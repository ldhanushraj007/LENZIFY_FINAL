"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateOrderStatus } from "@/lib/db/order_actions";

export { updateOrderStatus };

export async function updatePaymentStatus(orderId: string, payment_status: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ payment_status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function cancelOrder(orderId: string, reason?: string) {
  // Admin cancel: bypasses ownership check, restores stock, records history
  const supabase = await createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found." };

  for (const item of order.order_items ?? []) {
    try {
      await supabase.rpc("increment_stock", {
        p_id: item.product_id,
        p_qty: item.quantity,
      });
    } catch {}
  }

  const { error } = await supabase.from("orders").update({
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
    cancel_reason: reason || "Cancelled by admin",
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  if (error) return { error: error.message };

  try {
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: "cancelled",
      note: reason || "Cancelled by admin",
      updated_by: "admin",
    });
  } catch {}

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function refundOrder(orderId: string) {
  const supabase = await createAdminClient();
  
  // Update both status and payment
  const { error } = await supabase
    .from("orders")
    .update({ 
      status: 'refunded', 
      payment_status: 'refunded',
      updated_at: new Date().toISOString() 
    })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}
