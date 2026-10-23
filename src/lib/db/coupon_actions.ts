"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rateLimitAction } from "@/lib/rateLimit";

const APPLIES_TO_NAMES: Record<string, string> = {
  all: "All Products",
  eyeglasses: "Eyeglasses",
  sunglasses: "Sunglasses",
  "contact-lens": "Contact Lenses",
  "computer-glasses": "Computer Glasses",
  "reading-glasses": "Reading Glasses",
  lenses: "Prescription Lenses",
  accessories: "Accessories",
};

function checkItemMatchesApplicable(item: any, applicableTo: string): boolean {
  if (!applicableTo || applicableTo === "all") return true;

  const pType = (item.product_type || item.products?.product_type || "").toLowerCase();
  const cat = (
    item.category ||
    item.products?.category ||
    item.products?.categories?.name ||
    item.products?.categories?.slug ||
    ""
  ).toLowerCase();
  const name = (item.name || item.products?.name || "").toLowerCase();
  const hasLens = Boolean(
    item.lens_id ||
    (item.lens_price && Number(item.lens_price) > 0) ||
    item.lens_config?.type ||
    item.lens_config?.package ||
    item.lens_config?.package_name ||
    (item.lens_config?.lens_price && Number(item.lens_config?.lens_price) > 0) ||
    (item.lens_config?.total_price && Number(item.lens_config?.total_price) > 0)
  );

  switch (applicableTo) {
    case "eyeglasses":
      return (
        pType === "eyeglasses" ||
        pType === "eyewear" ||
        pType === "frame" ||
        cat.includes("eyeglass") ||
        cat.includes("eyeglasses") ||
        cat.includes("frames") ||
        (!cat.includes("sunglass") &&
          !cat.includes("contact") &&
          !cat.includes("reading") &&
          !cat.includes("computer") &&
          !cat.includes("accessor"))
      );
    case "sunglasses":
      return (
        pType === "sunglasses" ||
        pType === "sunglass" ||
        cat.includes("sunglass") ||
        name.includes("sunglass")
      );
    case "contact-lens":
      return (
        pType === "contact-lens" ||
        pType === "contact_lens" ||
        cat.includes("contact") ||
        name.includes("contact")
      );
    case "computer-glasses":
      return (
        pType === "computer-glasses" ||
        cat.includes("computer") ||
        name.includes("computer")
      );
    case "reading-glasses":
      return (
        pType === "reading-glasses" ||
        pType === "reading_glasses" ||
        cat.includes("reading") ||
        name.includes("reading")
      );
    case "lenses":
      return hasLens || cat.includes("lens") || pType === "lens";
    case "accessories":
      return (
        pType === "accessory" ||
        pType === "accessories" ||
        cat.includes("accessor") ||
        name.includes("cleaning kit") ||
        name.includes("case") ||
        name.includes("chain")
      );
    default:
      return true;
  }
}

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

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", cleanCode)
    .single();

  if (error || !coupon) {
    return { error: "Invalid coupon code. Please check and try again." };
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

  // Check minimum order value
  const minOrder = Number(
    coupon.minimum_order_value && Number(coupon.minimum_order_value) > 0
      ? coupon.minimum_order_value
      : coupon.min_order || 0
  );
  if (minOrder > 0 && subtotal < minOrder) {
    return {
      error: `Minimum order of ₹${minOrder.toLocaleString("en-IN")} required for this coupon.`,
    };
  }

  // Check applicable category if items are provided and applicable_to is not 'all'
  const applicableTo = coupon.applicable_to || "all";
  if (applicableTo !== "all" && Array.isArray(items) && items.length > 0) {
    const hasMatchingItem = items.some((item) =>
      checkItemMatchesApplicable(item, applicableTo)
    );
    if (!hasMatchingItem) {
      const categoryLabel = APPLIES_TO_NAMES[applicableTo] || applicableTo;
      return {
        error: `This code applies to ${categoryLabel} only. Add a qualifying product to use it.`,
      };
    }
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = (subtotal * Number(coupon.discount_value)) / 100;
    const maxDiscount = coupon.rules?.max_discount;
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    // flat
    discount = Number(coupon.discount_value);
  }

  // Don't let discount exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
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
