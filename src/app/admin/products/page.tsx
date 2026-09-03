import { createClient } from "@/lib/supabase/server";
import { Search, Plus, Filter, MoreVertical, Edit, Trash2, Package, Copy, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteProduct, duplicateProduct, toggleProductStatus } from "./actions";
import { cn } from "@/lib/utils";

import CSVManager from "./CSVManager";
import SuccessToast from "./SuccessToast";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q || "";
  const cat = params?.cat || "all";

  const supabase = await createClient();

  // Fetch Categories for filter
  const { data: categories } = await supabase.from("categories").select("id, name, slug");

  // Build Query
  let dbQuery = supabase
    .from("products")
    .select("*, categories(name), product_images(image_url, is_primary)")
    .order("created_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }
  if (cat !== "all") {
    dbQuery = dbQuery.eq("category_id", cat);
  }

  const { data: products, error } = await dbQuery;

  return (
    <div className="space-y-12">
      <SuccessToast />
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
           <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary italic mb-2">Inventory Management</p>
          <h1 className="text-4xl font-serif italic text-brand-navy tracking-tight uppercase">Catalog <span className="text-secondary">Matrix</span></h1>
          <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-brand-text-muted mt-3 italic">Active Models: {products?.length || 0}</p>
        </div>
        <Link 
          href="/admin/products/new"
          className="bg-brand-navy text-white px-10 py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-secondary transition-all shadow-xl group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
          Add Product
        </Link>
      </header>

      {/* CSV Data Management */}
      <CSVManager />

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white border border-brand-navy/5 p-8 shadow-sm">
        <form className="flex flex-col lg:flex-row gap-6 w-full lg:w-[700px] group">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-navy/30 group-focus-within:text-secondary transition-colors" />
            <input 
              name="q"
              defaultValue={query}
              placeholder="ACCESS SEARCH PARAMETERS..."
              className="w-full bg-brand-background border border-brand-navy/5 pl-16 pr-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] outline-none focus:border-secondary transition-all"
              suppressHydrationWarning
            />
          </div>
          <div className="relative w-full lg:w-[200px]">
            <Filter size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-navy/30" />
            <select 
              name="cat"
              defaultValue={cat}
              className="w-full appearance-none bg-brand-background border border-brand-navy/10 pl-14 pr-16 py-5 text-[10px] font-bold uppercase tracking-[0.2em] outline-none focus:border-secondary cursor-pointer"
              suppressHydrationWarning
            >
              <option value="all">Global Sectors</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-brand-navy text-white px-8 py-5 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all shrink-0" suppressHydrationWarning>Apply Filter</button>
        </form>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 gap-6">
          {products?.map((p, i) => (
            <div
              key={p.id}
              className="bg-white border border-brand-navy/5 p-6 flex flex-col lg:flex-row items-center gap-10 group hover:border-secondary transition-all duration-700 hover:-translate-y-1 shadow-sm"
            >
              <div className="relative w-32 h-32 bg-brand-background border border-brand-navy/5 overflow-hidden shrink-0">
                <Image src={p.primary_image || p.image || (p.product_images?.[0]?.image_url) || "/placeholder.jpg"} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
              </div>

              <div className="flex-1 flex flex-col lg:flex-row items-center justify-between w-full gap-10">
                <div className="text-center lg:text-left space-y-1">
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <p className="text-[9px] text-secondary uppercase tracking-[0.3em] font-bold">{p.brand}</p>
                    <span className="w-1 h-1 bg-brand-navy/10 rounded-full" />
                    <p className="text-[9px] text-brand-navy/40 uppercase tracking-[0.3em] font-bold">{p.categories?.name}</p>
                  </div>
                  <h3 className="text-xl font-serif italic text-brand-navy tracking-tight">{p.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-[9px] text-brand-navy/20 font-bold uppercase tracking-[0.3em]">SKU: {p.sku || "N/A"}</p>
                    <form action={async () => { "use server"; await toggleProductStatus(p.id, p.is_enabled); }}>
                      <button className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm cursor-pointer hover:opacity-80 transition-opacity",
                        p.is_enabled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      )}>
                        {p.is_enabled ? "Active (Click to Archive)" : "Archived (Click to Activate)"}
                      </button>
                    </form>
                    {p.images_360?.length > 0 && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-brand-navy/5 text-brand-navy px-2 py-1 rounded-sm border border-brand-navy/5">
                        Interactive 360° Enabled
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-16">
                   <div className="text-center lg:text-right">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-brand-navy/20 mb-2 italic">Integrity</p>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-2 border transition-all italic",
                        p.stock > 0 ? "border-secondary/20 bg-secondary/5 text-secondary" : "border-red-500/20 bg-red-50 text-red-500"
                      )}>
                        {p.stock > 0 ? `In Stock (${p.stock})` : "Depleted"}
                      </span>
                   </div>
                   <div className="text-center lg:text-right">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-brand-navy/20 mb-2 italic">Value</p>
                      <p className="text-xl font-serif italic text-brand-navy font-bold">₹{p.price.toLocaleString()}</p>
                   </div>
                   <div className="flex flex-col gap-2 border-l border-brand-navy/5 pl-10">
                      <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-brand-navy/60 hover:text-secondary transition-all bg-brand-background hover:bg-white border border-brand-navy/5">
                         <Edit size={14} /> Edit Product
                      </Link>
                      <form action={async () => { "use server"; await duplicateProduct(p.id); }}>
                         <button className="w-full flex items-center gap-2 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-brand-navy/60 hover:text-secondary transition-all bg-brand-background hover:bg-white border border-brand-navy/5" title="Duplicate Product">
                            <Copy size={14} /> Duplicate Product
                         </button>
                      </form>
                      <form action={async () => { "use server"; await deleteProduct(p.id); }}>
                         <button className="w-full flex items-center gap-2 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-brand-navy/60 hover:text-red-500 transition-all bg-brand-background hover:bg-red-50 border border-brand-navy/5">
                            <Trash2 size={14} /> Delete Product
                         </button>
                      </form>
                   </div>
                </div>
              </div>
            </div>
          ))}
        
        {(!products || products.length === 0) && (
          <div className="py-32 text-center bg-white border border-brand-navy/5 shadow-sm relative overflow-hidden">
             <div className="absolute inset-0 bg-brand-navy/[0.01] animate-pulse"></div>
             <Package size={64} className="mx-auto text-brand-navy/[0.05] mb-8" />
             <h3 className="text-2xl font-serif italic text-brand-navy uppercase tracking-widest relative">Nexus Empty</h3>
             <p className="text-[10px] text-brand-navy/20 uppercase tracking-[0.3em] font-bold mt-4 relative italic">No models registered in the current matrix</p>
          </div>
        )}
      </div>
    </div>
  );
}
