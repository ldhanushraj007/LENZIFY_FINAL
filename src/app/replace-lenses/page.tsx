"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldCheck, Truck, Eye, Camera, Info, Clock, Calendar, CreditCard, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLenses, getCoatings, createReplacementOrder } from "./actions";
import { toast } from "react-hot-toast";

const steps = [
  { id: 1, title: "Frame Details", icon: <Camera size={18} /> },
  { id: 2, title: "Lens Selection", icon: <Eye size={18} /> },
  { id: 3, title: "Prescription", icon: <Info size={18} /> },
  { id: 4, title: "Pickup Details", icon: <Calendar size={18} /> },
  { id: 5, title: "Summary", icon: <Clock size={18} /> },
  { id: 6, title: "Payment", icon: <CreditCard size={18} /> },
];

const supabase = createClient();

type PackageKey = "standard" | "photochromatic" | "photochromatic_bluecut";

function ReplaceLensesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillLensId = searchParams.get("lensId");
  const hasPrefilled = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Data from DB
  const [lenses, setLenses] = useState<any[]>([]);
  const [coatings, setCoatings] = useState<any[]>([]);

  // Selections
  const [selectedParentLens, setSelectedParentLens] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>("standard");

  // Form State
  const [formData, setFormData] = useState({
    frame_type: "",
    frame_condition: "",
    frame_images: [] as string[],
    lens_id: "",
    coating_ids: [] as string[],
    prescription_type: "upload",
    prescription_url: "",
    prescription_data: {
      od_sph: "", od_cyl: "", od_axis: "", od_add: "",
      os_sph: "", os_cyl: "", os_axis: "", os_add: "",
      pd: ""
    },
    pickup_address: {
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: ""
    },
    delivery_address: {
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: ""
    },
    is_delivery_different: false,
    pickup_date: "",
    pickup_time_slot: "",
    delivery_date: "",
    payment_method: "online"
  });

  const [pickupFee, setPickupFee] = useState(50);
  const [deliveryFee, setDeliveryFee] = useState(50);

  // Filter main lens types (parent lenses only, exclude standalone Blue Cut, Photochromic, and child Progressive tiers)
  const mainLensTypes = useMemo(() => {
    return lenses.filter(l => {
      const nameLower = l.name?.toLowerCase() || "";
      if (nameLower === "blue cut") return false;
      if (nameLower.includes("photochro")) return false; // Photochromic is an upgrade package only
      if (l.tier && ["silver", "gold", "platinum"].includes(l.tier.toLowerCase())) return false;
      if (nameLower.startsWith("progressive ") && (nameLower.includes("silver") || nameLower.includes("gold") || nameLower.includes("platinum"))) return false;
      return true;
    });
  }, [lenses]);

  // Progressive tiers lookup
  const progressiveTiers = useMemo(() => {
    const silver = lenses.find(l => l.tier === "silver" || l.name === "Progressive Silver");
    const gold = lenses.find(l => l.tier === "gold" || l.name === "Progressive Gold");
    const platinum = lenses.find(l => l.tier === "platinum" || l.name === "Progressive Platinum");

    return [
      {
        tier: "silver",
        name: "Progressive Silver",
        displayName: "Silver",
        price: silver?.price ?? 1799,
        fovLabel: "Narrow Corridor",
        description: silver?.description || "Excellent all-purpose progressive design with fast adaptation.",
        lens: silver || { id: "c2505ad1-7ea6-4213-8dca-9818e39f483d", name: "Progressive Silver", price: 1799 },
      },
      {
        tier: "gold",
        name: "Progressive Gold",
        displayName: "Gold",
        price: gold?.price ?? 2799,
        fovLabel: "Wide Corridor",
        description: gold?.description || "Recommended for presbyopes choosing their first progressive design.",
        lens: gold || { id: "6c87ecd2-f547-4742-9472-5589eb879628", name: "Progressive Gold", price: 2799 },
      },
      {
        tier: "platinum",
        name: "Progressive Platinum",
        displayName: "Platinum",
        price: platinum?.price ?? 4299,
        fovLabel: "Widest Panoramic View",
        description: platinum?.description || "Ultra-premium everyday lens with maximum visual field clarity.",
        lens: platinum || { id: "019c03ca-6320-4b95-bce4-865b4237594d", name: "Progressive Platinum", price: 4299 },
      },
    ];
  }, [lenses]);

  // Package Flat Pricing Lookup
  const getPackagePricing = () => {
    const typeName = selectedParentLens?.name?.toLowerCase() || "";
    const tierKey = selectedTier?.tier?.toLowerCase() || "";

    if (typeName.includes("progressive")) {
      const activeTierPrice = selectedTier?.lens?.price ?? (tierKey === "silver" ? 1799 : (tierKey === "gold" ? 2799 : 4299));
      return {
        standard: { price: activeTierPrice, label: "Standard", desc: "All 4 core coatings included" },
        photochromatic: { price: activeTierPrice + 1000, label: "+ Photochromatic", desc: "Light-responsive tint with all coatings" },
        photochromatic_bluecut: { price: activeTierPrice + 1700, label: "+ Photochromatic + Blue Cut", desc: "Full digital protection + light-adaptive tint" },
      };
    } else if (typeName.includes("bifocal")) {
      const base = selectedParentLens?.price ?? 999;
      return {
        standard: { price: base, label: "Standard", desc: "All 4 core coatings included" },
        photochromatic: { price: base + 800, label: "+ Photochromatic", desc: "Light-responsive tint with all coatings" },
        photochromatic_bluecut: { price: base + 1500, label: "+ Photochromatic + Blue Cut", desc: "Full digital protection + light-adaptive tint" },
      };
    } else {
      // Single Vision or other standard type
      const base = selectedParentLens?.price ?? 799;
      return {
        standard: { price: base, label: "Standard", desc: "All 4 core coatings included" },
        photochromatic: { price: base + 400, label: "+ Photochromatic", desc: "Light-responsive tint with all coatings" },
        photochromatic_bluecut: { price: base + 1000, label: "+ Photochromatic + Blue Cut", desc: "Full digital protection + light-adaptive tint" },
      };
    }
  };

  const packagePricing = getPackagePricing();
  const currentPackagePrice = packagePricing[selectedPackage]?.price || 799;

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    async function fetchData() {
      const [lensesData, coatingsData, settingsRes] = await Promise.all([
        getLenses(),
        getCoatings(),
        supabase.from("store_settings").select("base_shipping_charge").eq("id", 1).single(),
      ]);
      setLenses(lensesData);
      setCoatings(coatingsData);
      if (settingsRes.data?.base_shipping_charge) {
        const fee = Number(settingsRes.data.base_shipping_charge);
        setPickupFee(fee);
        setDeliveryFee(fee);
      }

      if (prefillLensId) {
        const found = lensesData.find(l => l.id === prefillLensId);
        if (found) {
          const isProg = found.name?.toLowerCase().includes("progressive");
          if (isProg) {
            const parentProg = lensesData.find(l => l.name === "Progressive") || found;
            setSelectedParentLens(parentProg);
            const matchingTier = [
              { tier: "silver", id: "c2505ad1-7ea6-4213-8dca-9818e39f483d", name: "Progressive Silver" },
              { tier: "gold", id: "6c87ecd2-f547-4742-9472-5589eb879628", name: "Progressive Gold" },
              { tier: "platinum", id: "019c03ca-6320-4b95-bce4-865b4237594d", name: "Progressive Platinum" }
            ].find(t => t.id === prefillLensId || found.name?.toLowerCase().includes(t.tier));
            
            const silver = lensesData.find(l => l.tier === "silver" || l.name === "Progressive Silver");
            const gold = lensesData.find(l => l.tier === "gold" || l.name === "Progressive Gold");
            const platinum = lensesData.find(l => l.tier === "platinum" || l.name === "Progressive Platinum");

            const pTiers = [
              {
                tier: "silver",
                name: "Progressive Silver",
                displayName: "Silver",
                price: silver?.price ?? 1799,
                fovLabel: "Narrow Corridor",
                description: silver?.description || "Excellent all-purpose progressive design with fast adaptation.",
                lens: silver || { id: "c2505ad1-7ea6-4213-8dca-9818e39f483d", name: "Progressive Silver", price: 1799 },
              },
              {
                tier: "gold",
                name: "Progressive Gold",
                displayName: "Gold",
                price: gold?.price ?? 2799,
                fovLabel: "Wide Corridor",
                description: gold?.description || "Recommended for presbyopes choosing their first progressive design.",
                lens: gold || { id: "6c87ecd2-f547-4742-9472-5589eb879628", name: "Progressive Gold", price: 2799 },
              },
              {
                tier: "platinum",
                name: "Progressive Platinum",
                displayName: "Platinum",
                price: platinum?.price ?? 4299,
                fovLabel: "Widest Panoramic View",
                description: platinum?.description || "Ultra-premium everyday lens with maximum visual field clarity.",
                lens: platinum || { id: "019c03ca-6320-4b95-bce4-865b4237594d", name: "Progressive Platinum", price: 4299 },
              },
            ];

            const tierObj = pTiers.find(t => t.tier === matchingTier?.tier) || pTiers[0];
            setSelectedTier(tierObj);
            setFormData(prev => ({ ...prev, lens_id: tierObj.lens.id }));
          } else {
            setSelectedParentLens(found);
            setFormData(prev => ({ ...prev, lens_id: found.id }));
          }
          if (!hasPrefilled.current) {
            hasPrefilled.current = true;
            toast.success("Lens pre-selected from your preference.");
          }
        }
      } else if (lensesData.length > 0) {
        const sv = lensesData.find(l => l.name?.toLowerCase() === "single vision");
        if (sv) {
          setSelectedParentLens(sv);
          setFormData(prev => ({ ...prev, lens_id: sv.id }));
        }
      }

      setLoading(false);
    }
    fetchData();

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      subscription.unsubscribe();
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [prefillLensId]);

  const calculateTotal = () => {
    const lensPrice = selectedParentLens ? currentPackagePrice : 0;
    const extraLogisticsFee = formData.is_delivery_different ? pickupFee : 0;
    return lensPrice + pickupFee + deliveryFee + extraLogisticsFee;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.frame_type) { toast.error("Please select a frame type"); return; }
      if (!formData.frame_condition) { toast.error("Please select frame condition"); return; }
      if (formData.frame_images.length === 0) {
        toast.error("Please upload at least one frame image.");
        return;
      }
    }
    if (currentStep === 2 && !formData.lens_id) {
      toast.error("Please select a lens type");
      return;
    }
    if (currentStep === 3) {
      if (formData.prescription_type === "upload" && !formData.prescription_url) {
        toast.error("Please upload your prescription");
        return;
      }
      if (formData.prescription_type === "manual") {
        const d = formData.prescription_data;
        if (!d.od_sph || !d.os_sph || !d.pd) {
          toast.error("Please fill in the required prescription fields");
          return;
        }
      }
    }
    if (currentStep === 4) {
      const addr = formData.pickup_address;
      if (!addr.name || !addr.phone || !addr.address || !addr.pincode) {
        toast.error("Please fill in all pickup address fields");
        return;
      }
      if (!formData.pickup_date) {
        toast.error("Please select a pickup date");
        return;
      }

      // Pickup must be at least tomorrow
      const pickupDateObj = new Date(formData.pickup_date);
      pickupDateObj.setHours(0, 0, 0, 0);
      const tomorrow = new Date();
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (pickupDateObj < tomorrow) {
        toast.error("Invalid pickup date. Please select a future date (tomorrow or later).");
        return;
      }

      if (formData.is_delivery_different) {
        const dAddr = formData.delivery_address;
        if (!dAddr.name || !dAddr.phone || !dAddr.address || !dAddr.pincode) {
          toast.error("Please fill in all delivery address fields");
          return;
        }
      }
      if (!formData.delivery_date) {
        toast.error("Please select a delivery date");
        return;
      }

      // Delivery must be at least 3 days after pickup
      const deliveryDateObj = new Date(formData.delivery_date);
      deliveryDateObj.setHours(0, 0, 0, 0);
      const minDelivery = new Date(pickupDateObj);
      minDelivery.setDate(minDelivery.getDate() + 3);
      if (deliveryDateObj < minDelivery) {
        toast.error("Delivery date must be at least 3 days after the pickup date.");
        return;
      }
    }
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const uploadToSupabase = async (file: File, folder: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const toastId = toast.loading("Uploading images...");
    const uploadPromises = Array.from(files).map(file => uploadToSupabase(file, 'frames'));
    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter(url => url !== null) as string[];

    if (validUrls.length > 0) {
      setFormData({ ...formData, frame_images: [...formData.frame_images, ...validUrls] });
      toast.success("Images uploaded.", { id: toastId });
    } else {
      toast.error("Upload failed.", { id: toastId });
    }
  };

  const removeFrameImage = (index: number) => {
    const newImages = [...formData.frame_images];
    newImages.splice(index, 1);
    setFormData({ ...formData, frame_images: newImages });
    toast.success("Image removed.");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      router.push("/auth/login?redirect=/replace-lenses");
      return;
    }

    setSubmitting(true);
    const total = calculateTotal();
    const activeLensId = selectedTier ? selectedTier.lens.id : (selectedParentLens?.id || formData.lens_id);
    const baseOrderData = {
      ...formData,
      lens_id: activeLensId,
      lens_price: currentPackagePrice,
      coatings_price: 0,
      pickup_fee: pickupFee,
      delivery_fee: deliveryFee,
      total_price: total
    };

    if (formData.payment_method === 'cod') {
      const res = await createReplacementOrder(baseOrderData);
      setSubmitting(false);
      if (res.success) {
        toast.success("Order Placed Successfully!");
        router.push(`/orders/success?id=${res.order.id}`);
      } else {
        toast.error(res.error || "Failed to place order");
      }
      return;
    }

    try {
      const toastId = toast.loading("Initializing payment...");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("[RAZORPAY CLIENT] API Error:", errBody);
        throw new Error(errBody.details || errBody.error || "Payment gateway initialization failed.");
      }
      const rzpOrder = await res.json();

      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK not available.");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "LENZIFY",
        description: "Lens Replacement Service",
        order_id: rzpOrder.id,
        prefill: {
          name: formData.pickup_address.name || user.user_metadata?.name,
          contact: formData.pickup_address.phone,
          email: user.email
        },
        theme: { color: "#004AAD" },
        handler: async function (response: any) {
          const finalRes = await createReplacementOrder({
            ...baseOrderData,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id
          });

          if (finalRes.success) {
            toast.success("Payment complete. Order confirmed.", { id: toastId });
            router.push(`/orders/success?id=${finalRes.order.id}`);
          } else {
            toast.error(finalRes.error || "Order creation failed.", { id: toastId });
          }
          setSubmitting(false);
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            toast.dismiss(toastId);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Razorpay Error:", error);
      toast.error(error.message || "Payment failed");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#004AAD] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-32 pb-16 md:pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#03173D] via-[#004AAD] to-[#009DFF] pb-16 pt-8 mb-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">Lens Renewal Service</p>
          <h1 className="font-[var(--font-hero)] italic text-white text-4xl md:text-6xl leading-none mb-3">
            Replace Your Lenses
          </h1>
          <p className="text-white/70 text-sm">Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* PROGRESS HEADER */}
        <div className="mb-10 flex gap-2 flex-wrap">
          {steps.map((s) => (
            <div
              key={s.id}
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-all duration-500 border rounded-xl",
                currentStep >= s.id
                  ? "bg-[#004AAD]/10 border-[#004AAD] text-[#004AAD]"
                  : "bg-[#F8F9FC] border-[#E8EAF2] text-[#CCCCCC]"
              )}
            >
              {currentStep > s.id ? <CheckCircle2 size={16} className="text-[#004AAD]" /> : s.icon}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">

              {/* STEP 1: FRAME DETAILS */}
              {currentStep === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="space-y-5">
                    <label className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest block">Frame Type *</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {["Full Rim", "Half Rim", "Rimless"].map(type => (
                        <button
                          key={type}
                          onClick={() => setFormData({ ...formData, frame_type: type })}
                          className={cn(
                            "p-6 border rounded-2xl transition-all text-center",
                            formData.frame_type === type
                              ? "bg-[#004AAD]/10 border-[#004AAD] text-[#004AAD]"
                              : "bg-[#F8F9FC] border-[#E8EAF2] text-[#666666] hover:border-[#004AAD]/50"
                          )}
                        >
                          <p className="text-sm font-semibold">{type}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <label className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest block">Frame Condition *</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {["Excellent", "Used", "Worn Out"].map(cond => (
                        <button
                          key={cond}
                          onClick={() => setFormData({ ...formData, frame_condition: cond })}
                          className={cn(
                            "p-6 border rounded-2xl transition-all text-center",
                            formData.frame_condition === cond
                              ? "bg-[#004AAD]/10 border-[#004AAD] text-[#004AAD]"
                              : "bg-[#F8F9FC] border-[#E8EAF2] text-[#666666] hover:border-[#004AAD]/50"
                          )}
                        >
                          <p className="text-sm font-semibold">{cond}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <label className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest block">Frame Images *</label>
                    <div className="border-2 border-dashed border-[#E8EAF2] rounded-2xl p-12 text-center bg-[#F8F9FC] hover:border-[#004AAD]/50 transition-all cursor-pointer group">
                      <input type="file" multiple className="hidden" id="frame-upload" onChange={handleFileUpload} />
                      <label htmlFor="frame-upload" className="cursor-pointer space-y-4 block">
                        <Upload className="mx-auto text-[#CCCCCC] group-hover:text-[#004AAD] transition-all" size={48} />
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-[#666666]">Drop frame images here or click to upload</p>
                          <p className="text-xs text-[#AAAAAA]">JPG, PNG supported</p>
                        </div>
                      </label>
                    </div>

                    {formData.frame_images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {formData.frame_images.map((url, idx) => (
                          <div key={idx} className="aspect-square bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl relative group overflow-hidden">
                            <img src={url} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeFrameImage(idx)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: LENS & UPGRADE PACKAGES */}
              {currentStep === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  {/* Main Lens Types */}
                  <div className="space-y-4">
                    <label className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest block">Select Lens Type</label>
                    <div className="space-y-4">
                      {mainLensTypes.map(lens => {
                        const isThisProgressive = lens.name.toLowerCase().includes("progressive");
                        const isSelected = selectedParentLens?.id === lens.id;

                        return (
                          <div key={lens.id} className="space-y-3">
                            <button
                              onClick={() => {
                                setSelectedParentLens(lens);
                                if (!isThisProgressive) {
                                  setSelectedTier(null);
                                  setFormData({ ...formData, lens_id: lens.id });
                                } else {
                                  const tier = selectedTier || progressiveTiers[0];
                                  setSelectedTier(tier);
                                  setFormData({ ...formData, lens_id: tier.lens.id });
                                }
                              }}
                              className={cn(
                                "w-full p-6 border rounded-2xl text-left transition-all flex justify-between items-center",
                                isSelected
                                  ? "bg-[#004AAD]/10 border-[#004AAD] text-[#004AAD] shadow-sm"
                                  : "bg-[#F8F9FC] border-[#E8EAF2] text-[#111111] hover:border-[#004AAD]/50"
                              )}
                            >
                              <div>
                                <h3 className="text-sm font-semibold mb-1">{lens.name}</h3>
                                <p className="text-xs text-[#666666]">
                                  {lens.description || (isThisProgressive ? "Multifocal lenses with seamless distance, intermediate, and reading zones." : "Standard corrective lenses.")}
                                </p>
                              </div>
                              <span className="text-xl font-serif italic text-[#004AAD]">
                                {isThisProgressive ? "From ₹1,799" : `₹${Number(lens.price).toLocaleString()}`}
                              </span>
                            </button>

                            {/* Inline Progressive Tier Selection */}
                            {isThisProgressive && isSelected && (
                              <div className="p-5 bg-white border-2 border-[#004AAD]/30 rounded-2xl space-y-4 ml-1 mr-1">
                                <div className="flex justify-between items-center border-b border-[#E8EAF2] pb-2">
                                  <span className="text-xs font-bold text-[#004AAD] uppercase tracking-wider">Select Progressive Tier</span>
                                  <span className="text-[10px] text-[#666666] font-medium">Corridor width & adaptation</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {progressiveTiers.map(tier => {
                                    const isTierSelected = selectedTier?.tier === tier.tier;
                                    return (
                                      <div
                                        key={tier.tier}
                                        onClick={() => {
                                          setSelectedTier(tier);
                                          setFormData({ ...formData, lens_id: tier.lens.id });
                                        }}
                                        className={cn(
                                          "p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 relative flex flex-col justify-between",
                                          isTierSelected
                                            ? "bg-[#004AAD]/5 border-[#004AAD] shadow-sm"
                                            : "bg-[#F8F9FC] border-[#E8EAF2] hover:border-[#004AAD]/40"
                                        )}
                                      >
                                        <div>
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#03173D]">
                                              {tier.displayName}
                                            </span>
                                            <span className="text-xs font-bold text-[#004AAD]">₹{tier.price.toLocaleString()}</span>
                                          </div>
                                          <p className="text-[9px] font-semibold text-[#004AAD] uppercase">{tier.fovLabel}</p>
                                          <p className="text-[10px] text-[#666666] mt-1">{tier.description}</p>
                                        </div>
                                        {isTierSelected && (
                                          <div className="absolute top-2 right-2">
                                            <CheckCircle2 size={14} className="text-[#004AAD]" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Included Coatings Block */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-950 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          Included in your lens
                        </h4>
                        <p className="text-[10px] text-emerald-800/80 mt-0.5">All essential protective optic armor comes standard with every lens</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-200/60 text-emerald-900 px-3 py-1 rounded-full w-fit">
                        All coatings included at no extra charge
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {[
                        "UV Block Protection",
                        "Blue Cut",
                        "Scratch Resistant Shield",
                        "Anti-Reflective Coating",
                      ].map((coating) => (
                        <div key={coating} className="bg-white/90 border border-emerald-200/60 rounded-xl p-3 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-semibold text-emerald-950">{coating}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upgrade Packages */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest block">
                        Choose an Upgrade Package
                      </label>
                      <span className="text-xs text-[#666666]">Flat package pricing</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {[
                        {
                          key: "standard" as PackageKey,
                          title: "Standard Package",
                          subtitle: "All 4 included coatings — UV Block, Blue Cut, Scratch Shield & Anti-Reflective",
                          price: packagePricing.standard.price,
                        },
                        {
                          key: "photochromatic" as PackageKey,
                          title: "+ Photochromatic",
                          subtitle: "Transitions automatically from clear indoors to dark sunglasses outdoors in sunlight",
                          price: packagePricing.photochromatic.price,
                        },
                        {
                          key: "photochromatic_bluecut" as PackageKey,
                          title: "+ Photochromatic + Blue Cut",
                          subtitle: "The ultimate duo: light-adaptive transition tint with maximum digital blue ray filtration",
                          price: packagePricing.photochromatic_bluecut.price,
                        },
                      ].map((pkg) => {
                        const isPkgSelected = selectedPackage === pkg.key;
                        return (
                          <div
                            key={pkg.key}
                            onClick={() => setSelectedPackage(pkg.key)}
                            className={cn(
                              "p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                              isPkgSelected
                                ? "bg-[#004AAD]/5 border-[#004AAD] shadow-sm ring-1 ring-[#004AAD]/20"
                                : "bg-white border-[#E8EAF2] hover:border-[#004AAD]/40"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all",
                                isPkgSelected ? "border-[#004AAD] bg-[#004AAD]" : "border-slate-300"
                              )}>
                                {isPkgSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-[#03173D]">{pkg.title}</h5>
                                <p className="text-[11px] text-[#666666] max-w-lg">{pkg.subtitle}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-9 sm:pl-0">
                              <span className="text-lg font-bold text-[#004AAD]">₹{pkg.price.toLocaleString()}</span>
                              <p className="text-[9px] text-[#888888] font-bold uppercase tracking-wider">Total Lens Price</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PRESCRIPTION */}
              {currentStep === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="flex gap-2 p-1 bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl mb-8">
                    {["upload", "manual"].map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, prescription_type: type })}
                        className={cn(
                          "flex-1 py-3 text-sm font-semibold rounded-xl transition-all capitalize",
                          formData.prescription_type === type ? "bg-[#004AAD] text-white" : "text-[#666666] hover:text-[#111111]"
                        )}
                      >
                        {type} Prescription
                      </button>
                    ))}
                  </div>

                  {formData.prescription_type === "upload" ? (
                    <div className="space-y-5">
                      <div className="border-2 border-dashed border-[#E8EAF2] rounded-2xl p-12 text-center bg-[#F8F9FC] space-y-5">
                        <input type="file" id="prescription-upload" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const toastId = toast.loading("Uploading prescription...");
                            const url = await uploadToSupabase(file, 'prescriptions');
                            if (url) {
                              setFormData({ ...formData, prescription_url: url });
                              toast.success("Prescription uploaded.", { id: toastId });
                            }
                          }
                        }} />
                        {formData.prescription_url ? (
                          <div className="relative group max-w-sm mx-auto aspect-[4/3] bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl overflow-hidden">
                            <img src={formData.prescription_url} alt="Prescription" className="w-full h-full object-contain" />
                            <button
                              onClick={() => setFormData({ ...formData, prescription_url: "" })}
                              className="absolute top-4 right-4 bg-white border border-[#E8EAF2] text-[#666666] p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:border-[#004AAD]"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <label htmlFor="prescription-upload" className="cursor-pointer space-y-4 block">
                            <Upload className="mx-auto text-[#CCCCCC]" size={48} />
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-[#666666]">Upload your prescription (JPG/PNG)</p>
                              <p className="text-xs text-[#004AAD] font-semibold">Click to select file</p>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-2xl p-8 space-y-10">
                      {["od", "os"].map(eye => (
                        <div key={eye} className="space-y-5">
                          <h4 className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#004AAD]"></div>
                            {eye === "od" ? "Right Eye (OD)" : "Left Eye (OS)"}
                          </h4>
                          <div className="grid grid-cols-4 gap-4">
                            {["sph", "cyl", "axis", "add"].map(field => (
                              <div key={field}>
                                <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest mb-2 block">{field}</label>
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  className="bg-white border border-[#E8EAF2] rounded-xl px-3 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                                  value={(formData.prescription_data as any)[`${eye}_${field}`]}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    prescription_data: { ...formData.prescription_data, [`${eye}_${field}`]: e.target.value }
                                  })}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="pt-8 border-t border-[#ECECEC]">
                        <label className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest mb-4 block">Pupillary Distance (PD)</label>
                        <input
                          type="text"
                          placeholder="62mm"
                          className="bg-white border border-[#E8EAF2] rounded-xl px-3 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-48 text-sm"
                          value={formData.prescription_data.pd}
                          onChange={(e) => setFormData({ ...formData, prescription_data: { ...formData.prescription_data, pd: e.target.value } })}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 4: LOGISTICS PLAN */}
              {currentStep === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="space-y-5">
                    <h3 className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">Pickup Address</h3>
                    <div className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-2xl p-8 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest">Name *</label>
                          <input
                            className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                            value={formData.pickup_address.name}
                            onChange={(e) => setFormData({ ...formData, pickup_address: { ...formData.pickup_address, name: e.target.value } })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest">Phone *</label>
                          <input
                            className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                            value={formData.pickup_address.phone}
                            onChange={(e) => setFormData({ ...formData, pickup_address: { ...formData.pickup_address, phone: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest">Address *</label>
                        <textarea
                          className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm h-24 resize-none"
                          value={formData.pickup_address.address}
                          onChange={(e) => setFormData({ ...formData, pickup_address: { ...formData.pickup_address, address: e.target.value } })}
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {["city", "state", "pincode"].map(field => (
                          <div key={field} className="space-y-2">
                            <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest">{field} *</label>
                            <input
                              className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                              value={(formData.pickup_address as any)[field]}
                              onChange={(e) => setFormData({ ...formData, pickup_address: { ...formData.pickup_address, [field]: e.target.value } })}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">Pickup Date *</label>
                        <input
                          type="date"
                          min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()}
                          className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                          value={formData.pickup_date}
                          onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value, delivery_date: "" })}
                        />
                        <p className="text-[10px] text-[#AAAAAA]">Must be tomorrow or later</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">Delivery Address</h3>
                      <button
                        onClick={() => setFormData({ ...formData, is_delivery_different: !formData.is_delivery_different })}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-semibold",
                          formData.is_delivery_different
                            ? "bg-[#004AAD]/10 text-[#004AAD] border-[#004AAD]"
                            : "bg-[#F8F9FC] border-[#E8EAF2] text-[#666666] hover:border-[#004AAD]/50"
                        )}
                      >
                        Different Delivery Address
                        {formData.is_delivery_different && <ArrowRight size={12} />}
                      </button>
                    </div>

                    {formData.is_delivery_different ? (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-[#F8F9FC] border border-[#004AAD]/20 rounded-2xl p-8 space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-[#004AAD]/5 rounded-xl mb-4">
                          <Info size={16} className="text-[#004AAD]" />
                          <p className="text-xs font-semibold text-[#666666]">Custom delivery routing incurs an additional ₹{pickupFee} fee</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest">Recipient Name *</label>
                            <input
                              className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                              value={formData.delivery_address.name}
                              onChange={(e) => setFormData({ ...formData, delivery_address: { ...formData.delivery_address, name: e.target.value } })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest">Phone *</label>
                            <input
                              className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                              value={formData.delivery_address.phone}
                              onChange={(e) => setFormData({ ...formData, delivery_address: { ...formData.delivery_address, phone: e.target.value } })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest">Delivery Address *</label>
                          <textarea
                            className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm h-24 resize-none"
                            value={formData.delivery_address.address}
                            onChange={(e) => setFormData({ ...formData, delivery_address: { ...formData.delivery_address, address: e.target.value } })}
                          />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {["city", "state", "pincode"].map(field => (
                            <div key={field} className="space-y-2">
                              <label className="text-xs font-semibold text-[#666666] uppercase tracking-widest">{field} *</label>
                              <input
                                className="bg-white border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                                value={(formData.delivery_address as any)[field]}
                                onChange={(e) => setFormData({ ...formData, delivery_address: { ...formData.delivery_address, [field]: e.target.value } })}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-8 border border-[#E8EAF2] bg-[#F8F9FC] rounded-2xl text-center space-y-3">
                        <CheckCircle2 size={28} className="mx-auto text-[#CCCCCC]" />
                        <p className="text-xs font-semibold text-[#AAAAAA]">Same as pickup address</p>
                      </div>
                    )}

                    <div className="space-y-2 pt-6 border-t border-[#ECECEC]">
                      <label className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">Delivery Date *</label>
                      <input
                        type="date"
                        min={(() => {
                          if (!formData.pickup_date) {
                            const d = new Date(); d.setDate(d.getDate() + 4); return d.toISOString().split("T")[0];
                          }
                          const d = new Date(formData.pickup_date); d.setDate(d.getDate() + 3); return d.toISOString().split("T")[0];
                        })()}
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                        value={formData.delivery_date}
                        onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                      />
                      <p className="text-[10px] text-[#AAAAAA]">Must be at least 3 days after pickup date</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: SUMMARY */}
              {currentStep === 5 && (
                <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-white border border-[#ECECEC] rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-10 space-y-8">
                    <div className="flex items-center gap-5 border-b border-[#ECECEC] pb-8">
                      <div className="w-14 h-14 bg-[#F0F5FF] rounded-2xl flex items-center justify-center">
                        <Eye className="text-[#004AAD]" />
                      </div>
                      <div>
                        <p className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest mb-1">Frame Details</p>
                        <p className="text-sm font-semibold text-[#111111]">{formData.frame_type} • {formData.frame_condition || "Standard"}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">Order Summary</h4>

                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="text-sm font-semibold text-[#111111]">
                            {selectedParentLens?.name || "Lens"} {selectedTier ? `(${selectedTier.displayName})` : ""}
                          </p>
                          <p className="text-xs text-[#004AAD]">{packagePricing[selectedPackage].label}</p>
                        </div>
                        <span className="text-lg font-serif italic text-[#111111]">₹{currentPackagePrice.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-t border-[#ECECEC]">
                        <span className="text-sm text-[#666666]">Included Coatings (4)</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">FREE</span>
                      </div>

                      <div className="flex justify-between items-center py-4 border-y border-[#ECECEC] bg-[#F8F9FC] px-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Truck size={14} className="text-[#004AAD]" />
                          <span className="text-sm text-[#111111] font-medium">Pickup & Delivery</span>
                        </div>
                        <span className="text-sm font-serif italic text-[#111111]">₹{pickupFee + deliveryFee + (formData.is_delivery_different ? pickupFee : 0)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 6: PAYMENT */}
              {currentStep === 6 && (
                <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <button
                      onClick={() => setFormData({ ...formData, payment_method: "online" })}
                      className={cn(
                        "p-8 border rounded-2xl transition-all text-left space-y-4",
                        formData.payment_method === "online"
                          ? "bg-[#004AAD]/10 border-[#004AAD] text-[#004AAD]"
                          : "bg-[#F8F9FC] border-[#E8EAF2] text-[#111111] hover:border-[#004AAD]/50"
                      )}
                    >
                      <Wallet size={24} className={formData.payment_method === "online" ? "text-[#004AAD]" : "text-[#CCCCCC]"} />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Pay Online</h3>
                        <p className="text-xs text-[#666666]">UPI, Cards, NetBanking</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, payment_method: "cod" })}
                      className={cn(
                        "p-8 border rounded-2xl transition-all text-left space-y-4",
                        formData.payment_method === "cod"
                          ? "bg-[#004AAD]/10 border-[#004AAD] text-[#004AAD]"
                          : "bg-[#F8F9FC] border-[#E8EAF2] text-[#111111] hover:border-[#004AAD]/50"
                      )}
                    >
                      <CreditCard size={24} className={formData.payment_method === "cod" ? "text-[#004AAD]" : "text-[#CCCCCC]"} />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Pay on Pickup/Delivery</h3>
                        <p className="text-xs text-[#666666]">Cash on Delivery</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* NAVIGATION */}
            <div className="mt-12 flex gap-4">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-8 py-4 border border-[#E8EAF2] text-sm font-semibold text-[#666666] rounded-full hover:border-[#004AAD] hover:text-[#004AAD] transition-all flex items-center gap-3"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              {currentStep < steps.length ? (
                <button
                  onClick={nextStep}
                  className="flex-1 bg-[#03173D] text-white text-sm font-semibold rounded-full py-4 flex items-center justify-center gap-3 hover:bg-gradient-to-r hover:from-[#03173D] hover:to-[#004AAD] transition-all"
                >
                  Continue <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#03173D] text-white text-sm font-semibold rounded-full py-4 flex items-center justify-center gap-3 hover:bg-gradient-to-r hover:from-[#03173D] hover:to-[#004AAD] transition-all disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Place Order"}
                </button>
              )}
            </div>
          </div>

          {/* SIDEBAR SUMMARY */}
          <aside className="space-y-5">
            <div className="bg-white border border-[#ECECEC] rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 sticky top-32">
              <div className="space-y-5">
                <p className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest">Order Summary</p>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-[#111111]">
                    <div>
                      <p className="font-semibold">
                        {selectedParentLens?.name || "Lens"} {selectedTier ? `(${selectedTier.displayName})` : ""}
                      </p>
                      <p className="text-xs text-[#004AAD]">{packagePricing[selectedPackage].label}</p>
                    </div>
                    <span className="font-semibold">₹{currentPackagePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#666666]">
                    <span>Included Coatings (4)</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#666666]">
                    <span>Pickup & Delivery</span>
                    <span>₹{pickupFee + deliveryFee + (formData.is_delivery_different ? pickupFee : 0)}</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-[#ECECEC]">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-serif italic text-[#111111] leading-none">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#ECECEC]">
                  <div className="flex items-center gap-3 text-[#004AAD]">
                    <ShieldCheck size={14} />
                    <span className="text-xs font-semibold">Precision Lab Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#666666]">
                    <Truck size={14} />
                    <span className="text-xs font-semibold">3-5 Day Completion</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ReplaceLensesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#004AAD] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Loading...</p>
        </div>
      </div>
    }>
      <ReplaceLensesContent />
    </Suspense>
  );
}
