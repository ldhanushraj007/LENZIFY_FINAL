import { createAdminClient } from "@/lib/supabase/server";
import { ShoppingCart, Search, Filter, Eye, CheckCircle2, Truck, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { updateOrderStatus } from "@/lib/db/order_actions";

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
  shipped:   "bg-blue-50 text-blue-700 border-blue-100",
  confirmed: "bg-violet-50 text-violet-700 border-violet-100",
  pending:   "bg-amber-50 text-amber-700 border-amber-100",
  cancelled: "bg-red-50 text-red-600 border-red-100",
  refunded:  "bg-gray-50 text-gray-600 border-gray-200",
};

const PAYMENT_STYLES: Record<string, string> = {
  paid:    "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  failed:  "bg-red-50 text-red-600 border-red-100",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q || "";
  const status = params?.status || "all";
  const page = parseInt(params?.page || "1");
  const fromDate = params?.from || "";
  const toDate = params?.to || "";
  const pageSize = 15;

  const supabase = await createAdminClient();

  let dbQuery = supabase
    .from("orders")
    .select("*, users(name, email), addresses(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (query) dbQuery = dbQuery.or(`id.ilike.%${query}%,tracking_id.ilike.%${query}%`);
  if (status !== "all") dbQuery = dbQuery.eq("status", status);
  if (fromDate) dbQuery = dbQuery.gte("created_at", `${fromDate}T00:00:00`);
  if (toDate) dbQuery = dbQuery.lte("created_at", `${toDate}T23:59:59`);

  const from = (page - 1) * pageSize;
  const { data: orders, count } = await dbQuery.range(from, from + pageSize - 1);
  const totalPages = Math.ceil((count || 0) / pageSize);

  // Map user IDs to auth metadata for accurate customer names & emails
  const userMap = new Map<string, { name: string; email: string }>();
  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    for (const u of usersData?.users || []) {
      userMap.set(u.id, {
        name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Customer",
        email: u.email || "",
      });
    }
  } catch {}

  const statusOptions = [
    { value: "all",       label: "All Orders" },
    { value: "pending",   label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped",   label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded",  label: "Refunded" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Orders</h1>
          <p className="text-sm text-[#888888] mt-0.5">{count || 0} total orders</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#ECEFF5] rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <form className="flex-1">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BBBBBB]" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by order ID or tracking..."
              className="w-full bg-[#F4F6F8] border border-[#ECEFF5] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#111111] placeholder:text-[#CCCCCC] focus:outline-none focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 transition-all"
            />
          </div>
        </form>

        <form className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#F4F6F8] border border-[#ECEFF5] rounded-lg px-3 py-2.5">
            <Calendar size={13} className="text-[#AAAAAA]" />
            <input type="date" name="from" defaultValue={fromDate} className="bg-transparent text-sm text-[#333333] focus:outline-none" />
            <span className="text-[#CCCCCC] text-xs">–</span>
            <input type="date" name="to" defaultValue={toDate} className="bg-transparent text-sm text-[#333333] focus:outline-none" />
          </div>

          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none" />
            <select
              name="status"
              defaultValue={status}
              className="appearance-none bg-[#F4F6F8] border border-[#ECEFF5] rounded-lg pl-8 pr-8 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#004AAD] cursor-pointer"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-[#004AAD] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#003d99] transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#ECEFF5] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#AAAAAA] bg-[#FAFAFA] border-b border-[#ECEFF5]">
                <th className="px-6 py-3.5 font-semibold">Order</th>
                <th className="px-4 py-3.5 font-semibold">Date</th>
                <th className="px-4 py-3.5 font-semibold">Customer</th>
                <th className="px-4 py-3.5 font-semibold">Amount</th>
                <th className="px-4 py-3.5 font-semibold">Payment</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {orders?.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="text-xs font-mono font-semibold text-[#004AAD] hover:underline">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#666666]">
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-[#111111]">
                      {(order.addresses as any)?.full_name || userMap.get(order.user_id)?.name || (order.users as any)?.name || "Customer"}
                    </p>
                    <p className="text-[10px] text-[#AAAAAA]">
                      {userMap.get(order.user_id)?.email || (order.users as any)?.email || ""}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#111111]">
                    ₹{Number(order.total_price || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                        order.payment_method === 'cod'
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-blue-50 text-[#004AAD] border-blue-200"
                      )}>
                        {order.payment_method === 'cod' ? 'COD' : 'ONLINE'}
                      </span>
                      <span className={cn(
                        "inline-block text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full border",
                        PAYMENT_STYLES[order.payment_status] ?? "bg-gray-50 text-gray-500 border-gray-200"
                      )}>
                        {order.payment_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "inline-block text-[10px] font-semibold capitalize px-2.5 py-1 rounded-full border",
                      STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === "pending" && (
                        <form action={async () => { "use server"; await updateOrderStatus(order.id, "confirmed"); }}>
                          <button title="Confirm" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-100">
                            <CheckCircle2 size={14} />
                          </button>
                        </form>
                      )}
                      {order.status === "confirmed" && (
                        <form action={async () => { "use server"; await updateOrderStatus(order.id, "shipped"); }}>
                          <button title="Mark Shipped" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100">
                            <Truck size={14} />
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="p-1.5 rounded-lg bg-[#F4F6F8] text-[#666666] hover:bg-[#ECEFF5] hover:text-[#111111] transition-colors border border-[#ECEFF5]"
                        title="View Order"
                      >
                        <Eye size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!orders || orders.length === 0) && (
          <div className="py-20 flex flex-col items-center gap-3 text-[#CCCCCC]">
            <ShoppingCart size={40} />
            <p className="text-sm font-medium">No orders found</p>
            <p className="text-xs">Try adjusting your filters</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#ECEFF5] flex items-center justify-between">
            <p className="text-xs text-[#AAAAAA]">
              Showing {from + 1}–{Math.min(from + pageSize, count || 0)} of {count} orders
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/admin/orders?page=${p}&q=${query}&status=${status}&from=${fromDate}&to=${toDate}`}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-lg border transition-all",
                    page === p
                      ? "bg-[#004AAD] text-white border-[#004AAD]"
                      : "bg-white text-[#666666] border-[#ECEFF5] hover:border-[#004AAD] hover:text-[#004AAD]"
                  )}
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
