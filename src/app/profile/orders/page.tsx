"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag,
  ChevronRight,
  Eye,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProfileOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          addresses(*),
          order_items(
            *,
            products(name, product_images(*))
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, [supabase]);

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse text-brand-navy/30 italic">Retrieving Archival Logs...</div>;

  return (
    <div className="bg-surface text-brand-navy min-h-screen pt-24 font-sans">
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-12 lg:py-20 pb-24 md:pb-32 space-y-20">
        <header className="space-y-6">
           <Link href="/" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-brand-navy/30 hover:text-secondary transition-all group">
              <ArrowLeft size={14} className="group-hover:-translate-x-2 transition-transform" />
              <span>Back to Storefront</span>
           </Link>
           <h1 className="text-6xl font-serif italic text-brand-navy font-black tracking-tight uppercase leading-none">
              Acquisition <span className="text-secondary">Archives</span>
           </h1>
           <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-navy/20 italic">History of optical procurement and deployment.</p>
        </header>

        <section className="space-y-12">
           {orders.length === 0 ? (
             <div className="py-32 border border-brand-navy/5 bg-white text-center space-y-8 shadow-sm">
                <ShoppingBag size={48} className="mx-auto text-brand-navy/10" />
                <div className="space-y-2">
                   <p className="text-xl font-serif italic text-brand-navy font-black italic">No protocols initialized.</p>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-brand-navy/30">Your purchase history remains unpopulated.</p>
                </div>
                <Link href="/products" className="inline-block py-4 px-10 bg-brand-navy text-white text-[9px] font-black uppercase tracking-widest hover:bg-secondary transition-all">
                   Initiate Acquisition
                </Link>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-8">
                {orders.map((order) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={order.id} 
                    className="bg-white border border-brand-navy/5 shadow-sm hover:shadow-2xl transition-all duration-700 group overflow-hidden"
                  >
                     <div className="p-8 md:p-12 flex flex-col lg:flex-row gap-12 items-start lg:items-center">
                        {/* Status Module */}
                        <div className="space-y-4 min-w-[180px]">
                           <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                order.status === 'delivered' ? 'bg-emerald-500' : 
                                order.status === 'pending' ? 'bg-amber-500' : 'bg-brand-navy'
                              )}></div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy">{order.status}</span>
                           </div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-brand-navy/20 italic">#{order.id.slice(0, 12)}</p>
                           <div className="flex items-center gap-3 text-brand-navy/40">
                              <Clock size={14} />
                              <span className="text-[10px] font-bold">{new Date(order.created_at).toLocaleDateString()}</span>
                           </div>
                        </div>

                        {/* Items Module */}
                        <div className="flex-grow flex -space-x-4 overflow-hidden py-2">
                           {order.order_items.map((item: any, i: number) => (
                             <div key={i} className="w-16 h-16 bg-brand-background border border-brand-navy/5 p-2 rounded-full shadow-lg relative z-[10] group-hover:z-[20] transition-all group-hover:scale-110">
                                <img 
                                  src={item.products.product_images?.[0]?.image_url || "/placeholder.jpg"} 
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                             </div>
                           ))}
                           {order.order_items.length > 3 && (
                             <div className="w-16 h-16 bg-brand-navy text-white flex items-center justify-center rounded-full text-[10px] font-black relative z-0 border-2 border-white">
                                +{order.order_items.length - 3}
                             </div>
                           )}
                        </div>

                        {/* Value Module */}
                        <div className="flex flex-col items-end gap-2 text-right">
                           <p className="text-[9px] font-black uppercase tracking-widest text-brand-navy/30">Protocol Value</p>
                           <p className="text-3xl font-serif italic text-brand-navy font-black italic">₹{order.total_price.toLocaleString()}</p>
                        </div>

                        {/* Action Module */}
                        <Link 
                          href={`/orders/${order.id}`}
                          className="py-6 px-10 border border-brand-navy/10 text-brand-navy text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-navy hover:text-white transition-all flex items-center gap-4"
                        >
                           <span>Inspect Log</span>
                           <Eye size={14} />
                        </Link>
                     </div>
                  </motion.div>
                ))}
             </div>
           )}
        </section>

        <footer className="pt-20 border-t border-brand-navy/5">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
              <div className="space-y-4">
                 <ShieldCheck className="mx-auto md:mx-0 text-secondary" size={24} />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-navy">Archival Security</h4>
                 <p className="text-[9px] text-brand-navy/40 font-bold uppercase leading-relaxed italic">All acquisition data is encrypted and stored in the secure Lenzify vault.</p>
              </div>
              <div className="space-y-4">
                 <Package className="mx-auto md:mx-0 text-secondary" size={24} />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-navy">Logistics Sync</h4>
                 <p className="text-[9px] text-brand-navy/40 font-bold uppercase leading-relaxed italic">Real-time transit coordinates are updated as archives are dispatched.</p>
              </div>
              <div className="space-y-4">
                 <AlertCircle className="mx-auto md:mx-0 text-secondary" size={24} />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-navy">Support Protocol</h4>
                 <p className="text-[9px] text-brand-navy/40 font-bold uppercase leading-relaxed italic">For protocol discrepancies, contact our visionary support team.</p>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}

// Sub-component for icons used in the footer (placeholder as ShieldCheck is not in lucide-react list above)
function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
