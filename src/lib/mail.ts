import nodemailer from "nodemailer";

/**
 * Mail Utility for Lenzify
 * Uses SMTP (Gmail recommended with App Password)
 */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "lenzify.in@gmail.com",
    pass: process.env.SMTP_PASSWORD, // Use an App Password from Google
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: `"Lenzify" <${process.env.SMTP_USER || "lenzify.in@gmail.com"}>`,
        to,
        subject,
        html,
      });
      console.log("[MAIL] Message sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error(`[MAIL] Attempt ${attempt} failed:`, error.message);
      if (attempt <= retries) {
        await new Promise(r => setTimeout(r, attempt * 1000));
      } else {
        return { success: false, error: error.message };
      }
    }
  }
  return { success: false, error: "Max retries exceeded" };
}

/**
 * Order Confirmation Template
 */
export function getOrderConfirmationHtml(order: any, customerName: string) {
  const itemsHtml = order.order_items
    ?.map(
      (item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.products?.name} x ${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
    </tr>
  `
    )
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Order Confirmed!</h1>
      <p>Hi ${customerName},</p>
      <p>Thank you for shopping with Lenzify. Your order has been placed successfully and is being processed.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #eee;">Item</th>
              <th style="text-align: right; padding: 10px; border-bottom: 2px solid #eee;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Total</td>
              <td style="padding: 10px; font-weight: bold; text-align: right;">₹${order.total}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <p>We'll notify you once your order is shipped.</p>
      <p>Best regards,<br>Team Lenzify</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0 20px;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        Lenzify.in | The Future of Vision<br>
        This is an automated message, please do not reply.
      </p>
    </div>
  `;
}

const STATUS_MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  confirmed:          { emoji: "✅", title: "Order Confirmed",             body: "Great news! Your order has been confirmed and we're getting started." },
  frame_reserved:     { emoji: "🕶️", title: "Frame Reserved",              body: "Your frame has been reserved and is ready for preparation." },
  frame_preparing:    { emoji: "🔧", title: "Frame Being Prepared",         body: "Your frame is now being cleaned and prepared by our team." },
  lens_selected:      { emoji: "🔬", title: "Lens Selected",                body: "The perfect lenses have been selected for your prescription." },
  lens_manufacturing: { emoji: "⚗️", title: "Lenses Being Manufactured",    body: "Your custom lenses are being precision-manufactured in our lab." },
  lens_fitting:       { emoji: "🧪", title: "Lens Fitting In Progress",      body: "Our experts are carefully fitting the lenses into your frame." },
  quality_check:      { emoji: "🔍", title: "Quality Inspection",            body: "Your order is undergoing our rigorous quality inspection process." },
  packed:             { emoji: "📦", title: "Order Packed",                  body: "Your order has been packed securely and is ready for dispatch." },
  waiting_shipment:   { emoji: "🏭", title: "Waiting for Shipment",          body: "Your package is at our dispatch center, waiting for pickup." },
  shipped:            { emoji: "🚚", title: "Order Shipped",                  body: "Your order is on its way! Track it with the tracking ID in your dashboard." },
  out_for_delivery:   { emoji: "🏃", title: "Out for Delivery",               body: "Your order is out for delivery and will reach you soon today!" },
  delivered:          { emoji: "🎉", title: "Order Delivered",                body: "Your order has been delivered. We hope you love your new eyewear!" },
  cancelled:          { emoji: "❌", title: "Order Cancelled",                body: "Your order has been cancelled. If you paid online, a refund is being processed." },
  refunded:           { emoji: "💰", title: "Refund Processed",               body: "Your refund has been processed. It will reflect in your account in 5-7 business days." },
};

export function getOrderStatusUpdateHtml(
  orderId: string,
  status: string,
  customerName: string,
  estimatedDelivery?: string | null,
  trackingId?: string | null,
  courier?: string | null,
  note?: string | null
) {
  const msg = STATUS_MESSAGES[status] || {
    emoji: "📋",
    title: `Order Update: ${status}`,
    body: `Your order status has been updated to ${status}.`,
  };

  const trackingRow = trackingId
    ? `<p style="margin:8px 0"><strong>Tracking ID:</strong> <code style="background:#f5f5f5;padding:2px 6px;border-radius:4px">${trackingId}</code>${courier ? ` via ${courier}` : ""}</p>`
    : "";
  const deliveryRow = estimatedDelivery
    ? `<p style="margin:8px 0"><strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>`
    : "";
  const noteRow = note
    ? `<p style="margin:16px 0;padding:12px;background:#f9f9f9;border-left:3px solid #004AAD;border-radius:4px">${note}</p>`
    : "";

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:#03173D;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:24px;font-style:italic">LENZIFY</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:48px">${msg.emoji}</span>
          <h2 style="color:#111;margin:8px 0">${msg.title}</h2>
        </div>
        <p>Hi ${customerName},</p>
        <p>${msg.body}</p>
        ${noteRow}
        <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:8px 0"><strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
          ${trackingRow}
          ${deliveryRow}
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="https://lenzify.in/orders/${orderId}"
             style="background:#004AAD;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">
            Track Your Order
          </a>
        </div>
        <p style="color:#666;font-size:13px">If you have any questions, reply to this email or contact us at support@lenzify.in</p>
        <p>Best regards,<br><strong>Team Lenzify</strong></p>
        <hr style="border:0;border-top:1px solid #eee;margin:32px 0 16px">
        <p style="font-size:11px;color:#999;text-align:center">
          Lenzify.in | See The World Differently<br>
          This is an automated message. Order: ${orderId}
        </p>
      </div>
    </div>
  `;
}

export function getReplacementOrderConfirmationHtml(order: any, customerName: string) {
  const pickupAddr = order.pickup_address || {};
  const isDiff = order.is_delivery_different;
  const deliveryAddr = isDiff ? (order.delivery_address || {}) : pickupAddr;

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #03173D; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-style: italic;">LENZIFY</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px;">👓</span>
          <h2 style="color: #111; margin: 8px 0;">Lens Replacement Request Confirmed!</h2>
          <p style="color: #004AAD; font-weight: bold; margin: 0;">Payment: ${order.payment_method === 'cod' ? 'Cash on Pickup / Delivery (COD)' : 'Paid Online'}</p>
        </div>
        <p>Hi ${customerName},</p>
        <p>We have successfully received your lens replacement order. Our courier specialist will visit your location to collect your frames.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #03173D;">Order Details</h3>
          <p style="margin: 6px 0;"><strong>Order ID:</strong> #${(order.id || "").slice(0, 8).toUpperCase()}</p>
          <p style="margin: 6px 0;"><strong>Frame Type:</strong> ${order.frame_type || "Standard"}</p>
          <p style="margin: 6px 0;"><strong>Pickup Schedule:</strong> ${order.pickup_date || "Scheduled"} (${order.pickup_time_slot || "Standard"})</p>
          <p style="margin: 6px 0;"><strong>Pickup Address:</strong> ${pickupAddr.address || ""}, ${pickupAddr.city || ""}, ${pickupAddr.pincode || ""}</p>
          ${isDiff ? `<p style="margin: 6px 0;"><strong>Delivery Address:</strong> ${deliveryAddr.address || ""}, ${deliveryAddr.city || ""}, ${deliveryAddr.pincode || ""}</p>` : ""}
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 12px 0;">
          <p style="margin: 6px 0; font-size: 16px; font-weight: bold; color: #111;">Total Amount: ₹${(order.total_price || 0).toLocaleString('en-IN')}</p>
        </div>
        
        <p>Please keep your frames safely packed or ready in their protective case for pickup.</p>
        <p>Best regards,<br><strong>Team Lenzify</strong></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0 16px;">
        <p style="font-size: 11px; color: #999; text-align: center;">
          Lenzify.in | Precision Optical Surfacing<br>
          This is an automated confirmation message.
        </p>
      </div>
    </div>
  `;
}
