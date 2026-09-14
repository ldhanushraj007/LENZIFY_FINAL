import { createClient } from "@/lib/supabase/server";
import {
  Package,
  Heart,
  FileText,
  Star,
  ChevronRight,
  User,
  MapPin,
  Settings,
  Clock,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { cn, getIndianGreeting } from "@/lib/utils";

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="bg-[#F8F9FC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666666]">Please log in to view your dashboard.</p>
          <Link href="/auth/login" className="mt-4 inline-block bg-[#03173D] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#004AAD] transition-all">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Fetch complete order history for the user
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*, products(*, product_images(*)))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: wishlistItems } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id);

  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("id")
    .eq("user_id", user.id);

  const name = user.user_metadata?.name || user.email?.split("@")[0] || "there";
  const greeting = getIndianGreeting();

  const recentOrders = (orders || []).slice(0, 5);

  const statusBadge = (status: string) => {
    if (status === "delivered")
      return "bg-green-50 text-green-700 border border-green-200";
    if (status === "processing" || status === "confirmed")
      return "bg-blue-50 text-[#004AAD] border border-blue-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  };

  const quickActions = [
    { href: "/orders", icon: Package, label: "My Orders", desc: "Track your orders" },
    { href: "/wishlist", icon: Heart, label: "Wishlist", desc: "Saved items" },
    { href: "/prescriptions", icon: FileText, label: "Prescriptions", desc: "Saved prescriptions" },
    { href: "/addresses", icon: MapPin, label: "Addresses", desc: "Manage delivery addresses" },
    { href: "/profile", icon: User, label: "Profile", desc: "Account settings" },
  ];

  return (
    <div className="bg-[#F8F9FC] min-h-screen pt-20 md:pt-28">
      {/* Welcome Header */}
      <div className="bg-white border-b border-[#ECECEC] pb-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-2">Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-[var(--font-hero)] italic text-[#111111]">
            {greeting}, {name}
          </h1>
          <p className="text-[#666666] mt-2 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total Orders", value: orders?.length ?? 0, color: "text-[#004AAD]" },
            { icon: Heart, label: "Wishlist Items", value: wishlistItems?.length ?? 0, color: "text-rose-500" },
            { icon: FileText, label: "Prescriptions", value: prescriptions?.length ?? 0, color: "text-emerald-600" },
            { icon: Star, label: "Reward Points", value: (orders?.length ?? 0) * 50, color: "text-amber-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6"
            >
              <Icon size={22} className={cn("mb-4", color)} />
              <p className="text-3xl font-bold text-[#111111]">{value.toLocaleString()}</p>
              <p className="text-[#666666] text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {quickActions.map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-white rounded-2xl border border-[#ECECEC] p-5 hover:border-[#004AAD] hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] transition-all duration-300 cursor-pointer group"
              >
                <Icon size={22} className="text-[#004AAD] mb-3" />
                <p className="text-[#111111] font-semibold text-sm">{label}</p>
                <p className="text-[#666666] text-xs mt-1 leading-snug">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD]">Recent Orders</p>
            <Link href="/orders" className="text-sm text-[#004AAD] font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-12 text-center">
              <ShoppingBag size={40} className="mx-auto text-[#ECECEC] mb-4" />
              <p className="text-[#111111] font-semibold mb-2">No orders yet</p>
              <p className="text-[#666666] text-sm mb-6">Start shopping to see your orders here.</p>
              <Link href="/products" className="inline-block bg-[#03173D] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#004AAD] transition-all">
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="divide-y divide-[#ECECEC]">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-[#F8F9FC] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F9FC] border border-[#ECECEC] flex items-center justify-center">
                        <Package size={16} className="text-[#004AAD]" />
                      </div>
                      <div>
                        <p className="text-[#111111] font-semibold text-sm">#{order.id.slice(0, 10).toUpperCase()}</p>
                        <p className="text-[#666666] text-xs flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn("text-xs font-semibold px-3 py-1 rounded-full capitalize", statusBadge(order.status))}>
                        {order.status}
                      </span>
                      <span className="text-[#111111] font-bold text-sm">₹{(order.total_price || 0).toLocaleString()}</span>
                      <Link href={`/orders/${order.id}`} className="text-[#004AAD] text-xs font-semibold hover:underline whitespace-nowrap">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
