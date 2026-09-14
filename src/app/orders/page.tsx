import { createClient } from "@/lib/supabase/server";
import { Package, ShoppingBag, RefreshCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="bg-[#F8F9FC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666666] mb-4">Please log in to view your orders.</p>
          <Link href="/auth/login" className="bg-[#03173D] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#004AAD] transition-all">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const { data: standardOrders } = await supabase
    .from("orders")
    .select("*, order_items(*, products(*, product_images(*)))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: replacementOrders } = await supabase
    .from("lens_replacement_orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const mappedRep = (replacementOrders || []).map(r => ({ ...r, isReplacement: true }));
  const orders = [...(standardOrders || []), ...mappedRep].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const statusBadge = (status: string) => {
    if (status === "delivered")
      return "bg-green-50 text-green-700 border border-green-200";
    if (status === "processing" || status === "confirmed" || status === "shipped")
      return "bg-blue-50 text-[#004AAD] border border-blue-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  };

  return (
    <div className="bg-[#F8F9FC] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#ECECEC] pt-20 md:pt-28 pb-6 md:pb-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-2">Account</p>
            <h1 className="text-4xl font-[var(--font-hero)] italic text-[#111111]">Your Orders</h1>
          </div>
          <Link
            href="/products"
            className="bg-[#03173D] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#004AAD] transition-all text-sm self-start sm:self-auto"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
        {orders.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-16 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-[#F8F9FC] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#ECECEC]">
              <ShoppingBag size={32} className="text-[#004AAD]/30" />
            </div>
            <h2 className="text-2xl font-[var(--font-hero)] italic text-[#111111] mb-3">No orders yet</h2>
            <p className="text-[#666666] text-sm mb-8 leading-relaxed">
              When you place your first order, it will appear here.
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#03173D] text-white rounded-full px-8 py-3 font-semibold hover:bg-[#004AAD] transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 mb-4 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] transition-all duration-300"
              >
                {/* Order header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-xs text-[#666666] uppercase tracking-widest font-semibold">Order #</p>
                      <p className="font-bold text-[#111111] text-sm">{order.id.slice(0, 12).toUpperCase()}</p>
                    </div>
                    <div className="w-px h-8 bg-[#ECECEC] hidden sm:block" />
                    <div>
                      <p className="text-xs text-[#666666] uppercase tracking-widest font-semibold">Date</p>
                      <p className="text-[#111111] text-sm font-medium">
                        {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {order.isReplacement && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#004AAD]/10 text-[#004AAD]">
                        Lens Replacement
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border",
                      order.payment_method === 'cod'
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-blue-50 text-[#004AAD] border-blue-200"
                    )}>
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}
                    </span>
                    <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full capitalize", statusBadge(order.status))}>
                      {order.status}
                    </span>
                    <span className="font-bold text-[#111111]">₹{(order.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Order items */}
                <div className="border-t border-[#ECECEC] pt-4 space-y-3">
                  {!order.isReplacement ? (
                    order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#F8F9FC] border border-[#ECECEC] rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img
                            src={item.products?.product_images?.[0]?.image_url || "/placeholder.jpg"}
                            className="w-full h-full object-contain"
                            alt={item.products?.name}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#111111] text-sm truncate">{item.products?.name}</p>
                          <p className="text-[#666666] text-xs">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-[#111111] text-sm flex-shrink-0">
                          ₹{(item.price || 0).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#F8F9FC] border border-[#ECECEC] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package size={22} className="text-[#004AAD]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#111111] text-sm">Lens Replacement Service</p>
                        <p className="text-[#666666] text-xs">Frame: {order.frame_type}</p>
                      </div>
                      <p className="font-semibold text-[#111111] text-sm">₹{(order.total_price || 0).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#ECECEC]">
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-1.5 text-[#004AAD] text-sm font-semibold hover:underline"
                  >
                    View Details <ChevronRight size={14} />
                  </Link>
                  <button className="flex items-center gap-1.5 text-[#666666] text-sm hover:text-[#111111] transition-colors">
                    <RefreshCcw size={13} /> Request Support
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
