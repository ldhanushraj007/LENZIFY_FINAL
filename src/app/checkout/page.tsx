"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getCart } from "@/lib/db/customer_actions";
import { placeOrder } from "@/lib/db/order_actions";
import { cn } from "@/lib/utils";
import { validateCheckoutAddress } from "@/lib/validation";
import { applyCoupon, incrementCouponUsage } from "@/lib/db/coupon_actions";
import toast from "react-hot-toast";
import {
  ChevronRight,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  Upload,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Copy,
} from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";
import { useCartStore } from "@/store/cartStore";
import OrderSummary, { ItemPrescription } from "@/components/checkout/OrderSummary";
import { getGSTRate, calculateCartGST } from "@/lib/gst";

const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Prescription", icon: FileText },
  { id: 3, label: "Payment", icon: CreditCard },
];

const RX_SESSION_KEY = "lenzify_checkout_rx";

function computeCartFingerprint(items: any[]): string {
  if (!items || items.length === 0) return "";
  return items
    .map((i) => {
      const id = i.database_id || i.id || i.product_id;
      const lensId = i.lens_id || i.lens_config?.lens_id || "none";
      const qty = i.quantity || 1;
      const rx = Boolean(i.prescription_json || i.prescription);
      return `${id}_${lensId}_${qty}_${rx}`;
    })
    .sort()
    .join("|");
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");

  const allSunglasses = cartItems.length > 0 && cartItems.every((item) => {
    const cat = (
      item.product?.category ||
      item.products?.category ||
      item.products?.categories?.name ||
      item.products?.categories?.slug ||
      item.category ||
      ""
    ).toLowerCase();
    return cat.includes("sunglass");
  });

  useEffect(() => {
    if (!allSunglasses && paymentMethod === "cod") {
      setPaymentMethod("razorpay");
    }
  }, [allSunglasses, paymentMethod]);

  const [addressData, setAddressData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Global / Fallback Prescription state
  const [prescription, setPrescription] = useState<{
    file_url?: string;
    left_eye: string;
    right_eye: string;
    pd: string;
  }>({ left_eye: "", right_eye: "", pd: "" });

  // Multi-item prescriptions: cartItemId -> PrescriptionData
  const [itemPrescriptions, setItemPrescriptions] = useState<Record<string, ItemPrescription>>({});
  const [prescriptionCompleted, setPrescriptionCompleted] = useState(false);
  const [applyToAllFrames, setApplyToAllFrames] = useState(true);
  const [selectedItemTab, setSelectedItemTab] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [couponId, setCouponId] = useState<number | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const isContactLensItem = (item: any) => {
    const pType = item.product_type || item.products?.product_type;
    const cat = item.category || item.products?.category || item.products?.categories?.slug;
    return (
      pType === "contact-lens" ||
      pType === "contact_lens" ||
      cat === "contact-lenses" ||
      cat === "Contact Lenses"
    );
  };

  const isComputerGlassesItem = (item: any) => {
    const cat = item.category || item.products?.category || item.products?.categories?.name || item.products?.categories?.slug;
    const name = item.name || item.products?.name || "";
    return cat === "Computer Glasses" || cat === "computer-glasses" || name.toLowerCase().includes("computer glass");
  };

  const isReadingGlassesItem = (item: any) => {
    const pType = item.product_type || item.products?.product_type;
    const cat = item.category || item.products?.category || item.products?.categories?.name || item.products?.categories?.slug;
    const name = item.name || item.products?.name || "";
    const brand = item.brand || item.products?.brand || "";
    return (
      pType === "reading-glasses" ||
      pType === "reading_glasses" ||
      cat === "Reading Glasses" ||
      cat === "reading-glasses" ||
      name.toLowerCase().includes("reading glass") ||
      brand.toLowerCase().includes("reading glass")
    );
  };

  const isAccessoryItem = (item: any) => {
    const pType = item.product_type || item.products?.product_type;
    const cat = item.category || item.products?.category || item.products?.categories?.name || item.products?.categories?.slug;
    const name = item.name || item.products?.name || "";
    return (
      pType === "accessory" ||
      pType === "accessories" ||
      cat === "Accessories" ||
      cat === "accessories" ||
      name.toLowerCase().includes("accessory") ||
      name.toLowerCase().includes("cleaning kit") ||
      name.toLowerCase().includes("case") ||
      name.toLowerCase().includes("chain")
    );
  };

  const isPrescriptionRequiredItem = (item: any) => {
    if (isContactLensItem(item)) return false;
    if (isComputerGlassesItem(item)) return false;
    if (isReadingGlassesItem(item)) return false;
    if (isAccessoryItem(item)) return false;
    return Boolean(
      item.lens_id ||
      (item.lens_config && (item.lens_config.type || item.lens_config.package || item.lens_config.package_name || item.lens_config.selected_index || (Number(item.lens_price) > 0)))
    );
  };

  // Prescription-requiring items in this cart
  const itemsNeedingPrescription = useMemo(
    () => cartItems.filter(isPrescriptionRequiredItem),
    [cartItems]
  );

  const isFrameOnly = cartItems.length > 0 && itemsNeedingPrescription.length === 0;

  // Check if every prescription-requiring item has prescription data
  const isEveryItemPrescriptionFulfilled = useMemo(() => {
    if (itemsNeedingPrescription.length === 0) return true;
    return itemsNeedingPrescription.every((item) => {
      const key = String(item.database_id || item.id || item.product_id);
      const rx = itemPrescriptions[key] || item.prescription_json || item.prescription;
      if (rx && (rx.left_eye || rx.os_sph || rx.file_url)) return true;
      if (prescription.left_eye || prescription.file_url) return true;
      return false;
    });
  }, [itemsNeedingPrescription, itemPrescriptions, prescription]);

  // Overall prescription completeness condition
  const isPrescriptionDone = isFrameOnly || (prescriptionCompleted && isEveryItemPrescriptionFulfilled);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/checkout");
      return;
    }

    if (user) {
      const init = async () => {
        const cart = await getCart();
        if (!cart || cart.length === 0) {
          router.push("/cart");
          return;
        }
        setCartItems(cart);
        setAddressData((prev) => ({ ...prev, name: user.user_metadata?.name || "" }));

        // Check fingerprint in sessionStorage
        const currentFingerprint = computeCartFingerprint(cart);
        const storedSessionRaw = sessionStorage.getItem(RX_SESSION_KEY);
        let restoredFromSession = false;

        if (storedSessionRaw) {
          try {
            const parsed = JSON.parse(storedSessionRaw);
            if (parsed.fingerprint === currentFingerprint) {
              if (parsed.itemPrescriptions) {
                setItemPrescriptions(parsed.itemPrescriptions);
              }
              if (parsed.globalPrescription) {
                setPrescription(parsed.globalPrescription);
              }
              if (parsed.prescriptionCompleted) {
                setPrescriptionCompleted(true);
                restoredFromSession = true;
              }
            } else {
              // Stale fingerprint from prior cart modification or session
              sessionStorage.removeItem(RX_SESSION_KEY);
            }
          } catch (e) {
            sessionStorage.removeItem(RX_SESSION_KEY);
          }
        }

        // Initialize per-item prescriptions from cart data if not restored
        if (!restoredFromSession) {
          const initialMap: Record<string, ItemPrescription> = {};
          let allPreConfigured = true;
          cart.forEach((item) => {
            if (isPrescriptionRequiredItem(item)) {
              const key = String(item.database_id || item.id || item.product_id);
              if (item.prescription_json) {
                initialMap[key] = item.prescription_json;
              } else if (item.prescription) {
                initialMap[key] = item.prescription;
              } else {
                allPreConfigured = false;
              }
            }
          });
          setItemPrescriptions(initialMap);

          // If every item with lenses was already configured in product step
          if (cart.some(isPrescriptionRequiredItem) && allPreConfigured) {
            setPrescriptionCompleted(true);
          }
        }

        const firstRxItem = cart.find(isPrescriptionRequiredItem);
        if (firstRxItem) {
          setSelectedItemTab(String(firstRxItem.database_id || firstRxItem.id || firstRxItem.product_id));
        }

        setLoading(false);
      };
      init();
    }

    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, [user, authLoading, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetItemKey?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPrescription(true);
    const toastId = toast.loading("Uploading prescription...");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `prescriptions/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      if (applyToAllFrames || !targetItemKey) {
        setPrescription((prev) => ({ ...prev, file_url: publicUrl }));
        // Also update all items needing prescription
        setItemPrescriptions((prev) => {
          const next = { ...prev };
          itemsNeedingPrescription.forEach((item) => {
            const key = String(item.database_id || item.id || item.product_id);
            next[key] = { ...(next[key] || {}), file_url: publicUrl };
          });
          return next;
        });
      } else {
        setItemPrescriptions((prev) => ({
          ...prev,
          [targetItemKey]: { ...(prev[targetItemKey] || {}), file_url: publicUrl },
        }));
      }

      toast.success("Prescription uploaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Prescription upload error:", err);
      toast.error(err.message || "Failed to upload prescription.", { id: toastId });
    } finally {
      setUploadingPrescription(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter a coupon code.");
      return;
    }
    setApplyingCoupon(true);
    const subtotal = cartItems.reduce(
      (acc: number, item: any) =>
        acc + (item.price || item.products?.offer_price || item.products?.price || 0) * item.quantity,
      0
    );
    const result = await applyCoupon(couponCode.trim(), subtotal);
    setApplyingCoupon(false);
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      setCouponDiscount(result.discount!);
      setCouponApplied(result.description!);
      setCouponId(result.coupon_id ?? null);
      toast.success(`Coupon applied! ${result.description}`);
    }
  };

  // Navigation handlers ensuring STRICTLY LINEAR FLOW
  const handleProceedFromAddress = () => {
    const validationErrors = validateCheckoutAddress(addressData);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0].message);
      return;
    }
    // If prescription is already completed in this checkout session or no items need prescription,
    // skip Step 2 and proceed directly to Step 3 (Payment)
    if (isFrameOnly || isPrescriptionDone) {
      setActiveStep(3);
    } else {
      setActiveStep(2);
    }
  };

  const handleProceedFromPrescription = () => {
    // Fulfill all unfulfilled items with current global prescription if applyToAllFrames
    const updatedMap = { ...itemPrescriptions };
    itemsNeedingPrescription.forEach((item) => {
      const key = String(item.database_id || item.id || item.product_id);
      if (!updatedMap[key] || (!updatedMap[key].left_eye && !updatedMap[key].file_url)) {
        updatedMap[key] = {
          left_eye: prescription.left_eye,
          right_eye: prescription.right_eye,
          od_sph: prescription.right_eye,
          os_sph: prescription.left_eye,
          pd: prescription.pd,
          file_url: prescription.file_url,
        };
      }
    });

    setItemPrescriptions(updatedMap);
    setPrescriptionCompleted(true);

    // Save to sessionStorage with current cart fingerprint
    const fingerprint = computeCartFingerprint(cartItems);
    sessionStorage.setItem(
      RX_SESSION_KEY,
      JSON.stringify({
        fingerprint,
        prescriptionCompleted: true,
        itemPrescriptions: updatedMap,
        globalPrescription: prescription,
      })
    );

    // Strictly advance to Payment step (Step 3)
    setActiveStep(3);
  };

  const handleBackFromPrescription = () => {
    setActiveStep(1);
  };

  const handleBackFromPayment = () => {
    // Flow is strictly linear: Once prescription has been completed in this session,
    // going back from Payment returns to Address (Step 1).
    setActiveStep(1);
  };

  const handlePayment = async () => {
    const validationErrors = validateCheckoutAddress(addressData);
    if (validationErrors.length > 0) {
      validationErrors.forEach((err) => toast.error(err.message));
      return;
    }
    setOrderProcessing(true);

    const gstBreakdown = calculateCartGST(cartItems, couponDiscount);
    const totalAmount = gstBreakdown.grandTotal;

    // Helper to resolve prescription payload per item
    const getResolvedItemPrescription = (item: any) => {
      const key = String(item.database_id || item.id || item.product_id);
      const itemRx = itemPrescriptions[key] || item.prescription_json || item.prescription;
      if (itemRx) {
        return {
          od_sph: itemRx.od_sph || itemRx.right_eye || "0.00",
          os_sph: itemRx.os_sph || itemRx.left_eye || "0.00",
          od_cyl: itemRx.od_cyl || "",
          os_cyl: itemRx.os_cyl || "",
          od_axis: itemRx.od_axis || "",
          os_axis: itemRx.os_axis || "",
          od_add: itemRx.od_add || "",
          os_add: itemRx.os_add || "",
          pd: itemRx.pd || prescription.pd || "",
          file_url: itemRx.file_url || prescription.file_url || null,
        };
      }
      if (prescription.left_eye || prescription.right_eye || prescription.file_url) {
        return {
          od_sph: prescription.right_eye || "0.00",
          os_sph: prescription.left_eye || "0.00",
          pd: prescription.pd || "",
          file_url: prescription.file_url || null,
        };
      }
      return null;
    };

    // 1. CASH ON DELIVERY (COD) FLOW
    if (paymentMethod === "cod") {
      try {
        const codId = `COD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const orderRes = await placeOrder({
          items: cartItems.map((item) => {
            const rate = getGSTRate(item);
            const itemPrice = item.price || item.products?.offer_price || item.products?.price || 0;
            const itemTotal = itemPrice * item.quantity;
            const numericRate = rate === 'included' ? 0 : rate;
            const gstAmount = Math.round(itemTotal * numericRate);
            return {
              id: item.product_id,
              quantity: item.quantity,
              price: itemPrice,
              lens_id: item.lens_id,
              selected_color: item.selected_color,
              selected_size: item.selected_size,
              prescription_json: getResolvedItemPrescription(item),
              gst_rate: numericRate,
              gst_amount: gstAmount,
            };
          }),
          total_price: totalAmount,
          address: addressData,
          prescription: prescription.left_eye || prescription.file_url ? prescription : undefined,
          payment: { id: codId, method: "cod" },
        });

        if (orderRes.success) {
          if (couponId) await incrementCouponUsage(couponId);
          // Purge session prescription cache on successful order
          sessionStorage.removeItem(RX_SESSION_KEY);
          useCartStore.getState().clearCart();
          toast.success("Order placed successfully with Cash on Delivery!");
          router.push(`/orders/success?id=${orderRes.order_id}`);
        } else {
          console.error("COD Order Placement Error:", orderRes.error);
          toast.error(orderRes.error || "Order placement failed. Please try again.");
          setOrderProcessing(false);
        }
      } catch (err: any) {
        console.error("COD Fulfillment Exception:", err);
        toast.error(`Order processing failed: ${err.message || "Unknown error"}.`);
        setOrderProcessing(false);
      }
      return;
    }

    // 2. UPI / Razorpay Flow
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`${errorData.error}: ${errorData.details || "Unknown error"}`);
      }

      const order = await res.json();
      if (!order.id) throw new Error("Invalid order received.");
      if (!(window as any).Razorpay) throw new Error("Razorpay SDK not loaded.");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "LENZIFY",
        description: "Premium Eyewear Order",
        order_id: order.id,
        prefill: {
          name: addressData.name,
          contact: addressData.phone,
          email: user?.email,
        },
        theme: { color: "#03173D" },
        modal: {
          ondismiss: function () {
            setOrderProcessing(false);
          },
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyData.verified) {
              toast.error("Payment verification failed. Please contact support.");
              setOrderProcessing(false);
              return;
            }

            const orderRes = await placeOrder({
              items: cartItems.map((item) => {
                const rate = getGSTRate(item);
                const itemPrice = item.price || item.products?.offer_price || item.products?.price || 0;
                const itemTotal = itemPrice * item.quantity;
                const numericRate = rate === 'included' ? 0 : rate;
                const gstAmount = Math.round(itemTotal * numericRate);
                return {
                  id: item.product_id,
                  quantity: item.quantity,
                  price: itemPrice,
                  lens_id: item.lens_id,
                  selected_color: item.selected_color,
                  selected_size: item.selected_size,
                  prescription_json: getResolvedItemPrescription(item),
                  gst_rate: numericRate,
                  gst_amount: gstAmount,
                };
              }),
              total_price: totalAmount,
              address: addressData,
              prescription: prescription.left_eye || prescription.file_url ? prescription : undefined,
              payment: { id: response.razorpay_payment_id, method: "razorpay" },
            });

            if (orderRes.success) {
              if (couponId) await incrementCouponUsage(couponId);
              // Purge session prescription cache on successful payment
              sessionStorage.removeItem(RX_SESSION_KEY);
              useCartStore.getState().clearCart();
              router.push(`/orders/success?id=${orderRes.order_id}`);
            } else {
              console.error("Order Placement Error:", orderRes.error);
              toast.error(orderRes.error || "Order placement failed. Please contact support.");
              setOrderProcessing(false);
            }
          } catch (err: any) {
            console.error("Fulfillment Exception:", err);
            toast.error(`Order processing failed: ${err.message || "Unknown error"}.`);
            setOrderProcessing(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Payment Failed:", response.error);
        toast.error("Payment failed: " + (response.error.description || "Please try again."));
        setOrderProcessing(false);
      });
      rzp.open();
    } catch (e: any) {
      console.error("Razorpay Init Error:", e);
      toast.error("Payment initialization failed. Please try again.");
      setOrderProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F8F9FC] min-h-screen pt-28 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#03173D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666666] text-sm font-medium">Loading your checkout...</p>
        </div>
      </div>
    );
  }

  // Calculate totals for payment button label
  const gstBreakdown = calculateCartGST(cartItems, couponDiscount);
  const { subtotal, discountedSubtotal, grandTotal } = gstBreakdown;

  // Determine steps shown in stepper
  const visibleSteps = isFrameOnly
    ? [
        { id: 1, label: "Address", icon: MapPin },
        { id: 3, label: "Payment", icon: CreditCard },
      ]
    : STEPS;

  // Active step indices
  const isAddressCompleted = activeStep > 1;
  const isPrescriptionStepCompleted = isPrescriptionDone || activeStep > 2;

  return (
    <div className="bg-[#F8F9FC] min-h-screen pt-20 md:pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
            Lenzify Secure Checkout
          </p>
          <h1 className="text-2xl md:text-4xl font-[var(--font-hero)] italic text-[#111111]">
            Complete Your Order
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center gap-0">
          {visibleSteps.map((step, i) => {
            const isCompleted =
              step.id === 1
                ? isAddressCompleted
                : step.id === 2
                ? isPrescriptionStepCompleted
                : false;
            const isCurrent = step.id === activeStep;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300",
                      isCompleted
                        ? "border-[#03173D] bg-[#03173D] text-white"
                        : isCurrent
                        ? "border-[#03173D] bg-white text-[#03173D] ring-4 ring-[#004AAD]/10"
                        : "border-[#ECECEC] bg-white text-[#666666]"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 size={15} /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold hidden sm:block",
                      isCurrent
                        ? "text-[#03173D]"
                        : isCompleted
                        ? "text-[#111111]"
                        : "text-[#666666]"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < visibleSteps.length - 1 && (
                  <div className="flex-1 mx-3 h-0.5 bg-[#ECECEC] relative overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-[#03173D] transition-all duration-500",
                        isCompleted ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Step Content */}
          <div className="lg:col-span-7 space-y-4">
            <AnimatePresence mode="wait">
              {/* STEP 1: ADDRESS */}
              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 md:p-8 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-[#ECECEC]">
                    <div className="w-9 h-9 rounded-xl bg-[#004AAD]/10 flex items-center justify-center text-[#004AAD]">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#111111]">Delivery Address</h2>
                      <p className="text-[#666666] text-xs">Where should we deliver your order?</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        Full Name *
                      </label>
                      <input
                        value={addressData.name}
                        onChange={(e) => setAddressData({ ...addressData, name: e.target.value })}
                        placeholder="Your full name"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        value={addressData.phone}
                        onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                        placeholder="+91 XXXXXXXXXX"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        Pincode *
                      </label>
                      <input
                        value={addressData.pincode}
                        onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        City *
                      </label>
                      <input
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        placeholder="City"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        State *
                      </label>
                      <input
                        value={addressData.state}
                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                        placeholder="State"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        Complete Address *
                      </label>
                      <textarea
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        rows={3}
                        placeholder="House/flat number, street name, area, landmark"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleProceedFromAddress}
                      className="flex items-center justify-center gap-2 bg-[#03173D] text-white rounded-full px-8 py-3.5 font-semibold hover:bg-[#004AAD] transition-all shadow-md hover:shadow-lg cursor-pointer text-sm"
                    >
                      {isFrameOnly || isPrescriptionDone
                        ? "Proceed to Payment"
                        : "Proceed to Prescription"}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PRESCRIPTION */}
              {activeStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 md:p-8 space-y-6"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#ECECEC]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#004AAD]/10 flex items-center justify-center text-[#004AAD]">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h2 className="font-semibold text-[#111111]">Prescription Details</h2>
                        <p className="text-[#666666] text-xs">
                          {itemsNeedingPrescription.length > 1
                            ? `Provide prescription for ${itemsNeedingPrescription.length} prescription frames`
                            : "Enter your vision power or upload an eye doctor slip"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Multi-frame tabs / bulk toggle */}
                  {itemsNeedingPrescription.length > 1 && (
                    <div className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#111111]">
                          Multiple Frames Requiring Lenses
                        </span>
                        <label className="flex items-center gap-2 text-xs font-medium text-[#004AAD] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={applyToAllFrames}
                            onChange={(e) => setApplyToAllFrames(e.target.checked)}
                            className="w-4 h-4 rounded text-[#004AAD] focus:ring-[#004AAD]"
                          />
                          Use same prescription for all frames
                        </label>
                      </div>

                      {!applyToAllFrames && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {itemsNeedingPrescription.map((item, idx) => {
                            const key = String(item.database_id || item.id || item.product_id);
                            const isSelected = selectedItemTab === key;
                            const hasRx = Boolean(
                              itemPrescriptions[key]?.left_eye ||
                                itemPrescriptions[key]?.file_url ||
                                item.prescription_json
                            );

                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedItemTab(key)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer",
                                  isSelected
                                    ? "bg-[#03173D] text-white border-[#03173D]"
                                    : "bg-white text-[#444444] border-[#E8EAF2] hover:border-[#CCCCCC]"
                                )}
                              >
                                <span>
                                  Frame {idx + 1}: {item.products?.name || item.name}
                                </span>
                                {hasRx && <CheckCircle2 size={12} className="text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Power Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        Left Eye Power (OS - SPH)
                      </label>
                      <input
                        value={
                          !applyToAllFrames && selectedItemTab && itemPrescriptions[selectedItemTab]?.left_eye !== undefined
                            ? itemPrescriptions[selectedItemTab].left_eye
                            : prescription.left_eye
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescription((p) => ({ ...p, left_eye: val }));
                          if (!applyToAllFrames && selectedItemTab) {
                            setItemPrescriptions((prev) => ({
                              ...prev,
                              [selectedItemTab]: { ...(prev[selectedItemTab] || {}), left_eye: val, os_sph: val },
                            }));
                          }
                        }}
                        placeholder="-2.50 / +1.75"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        Right Eye Power (OD - SPH)
                      </label>
                      <input
                        value={
                          !applyToAllFrames && selectedItemTab && itemPrescriptions[selectedItemTab]?.right_eye !== undefined
                            ? itemPrescriptions[selectedItemTab].right_eye
                            : prescription.right_eye
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescription((p) => ({ ...p, right_eye: val }));
                          if (!applyToAllFrames && selectedItemTab) {
                            setItemPrescriptions((prev) => ({
                              ...prev,
                              [selectedItemTab]: { ...(prev[selectedItemTab] || {}), right_eye: val, od_sph: val },
                            }));
                          }
                        }}
                        placeholder="-2.50 / +1.75"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">
                        Pupillary Distance (PD)
                      </label>
                      <input
                        value={
                          !applyToAllFrames && selectedItemTab && itemPrescriptions[selectedItemTab]?.pd !== undefined
                            ? itemPrescriptions[selectedItemTab].pd
                            : prescription.pd
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescription((p) => ({ ...p, pd: val }));
                          if (!applyToAllFrames && selectedItemTab) {
                            setItemPrescriptions((prev) => ({
                              ...prev,
                              [selectedItemTab]: { ...(prev[selectedItemTab] || {}), pd: val },
                            }));
                          }
                        }}
                        placeholder="e.g. 62mm (optional)"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                  </div>

                  {/* File upload alternative */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E8EAF2] rounded-2xl p-6 text-center cursor-pointer hover:border-[#004AAD] hover:bg-[#F0F4FF]/30 transition-all"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, !applyToAllFrames ? selectedItemTab : undefined)}
                      accept="image/*,application/pdf"
                      disabled={uploadingPrescription}
                    />
                    <Upload size={28} className="mx-auto text-[#004AAD]/50 mb-2" />
                    {uploadingPrescription ? (
                      <p className="text-sm font-semibold text-[#004AAD] animate-pulse">
                        Uploading prescription file...
                      </p>
                    ) : prescription.file_url ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-emerald-600 flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={16} /> Prescription file uploaded
                        </p>
                        <p className="text-xs text-[#666666]">Click to upload a replacement file</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#111111]">Upload Doctor Prescription</p>
                        <p className="text-xs text-[#666666] mt-1">
                          Take a photo or upload PDF of your clinic slip
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBackFromPrescription}
                      className="border border-[#03173D] text-[#03173D] rounded-full px-6 py-3.5 font-semibold hover:bg-[#03173D] hover:text-white transition-all text-sm cursor-pointer text-center"
                    >
                      Back to Address
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedFromPrescription}
                      className="flex items-center justify-center gap-2 bg-[#03173D] text-white rounded-full px-8 py-3.5 font-semibold hover:bg-[#004AAD] transition-all flex-1 sm:flex-none shadow-md hover:shadow-lg cursor-pointer text-sm"
                    >
                      Proceed to Payment <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PAYMENT */}
              {activeStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-[#ECECEC]">
                      <div className="w-9 h-9 rounded-xl bg-[#004AAD]/10 flex items-center justify-center text-[#004AAD]">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <h2 className="font-semibold text-[#111111]">Payment Method</h2>
                        <p className="text-[#666666] text-xs">Choose how you wish to pay.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Online Payment Option */}
                      <div
                        onClick={() => setPaymentMethod("razorpay")}
                        className={cn(
                          "p-5 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border-2",
                          paymentMethod === "razorpay"
                            ? "border-[#03173D] bg-[#F0F4FF] shadow-sm"
                            : "border-[#ECECEC] bg-white hover:border-[#CCCCCC] hover:bg-[#F8F9FC]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            paymentMethod === "razorpay"
                              ? "bg-[#03173D] text-white"
                              : "bg-[#F4F6F8] text-[#555555]"
                          )}
                        >
                          <CreditCard size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#111111] text-sm">Online Payment</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Instant & Secure
                            </span>
                          </div>
                          <p className="text-[#666666] text-xs mt-0.5">
                            UPI (GPay, PhonePe, Paytm), Credit/Debit Cards & Net Banking
                          </p>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all",
                            paymentMethod === "razorpay"
                              ? "bg-[#03173D] border-[#03173D]"
                              : "border-[#CCCCCC] bg-white"
                          )}
                        >
                          {paymentMethod === "razorpay" && (
                            <CheckCircle2 size={12} className="text-white" />
                          )}
                        </div>
                      </div>

                      {/* Cash on Delivery Option - only for sunglasses-only cart */}
                      {allSunglasses && (
                        <div
                          onClick={() => setPaymentMethod("cod")}
                          className={cn(
                            "p-5 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border-2",
                            paymentMethod === "cod"
                              ? "border-[#03173D] bg-[#F0F4FF] shadow-sm"
                              : "border-[#ECECEC] bg-white hover:border-[#CCCCCC] hover:bg-[#F8F9FC]"
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              paymentMethod === "cod"
                                ? "bg-[#03173D] text-white"
                                : "bg-[#F4F6F8] text-[#555555]"
                            )}
                          >
                            <Banknote size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#111111] text-sm">Cash on Delivery (COD)</p>
                            <p className="text-[#666666] text-xs mt-0.5">
                              Pay in cash or UPI directly when your package arrives at your doorstep
                            </p>
                          </div>
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all",
                              paymentMethod === "cod"
                                ? "bg-[#03173D] border-[#03173D]"
                                : "border-[#CCCCCC] bg-white"
                            )}
                          >
                            {paymentMethod === "cod" && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E8EAF2] flex items-start gap-3">
                      <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-[#666666] text-xs leading-relaxed">
                        {paymentMethod === "cod"
                          ? "Cash on Delivery is available across all serviceable pincodes in India. Please keep exact cash or UPI ready upon delivery."
                          : "Your payment is secured and encrypted via Razorpay. We never store your payment credentials."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBackFromPayment}
                      className="border border-[#03173D] text-[#03173D] rounded-full px-6 py-3.5 font-semibold hover:bg-[#03173D] hover:text-white transition-all text-sm cursor-pointer text-center"
                    >
                      Back to Address
                    </button>
                    <button
                      disabled={orderProcessing}
                      onClick={handlePayment}
                      className="flex items-center justify-center gap-2 bg-[#03173D] text-white rounded-full px-8 py-3.5 font-semibold hover:bg-[#004AAD] transition-all flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg cursor-pointer text-sm"
                    >
                      {orderProcessing
                        ? "Placing Order..."
                        : paymentMethod === "cod"
                        ? `Place Order (COD) • ₹${Math.round(grandTotal).toLocaleString("en-IN")}`
                        : `Pay Now • ₹${Math.round(grandTotal).toLocaleString("en-IN")}`}
                      {!orderProcessing && <ArrowRight size={16} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Consolidated Order Summary Component */}
          <div className="lg:col-span-5 sticky top-28">
            <OrderSummary
              items={cartItems}
              itemPrescriptions={itemPrescriptions}
              checkoutPrescription={prescription}
              couponCode={couponCode}
              onCouponCodeChange={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={() => {
                setCouponDiscount(0);
                setCouponApplied("");
                setCouponCode("");
                setCouponId(null);
              }}
              couponApplied={couponApplied}
              couponDiscount={couponDiscount}
              applyingCoupon={applyingCoupon}
              showCoupon={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
