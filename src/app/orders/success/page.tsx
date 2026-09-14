"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Package, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<any>(null);
  const [phase, setPhase] = useState<"burst" | "details">("burst");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("details"), 2600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const supabase = createClient();
    supabase
      .from("orders")
      .select("*, order_items(*, products(name, product_images(image_url)))")
      .eq("id", orderId)
      .single()
      .then((res: { data: any }) => setOrder(res.data));
  }, [orderId]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start pt-24 pb-16 px-4">
      <AnimatePresence mode="wait">
        {phase === "burst" ? (
          /* ── BURST ANIMATION ── */
          <motion.div
            key="burst"
            className="flex flex-col items-center justify-center flex-1 min-h-[60vh]"
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
          >
            {/* Rings */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-[#004AAD]/20"
                initial={{ width: 80, height: 80, opacity: 0.8 }}
                animate={{ width: 80 + i * 120, height: 80 + i * 120, opacity: 0 }}
                transition={{ duration: 1.6, delay: i * 0.25, ease: "easeOut" }}
                style={{ position: "absolute" }}
              />
            ))}

            {/* Check circle */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-[#004AAD] to-[#03173D] flex items-center justify-center shadow-[0_20px_60px_rgba(0,74,173,0.4)]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.35 }}
              >
                <CheckCircle2 size={52} className="text-white" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center mt-10 space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#004AAD]">
                Order Confirmed
              </p>
              <h1 className="text-4xl sm:text-6xl font-serif italic font-black text-[#03173D] leading-none">
                Order Placed
                <br />
                <span className="text-[#004AAD]">Successfully!</span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-[#666666] text-sm mt-2"
              >
                Preparing your order details…
              </motion.p>
            </motion.div>

            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[#004AAD]"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: (Math.cos((i / 8) * Math.PI * 2) * 140),
                  y: (Math.sin((i / 8) * Math.PI * 2) * 140),
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 1.2, delay: 0.2 + i * 0.05, ease: "easeOut" }}
                style={{ position: "absolute" }}
              />
            ))}
          </motion.div>
        ) : (
          /* ── ORDER DETAILS ── */
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#004AAD] to-[#03173D] flex items-center justify-center mx-auto shadow-[0_10px_30px_rgba(0,74,173,0.3)]">
                <CheckCircle2 size={30} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#004AAD] mt-4">
                Order Confirmed
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif italic text-[#03173D]">
                Order Placed Successfully!
              </h1>
              {orderId && (
                <p className="text-[#999999] text-xs font-mono">
                  #{orderId.slice(0, 12).toUpperCase()}
                </p>
              )}
            </div>

            {/* Order items */}
            {order?.order_items?.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#ECECEC] shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#ECECEC] flex items-center gap-2">
                  <Package size={16} className="text-[#004AAD]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                    Items Ordered
                  </span>
                </div>
                <div className="divide-y divide-[#F0F0F0]">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-14 h-14 bg-[#F8F9FC] rounded-xl border border-[#ECECEC] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.products?.product_images?.[0]?.image_url ? (
                          <img
                            src={item.products.product_images[0].image_url}
                            alt={item.products?.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ShoppingBag size={20} className="text-[#CCCCCC]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#111111] text-sm truncate">
                          {item.products?.name || "Product"}
                        </p>
                        <p className="text-[#999999] text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[#111111] text-sm flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 bg-[#F8F9FC] flex justify-between items-center border-t border-[#ECECEC]">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#666666]">
                      {order.payment_method === "cod" ? "Payable on Delivery" : "Total Paid"}
                    </span>
                    {order.payment_method === "cod" && (
                      <p className="text-[11px] text-amber-600 font-medium mt-0.5">Cash / UPI at doorstep</p>
                    )}
                  </div>
                  <span className="text-lg font-bold text-[#03173D]">
                    ₹{(order.total_price || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Status info */}
            <div className="bg-gradient-to-br from-[#03173D] to-[#004AAD] rounded-2xl p-6 text-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Truck size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">What happens next?</p>
                  <p className="text-white/70 text-xs">Your order is now being processed</p>
                </div>
              </div>
              <div className="space-y-2.5 pl-2">
                {[
                  "Our team will confirm and prepare your frame",
                  "Lenses will be custom-manufactured for your prescription",
                  "Quality check — then shipped to your address",
                  "You'll get email updates at every step",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-white/80 text-xs leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/orders"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#03173D] text-white rounded-full font-semibold text-sm hover:bg-[#004AAD] transition-colors"
              >
                <Package size={16} />
                View My Orders
              </Link>
              <Link
                href="/products"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-[#ECECEC] text-[#111111] rounded-full font-semibold text-sm hover:border-[#004AAD] hover:text-[#004AAD] transition-colors"
              >
                Continue Shopping
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-2 border-[#03173D] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
