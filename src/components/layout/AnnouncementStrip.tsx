"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface CouponAnnouncement {
  code: string;
  discount_value: number;
  discount_type: string;
  minimum_order_value?: number | null;
  min_order?: number | null;
}

export default function AnnouncementStrip() {
  const [coupons, setCoupons] = useState<CouponAnnouncement[]>([]);

  useEffect(() => {
    async function fetchActiveCoupons() {
      try {
        const supabase = createClient();
        const now = new Date().toISOString();
        const { data } = await supabase
          .from("coupons")
          .select("code, discount_value, discount_type, minimum_order_value, min_order")
          .eq("is_active", true)
          .or(`valid_until.is.null,valid_until.gt.${now}`)
          .order("discount_value", { ascending: false })
          .limit(3);

        if (data && data.length > 0) {
          setCoupons(data);
        }
      } catch (err) {
        // Fallback to static text
      }
    }

    fetchActiveCoupons();
  }, []);

  // Build announcement message
  const announcementParts: string[] = [];
  if (coupons.length > 0) {
    coupons.forEach((c) => {
      const min = c.minimum_order_value ?? c.min_order ?? 0;
      const discountText =
        c.discount_type === "percentage"
          ? `${c.discount_value}%`
          : `₹${c.discount_value}`;
      announcementParts.push(
        `🎉 Save ${discountText} on orders above ₹${min.toLocaleString("en-IN")} — Use ${c.code}`
      );
    });
    announcementParts.push("Free delivery on all orders");
    announcementParts.push("Premium eyewear starting ₹799");
  } else {
    announcementParts.push("Free delivery on all orders");
    announcementParts.push("Premium eyewear starting ₹799");
    announcementParts.push("India's newest eyewear brand");
  }

  const fullText = announcementParts.join("   •   ") + "   •   ";

  return (
    <div className="w-full h-9 bg-gradient-to-r from-[#03173D] via-[#004AAD] to-[#03173D] text-white flex items-center overflow-hidden border-b border-white/10 select-none z-50">
      <div className="w-full flex overflow-hidden group">
        <div
          className="flex shrink-0 items-center whitespace-nowrap group-hover:[animation-play-state:paused]"
          style={{
            animation: "marquee 32s linear infinite",
          }}
        >
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider px-4 flex items-center gap-2">
            {fullText}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center whitespace-nowrap group-hover:[animation-play-state:paused]"
          style={{
            animation: "marquee 32s linear infinite",
          }}
        >
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider px-4 flex items-center gap-2">
            {fullText}
          </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
