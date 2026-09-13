import { createClient } from "@/lib/supabase/server";
import { Search, UserX, UserCheck, Eye, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { deleteCustomer, toggleCustomerBlock } from "./actions";
import { cn } from "@/lib/utils";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q || "";
  const supabase = await createClient();

  let dbQuery = supabase
    .from("users")
    .select("*, orders(total_price)")
    .order("created_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  let { data: users, error } = await dbQuery;

  if (!users || users.length === 0) {
    const { data: profileList } = await supabase.from("profiles").select("*");
    if (profileList && profileList.length > 0) {
      users = profileList.map((p: any) => ({
        id: p.id,
        name: p.full_name || "Customer",
        email: p.email || "Registered User",
        created_at: p.updated_at,
        is_blocked: false,
        role: p.role || "customer",
        orders: []
      }));
    }
  }

  // Calculate total spent per user
  const customers = users?.map(u => ({
    ...u,
    total_spent: u.orders?.reduce((acc: number, ord: any) => acc + (Number(ord.total_price) || 0), 0) || 0,
    order_count: u.orders?.length || 0
  })) || [];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-10 border-b border-brand-navy/5">
        <div>
           <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary italic mb-2">User Logistics</p>
          <h1 className="text-4xl font-serif italic text-brand-navy tracking-tight uppercase">Client <span className="text-secondary">Matrix</span></h1>
          <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-brand-text-muted mt-3 italic">Active Profiles: {customers.length}</p>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-white border border-brand-navy/5 p-8 shadow-sm">
        <form className="relative w-full lg:w-[500px] group">
          <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-navy/30 group-focus-within:text-secondary transition-colors" />
          <input 
            name="q"
            defaultValue={query}
            placeholder="SEARCH PROFILES (NAME OR PROTOCOL ID)..."
            className="w-full bg-brand-background border border-brand-navy/5 pl-16 pr-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] outline-none focus:border-secondary transition-all"
          />
        </form>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 gap-6">
          {customers.map((c) => (
            <div key={c.id} className="bg-white border border-brand-navy/5 p-8 flex flex-col lg:flex-row items-center justify-between gap-8 group hover:border-secondary transition-colors shadow-sm">
               <div className="flex items-center gap-6 w-full lg:w-1/3">
                  <div className="w-16 h-16 bg-brand-background flex items-center justify-center shrink-0 border border-brand-navy/5">
                     <Users size={20} className="text-brand-navy/20" />
                  </div>
                  <div>
                     <h3 className="text-lg font-serif italic text-brand-navy tracking-tight">{c.name || "UNNAMED ENTITY"}</h3>
                     <p className="text-[9px] text-brand-navy/40 font-bold uppercase tracking-[0.2em] mt-1">{c.email}</p>
                     {c.is_blocked && (
                       <span className="inline-block mt-2 text-[8px] bg-red-50 text-red-600 px-2 py-1 uppercase tracking-widest font-black">Restricted Access</span>
                     )}
                  </div>
               </div>

               <div className="flex items-center justify-between w-full lg:w-1/3 border-y lg:border-y-0 lg:border-x border-brand-navy/5 py-4 lg:py-0 lg:px-10">
                  <div className="text-center">
                     <p className="text-[9px] text-brand-navy/30 uppercase font-bold tracking-[0.3em] mb-1 italic">Interactions</p>
                     <p className="text-xl font-serif text-brand-navy">{c.order_count}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[9px] text-brand-navy/30 uppercase font-bold tracking-[0.3em] mb-1 italic">Total Capital</p>
                     <p className="text-xl font-serif text-secondary font-bold">₹{c.total_spent.toLocaleString()}</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                  <Link href={`/admin/customers/${c.id}`} className="px-6 py-4 bg-brand-background hover:bg-white border border-transparent hover:border-brand-navy/5 text-[9px] font-bold uppercase tracking-widest text-brand-navy transition-all flex items-center gap-2">
                     <Eye size={14} /> View Dossier
                  </Link>
                  <form action={async () => { "use server"; await toggleCustomerBlock(c.id, c.is_blocked); }}>
                     <button className={cn(
                        "p-4 border transition-all text-brand-navy/30",
                        c.is_blocked ? "bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-600 border-emerald-100" : "bg-brand-background hover:bg-red-50 hover:text-red-500 border-transparent hover:border-red-100"
                     )} title={c.is_blocked ? "Unblock Entity" : "Restrict Entity"}>
                        {c.is_blocked ? <UserCheck size={16} /> : <UserX size={16} />}
                     </button>
                  </form>
                  <form action={async () => { "use server"; await deleteCustomer(c.id); }}>
                     <button className="p-4 bg-brand-background hover:bg-red-50 border border-transparent hover:border-red-100 text-brand-navy/30 hover:text-red-500 transition-all">
                        <Trash2 size={16} />
                     </button>
                  </form>
               </div>
            </div>
          ))}

          {customers.length === 0 && (
            <div className="py-32 text-center bg-white border border-brand-navy/5 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-brand-navy/[0.01] animate-pulse"></div>
               <Users size={64} className="mx-auto text-brand-navy/[0.05] mb-8" />
               <h3 className="text-2xl font-serif italic text-brand-navy uppercase tracking-widest relative">Nexus Void</h3>
               <p className="text-[10px] text-brand-navy/20 uppercase tracking-[0.3em] font-bold mt-4 relative italic">No client profiles detected</p>
            </div>
          )}
      </div>
    </div>
  );
}
