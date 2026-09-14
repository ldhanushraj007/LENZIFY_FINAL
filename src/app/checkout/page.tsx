"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getCart } from "@/lib/db/customer_actions";
import { placeOrder } from "@/lib/db/order_actions";
import { cn } from "@/lib/utils";
import { validateCheckoutAddress, sanitizeErrorMessage } from "@/lib/validation";
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
  Eye,
  Shield,
  Tag,
  X,
} from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";

const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Prescription", icon: FileText },
  { id: 3, label: "Payment", icon: CreditCard },
];

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [paymentMethod] = useState<"upi">("upi");

  const [addressData, setAddressData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [prescription, setPrescription] = useState<{
    file_url?: string;
    left_eye: string;
    right_eye: string;
    pd: string;
  }>({ left_eye: "", right_eye: "", pd: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPrescription(true);
    const toastId = toast.loading("Uploading prescription...");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `prescriptions/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setPrescription(prev => ({ ...prev, file_url: publicUrl }));
      toast.success("Prescription uploaded!", { id: toastId });
    } catch (err: any) {
      console.error("Prescription upload error:", err);
      toast.error(err.message || "Failed to upload prescription.", { id: toastId });
    } finally {
      setUploadingPrescription(false);
    }
  };

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [couponId, setCouponId] = useState<number | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error("Enter a coupon code."); return; }
    setApplyingCoupon(true);
    const subtotal = cartItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
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

  const supabase = createClient();
  const router = useRouter();

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
        setAddressData(prev => ({ ...prev, name: user.user_metadata?.name || "" }));
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

  const handlePayment = async () => {
    const validationErrors = validateCheckoutAddress(addressData);
    if (validationErrors.length > 0) {
      validationErrors.forEach(err => toast.error(err.message));
      return;
    }
    setOrderProcessing(true);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const tax = discountedSubtotal * 0.18;
    const totalAmount = discountedSubtotal + tax;

    // UPI / Razorpay Flow
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount })
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
          email: user?.email
        },
        theme: { color: "#03173D" },
        modal: {
          ondismiss: function () { setOrderProcessing(false); }
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
              items: cartItems.map(item => ({
                id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                lens_id: item.lens_id,
                selected_color: item.selected_color,
                selected_size: item.selected_size,
                prescription_json: item.prescription_json || (prescription.left_eye ? {
                  od_sph: prescription.right_eye,
                  os_sph: prescription.left_eye,
                  pd: prescription.pd
                } : null)
              })),
              total_price: totalAmount,
              address: addressData,
              prescription: (prescription.left_eye || prescription.file_url) ? prescription : undefined,
              payment: { id: response.razorpay_payment_id, method: "razorpay" }
            });

            if (orderRes.success) {
              if (couponId) await incrementCouponUsage(couponId);
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
        }
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
          <p className="text-[#666666] text-sm">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const tax = discountedSubtotal * 0.18;
  const total = discountedSubtotal + tax;

  const isFrameOnly = cartItems.length > 0 && cartItems.every(item => !item.lens_id && !item.prescription_json);
  const maxStep = isFrameOnly ? 2 : 3; // If frame-only, skip prescription step (step 2 becomes payment)

  const goNext = () => {
    if (isFrameOnly && activeStep === 1) {
      setActiveStep(3); // skip prescription
    } else {
      setActiveStep(s => Math.min(s + 1, 3));
    }
  };

  const goBack = () => {
    if (isFrameOnly && activeStep === 3) {
      setActiveStep(1);
    } else {
      setActiveStep(s => Math.max(s - 1, 1));
    }
  };

  // Determine which steps to show in indicator
  const visibleSteps = isFrameOnly
    ? [{ id: 1, label: "Address" }, { id: 3, label: "Payment" }]
    : STEPS;

  const getStepIndex = (stepId: number) => visibleSteps.findIndex(s => s.id === stepId);
  const activeVisibleIndex = visibleSteps.findIndex(s => s.id === activeStep);

  return (
    <div className="bg-[#F8F9FC] min-h-screen pt-20 md:pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-2">Checkout</p>
          <h1 className="text-2xl md:text-4xl font-[var(--font-hero)] italic text-[#111111]">Complete Your Order</h1>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center gap-0">
          {visibleSteps.map((step, i) => {
            const isCompleted = activeVisibleIndex > i;
            const isCurrent = visibleSteps[i].id === activeStep;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300",
                      isCompleted
                        ? "border-[#03173D] bg-[#03173D] text-white"
                        : isCurrent
                        ? "border-[#03173D] bg-white text-[#03173D]"
                        : "border-[#ECECEC] bg-white text-[#666666]"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold hidden sm:block",
                      isCurrent ? "text-[#03173D]" : isCompleted ? "text-[#111111]" : "text-[#666666]"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < visibleSteps.length - 1 && (
                  <div className="flex-1 mx-3 h-0.5 bg-[#ECECEC] relative overflow-hidden">
                    <div
                      className={cn("h-full bg-[#03173D] transition-all duration-500", isCompleted ? "w-full" : "w-0")}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Steps */}
          <div className="lg:col-span-7 space-y-4">
            <AnimatePresence mode="wait">
              {/* STEP 1: ADDRESS */}
              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-[#ECECEC]">
                    <MapPin size={20} className="text-[#004AAD]" />
                    <div>
                      <h2 className="font-semibold text-[#111111]">Delivery Address</h2>
                      <p className="text-[#666666] text-xs">Where should we deliver your order?</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">Full Name</label>
                      <input
                        value={addressData.name}
                        onChange={(e) => setAddressData({ ...addressData, name: e.target.value })}
                        placeholder="Your full name"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">Phone Number</label>
                      <input
                        value={addressData.phone}
                        onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                        placeholder="+91 XXXXXXXXXX"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">Pincode</label>
                      <input
                        value={addressData.pincode}
                        onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                        placeholder="6-digit pincode"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">City</label>
                      <input
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        placeholder="City"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">State</label>
                      <input
                        value={addressData.state}
                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                        placeholder="State"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">Address</label>
                      <textarea
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        rows={3}
                        placeholder="House/flat number, street name, area"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={goNext}
                    className="flex items-center gap-2 bg-[#03173D] text-white rounded-full px-8 py-3 font-semibold hover:bg-[#004AAD] transition-all"
                  >
                    {isFrameOnly ? "Proceed to Payment" : "Proceed to Prescription"}
                    <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: PRESCRIPTION */}
              {activeStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-[#ECECEC]">
                    <FileText size={20} className="text-[#004AAD]" />
                    <div>
                      <h2 className="font-semibold text-[#111111]">Prescription Details</h2>
                      <p className="text-[#666666] text-xs">Optional — enter your vision power for lens grinding.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">Left Eye Power (SPH)</label>
                      <input
                        value={prescription.left_eye}
                        onChange={(e) => setPrescription({ ...prescription, left_eye: e.target.value })}
                        placeholder="+0.00 / -0.00"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">Right Eye Power (SPH)</label>
                      <input
                        value={prescription.right_eye}
                        onChange={(e) => setPrescription({ ...prescription, right_eye: e.target.value })}
                        placeholder="+0.00 / -0.00"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1.5">Pupillary Distance (PD)</label>
                      <input
                        value={prescription.pd}
                        onChange={(e) => setPrescription({ ...prescription, pd: e.target.value })}
                        placeholder="e.g. 62mm"
                        className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full text-sm"
                      />
                    </div>
                  </div>

                  {/* File upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E8EAF2] rounded-xl p-8 text-center cursor-pointer hover:border-[#004AAD] hover:bg-[#F0F4FF]/30 transition-all"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                      disabled={uploadingPrescription}
                    />
                    <Upload size={28} className="mx-auto text-[#004AAD]/40 mb-3" />
                    {uploadingPrescription ? (
                      <p className="text-sm font-semibold text-[#004AAD] animate-pulse">Uploading...</p>
                    ) : prescription.file_url ? (
                      <p className="text-sm font-semibold text-emerald-600">Prescription uploaded</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#111111]">Upload Prescription</p>
                        <p className="text-xs text-[#666666] mt-1">Image or PDF — optional</p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={goBack}
                      className="border border-[#03173D] text-[#03173D] rounded-full px-6 py-3 font-semibold hover:bg-[#03173D] hover:text-white transition-all text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={goNext}
                      className="flex items-center justify-center gap-2 bg-[#03173D] text-white rounded-full px-8 py-3 font-semibold hover:bg-[#004AAD] transition-all flex-1 sm:flex-none"
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-[#ECECEC]">
                      <CreditCard size={20} className="text-[#004AAD]" />
                      <div>
                        <h2 className="font-semibold text-[#111111]">Payment Method</h2>
                        <p className="text-[#666666] text-xs">Choose how you want to pay.</p>
                      </div>
                    </div>

                    <div className="p-5 border-2 border-[#03173D] bg-[#F0F4FF] rounded-2xl flex items-center gap-4">
                      <CreditCard size={22} className="text-[#03173D] shrink-0" />
                      <div>
                        <p className="font-semibold text-[#111111] text-sm">UPI / Card / Net Banking</p>
                        <p className="text-[#666666] text-xs mt-0.5">Instant payment via Razorpay</p>
                      </div>
                      <div className="ml-auto w-5 h-5 rounded-full bg-[#03173D] flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    </div>

                    <p className="text-[#666666] text-xs leading-relaxed">
                      By completing your purchase, you confirm that the information provided is accurate.
                      Your payment is secured and encrypted.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={goBack}
                      className="border border-[#03173D] text-[#03173D] rounded-full px-6 py-3 font-semibold hover:bg-[#03173D] hover:text-white transition-all text-sm"
                    >
                      Back
                    </button>
                    <button
                      disabled={orderProcessing}
                      onClick={handlePayment}
                      className="flex items-center justify-center gap-2 bg-[#03173D] text-white rounded-full px-8 py-3 font-semibold hover:bg-[#004AAD] transition-all flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {orderProcessing ? "Processing..." : "Pay Now"}
                      {!orderProcessing && <ArrowRight size={16} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Order Summary (sticky) */}
          <div className="lg:col-span-5 sticky top-32">
            <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 space-y-6">
              <h2 className="font-semibold text-[#111111] text-base">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {cartItems.map((item, i) => {
                  const lensCfg = item.lens_config || {};
                  const indexName = lensCfg.index_label || lensCfg.thickness?.name || (lensCfg.selected_index ? `Index ${lensCfg.selected_index}` : null);
                  const lensTypeName = item.lenses?.name || lensCfg.type?.name || item.lens_name;
                  const tierName = lensCfg.tier ? `(${lensCfg.tier.toUpperCase()})` : "";
                  const frameType = item.products?.frame_type || lensCfg.frame_type;

                  return (
                    <div key={i} className="flex gap-3 pb-3 border-b border-[#F0F0F0] last:border-b-0">
                      <div className="w-16 h-16 bg-[#F8F9FC] border border-[#ECECEC] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img
                          src={item.products?.product_images?.[0]?.image_url || "/placeholder.jpg"}
                          className="w-full h-full object-contain"
                          alt={item.products?.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#111111] text-sm truncate">{item.products?.name}</p>
                        
                        {/* Variant details (Frame type, color, size) */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {frameType && (
                            <span className="text-[9px] font-bold uppercase bg-[#03173D]/5 text-[#03173D] px-1.5 py-0.5 rounded">
                              {frameType.replace('_', ' ')}
                            </span>
                          )}
                          {item.selected_color && (
                            <span className="text-[10px] text-[#666666]">
                              Color: {item.selected_color}
                            </span>
                          )}
                          {item.selected_size && (
                            <span className="text-[10px] text-[#666666]">
                              • Size: {item.selected_size}
                            </span>
                          )}
                        </div>

                        {/* Lens Configuration & Chosen Index */}
                        {lensTypeName && (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-xs font-semibold text-[#004AAD]">
                              {lensTypeName} {tierName} {lensCfg.package_name ? `• ${lensCfg.package_name}` : ""}
                            </p>
                            {indexName && (
                              <p className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded inline-block">
                                Refractive Index: {indexName}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="text-[#888888] text-xs mt-1">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[#111111] text-sm flex-shrink-0">
                        ₹{(item.price || item.products?.offer_price || 0).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              <div className="border-t border-[#ECECEC] pt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Coupon Code</p>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    disabled={!!couponApplied}
                    className="flex-1 bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-3 py-2.5 text-[#111111] text-xs font-semibold focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none disabled:opacity-50"
                  />
                  {couponApplied ? (
                    <button
                      onClick={() => { setCouponDiscount(0); setCouponApplied(""); setCouponCode(""); }}
                      className="px-3 py-2.5 bg-red-50 text-red-500 text-xs font-semibold border border-red-200 rounded-xl hover:bg-red-100 transition-all flex items-center gap-1"
                    >
                      <X size={12} /> Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      className="px-4 py-2.5 bg-[#03173D] text-white text-xs font-semibold rounded-xl hover:bg-[#004AAD] transition-all disabled:opacity-50"
                    >
                      {applyingCoupon ? "..." : "Apply"}
                    </button>
                  )}
                </div>
                {couponApplied && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                    <Tag size={12} /> {couponApplied} applied
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              <div className="border-t border-[#ECECEC] pt-4 space-y-3">
                <div className="flex justify-between text-sm text-[#666666]">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-[#666666]">
                  <span>GST (18%)</span>
                  <span>₹{Math.round(tax).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-[#004AAD] font-semibold">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-[#ECECEC] pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-[#111111]">Total</span>
                  <span className="text-2xl font-bold text-[#111111]">₹{Math.round(total).toLocaleString()}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 pt-2 opacity-40">
                <Shield size={18} className="text-[#111111]" />
                <Eye size={18} className="text-[#111111]" />
                <ShieldCheck size={18} className="text-[#111111]" />
              </div>
              <p className="text-center text-xs text-[#666666]">Secured & Encrypted Checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
