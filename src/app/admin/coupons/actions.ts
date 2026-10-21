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
