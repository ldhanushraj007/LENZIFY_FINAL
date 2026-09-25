"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, Eye, ShieldCheck, Tag, X, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGSTRate, calculateCartGST } from "@/lib/gst";
import { getItemPricing } from "@/lib/pricing";
import { resolveProductImage } from "@/lib/image_utils";

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
  left_eye?: any;
  right_eye?: any;
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

  const isComputerGlassesItem = (item: any) => {
    const cat = item.category || item.products?.category || item.products?.categories?.name || item.products?.categories?.slug;
    const name = item.name || item.products?.name || "";
    return (
      cat === "Computer Glasses" ||
      cat === "computer-glasses" ||
      name.toLowerCase().includes("computer glass")
    );
  };

  const isFrameOnlyItem = (item: any) => {
    if (isContactLensItem(item) || isReadingGlassesItem(item) || isAccessoryItem(item) || isComputerGlassesItem(item)) {
      return false;
    }
    const hasLens = Boolean(
      item.lens_id ||
      (item.lens_config && (item.lens_config.type || item.lens_config.package || item.lens_config.package_name || item.lens_config.selected_index || item.lens_price))
    );
    return !hasLens;
  };

  const gstBreakdown = calculateCartGST(items, couponDiscount);
  const { subtotal, discountedSubtotal, gst5Total, gst18Total, hasContactLens, hasSunglasses, shippingFee, grandTotal } = gstBreakdown;

  // Resolve prescription for a specific line item
  const getItemPrescription = (item: any): ItemPrescription | null => {
    if (isReadingGlassesItem(item)) return null;
    if (isAccessoryItem(item)) return null;
    if (isComputerGlassesItem(item)) return null;
    if (isFrameOnlyItem(item)) return null;

    const itemKey = item.id || item.product_id || item.database_id;
    let rx: any = null;

    // 1. From itemPrescriptions prop
    if (itemPrescriptions && itemKey && itemPrescriptions[itemKey]) {
      rx = itemPrescriptions[itemKey];
    }
    // 2. From item.prescription_json
    else if (item.prescription_json) {
      rx = item.prescription_json;
    }
    // 3. From item.prescription
    else if (item.prescription) {
      rx = item.prescription;
    }
    // 4. Fallback to checkoutPrescription if this item requires a lens
    else if (
      (item.lens_id || item.lens_config) &&
      checkoutPrescription &&
      (checkoutPrescription.left_eye || checkoutPrescription.right_eye || checkoutPrescription.file_url || checkoutPrescription.od_sph || checkoutPrescription.os_sph)
    ) {
      rx = checkoutPrescription;
    }

    // Ensure rx contains actual prescription power or file, not empty or reading power
    if (rx && (rx.file_url || rx.od_sph || rx.os_sph || rx.left_eye || rx.right_eye)) {
      return rx;
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
          const frameType = item.products?.frame_type || lensCfg.frame_type;
          const rx = getItemPrescription(item);

          const isReading = isReadingGlassesItem(item);
          const isAccessory = isAccessoryItem(item);
          const isComputer = isComputerGlassesItem(item);
          const isFrameOnly = isFrameOnlyItem(item);
          const isContactLens = isContactLensItem(item);

          const pricing = getItemPricing(item);
          const hasLensConfig = pricing.hasLens;
          const frameUnitPrice = pricing.frameUnitPrice;
          const lensUnitPrice = pricing.lensUnitPrice;
          const itemTotalPrice = pricing.totalPrice;
          const gstAmount = pricing.gstAmount;
          const coatingsCount = pricing.coatingsCount;
          const lensTypeName = pricing.lensType;
          const lensPackageName = pricing.lensPackage;

          const rate = getGSTRate(item);
          const isIncluded = rate === 'included' || rate === 'included-18';
          const gstRatePct = isIncluded ? 0 : rate === 0.18 ? 18 : 5;

          const imageUrl =
            resolveProductImage(item.products || item) ||
            item.image ||
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
                        {isReading && <span className="text-[#666666] font-normal"> — Reading Glasses</span>}
                        {isComputer && <span className="text-[#666666] font-normal"> — Computer Glasses</span>}
                        {isFrameOnly && <span className="text-[#666666] font-normal"> (Frame Only)</span>}
                      </h4>
                    </div>
                    {!hasLensConfig && (
                      <p className="font-bold text-[#111111] text-sm whitespace-nowrap">
                        ₹{itemTotalPrice.toLocaleString("en-IN")}
                      </p>
                    )}
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

              {/* Lens & Frame Separate Lines (Change 2 & Change 5) */}
              {hasLensConfig ? (
                <div className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl p-3 text-xs space-y-1.5 mt-2">
                  <div className="flex justify-between text-[#555555]">
                    <span>Frame</span>
                    <span className="font-medium text-[#111111]">₹{(frameUnitPrice * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#555555]">
                    <span>{String(lensTypeName || "Prescription Lens")} · {String(lensPackageName || "Standard")}</span>
                    <span className="font-medium text-[#111111]">₹{(lensUnitPrice * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#555555]">
                    <span>Included Coatings ({coatingsCount})</span>
                    <span className="font-bold text-emerald-600 uppercase text-[11px]">FREE</span>
                  </div>
                  <div className="border-t border-[#ECECEC] pt-1.5 flex justify-between font-bold text-[#111111]">
                    <span>Item Total</span>
                    <span>₹{itemTotalPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#666666]">
                    <span>GST (5%):</span>
                    <span className="font-medium text-[#111111]">₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-xs text-[#666666] pt-1 px-1">
                  <span>{rate === 'included' ? "GST (5%):" : "GST:"}</span>
                  <span className="font-medium text-[#111111]">
                    {rate === 'included'
                      ? "Included in price"
                      : `GST (${gstRatePct}%): ₹${gstAmount.toLocaleString("en-IN")}`}
                  </span>
                </div>
              )}

              {/* Per-Item Prescription Specs */}
              {!isReading && !isAccessory && !isComputer && !isFrameOnly && rx ? (
                (() => {
                  const rightEyeDisplay =
                    typeof rx.right_eye === "object"
                      ? rx.right_eye?.sph || "0.00"
                      : typeof rx.od_sph === "string"
                      ? rx.od_sph
                      : typeof rx.right_eye === "string"
                      ? rx.right_eye
                      : "0.00";

                  const leftEyeDisplay =
                    typeof rx.left_eye === "object"
                      ? rx.left_eye?.sph || "0.00"
                      : typeof rx.os_sph === "string"
                      ? rx.os_sph
                      : typeof rx.left_eye === "string"
                      ? rx.left_eye
                      : "0.00";

                  const rightCylDisplay =
                    typeof rx.right_eye === "object"
                      ? (rx.right_eye?.cyl && rx.right_eye.cyl !== "0.00 (None)" ? rx.right_eye.cyl : null)
                      : rx.od_cyl || null;

                  const leftCylDisplay =
                    typeof rx.left_eye === "object"
                      ? (rx.left_eye?.cyl && rx.left_eye.cyl !== "0.00 (None)" ? rx.left_eye.cyl : null)
                      : rx.os_cyl || null;

                  const rightAxisDisplay =
                    typeof rx.right_eye === "object"
                      ? (rx.right_eye?.axis && rx.right_eye.axis !== "None" ? rx.right_eye.axis : null)
                      : rx.od_axis || null;

                  const leftAxisDisplay =
                    typeof rx.left_eye === "object"
                      ? (rx.left_eye?.axis && rx.left_eye.axis !== "None" ? rx.left_eye.axis : null)
                      : rx.os_axis || null;

                  const rightBcDisplay = typeof rx.right_eye === "object" ? rx.right_eye?.bc : null;
                  const rightDiaDisplay = typeof rx.right_eye === "object" ? rx.right_eye?.dia : null;

                  return (
                    <div className="bg-[#F0F4FF]/70 border border-[#004AAD]/15 rounded-xl p-2.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[#004AAD] font-semibold text-[11px]">
                        <FileText size={12} />
                        <span>{isContactLens ? "Contact Lens Power" : "Prescription Details"}</span>
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
                            {rightEyeDisplay}
                            {rightCylDisplay && ` | Cyl: ${rightCylDisplay}`}
                            {rightAxisDisplay && ` | Axis: ${rightAxisDisplay}°`}
                            {rightBcDisplay && ` | BC: ${rightBcDisplay}`}
                            {rightDiaDisplay && ` | DIA: ${rightDiaDisplay}`}
                          </div>
                          <div className="bg-white/80 border border-[#D8E2F8] px-2 py-1 rounded">
                            <span className="font-bold text-[#03173D]">OS (Left):</span>{" "}
                            {leftEyeDisplay}
                            {leftCylDisplay && ` | Cyl: ${leftCylDisplay}`}
                            {leftAxisDisplay && ` | Axis: ${leftAxisDisplay}°`}
                            {rightBcDisplay && ` | BC: ${rightBcDisplay}`}
                            {rightDiaDisplay && ` | DIA: ${rightDiaDisplay}`}
                          </div>
                          {rx.pd && !isContactLens && (
                            <div className="col-span-2 text-[10px] text-[#555555] mt-0.5">
                              Pupillary Distance (PD): <span className="font-semibold">{rx.pd}mm</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : !isReading && !isAccessory && !isComputer && !isFrameOnly && !isContactLens && (item.lens_id || item.lens_config) ? (
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


      {/* Price breakdown */}
      <div className="border-t border-[#ECECEC] pt-4 space-y-2.5">
        <div className="flex justify-between text-sm text-[#666666]">
          <span>Subtotal (excl. GST)</span>
          <span className="font-medium text-[#111111]">₹{discountedSubtotal.toLocaleString("en-IN")}</span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600 font-semibold">
            <span>Coupon Discount</span>
            <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {gst5Total > 0 ? (
          <div className="flex justify-between text-sm text-[#666666]">
            <span>GST (5% — Eyeglasses/Lenses)</span>
            <span className="font-medium text-[#111111]">₹{gst5Total.toLocaleString("en-IN")}</span>
          </div>
        ) : null}

        {gst18Total > 0 ? (
          <div className="flex justify-between text-sm text-[#666666]">
            <span>GST (18% — Sunglasses)</span>
            <span className="font-medium text-[#111111]">₹{gst18Total.toLocaleString("en-IN")}</span>
          </div>
        ) : null}

        {hasContactLens ? (
          <div className="flex justify-between text-sm text-emerald-600 font-medium">
            <span>Contact Lenses</span>
            <span>GST (5%): Included in price</span>
          </div>
        ) : null}

        {hasSunglasses ? (
          <div className="flex justify-between text-sm text-emerald-600 font-medium">
            <span>Sunglasses</span>
            <span>GST (18%): Included in price</span>
          </div>
        ) : null}

        <div className="flex justify-between text-sm font-semibold">
          <span className="text-[#004AAD]">Delivery</span>
          <span className="text-[#004AAD] uppercase font-bold tracking-wider">FREE</span>
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
