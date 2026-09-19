"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAdminPrescriptions() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*, users(name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin prescriptions:", error);
    return [];
  }
  return data || [];
}

export async function updatePrescriptionStatus(
  id: string, 
  status: 'pending' | 'approved' | 'rejected', 
  adminNotes?: string
) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("prescriptions")
    .update({ 
      status, 
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating prescription status:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/prescriptions");
  return { success: true };
}

export async function updatePrescriptionPower(id: string, leftEye: any, rightEye: any, pd: number) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("prescriptions")
    .update({ 
      left_eye: leftEye,
      right_eye: rightEye,
      pd,
      updated_at: new Date().toISOString() 
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating prescription power:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/prescriptions");
  return { success: true };
}

export async function deletePrescription(id: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("prescriptions").delete().eq("id", id);
  
    if (error) {
      console.error("Error deleting prescription:", error);
      return { error: error.message };
    }
  
    revalidatePath("/admin/prescriptions");
    return { success: true };
}
