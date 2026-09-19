"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getOffersData } from "./actions";
import ProductCard from "@/components/store/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Ticket, Percent, ShoppingBag, Tag, Zap, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

const FILTER_TABS = [
  { value: "discounts", label: "Discounts" },
  { value: "coupons", label: "Coupon Codes" },
  { value: "seasonal-sales", label: "Seasonal Sales" },
];

function OffersContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "discounts";

  const [items, setItems] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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
    toast.success(`Copied: ${code}`);
  };

  const activeTab = FILTER_TABS.find(t => t.value === type) || FILTER_TABS[0];

  return (
    <div className="bg-[#F8F9FC] min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#03173D] to-[#004AAD] pt-28 pb-16 px-6 lg:px-12 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Zap size={14} className="text-yellow-300" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80">Limited Time</span>
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
        <div className="bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl p-1.5 inline-flex gap-1 mb-10">
          {FILTER_TABS.map(tab => (
            <Link
              key={tab.value}
              href={`/offers?type=${tab.value}`}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                type === tab.value
                  ? "bg-white border border-[#ECECEC] text-[#111111] shadow-sm"
                  : "text-[#666666] hover:text-[#111111]"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Section label */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1">
            {activeTab.label}
          </p>
          <h2 className="text-3xl font-[var(--font-hero)] italic text-[#111111]">
            {type === "coupons" ? "Active Coupon Codes" : type === "discounts" ? "On-Sale Products" : "Seasonal Deals"}
          </h2>
        </div>

        {/* Loading / Auth Check */}
        {!loading && isAuthenticated === false ? (
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
              Coupon codes, special promotional pricing, and seasonal discounts are reserved exclusively for registered Lenzify members.
            </p>
            <Link
              href="/auth/login?redirect=/offers"
              className="inline-flex items-center justify-center gap-2 bg-[#03173D] text-white rounded-full px-8 py-3.5 font-semibold hover:bg-[#004AAD] transition-all text-sm shadow-md"
            >
              Sign In to View Offers
            </Link>
          </div>
        ) : loading ? (
          <div className={cn(
            "grid gap-6",
            type === "coupons" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          )}>
            {Array.from({ length: type === "coupons" ? 3 : 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-[#ECECEC] animate-pulse h-48" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className={cn(
            "grid gap-6",
            type === "coupons" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          )}>
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {type === "coupons" ? (
                    /* Coupon Card */
                    <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 flex flex-col h-full hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-[#004AAD]/10 rounded-xl flex items-center justify-center">
                          <Percent size={18} className="text-[#004AAD]" />
                        </div>
                        <span className="bg-[#004AAD]/10 text-[#004AAD] text-xs font-bold uppercase rounded-full px-3 py-1">
                          Valid
                        </span>
                      </div>

                      <div className="flex-1">
                        <p className="text-4xl font-bold text-[#03173D] mb-2">
                          {item.discount_type === "flat"
                            ? `₹${item.discount_value} OFF`
                            : `${item.discount_value}% OFF`}
                        </p>
                        <p className="text-[#666666] text-sm leading-relaxed">
                          {item.description || `Valid on orders above ₹${item.min_order_value || 0}`}
                        </p>
                        {item.expiry_date && (
                          <p className="text-xs text-[#666666] mt-2">
                            Valid till{" "}
                            {new Date(item.expiry_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 pt-5 border-t border-[#ECECEC]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-[#666666] uppercase tracking-widest">Code</span>
                          <span className="font-mono font-bold text-[#111111] text-sm">{item.code}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(item.code)}
                          className="w-full bg-[#03173D] text-white rounded-full py-2.5 text-sm font-semibold hover:bg-[#004AAD] transition-all flex items-center justify-center gap-2"
                        >
                          <Copy size={14} /> Copy Code
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
            <h3 className="text-xl font-[var(--font-hero)] italic text-[#111111] mb-2">No offers right now</h3>
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
