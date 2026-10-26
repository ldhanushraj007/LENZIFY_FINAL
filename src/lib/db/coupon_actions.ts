"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rateLimitAction } from "@/lib/rateLimit";
import { getItemPricing, isContactLensItem } from "@/lib/pricing";

import {
  APPLIES_TO_NAMES,
  getCategoryLabel,
  checkItemMatchesApplicable,
} from "@/lib/offers";

// Built-in standard offers metadata
const STANDARD_OFFERS: Record<string, any> = {
  LENZ999: {
    code: "LENZ999",
    title: "Save ₹999 on orders above ₹2999",
    description: "Valid for Spectacles, Sunglasses & Accessories only (Excludes Contact Lenses)",
    discount_type: "flat",
    discount_value: 999,
    minimum_order_value: 2999,
    applicable_to: "eyeglasses,sunglasses,accessories,lenses,computer-glasses,reading-glasses",
    is_active: true,
  },
  LENZ599: {
    code: "LENZ599",
    title: "Save ₹599 on orders above ₹1999",
    description: "Valid for Spectacles, Sunglasses & Accessories only (Excludes Contact Lenses)",
    discount_type: "flat",
    discount_value: 599,
    minimum_order_value: 1999,
    applicable_to: "eyeglasses,sunglasses,accessories,lenses,computer-glasses,reading-glasses",
    is_active: true,
  },
  LENZ299: {
    code: "LENZ299",
    title: "Save ₹299 on orders above ₹999",
    description: "Valid for Spectacles, Sunglasses & Accessories only (Excludes Contact Lenses)",
    discount_type: "flat",
    discount_value: 299,
    minimum_order_value: 999,
    applicable_to: "eyeglasses,sunglasses,accessories,lenses,computer-glasses,reading-glasses",
    is_active: true,
  },
  CL200: {
    code: "CL200",
    title: "Save ₹200 on Contact Lenses",
    description: "Flat ₹200 off on Contact Lenses only",
    discount_type: "flat",
    discount_value: 200,
    minimum_order_value: 0,
    applicable_to: "contact-lens",
    is_active: true,
  },
};

/**
 * Validate and apply a coupon code
 */
export async function applyCoupon(code: string, subtotal: number, items: any[] = []) {
  if (await rateLimitAction("coupon", 15)) {
    return { error: "Too many coupon attempts. Please wait a minute." };
  }

  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { error: "Please enter a coupon code." };
  }

  // Use Admin client for resilient query
  const supabase = await createAdminClient();

  const { data: dbCoupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", cleanCode)
    .single();

  // If not found in DB, check standard built-ins as graceful fallback
  let coupon = dbCoupon;
  if (!coupon && STANDARD_OFFERS[cleanCode]) {
    coupon = {
      id: Date.now(),
      ...STANDARD_OFFERS[cleanCode],
    };
  }

  if (!coupon) {
    return { error: "Invalid coupon code. Please check and try again." };
  }

  // Enforce category restrictions for the 3 flagship eyewear offers even if legacy DB row had "all"
  if (["LENZ999", "LENZ599", "LENZ299"].includes(cleanCode)) {
    coupon.applicable_to = "eyeglasses,sunglasses,accessories,lenses,computer-glasses,reading-glasses";
  } else if (cleanCode === "CL200") {
    coupon.applicable_to = "contact-lens";
  }

  // Check active state
  const isActive = coupon.is_active ?? coupon.is_enabled ?? true;
  if (!isActive) {
    return { error: "This coupon is inactive." };
  }

  // Check validity dates
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { error: "This coupon is not yet valid." };
  }

  const expiry = coupon.valid_until || coupon.expiry;
  if (expiry && new Date(expiry) < now) {
    return { error: "This coupon has expired." };
  }

  // Check usage limit
  if (coupon.usage_limit && (coupon.usage_count || 0) >= coupon.usage_limit) {
    return { error: "This coupon has reached its usage limit." };
  }

  // Determine applicable categories & calculate qualifying items subtotal
  const applicableTo = coupon.applicable_to || "all";
  let qualifyingSubtotal = subtotal;

  if (applicableTo !== "all" && Array.isArray(items) && items.length > 0) {
    const qualifyingItems = items.filter((item) =>
      checkItemMatchesApplicable(item, applicableTo)
    );

    // If no qualifying items in cart
    if (qualifyingItems.length === 0) {
      if (applicableTo.includes("contact-lens")) {
        return {
          error: `Code ${cleanCode} is valid only for Contact Lenses. Add contact lenses to your cart to use this offer.`,
        };
      }
      if (
        applicableTo.includes("eyeglasses") ||
        applicableTo.includes("sunglasses") ||
        applicableTo.includes("accessories") ||
        applicableTo === "eyewear_accessories"
      ) {
        return {
          error: `Code ${cleanCode} is valid for Spectacles, Sunglasses, and Accessories only. It cannot be applied to Contact Lenses.`,
        };
      }
      return {
        error: `This code applies to ${getCategoryLabel(applicableTo)} only. Add qualifying products to use it.`,
      };
    }

    // Calculate qualifying subtotal strictly from qualifying items
    qualifyingSubtotal = qualifyingItems.reduce((acc, item) => {
      const pricing = getItemPricing(item);
      return acc + pricing.totalPrice;
    }, 0);
  }

  // Check minimum order value against qualifying subtotal
  const minOrder = Number(
    coupon.minimum_order_value && Number(coupon.minimum_order_value) > 0
      ? coupon.minimum_order_value
      : coupon.min_order || 0
  );

  if (minOrder > 0 && qualifyingSubtotal < minOrder) {
    const categoryLabel = getCategoryLabel(applicableTo);
    return {
      error: `Minimum order of ₹${minOrder.toLocaleString("en-IN")} on qualifying ${categoryLabel} required for ${cleanCode} (current eligible: ₹${Math.round(qualifyingSubtotal).toLocaleString("en-IN")}).`,
    };
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = (qualifyingSubtotal * Number(coupon.discount_value)) / 100;
    const maxDiscount = coupon.rules?.max_discount;
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    // flat discount
    discount = Number(coupon.discount_value);
  }

  // Don't let discount exceed qualifying subtotal
  if (discount > qualifyingSubtotal) {
    discount = qualifyingSubtotal;
  }

  const roundedDiscount = Math.round(discount * 100) / 100;

  return {
    success: true,
    code: coupon.code,
    discount: roundedDiscount,
    coupon_id: coupon.id,
    title: coupon.title || `${coupon.code} applied`,
    description:
      coupon.discount_type === "percentage"
        ? `${coupon.discount_value}% off`
        : `₹${coupon.discount_value} off`,
    message: `${coupon.code} applied — ₹${roundedDiscount} saved! ✓`,
  };
}

/**
 * Increment coupon usage count after successful order
 */
export async function incrementCouponUsage(couponIdOrCode: number | string) {
  try {
    const supabase = await createAdminClient();
    if (typeof couponIdOrCode === "number") {
      // First try rpc if present
      const { error: rpcError } = await supabase.rpc("increment_coupon_usage", {
        coupon_id: couponIdOrCode,
      });
      if (rpcError) {
        // Direct query fallback
        const { data: c } = await supabase
          .from("coupons")
          .select("usage_count")
          .eq("id", couponIdOrCode)
          .single();
        if (c) {
          await supabase
            .from("coupons")
            .update({ usage_count: (c.usage_count || 0) + 1 })
            .eq("id", couponIdOrCode);
        }
      }
    } else {
      const code = String(couponIdOrCode).trim().toUpperCase();
      const { data: c } = await supabase
        .from("coupons")
        .select("id, usage_count")
        .eq("code", code)
        .single();
      if (c) {
        await supabase
          .from("coupons")
          .update({ usage_count: (c.usage_count || 0) + 1 })
          .eq("id", c.id);
      }
    }
  } catch (err) {
    console.error("Failed to increment coupon usage:", err);
  }
}
