"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * CART ACTIONS
 */

export async function getCart() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("cart")
      .select("*, products(id, name, brand, price, offer_price, discount_price, stock, frame_type, primary_image, product_images(*))")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching cart:", error);
      return [];
    }

    // Attach lens details if lens_id is present
    const lensIds = (data || []).map((i: any) => i.lens_id).filter(Boolean);
    let lensesMap: Record<string, any> = {};
    if (lensIds.length > 0) {
      const { data: lenses } = await supabase
        .from("lenses")
        .select("id, name, price")
        .in("id", lensIds);
      if (lenses) {
        lensesMap = Object.fromEntries(lenses.map((l: any) => [l.id, l]));
      }
    }

    return (data || []).map((item: any) => ({
      ...item,
      lenses: item.lens_id ? lensesMap[item.lens_id] || null : null
    }));
  } catch (err) {
    console.error("Unexpected error in getCart:", err);
    return [];
  }
}

export async function addToCart(product_id: string, options: { 
  quantity?: number; 
  lens_id?: string | null; 
  lens_config?: any;
  prescription_json?: any;
  price?: number;
  color?: string;
  size?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Login required" };

    // Check if identical item (same product, same lens, same color, and same size selection) already exists
    let query = supabase
      .from("cart")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product_id);

    if (options.color) {
      query = query.eq("selected_color", options.color);
    } else {
      query = query.is("selected_color", null);
    }

    if (options.size) {
      query = query.eq("selected_size", options.size);
    } else {
      query = query.is("selected_size", null);
    }

    if (options.lens_id) {
      query = query.eq("lens_id", options.lens_id);
    } else {
      query = query.is("lens_id", null);
    }

    const { data: existingRows } = await query.limit(1);
    const existing = existingRows?.[0] || null;

    if (existing && !options.prescription_json && !options.lens_config) {
      await supabase
        .from("cart")
        .update({ quantity: (existing.quantity || 0) + (options.quantity || 1) })
        .eq("id", existing.id);
    } else {
      await supabase.from("cart").insert({
        user_id: user.id,
        product_id,
        quantity: options.quantity || 1,
        lens_id: options.lens_id || null,
        lens_config: options.lens_config || null,
        prescription_json: options.prescription_json || null,
        price: options.price,
        selected_color: options.color || null,
        selected_size: options.size || null
      });
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (err) {
    console.error("Error in addToCart:", err);
    return { error: "Failed to add to cart" };
  }
}

export async function removeFromCart(cartItemId: number) {
  const supabase = await createClient();
  await supabase.from("cart").delete().eq("id", cartItemId);
  revalidatePath("/cart");
}

export async function updateCartQuantity(cartItemId: number, quantity: number) {
  const supabase = await createClient();
  await supabase.from("cart").update({ quantity }).eq("id", cartItemId);
  revalidatePath("/cart");
}

/**
 * WISHLIST ACTIONS
 */

export async function getWishlist() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wishlist")
    .select("*, products(name, price, offer_price, product_images(*))")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }
  return data;
}

export async function toggleWishlist(product_id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Login required" };

  const { data: existing } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist").delete().eq("id", existing.id);
  } else {
    await supabase.from("wishlist").insert({ user_id: user.id, product_id });
  }

  revalidatePath("/wishlist");
  revalidatePath("/");
  return { success: !existing };
}
