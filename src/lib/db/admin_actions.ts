"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 📦 INVENTORY LOGGING & MANUAL CORRECTION
 * Records every stock change into the inventory_logs audit trail.
 */
export async function updateInventoryAudit(
  productId: string, 
  changeAmount: number, 
  reason: string, 
  adminId: string
) {
  const supabase = await createClient();

  // 1. Log the change
  const { error: logError } = await supabase.from("inventory_logs").insert({
    product_id: productId,
    change_amount: changeAmount,
    reason,
    admin_id: adminId
  });

  if (logError) return { error: logError.message };

  // 2. Update actual product stock
  const { error: updateError } = await supabase.rpc('increment_stock', {
    p_id: productId,
    p_qty: changeAmount
  });

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  return { success: true };
}

/**
 * 👁️ CLINICAL PRESCRIPTION VERIFICATION
 * Standardized approval/rejection and clinical notes attachment.
 */
export async function updatePrescriptionStatus(
  id: string, 
  status: 'pending' | 'approved' | 'rejected', 
  adminNotes?: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("prescriptions")
    .update({ 
      status, 
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/prescriptions");
  return { success: true };
}

/**
 * 👤 CUSTOMER IDENTITY MANAGEMENT
 * Protocol for blocking/unblocking accounts for security or policy violations.
 */
export async function toggleCustomerAccess(id: string, isBlocked: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ is_blocked: isBlocked })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/customers");
  return { success: true };
}

/**
 * 🎯 COUPON ORCHESTRATION
 * Enable/Disable protocol for promotional matrix coordination.
 */
export async function toggleCouponStatus(id: number, isEnabled: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("coupons")
    .update({ is_enabled: isEnabled })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/coupons");
  return { success: true };
}

/**
 * ⭐ REVIEW MODERATION Hub
 * Administrative tools to moderate storefront engagement.
 */
export async function moderateReview(
  id: number, 
  action: 'approve' | 'hide' | 'pin' | 'unpin',
  reply?: string
) {
  const supabase = await createClient();
  let updateData: any = {};

  if (action === 'approve') updateData.status = 'approved';
  if (action === 'hide') updateData.is_hidden = true;
  if (action === 'pin') updateData.is_pinned = true;
  if (action === 'unpin') updateData.is_pinned = false;
  if (reply) updateData.admin_reply = reply;

  const { error } = await supabase
    .from("reviews")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  return { success: true };
}

/**
 * 🎨 HOMEPAGE CONFIG SYNC
 * Orchestrating section logic and banners.
 */
export async function updateHomepageSection(key: string, content: any, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("homepage_config")
    .upsert({ 
      section_key: key, 
      content, 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq("section_key", key);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { success: true };
}

/**
 * 📊 DASHBOARD ANALYTICS ORCHESTRATION
 * Aggregates site-wide metrics for tactical administrative overview.
 */
export async function getDashboardStats() {
  const supabase = await createAdminClient();

  // 1. Fetch all orders with essential columns using admin client (bypasses RLS)
  let allOrders: any[] = [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, total_price, status, payment_status, payment_method, created_at, user_id")
      .order("created_at", { ascending: false });
    if (!error && data) allOrders = data;
  } catch (e: any) {
    console.error("Error fetching all orders for dashboard:", e?.message || e);
  }

  // 2. Fetch users map (from auth.admin.listUsers() and fallback to users/profiles)
  const userMap = new Map<string, { name: string; email: string }>();
  let totalCustomers = 0;
  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    if (usersData?.users) {
      totalCustomers = usersData.users.length;
      for (const u of usersData.users) {
        userMap.set(u.id, {
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Customer",
          email: u.email || "",
        });
      }
    }
  } catch (e) {
    const { data: profileUsers, count } = await supabase.from("profiles").select("id, full_name, email", { count: "exact" });
    if (profileUsers) {
      totalCustomers = count || profileUsers.length;
      profileUsers.forEach((p: any) => {
        userMap.set(p.id, { name: p.full_name || "Customer", email: p.email || "" });
      });
    }
  }

  // 3. Low stock products (stock <= 5)
  let lowStockProducts: any[] = [];
  let lowStockCount = 0;
  try {
    const { data, count } = await supabase
      .from("products")
      .select("id, name, stock, brand", { count: "exact" })
      .lte("stock", 5)
      .order("stock", { ascending: true })
      .limit(5);
    lowStockProducts = data || [];
    lowStockCount = count || 0;
  } catch (e: any) {
    console.error("Error fetching low stock:", e?.message || e);
  }

  // 4. Cart Abandonment (active cart sessions)
  let uniqueCartUsers = 0;
  try {
    const { data } = await supabase.from("cart").select("user_id");
    if (data) {
      uniqueCartUsers = new Set(data.map((c: any) => c.user_id)).size;
    }
  } catch (e) {}

  // 5. Top selling items from order_items
  let topProducts: { name: string; brand: string; sales: number }[] = [];
  try {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, products(name, brand)")
      .limit(50);
    
    if (orderItems && orderItems.length > 0) {
      const salesMap: Record<string, { name: string; brand: string; sales: number }> = {};
      orderItems.forEach((item: any) => {
        const pid = item.product_id;
        if (!salesMap[pid]) {
          salesMap[pid] = {
            name: (item.products as any)?.name || "Eyewear Model",
            brand: (item.products as any)?.brand || "Lenzify",
            sales: 0
          };
        }
        salesMap[pid].sales += item.quantity || 1;
      });
      topProducts = Object.values(salesMap).sort((a, b) => b.sales - a.sales).slice(0, 5);
    }
  } catch (e: any) {
    console.error("Error fetching top products:", e?.message || e);
  }

  // 6. Metrics aggregation
  // Real sales: All valid non-cancelled orders (paid online OR active COD orders)
  const validOrders = allOrders.filter(o => o.status !== "cancelled" && o.status !== "refunded");
  const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
  const totalOrders = allOrders.length;

  const pendingOrders = allOrders.filter(o => o.status === "pending" || (o.payment_method === "cod" && o.status === "pending")).length;
  const codOrders = allOrders.filter(o => o.payment_method === "cod").length;

  // Today's metrics
  const now = new Date();
  const todayISO = now.toISOString().split("T")[0];
  const todayOrdersList = allOrders.filter(o => o.created_at?.startsWith(todayISO));
  const todayRevenue = todayOrdersList
    .filter(o => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
  const todayOrders = todayOrdersList.length;

  // Real Trends (Last 7 days vs previous 7 days)
  const msInDay = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now.getTime() - 7 * msInDay);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * msInDay);

  const last7DaysOrders = validOrders.filter(o => new Date(o.created_at) >= sevenDaysAgo);
  const prev7DaysOrders = validOrders.filter(o => {
    const d = new Date(o.created_at);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  });

  const last7Revenue = last7DaysOrders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
  const prev7Revenue = prev7DaysOrders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);

  let revenueTrend = "+0%";
  if (prev7Revenue > 0) {
    const pct = Math.round(((last7Revenue - prev7Revenue) / prev7Revenue) * 100);
    revenueTrend = `${pct >= 0 ? "+" : ""}${pct}%`;
  } else if (last7Revenue > 0) {
    revenueTrend = "+100%";
  } else if (totalSales > 0) {
    revenueTrend = "Active";
  } else {
    revenueTrend = "₹0 this week";
  }

  let ordersTrend = "+0%";
  if (prev7DaysOrders.length > 0) {
    const pct = Math.round(((last7DaysOrders.length - prev7DaysOrders.length) / prev7DaysOrders.length) * 100);
    ordersTrend = `${pct >= 0 ? "+" : ""}${pct}%`;
  } else if (last7DaysOrders.length > 0) {
    ordersTrend = `+${last7DaysOrders.length} this week`;
  } else if (totalOrders > 0) {
    ordersTrend = `${totalOrders} all-time`;
  } else {
    ordersTrend = "Active";
  }

  // 7. Recent Orders with real customer names attached
  const recentOrders = allOrders.slice(0, 5).map(o => {
    const cust = userMap.get(o.user_id);
    return {
      ...o,
      customerName: cust?.name || (o.users as any)?.name || "Customer",
      customerEmail: cust?.email || ""
    };
  });

  // 8. 7-Day Chart Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * msInDay);
    return d.toISOString().split("T")[0];
  });

  const chartData = last7Days.map(date => {
    const dayOrders = allOrders.filter(o => o.created_at?.startsWith(date) && o.status !== "cancelled");
    const revenue = dayOrders.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    const dateObj = new Date(`${date}T00:00:00`);
    return {
      date: dateObj.toLocaleDateString("en-IN", { weekday: "short" }),
      fullDate: date,
      revenue,
      orders: dayOrders.length
    };
  });

  // 9. 30-Day Chart Data (so admin can view longer real timeline)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * msInDay);
    return d.toISOString().split("T")[0];
  });

  const chartData30Days = last30Days.map(date => {
    const dayOrders = allOrders.filter(o => o.created_at?.startsWith(date) && o.status !== "cancelled");
    const revenue = dayOrders.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    const dateObj = new Date(`${date}T00:00:00`);
    return {
      date: dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      fullDate: date,
      revenue,
      orders: dayOrders.length
    };
  });

  return {
    totalSales,
    totalOrders,
    totalCustomers,
    lowStockCount,
    abandonedCarts: uniqueCartUsers,
    lowStockProducts,
    recentOrders,
    topProducts,
    pendingOrders,
    codOrders,
    todayRevenue,
    todayOrders,
    revenueTrend,
    ordersTrend,
    customersTrend: totalCustomers > 0 ? `${totalCustomers} accounts` : "Verified",
    chartData,
    chartData30Days
  };
}

/**
 * 🔔 SYSTEM PROTOCOL NOTIFICATIONS
 * Marks system alerts as acknowledged by admin.
 */
export async function markNotificationRead(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function deleteNotification(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/notifications");
  return { success: true };
}
