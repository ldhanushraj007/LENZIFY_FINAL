"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLens(formData: FormData) {
  const supabase = await createAdminClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string || "type";
  const is_active = formData.get("is_active") === "true";
  
  // Extract features
  const featuresRaw = formData.get("features") as string;
  let features = [];
  try {
    features = JSON.parse(featuresRaw || "[]");
  } catch (e) {
    features = featuresRaw.split(",").map(f => f.trim()).filter(Boolean);
  }

  // Extract power_ranges
  const powerRangesRaw = formData.get("power_ranges") as string;
  let power_ranges = [];
  try {
    power_ranges = JSON.parse(powerRangesRaw || "[]");
  } catch (e) {
    power_ranges = [];
  }

  // Extract Progressive tier attributes
  const tier = (formData.get("tier") as string) || null;
  const field_of_view = (formData.get("field_of_view") as string) || null;
  const parent_lens_id = (formData.get("parent_lens_id") as string) || null;
  let performance_ratings = null;
  try {
    const ratingsRaw = formData.get("performance_ratings") as string;
    if (ratingsRaw) performance_ratings = JSON.parse(ratingsRaw);
  } catch {}

  // Attempt insert with all attributes; fallback if any columns do not exist yet
  const insertPayload: any = {
    name,
    description,
    price,
    features,
    category,
    is_active,
  };
  if (power_ranges.length > 0) insertPayload.power_ranges = power_ranges;
  if (tier) insertPayload.tier = tier;
  if (field_of_view) insertPayload.field_of_view = field_of_view;
  if (performance_ratings) insertPayload.performance_ratings = performance_ratings;
  if (parent_lens_id) insertPayload.parent_lens_id = parent_lens_id;

  let { error } = await supabase.from("lenses").insert(insertPayload);

  if (error && (error.message?.includes("power_ranges") || error.message?.includes("tier") || error.message?.includes("field_of_view"))) {
    delete insertPayload.power_ranges;
    delete insertPayload.tier;
    delete insertPayload.field_of_view;
    delete insertPayload.performance_ratings;
    delete insertPayload.parent_lens_id;
    const retry = await supabase.from("lenses").insert(insertPayload);
    error = retry.error;
  }

  if (error) {
    console.error("Error creating lens:", error);
    redirect(`/admin/lenses/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/lenses");
  redirect("/admin/lenses");
}

export async function updateLens(id: string, formData: FormData) {
  const supabase = await createAdminClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string || "type";
  const is_active = formData.get("is_active") === "true";

  const featuresRaw = formData.get("features") as string;
  let features = [];
  try {
    features = JSON.parse(featuresRaw || "[]");
  } catch (e) {
    features = featuresRaw.split(",").map(f => f.trim()).filter(Boolean);
  }

  const powerRangesRaw = formData.get("power_ranges") as string;
  let power_ranges = [];
  try {
    power_ranges = JSON.parse(powerRangesRaw || "[]");
  } catch (e) {
    power_ranges = [];
  }

  // Extract Progressive tier attributes
  const tier = (formData.get("tier") as string) || null;
  const field_of_view = (formData.get("field_of_view") as string) || null;
  const parent_lens_id = (formData.get("parent_lens_id") as string) || null;
  let performance_ratings = null;
  try {
    const ratingsRaw = formData.get("performance_ratings") as string;
    if (ratingsRaw) performance_ratings = JSON.parse(ratingsRaw);
  } catch {}

  const updatePayload: any = {
    name,
    description,
    price,
    features,
    category,
    is_active,
    power_ranges,
    tier,
    field_of_view,
    performance_ratings,
    parent_lens_id
  };

  let { error } = await supabase.from("lenses").update(updatePayload).eq("id", id);

  if (error && (error.message?.includes("power_ranges") || error.message?.includes("tier") || error.message?.includes("field_of_view"))) {
    delete updatePayload.power_ranges;
    delete updatePayload.tier;
    delete updatePayload.field_of_view;
    delete updatePayload.performance_ratings;
    delete updatePayload.parent_lens_id;
    const retry = await supabase.from("lenses").update(updatePayload).eq("id", id);
    error = retry.error;
  }

  if (error && error.message?.includes("power_ranges")) {
    delete updatePayload.power_ranges;
    const retry = await supabase.from("lenses").update(updatePayload).eq("id", id);
    error = retry.error;
  }

  if (error) {
    console.error("Error updating lens:", error);
    redirect(`/admin/lenses/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/lenses");
  redirect("/admin/lenses");
}

export async function deleteLens(id: string) {
  const supabase = await createAdminClient();
  // Soft delete so past orders that reference this lens ID don't break
  const { error } = await supabase.from("lenses").update({ is_active: false }).eq("id", id);

  if (error) {
    console.error("Error deleting lens:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/lenses");
  return { success: true };
}

export async function updateLensPrice(id: string, price: number) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("lenses").update({ price }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/lenses");
  revalidatePath(`/lenses/${id}`);
  return { success: true };
}

export async function toggleLensStatus(id: string, currentStatus: boolean) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("lenses")
    .update({ is_active: !currentStatus })
    .eq("id", id);
    
  if (error) {
    console.error("Error toggling lens status:", error);
    return { error: error.message };
  }
  
  revalidatePath("/admin/lenses");
}
