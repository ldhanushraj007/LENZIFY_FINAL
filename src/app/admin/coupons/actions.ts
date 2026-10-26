"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CouponPayload {
  id?: number;
  code: string;
  title?: string;
  description?: string;
  discount_type: "flat" | "percentage";
  discount_value: number;
  minimum_order_value: number;
  applicable_to: string;
  valid_from?: string;
  valid_until?: string | null;
  usage_limit?: number | null;
  is_active: boolean;
  show_on_offers_page: boolean;
}

export async function saveCoupon(data: CouponPayload) {
  try {
    const supabase = await createAdminClient();
    const code = (data.code || "").trim().toUpperCase();

    if (!code) {
      return { success: false, error: "Coupon code is required." };
    }

    if (data.discount_value <= 0) {
      return { success: false, error: "Discount value must be greater than 0." };
    }

    const payload: any = {
      code,
      title: data.title?.trim() || `Save ₹${data.discount_value} with ${code}`,
      description: data.description?.trim() || "Use at checkout for instant discount",
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      minimum_order_value: data.minimum_order_value ?? 0,
      min_order: data.minimum_order_value ?? 0, // legacy sync
      applicable_to: data.applicable_to || "all",
      applicable_category: data.applicable_to === "all" ? null : data.applicable_to,
      valid_from: data.valid_from ? new Date(data.valid_from).toISOString() : new Date().toISOString(),
      valid_until: data.valid_until ? new Date(data.valid_until).toISOString() : null,
      expiry: data.valid_until ? new Date(data.valid_until).toISOString() : null, // legacy sync
      usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
      is_active: Boolean(data.is_active),
      is_enabled: Boolean(data.is_active), // legacy sync
      show_on_offers_page: Boolean(data.show_on_offers_page),
    };

    if (data.id) {
      // Update
      const { error } = await supabase
        .from("coupons")
        .update(payload)
        .eq("id", data.id);

      if (error) throw error;
    } else {
      // Create
      payload.usage_count = 0;
      payload.created_at = new Date().toISOString();
      const { error } = await supabase
        .from("coupons")
        .insert(payload);

      if (error) throw error;
    }

    revalidatePath("/admin/coupons");
    revalidatePath("/offers");
    return { success: true };
  } catch (err: any) {
    console.error("Error saving coupon:", err);
    return { success: false, error: err.message || "Failed to save coupon." };
  }
}

export async function toggleCouponActive(id: number, isActive: boolean) {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("coupons")
      .update({
        is_active: isActive,
        is_enabled: isActive, // legacy sync
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/admin/coupons");
    revalidatePath("/offers");
    return { success: true };
  } catch (err: any) {
    console.error("Error toggling coupon active:", err);
    return { success: false, error: err.message };
  }
}

export async function toggleCouponShowOnOffers(id: number, showOnOffers: boolean) {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("coupons")
      .update({
        show_on_offers_page: showOnOffers,
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/admin/coupons");
    revalidatePath("/offers");
    return { success: true };
  } catch (err: any) {
    console.error("Error toggling coupon offers display:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteCoupon(id: number) {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/coupons");
    revalidatePath("/offers");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting coupon:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Seed or sync standard offers in DB:
 * - CL200 (Contact Lenses only)
 * - LENZ299, LENZ599, LENZ999 (Spectacles, Sunglasses & Accessories only)
 */
export async function seedStandardOffers() {
  try {
    const supabase = await createAdminClient();
    const EYEWEAR_CATEGORIES = "eyeglasses,sunglasses,accessories,lenses,computer-glasses,reading-glasses";

    const standardCoupons = [
      {
        code: "CL200",
        title: "Save ₹200 on Contact Lenses",
        description: "Flat ₹200 discount on Contact Lenses",
        discount_type: "flat",
        discount_value: 200,
        minimum_order_value: 0,
        min_order: 0,
        applicable_to: "contact-lens",
        applicable_category: "contact-lens",
        is_active: true,
        is_enabled: true,
        show_on_offers_page: true,
      },
      {
        code: "LENZ299",
        title: "Save ₹299 on orders above ₹999",
        description: "Valid on Spectacles, Sunglasses & Accessories (Excludes Contact Lenses)",
        discount_type: "flat",
        discount_value: 299,
        minimum_order_value: 999,
        min_order: 999,
        applicable_to: EYEWEAR_CATEGORIES,
        applicable_category: EYEWEAR_CATEGORIES,
        is_active: true,
        is_enabled: true,
        show_on_offers_page: true,
      },
      {
        code: "LENZ599",
        title: "Save ₹599 on orders above ₹1999",
        description: "Valid on Spectacles, Sunglasses & Accessories (Excludes Contact Lenses)",
        discount_type: "flat",
        discount_value: 599,
        minimum_order_value: 1999,
        min_order: 1999,
        applicable_to: EYEWEAR_CATEGORIES,
        applicable_category: EYEWEAR_CATEGORIES,
        is_active: true,
        is_enabled: true,
        show_on_offers_page: true,
      },
      {
        code: "LENZ999",
        title: "Save ₹999 on orders above ₹2999",
        description: "Valid on Spectacles, Sunglasses & Accessories (Excludes Contact Lenses)",
        discount_type: "flat",
        discount_value: 999,
        minimum_order_value: 2999,
        min_order: 2999,
        applicable_to: EYEWEAR_CATEGORIES,
        applicable_category: EYEWEAR_CATEGORIES,
        is_active: true,
        is_enabled: true,
        show_on_offers_page: true,
      },
    ];

    for (const c of standardCoupons) {
      const { data: existing } = await supabase
        .from("coupons")
        .select("id, applicable_to")
        .eq("code", c.code)
        .maybeSingle();

      if (existing) {
        // Update applicable_to to ensure category isolation
        await supabase
          .from("coupons")
          .update({
            applicable_to: c.applicable_to,
            applicable_category: c.applicable_category,
            title: c.title,
            description: c.description,
            is_active: true,
            is_enabled: true,
          })
          .eq("id", existing.id);
      } else {
        // Insert missing coupon
        await supabase.from("coupons").insert({
          ...c,
          usage_count: 0,
          created_at: new Date().toISOString(),
        });
      }
    }

    revalidatePath("/admin/coupons");
    revalidatePath("/offers");
    return { success: true };
  } catch (err) {
    console.error("Failed to seed standard offers:", err);
    return { success: false, error: String(err) };
  }
}
