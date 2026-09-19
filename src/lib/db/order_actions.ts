"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail, getOrderConfirmationHtml } from "@/lib/mail";

/**
 * CHECKOUT & ORDER ACTIONS
 */

export async function placeOrder(data: {
  items: any[];
  total_price: number;
  address: any;
  prescription?: any;
  payment: { id: string; method: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Security identity required." };

  // Use Admin Client for database mutations to bypass RLS issues during checkout
  const adminSupabase = await createAdminClient();

  // 1. Insert/Get Address ID
  const { data: address, error: addrError } = await adminSupabase
    .from("addresses")
    .insert({
      user_id: user.id,
      name: data.address.name,
      phone: data.address.phone,
      address: data.address.address,
      city: data.address.city,
      state: data.address.state || "Not Specified",
      pincode: data.address.pincode
    })
    .select("id")
    .single();

  if (addrError) return { error: "Address synchronization failure: " + addrError.message };

  // 2. Create Order
  const { data: order, error: orderError } = await adminSupabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_price: data.total_price,
      status: 'confirmed',
      payment_status: data.payment.method === 'cod' ? 'pending' : 'paid',
      payment_method: data.payment.method,
      address_id: address.id
    })
    .select("id")
    .single();

  if (orderError) return { error: "Order initialization failure: " + orderError.message };

  // 3. Create Order Items
  const orderItems = data.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id || item.id,
    quantity: item.quantity,
    price: item.price,
    lens_id: item.lens_id || null,
    prescription_json: item.prescription_json || null,
    selected_color: item.selected_color || null,
    selected_size: item.selected_size || null,
    gst_rate: item.gst_rate !== undefined ? item.gst_rate : 0.05,
    gst_amount: item.gst_amount !== undefined ? item.gst_amount : 0
  }));

  let { error: itemsError } = await adminSupabase.from("order_items").insert(orderItems);
  if (itemsError && (itemsError.message?.includes("gst_rate") || itemsError.message?.includes("gst_amount"))) {
    // Graceful fallback if database migration SQL has not been executed yet
    const fallbackItems = orderItems.map(({ gst_rate, gst_amount, ...rest }) => rest);
    const retryResult = await adminSupabase.from("order_items").insert(fallbackItems);
    itemsError = retryResult.error;
  }
  if (itemsError) {
    console.error("[ORDER] Order items insert failure:", itemsError);
    return { error: "Item batch insert failure: " + itemsError.message };
  }

  // Admin-facing notification: new order placed
  try {
    await adminSupabase.from("notifications").insert({
      user_id: null,
      title: "New Order",
      message: `New order #${order.id.slice(0, 8).toUpperCase()} placed for ₹${data.total_price.toLocaleString("en-IN")}.`,
      type: "New Order",
      metadata: { order_id: order.id },
    });
  } catch {}

  // 3b. Decrement stock. If payment is already received (razorpay), never
  // roll back the order — log the issue and let admin handle it manually.
  const paymentAlreadyReceived = data.payment.method === "razorpay";
  for (const item of data.items) {
    const { data: decremented, error: stockErr } = await adminSupabase.rpc(
      "decrement_inventory_safe",
      { p_id: item.product_id || item.id, p_qty: item.quantity }
    );
    if (stockErr || decremented === false) {
      if (!paymentAlreadyReceived) {
        await adminSupabase.from("order_items").delete().eq("order_id", order.id);
        await adminSupabase.from("orders").delete().eq("id", order.id);
        return { error: "One or more items in your cart are out of stock. Please refresh your cart." };
      }
      // Payment already taken — keep the order, flag it for admin review
      console.error(`[ORDER] Stock issue for product ${item.id} on paid order ${order.id}. Manual review needed.`);
    }
  }

  // 4. Comprehensive Prescription & Upload Image Persistence
  try {
    let fileUrl = data.prescription?.file_url || null;
    let rightEyeStr = data.prescription?.right_eye ? (typeof data.prescription.right_eye === "object" ? JSON.stringify(data.prescription.right_eye) : String(data.prescription.right_eye)) : null;
    let leftEyeStr = data.prescription?.left_eye ? (typeof data.prescription.left_eye === "object" ? JSON.stringify(data.prescription.left_eye) : String(data.prescription.left_eye)) : null;
    let pdVal = parseFloat(data.prescription?.pd) || 0;

    // Scan items for any uploaded prescription file or optical specs
    for (const item of data.items) {
      const rx = item.prescription_json;
      if (!rx) continue;

      if (!fileUrl && rx.file_url) {
        fileUrl = rx.file_url;
      }

      if (!rightEyeStr && (rx.od_sph || rx.right_eye)) {
        if (rx.right_eye) {
          const re = rx.right_eye;
          rightEyeStr = `SPH: ${re.sph || '0.00'} | CYL: ${re.cyl || '0.00'} | AXIS: ${re.axis || 'None'} | BC: ${re.bc || '8.6'} | DIA: ${re.dia || '14.2'}${re.add && re.add !== 'None' ? ` | ADD: ${re.add}` : ''}`;
        } else if (rx.od_sph) {
          rightEyeStr = `SPH: ${rx.od_sph || '0.00'}${rx.od_cyl ? ` | CYL: ${rx.od_cyl}` : ''}${rx.od_axis ? ` | AXIS: ${rx.od_axis}` : ''}${rx.od_add ? ` | ADD: ${rx.od_add}` : ''}`;
        }
      }

      if (!leftEyeStr && (rx.os_sph || rx.left_eye)) {
        if (rx.left_eye) {
          const le = rx.left_eye;
          leftEyeStr = `SPH: ${le.sph || '0.00'} | CYL: ${le.cyl || '0.00'} | AXIS: ${le.axis || 'None'} | BC: ${le.bc || '8.6'} | DIA: ${le.dia || '14.2'}${le.add && le.add !== 'None' ? ` | ADD: ${le.add}` : ''}`;
        } else if (rx.os_sph) {
          leftEyeStr = `SPH: ${rx.os_sph || '0.00'}${rx.os_cyl ? ` | CYL: ${rx.os_cyl}` : ''}${rx.os_axis ? ` | AXIS: ${rx.os_axis}` : ''}${rx.os_add ? ` | ADD: ${rx.os_add}` : ''}`;
        }
      }

      if (!rightEyeStr && rx.reading_power) {
        rightEyeStr = `Reading Power: ${rx.reading_power}`;
        leftEyeStr = `Reading Power: ${rx.reading_power}`;
      }

      if (!pdVal && rx.pd) {
        pdVal = parseFloat(rx.pd) || 0;
      }
    }

    if (rightEyeStr || leftEyeStr || fileUrl || pdVal > 0) {
      const { error: prescError } = await adminSupabase.from("prescriptions").insert({
        user_id: user.id,
        order_id: order.id,
        right_eye: rightEyeStr || "Not Specified",
        left_eye: leftEyeStr || "Not Specified",
        pd: pdVal,
        file_url: fileUrl
      });
      if (prescError) {
        console.error("[ORDER] Prescription insert error:", prescError.message, prescError.details);
      }
    }
  } catch (rxErr: any) {
    console.error("[ORDER] Prescription processing exception:", rxErr?.message);
  }
  
  // 5. Record Payment
  const { error: payError } = await adminSupabase.from("payments").insert({
      order_id: order.id,
      payment_method: data.payment.method,
      transaction_id: data.payment.id,
      amount: data.total_price,
      status: data.payment.method === 'cod' ? 'pending' : 'Success',
  });

  if (payError) {
      console.error("Payment Record Error:", payError);
      return { error: "Order placed but payment record failed: " + payError.message, order_id: order.id };
  }

  // 6. Clear Cart
  const { error: clearError } = await adminSupabase.from("cart").delete().eq("user_id", user.id);
  if (clearError) console.error("Cart Clear Error:", clearError);

  // 7. Send confirmation email for COD orders (Razorpay orders are emailed via webhook)
  if (data.payment.method === 'cod') {
    try {
      const { data: fullOrder } = await adminSupabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .eq("id", order.id)
        .single();

      const { data: userData } = await adminSupabase.auth.admin.getUserById(user.id);
      const customerEmail = userData?.user?.email;
      const customerName = data.address.name || "Customer";

      if (customerEmail && fullOrder) {
        await sendEmail({
          to: customerEmail,
          subject: `Order Confirmed - Lenzify #${order.id.slice(0, 8)}`,
          html: getOrderConfirmationHtml(fullOrder, customerName),
        });
        await sendEmail({
          to: process.env.SMTP_USER || "lenzify.in@gmail.com",
          subject: `New COD Order - #${order.id.slice(0, 8)}`,
          html: `<h3>New COD Order</h3><p>Order ID: ${order.id}</p><p>Customer: ${customerName} (${customerEmail})</p><p>Total: ₹${data.total_price}</p>`,
        });
      }
    } catch (mailErr) {
      console.error("[ORDER] COD confirmation email failed:", mailErr);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/profile/orders");

  return { success: true, order_id: order.id };
}

/**
 * ADMIN ORDER MANAGEMENT
 */

export async function updateOrderStatus(
  orderId: string,
  status: string,
  paymentStatus?: string,
  trackingId?: string,
  courier?: string,
  estimatedDeliveryDate?: string,
  note?: string
) {
  const supabase = await createClient();
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = await createAdminClient();

  const { data: order } = await adminSupabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };

  // Fetch customer email from auth
  let customerEmail: string | null = null;
  let customerName = "Customer";
  let notifyOrderUpdates = true;
  try {
    const { data: userData } = await adminSupabase.auth.admin.getUserById(order.user_id);
    customerEmail = userData?.user?.email ?? null;
    customerName = userData?.user?.user_metadata?.full_name || userData?.user?.email?.split("@")[0] || "Customer";
    notifyOrderUpdates = userData?.user?.user_metadata?.notify_order_updates ?? true;
  } catch {}

  const oldStatus = order.status;

  // Restore stock when cancelled from an active state
  if (status === "cancelled" && ["pending", "confirmed", "frame_reserved", "frame_preparing"].includes(oldStatus)) {
    for (const item of order.order_items) {
      await adminSupabase.rpc("increment_stock", {
        p_id: item.product_id,
        p_qty: item.quantity,
      });
    }
  }

  const updateData: any = { status, updated_at: new Date().toISOString() };
  if (paymentStatus) updateData.payment_status = paymentStatus;
  if (trackingId !== undefined) updateData.tracking_id = trackingId;
  if (courier !== undefined) updateData.courier_partner = courier;
  if (estimatedDeliveryDate) updateData.estimated_delivery_date = estimatedDeliveryDate;

  const { error } = await adminSupabase.from("orders").update(updateData).eq("id", orderId);
  if (error) return { error: error.message };

  // Record in status history
  try {
    await adminSupabase.from("order_status_history").insert({
      order_id: orderId,
      status,
      note: note || null,
      updated_by: "admin",
    });
  } catch {}

  // In-app notification (respect customer's notification preference)
  if (notifyOrderUpdates) {
    try {
      await adminSupabase.from("notifications").insert({
        user_id: order.user_id,
        title: `Order Update`,
        message: `Your order #${orderId.slice(0, 8).toUpperCase()} is now: ${status.replace(/_/g, " ")}.`,
        type: "order_update",
        metadata: { order_id: orderId, status },
      });
    } catch {}
  }

  // Email notification via Resend (fire-and-forget)
  if (customerEmail) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const statusLabel = status.replace(/_/g, " ");
      const displayStatus = statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);
      const shortId = orderId.slice(0, 8).toUpperCase();

      const trackingSection = trackingId
        ? `<p style="margin:8px 0;color:#333"><strong>Tracking ID:</strong> ${trackingId}${courier ? ` (${courier})` : ""}</p>`
        : "";
      const deliverySection = estimatedDeliveryDate
        ? `<p style="margin:8px 0;color:#333"><strong>Estimated Delivery:</strong> ${estimatedDeliveryDate}</p>`
        : "";
      const noteSection = note
        ? `<p style="margin:8px 0;color:#555;font-style:italic">${note}</p>`
        : "";

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
          <div style="background:#03173D;padding:24px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:24px;font-style:italic">LENZIFY</h1>
            <p style="color:#fff;opacity:0.7;margin:4px 0 0;font-size:13px">Order Update</p>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
            <p style="color:#333">Hi ${customerName},</p>
            <p style="color:#333">Your order <strong>#${shortId}</strong> has been updated to:</p>
            <div style="background:#f0f5ff;border-left:4px solid #004AAD;padding:12px 16px;margin:16px 0;border-radius:4px">
              <strong style="color:#004AAD;font-size:16px">${displayStatus}</strong>
            </div>
            ${trackingSection}${deliverySection}${noteSection}
            <p style="color:#333;margin-top:24px">Thank you for shopping with Lenzify!</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: "Lenzify Orders <noreply@lenzify.in>",
        to: customerEmail,
        subject: `Order #${shortId} — ${displayStatus}`,
        html,
      });
    } catch (mailErr) {
      console.error("[ORDER] Status email failed:", mailErr);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

/** Customer: cancel an order (only pending/confirmed) */
export async function cancelOrder(orderId: string, reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) return { error: "Order not found" };
  if (!["pending", "confirmed"].includes(order.status)) {
    return { error: "This order can no longer be cancelled. Please contact support." };
  }

  // Restore stock
  for (const item of order.order_items) {
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
    cancel_reason: reason || "Cancelled by customer",
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  if (error) return { error: error.message };

  try {
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: "cancelled",
      note: reason || "Cancelled by customer",
      updated_by: "customer",
    });
  } catch {}

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: true };
}

/** Customer: request return (only if delivered) */
export async function requestReturn(orderId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) return { error: "Order not found" };
  if (order.status !== "delivered") return { error: "Only delivered orders can be returned." };

  const { error } = await supabase.from("orders").update({
    return_requested_at: new Date().toISOString(),
    return_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  if (error) return { error: error.message };

  try {
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Return Requested",
      message: `Return request submitted for order #${orderId.slice(0, 8).toUpperCase()}.`,
      type: "return_request",
      metadata: { order_id: orderId },
    });
  } catch {}

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}
