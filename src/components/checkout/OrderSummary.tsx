"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, Eye, ShieldCheck, Tag, X, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ItemPrescription {
  od_sph?: string;
  od_cyl?: string;
  od_axis?: string;
  od_add?: string;
  os_sph?: string;
  os_cyl?: string;
  os_axis?: string;
  os_add?: string;
  pd?: string;
  file_url?: string;
  left_eye?: string;
  right_eye?: string;
  is_contact_lens?: boolean;
}

export interface OrderSummaryProps {
  items: any[];
  itemPrescriptions?: Record<string, ItemPrescription>;
  checkoutPrescription?: ItemPrescription;
  couponCode?: string;
  onCouponCodeChange?: (code: string) => void;
  onApplyCoupon?: () => void;
  onRemoveCoupon?: () => void;
  couponApplied?: string;
  couponDiscount?: number;
  applyingCoupon?: boolean;
  showCoupon?: boolean;
  showShippingProgress?: boolean;
  actionButton?: React.ReactNode;
  footerNote?: React.ReactNode;
  className?: string;
}

export default function OrderSummary({
  items = [],
  itemPrescriptions = {},
  checkoutPrescription,
  couponCode = "",
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
  couponApplied = "",
  couponDiscount = 0,
  applyingCoupon = false,
  showCoupon = true,
  showShippingProgress = false,
  actionButton,
  footerNote,
  className,
}: OrderSummaryProps) {
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

  const subtotal = items.reduce(
    (acc, item) => acc + (item.price || item.products?.offer_price || item.products?.price || 0) * item.quantity,
    0
  );

  const discountedSubtotal = Math.max(0, subtotal - (couponDiscount || 0));

  const taxableSubtotal = items
    .filter((item) => !isContactLensItem(item))
    .reduce(
      (acc, item) => acc + (item.price || item.products?.offer_price || item.products?.price || 0) * item.quantity,
      0
    );

  const taxableRatio = subtotal > 0 ? taxableSubtotal / subtotal : 0;
  const tax = Math.round(discountedSubtotal * taxableRatio * 0.18);
  const grandTotal = discountedSubtotal + tax;

  // Resolve prescription for a specific line item
  const getItemPrescription = (item: any): ItemPrescription | null => {
    const itemKey = item.id || item.product_id || item.database_id;
    // 1. From itemPrescriptions prop
    if (itemPrescriptions && itemKey && itemPrescriptions[itemKey]) {
      return itemPrescriptions[itemKey];
    }
    // 2. From item.prescription_json
    if (item.prescription_json) {
      return item.prescription_json;
    }
    // 3. From item.prescription
    if (item.prescription) {
      return item.prescription;
    }
    // 4. Fallback to checkoutPrescription if this item requires a lens
    if (
      (item.lens_id || item.lens_config || item.lens_name) &&
      checkoutPrescription &&
      (checkoutPrescription.left_eye || checkoutPrescription.right_eye || checkoutPrescription.file_url)
    ) {
      return checkoutPrescription;
    }
    return null;
  };

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-6",
        className
      )}
    >
      <header className="border-b border-[#ECECEC] pb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[#111111] text-base tracking-wide">Order Summary</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            {items.length} {items.length === 1 ? "item" : "items"} in order
          </p>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#004AAD] bg-[#004AAD]/5 px-2.5 py-1 rounded-full">
          Verified Details
        </span>
      </header>

      {/* Line Items List - NON-SCROLLING BLOCK */}
      <div className="space-y-4">
        {items.map((item, idx) => {
          const itemKey = item.database_id || item.id || item.product_id || idx;
          const lensCfg = item.lens_config || {};
          const indexName =
            lensCfg.index_label ||
            lensCfg.thickness?.name ||
            (lensCfg.selected_index ? `Index ${lensCfg.selected_index}` : null);
          const lensTypeName =
            item.lenses?.name || lensCfg.type?.name || item.lens_name || lensCfg.lens_name;
          const tierName = lensCfg.tier ? `(${String(lensCfg.tier).toUpperCase()})` : "";
          const frameType = item.products?.frame_type || lensCfg.frame_type;
          const rx = getItemPrescription(item);

          // Coatings & features
          const coatings: string[] = Array.isArray(lensCfg.coatings)
            ? lensCfg.coatings.map((c: any) => (typeof c === "string" ? c : c.name || c.title))
            : [];
          const features: string[] = Array.isArray(lensCfg.features)
            ? lensCfg.features.map((f: any) => (typeof f === "string" ? f : f.name || f.title))
            : [];
          const allCoatings = Array.from(new Set([...coatings, ...features])).filter(Boolean);

          const itemPrice = item.price || item.products?.offer_price || item.products?.price || 0;
          const itemTotalPrice = itemPrice * item.quantity;
          const imageUrl =
            item.image ||
            item.products?.primary_image ||
            item.products?.product_images?.[0]?.image_url ||
            "/placeholder.jpg";
          const productName = item.name || item.products?.name || "Eyewear";
          const brandName = item.brand || item.products?.brand || "LENZIFY";

          return (
            <div
              key={itemKey}
              className="pb-4 border-b border-[#F0F0F0] last:border-b-0 space-y-2.5"
            >
              {/* Product header & price */}
              <div className="flex gap-3.5 items-start">
                {/* Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 relative">
                  <img
                    src={imageUrl}
                    alt={productName}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-1 right-1 bg-[#03173D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
                    ×{item.quantity}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#004AAD]">
                        {brandName}
                      </p>
                      <h4 className="font-semibold text-[#111111] text-sm leading-tight mt-0.5">
                        {productName}
                      </h4>
                    </div>
                    <p className="font-bold text-[#111111] text-sm whitespace-nowrap">
                      ₹{itemTotalPrice.toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Frame Specs (Size, Color, Frame Type) */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {frameType && (
                      <span className="text-[9px] font-bold uppercase bg-[#03173D]/5 text-[#03173D] px-2 py-0.5 rounded">
                        {String(frameType).replace("_", " ")}
                      </span>
                    )}
                    {item.selected_size && (
                      <span className="text-[10px] bg-[#F8F9FC] border border-[#E8EAF2] text-[#444444] px-2 py-0.5 rounded font-medium">
                        Size: {item.selected_size}
                      </span>
                    )}
                    {item.selected_color && (
                      <span className="text-[10px] bg-[#F8F9FC] border border-[#E8EAF2] text-[#444444] px-2 py-0.5 rounded font-medium">
                        Color: {item.selected_color}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lens Specification breakdown */}
              {(lensTypeName || indexName || allCoatings.length > 0) && (
                <div className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl p-2.5 text-xs space-y-1.5 mt-2">
                  {lensTypeName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#666666] font-medium text-[11px]">Lens Type</span>
                      <span className="font-semibold text-[#004AAD] text-right">
                        {lensTypeName} {tierName} {lensCfg.package_name ? `• ${lensCfg.package_name}` : ""}
                      </span>
                    </div>
                  )}

                  {indexName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#666666] font-medium text-[11px]">Refractive Index</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[10px]">
                        {indexName}
                      </span>
                    </div>
                  )}

                  {allCoatings.length > 0 && (
                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-[#ECECEC]/60">
                      <span className="text-[#666666] font-medium text-[11px] shrink-0">Coatings</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {allCoatings.map((c, i) => (
                          <span
                            key={i}
                            className="bg-white border border-[#E0E2EC] text-[#222222] text-[10px] px-1.5 py-0.5 rounded font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Per-Item Prescription Specs */}
              {rx ? (
                <div className="bg-[#F0F4FF]/70 border border-[#004AAD]/15 rounded-xl p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#004AAD] font-semibold text-[11px]">
                    <FileText size={12} />
                    <span>Prescription Details</span>
                  </div>

                  {rx.file_url ? (
                    <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-medium mt-0.5">
                      <CheckCircle2 size={12} />
                      <span>Prescription Slip Attached</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#333333] pt-0.5">
                      <div className="bg-white/80 border border-[#D8E2F8] px-2 py-1 rounded">
                        <span className="font-bold text-[#03173D]">OD (Right):</span>{" "}
                        {rx.od_sph || rx.right_eye || "0.00"}
                        {rx.od_cyl && ` | Cyl: ${rx.od_cyl}`}
                        {rx.od_axis && ` | Axis: ${rx.od_axis}°`}
                        {rx.od_add && ` | Add: ${rx.od_add}`}
                      </div>
                      <div className="bg-white/80 border border-[#D8E2F8] px-2 py-1 rounded">
                        <span className="font-bold text-[#03173D]">OS (Left):</span>{" "}
                        {rx.os_sph || rx.left_eye || "0.00"}
                        {rx.os_cyl && ` | Cyl: ${rx.os_cyl}`}
                        {rx.os_axis && ` | Axis: ${rx.os_axis}°`}
                        {rx.os_add && ` | Add: ${rx.os_add}`}
                      </div>
                      {rx.pd && (
                        <div className="col-span-2 text-[10px] text-[#555555] mt-0.5">
                          Pupillary Distance (PD): <span className="font-semibold">{rx.pd}mm</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (item.lens_id || item.lens_name || item.lens_config) ? (
                <div className="bg-amber-50/70 border border-amber-200 text-amber-800 rounded-xl p-2 text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Prescription details pending in Step 2</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Coupon Field */}
      {showCoupon && (
        <div className="border-t border-[#ECECEC] pt-4 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#666666]">
            Discount Coupon
          </p>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => onCouponCodeChange && onCouponCodeChange(e.target.value.toUpperCase())}
              placeholder="ENTER PROMO CODE"
              disabled={!!couponApplied || !onCouponCodeChange}
              className="flex-1 bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-3.5 py-2.5 text-[#111111] text-xs font-semibold uppercase tracking-wider focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none disabled:opacity-60 transition-all"
            />
            {couponApplied ? (
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="px-3 py-2.5 bg-red-50 text-red-500 text-xs font-semibold border border-red-200 rounded-xl hover:bg-red-100 transition-all flex items-center gap-1 cursor-pointer"
              >
                <X size={12} /> Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={onApplyCoupon}
                disabled={applyingCoupon || !couponCode.trim() || !onApplyCoupon}
                className="px-4 py-2.5 bg-[#03173D] text-white text-xs font-semibold rounded-xl hover:bg-[#004AAD] transition-all disabled:opacity-40 cursor-pointer"
              >
                {applyingCoupon ? "..." : "Apply"}
              </button>
            )}
          </div>
          {couponApplied && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg">
              <Tag size={12} /> {couponApplied} applied
            </div>
          )}
        </div>
      )}

      {/* Free Shipping Progress (optional, useful on cart) */}
      {showShippingProgress && (
        <div className="border-t border-[#ECECEC] pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#666666]">Free shipping progress</span>
            <span className="font-semibold text-[#004AAD]">
              {subtotal >= 2000 ? "Unlocked!" : `₹${(2000 - subtotal).toLocaleString("en-IN")} away`}
            </span>
          </div>
          <div className="h-1.5 bg-[#F8F9FC] border border-[#E8EAF2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#004AAD] rounded-full transition-all duration-500"
              style={{ width: `${Math.min((subtotal / 2000) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Price breakdown */}
      <div className="border-t border-[#ECECEC] pt-4 space-y-2.5">
        <div className="flex justify-between text-sm text-[#666666]">
          <span>Subtotal</span>
          <span className="font-medium text-[#111111]">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600 font-semibold">
            <span>Coupon Discount</span>
            <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {tax > 0 ? (
          <div className="flex justify-between text-sm text-[#666666]">
            <span>GST (18% on frames)</span>
            <span className="font-medium text-[#111111]">₹{tax.toLocaleString("en-IN")}</span>
          </div>
        ) : null}

        <div className="flex justify-between text-sm text-[#004AAD] font-semibold">
          <span>Shipping</span>
          <span>Free</span>
        </div>

        <div className="border-t border-[#ECECEC] pt-3 flex justify-between items-baseline">
          <div>
            <span className="font-bold text-[#111111] text-base">Total</span>
            <p className="text-[10px] text-[#888888]">Inclusive of applicable taxes</p>
          </div>
          <span className="text-2xl md:text-3xl font-[var(--font-hero)] italic font-bold text-[#111111]">
            ₹{Math.round(grandTotal).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Action Button slot (e.g. Proceed to Checkout or Pay Now) */}
      {actionButton && <div className="pt-2">{actionButton}</div>}

      {/* Trust badges */}
      <div className="border-t border-[#ECECEC] pt-4 space-y-2">
        <div className="flex items-center justify-center gap-6 opacity-50">
          <div className="flex items-center gap-1 text-[11px] text-[#111111] font-medium">
            <Shield size={14} className="text-[#004AAD]" />
            <span>100% Genuine</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#111111] font-medium">
            <Eye size={14} className="text-[#004AAD]" />
            <span>Optician Checked</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#111111] font-medium">
            <ShieldCheck size={14} className="text-[#004AAD]" />
            <span>Secure 256-bit</span>
          </div>
        </div>
        <p className="text-center text-[11px] text-[#888888]">
          Encrypted checkout powered by Razorpay & SSL
        </p>
      </div>

      {footerNote && <div className="text-center">{footerNote}</div>}
    </div>
  );
}
