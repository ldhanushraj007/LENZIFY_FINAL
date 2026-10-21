"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export type OffersResponse = {
  authenticated: boolean;
  type: string;
  items: any[];
  error?: string;
};

export async function getOffersData(type: string = "discounts"): Promise<OffersResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    if (type === "coupons") {
      // Use createAdminClient to ensure query succeeds regardless of RLS configuration
      const adminSupabase = await createAdminClient();
      const now = new Date().toISOString();

      // Fetch active coupons intended for offers page, not expired
      const { data, error } = await adminSupabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .eq("show_on_offers_page", true)
        .or(`valid_until.is.null,valid_until.gt.${now}`)
        .order("discount_value", { ascending: false });

      if (error) {
        console.error("Error fetching coupons for offers:", error);
        return { authenticated: true, type, items: [], error: error.message };
      }

      // Filter in case any legacy rows have expired
      const validCoupons = (data || []).filter((c: any) => {
        const expiry = c.valid_until || c.expiry;
        if (!expiry) return true;
        return new Date(expiry) > new Date();
      });

      return { authenticated: true, type, items: validCoupons };
    }

    // For discounts and seasonal-sales, check authentication if required
    if (!user) {
      return {
        authenticated: false,
        type,
        items: [],
        error: "Authentication required to access exclusive promotional offers.",
      };
    }

    if (type === "discounts") {
      const { data } = await supabase
        .from("products")
        .select("*")
        .not("discount_price", "is", null)
        .eq("is_enabled", true);
      return { authenticated: true, type, items: data || [] };
    } else if (type === "seasonal-sales") {
      const { data } = await supabase
        .from("products")
        .select(`
          *,
          categories (name)
        `)
        .eq("is_enabled", true)
        .or("tags.cs.{Seasonal-Sale},is_featured.eq.true")
        .not("discount_price", "is", null);
      return { authenticated: true, type, items: data || [] };
    }

    return { authenticated: true, type, items: [] };
  } catch (err: any) {
    return { authenticated: true, type, items: [], error: err.message };
  }
}
