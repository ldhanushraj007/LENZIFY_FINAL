"use server";

import { createClient } from "@/lib/supabase/server";

export type OffersResponse = {
  authenticated: boolean;
  type: string;
  items: any[];
  error?: string;
};

export async function getOffersData(type: string = "discounts"): Promise<OffersResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      authenticated: false,
      type,
      items: [],
      error: "Authentication required to access exclusive promotional offers.",
    };
  }

  try {
    if (type === "coupons") {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .gte("expiry_date", new Date().toISOString());
      return { authenticated: true, type, items: data || [] };
    } else if (type === "discounts") {
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
