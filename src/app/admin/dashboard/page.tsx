import { Plus, Tag, Layers, ShoppingBag, ChevronRight, ArrowRight, Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getDashboardStats } from "@/lib/db/admin_actions";
import { createClient } from "@/lib/supabase/server";
import DashboardStats from "@/components/admin/DashboardStats";
import DashboardCharts from "@/components/admin/DashboardCharts";
import TopProducts from "@/components/admin/TopProducts";

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
  shipped:   "bg-blue-50 text-blue-700 border-blue-100",
  confirmed: "bg-violet-50 text-violet-700 border-violet-100",
  pending:   "bg-amber-50 text-amber-700 border-amber-100",
  cancelled: "bg-red-50 text-red-600 border-red-100",
};

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboardPage() {
  const statsData = await getDashboardStats();
  const supabase = await createClient();
  let name = "Admin";
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.user_metadata?.name) {
      name = data.user.user_metadata.name.split(" ")[0];
    }
  } catch {
    name = "Admin";
  }

  const quickActions = [
    { label: "Add Product",    icon: Plus,      href: "/admin/products/new",      color: "bg-blue-50 text-blue-600" },
    { label: "Add Category",   icon: Layers,    href: "/admin/categories/new",    color: "bg-purple-50 text-purple-600" },
    { label: "Create Coupon",  icon: Tag,       href: "/admin/coupons",           color: "bg-emerald-50 text-emerald-600" },
    { label: "Manage Offers",  icon: ShoppingBag, href: "/admin/offers",            color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#888888]">{greet()},</p>
          <h1 className="text-2xl font-bold text-[#111111] mt-0.5">{name}</h1>
        </div>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#004AAD] hover:underline"
        >
          View all orders <ArrowRight size={13} />
        </Link>
      </div>

      {/* KPI Cards */}
      <DashboardStats initialStats={{
        totalSales: statsData.totalSales,
        totalOrders: statsData.totalOrders,
        totalCustomers: statsData.totalCustomers,
        lowStockCount: statsData.lowStockCount,
        abandonedCarts: statsData.abandonedCarts,
      }} />

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#AAAAAA] mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-white border border-[#ECEFF5] rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm hover:border-[#D0D7E8] transition-all group"
            >
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", a.color)}>
                <a.icon size={15} strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-[#111111] group-hover:text-[#004AAD] transition-colors">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts data={statsData.chartData} />

      {/* Bottom Grid: Recent Orders + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-[#ECEFF5] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECEFF5]">
            <h2 className="text-sm font-semibold text-[#111111]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[#004AAD] font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-[#AAAAAA] border-b border-[#ECEFF5]">
                  <th className="px-6 py-3 font-semibold">Order</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold text-right">Amount</th>
                  <th className="px-6 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {(statsData.recentOrders || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-[#AAAAAA]">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  statsData.recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-3.5">
                        <Link href={`/admin/orders/${order.id}`} className="text-xs font-mono font-semibold text-[#004AAD] hover:underline">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <p className="text-[10px] text-[#AAAAAA] mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-[#333333]">
                        {(order.users as any)?.name || "Customer"}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-[#111111] text-right">
                        ₹{Number(order.total_price).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={cn(
                          "inline-block text-[10px] font-semibold capitalize px-2.5 py-1 rounded-full border",
                          STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-600 border-gray-100"
                        )}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side: Top Products + Low Stock */}
        <div className="space-y-6">
          <TopProducts products={statsData.topProducts} />

          {/* Low Stock */}
          <div className="bg-white border border-[#ECEFF5] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEFF5]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-[#111111]">Low Stock</h2>
              </div>
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
                {statsData.lowStockCount} items
              </span>
            </div>
            <div className="divide-y divide-[#F5F5F5]">
              {(statsData.lowStockProducts || []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-[#AAAAAA] text-center">All products well-stocked</p>
              ) : (
                statsData.lowStockProducts.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#111111] truncate max-w-[160px]">{item.name}</p>
                      <p className="text-[10px] text-[#AAAAAA]">{item.brand}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-bold tabular-nums ml-2",
                      item.stock === 0 ? "text-red-500" : "text-amber-500"
                    )}>
                      {item.stock} left
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t border-[#ECEFF5]">
              <Link
                href="/admin/inventory"
                className="text-xs font-medium text-[#004AAD] hover:underline flex items-center gap-1"
              >
                Manage inventory <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
