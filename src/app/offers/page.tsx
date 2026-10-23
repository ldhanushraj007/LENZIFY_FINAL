"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOffersData } from "./actions";
import ProductCard from "@/components/store/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowRight, Tag, Zap, Lock, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

const FILTER_TABS = [
  { value: "discounts", label: "Discounts" },
  { value: "coupons", label: "Coupon Codes" },
  { value: "seasonal-sales", label: "Seasonal Sales" },
];

const APPLIES_TO_MAP: Record<string, string> = {
  all: "All Products",
  eyeglasses: "Eyeglasses",
  sunglasses: "Sunglasses",
  "contact-lens": "Contact Lenses",
  "computer-glasses": "Computer Glasses",
  "reading-glasses": "Reading Glasses",
  lenses: "Prescription Lenses",
  accessories: "Accessories",
};

function OffersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") || "discounts";

  const [items, setItems] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await getOffersData(type);
      setIsAuthenticated(res.authenticated);
      setItems(res.items || []);
      setLoading(false);
    }
    fetchData();
  }, [type]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => {
      setCopiedCode((current) => (current === code ? null : current));
    }, 2000);
  };

  const handleApplyToCart = (code: string) => {
    sessionStorage.setItem("lenzify_pending_coupon", code);
    sessionStorage.setItem("lenzify_applied_coupon", code);
    toast.success(`${code} selected! Redirecting to shop...`);
    router.push("/products");
  };

  const activeTab = FILTER_TABS.find((t) => t.value === type) || FILTER_TABS[0];

  return (
    <div className="bg-[#F8F9FC] min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#03173D] to-[#004AAD] pt-28 pb-16 px-6 lg:px-12 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Zap size={14} className="text-yellow-300" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Limited Time
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-[var(--font-hero)] italic text-white mb-4">
            Exclusive Offers
          </h1>
          <p className="text-white/70 text-base max-w-lg mx-auto">
            Discover savings on premium eyewear — discounts, coupon codes, and seasonal deals.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
        {/* Filter Tabs */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2 mb-8">
          <div className="bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl p-1.5 inline-flex gap-1 shrink-0">
            {FILTER_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={`/offers?type=${tab.value}`}
                className={cn(
                  "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all",
                  type === tab.value
                    ? "bg-white border border-[#ECECEC] text-[#111111] shadow-sm"
                    : "text-[#666666] hover:text-[#111111]"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Section label */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1">
            {activeTab.label}
          </p>
          <h2 className="text-3xl font-[var(--font-hero)] italic text-[#111111]">
            {type === "coupons"
              ? "Active Coupon Codes"
              : type === "discounts"
              ? "On-Sale Products"
              : "Seasonal Deals"}
          </h2>
        </div>

        {/* Loading / Auth Check */}
        {!loading && isAuthenticated === false && type !== "coupons" ? (
          <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-12 sm:p-16 text-center max-w-lg mx-auto my-8">
            <div className="w-16 h-16 bg-[#004AAD]/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#004AAD]/20">
              <Lock size={26} className="text-[#004AAD]" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#004AAD] mb-2">
              Member Exclusive
            </p>
            <h3 className="text-2xl font-[var(--font-hero)] italic text-[#111111] mb-3">
              Sign In to Unlock Offers
            </h3>
            <p className="text-[#666666] text-sm mb-8 leading-relaxed">
              Special promotional pricing and seasonal discounts are reserved exclusively for registered Lenzify members.
            </p>
            <Link
              href="/auth/login?redirect=/offers"
              className="inline-flex items-center justify-center gap-2 bg-[#03173D] text-white rounded-full px-8 py-3.5 font-semibold hover:bg-[#004AAD] transition-all text-sm shadow-md"
            >
              Sign In to View Offers
            </Link>
          </div>
        ) : loading ? (
          <div
            className={cn(
              "grid gap-6",
              type === "coupons"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}
          >
            {Array.from({ length: type === "coupons" ? 3 : 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#ECECEC] animate-pulse h-56"
              />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div
            className={cn(
              "grid gap-6",
              type === "coupons"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="h-full"
                >
                  {type === "coupons" ? (
                    /* Customer Coupon Card matching exact specification */
                    <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 sm:p-7 flex flex-col justify-between h-full hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] transition-all duration-300 relative overflow-hidden group">
                      {/* Top Row: Code & Copy Code */}
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xl sm:text-2xl font-black text-[#03173D] tracking-wider uppercase">
                              {item.code}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.code)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border",
                              copiedCode === item.code
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-[#F8F9FC] text-[#03173D] border-[#ECECEC] hover:bg-[#03173D] hover:text-white"
                            )}
                          >
                            {copiedCode === item.code ? (
                              <>
                                <Check size={13} className="text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Title / Description / Savings */}
                        <div className="space-y-1.5 mb-5">
                          <p className="font-bold text-base text-[#111111] leading-snug">
                            {(() => {
                              if (item.title) return item.title;
                              const minVal = Number(
                                item.minimum_order_value && item.minimum_order_value > 0
                                  ? item.minimum_order_value
                                  : item.min_order || 0
                              );
                              const discountLabel =
                                item.discount_type === "percentage"
                                  ? `${item.discount_value}%`
                                  : `₹${item.discount_value}`;
                              return minVal > 0
                                ? `Save ${discountLabel} on orders above ₹${minVal.toLocaleString("en-IN")}`
                                : `Save ${discountLabel} on all orders`;
                            })()}
                          </p>
                          {item.description && (
                            <p className="text-xs text-[#666666] leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Meta info: Valid till & Applies to */}
                        <div className="space-y-1.5 text-xs text-[#555555] mb-6 pt-3 border-t border-[#F0F0F0]">
                          <div className="flex items-center justify-between">
                            <span className="text-[#888888]">Valid till:</span>
                            <span className="font-medium text-[#111111]">
                              {item.valid_until || item.expiry
                                ? new Date(item.valid_until || item.expiry).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "No expiry"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#888888]">Applies to:</span>
                            <span className="font-medium text-[#111111]">
                              {APPLIES_TO_MAP[item.applicable_to] ||
                                item.applicable_to ||
                                "All Products"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Button: Apply to Cart -> */}
                      <div className="pt-4 border-t border-[#ECECEC]">
                        <button
                          type="button"
                          onClick={() => handleApplyToCart(item.code)}
                          className="w-full bg-[#03173D] text-white hover:bg-[#004AAD] rounded-full py-3 px-5 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-lg"
                        >
                          <span>Apply to Cart</span>
                          <ArrowRight
                            size={15}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ProductCard product={item} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#F8F9FC] rounded-full flex items-center justify-center mx-auto mb-5 border border-[#ECECEC]">
              <Tag size={24} className="text-[#004AAD]/30" />
            </div>
            <h3 className="text-xl font-[var(--font-hero)] italic text-[#111111] mb-2">
              No offers right now
            </h3>
            <p className="text-[#666666] text-sm mb-6">
              Check back soon — new deals are added regularly.
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#03173D] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#004AAD] transition-all"
            >
              Shop All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#F8F9FC] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#03173D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#666666] text-sm">Loading offers...</p>
          </div>
        </div>
      }
    >
      <OffersContent />
    </Suspense>
  );
}
