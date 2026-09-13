import { updateLens, deleteLens } from "../../actions";
import { ArrowLeft, Save, Cpu, Trash2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PowerRangeEditor from "@/components/admin/PowerRangeEditor";
import ProgressiveTierFields from "@/components/admin/ProgressiveTierFields";

export default async function EditLensPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: lens } = await supabase.from("lenses").select("*").eq("id", id).single();
  if (!lens) notFound();

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 border-b border-brand-navy/5 pb-10">
        <div className="space-y-2">
           <Link href="/admin/lenses" className="text-[9px] font-bold uppercase tracking-[0.4em] text-secondary flex items-center gap-2 hover:translate-x-1 transition-transform mb-4">
              <ArrowLeft size={10} />
              Back to Lenses
           </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary italic">Catalog</p>
          <h1 className="text-4xl md:text-5xl font-serif italic text-brand-navy tracking-tight">Edit <span className="text-secondary">{lens.name}</span></h1>
        </div>
        <form action={async () => {
          "use server";
          await deleteLens(id);
          redirect("/admin/lenses");
        }}>
          <button
            type="submit"
            className="px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all"
          >
            <Trash2 size={14} />
            Deactivate / Delete Lens
          </button>
        </form>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-100 p-8 flex items-center gap-6 shadow-xl">
           <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0"><Cpu size={24} /></div>
           <div className="flex-1">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-900">Update Failure</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-600 mt-1 italic">{error}</p>
           </div>
        </div>
      )}

      <form action={async (formData) => { "use server"; await updateLens(id, formData); }} className="max-w-3xl space-y-12">
        <section className="bg-white border border-brand-navy/5 p-8 lg:p-12 space-y-10 shadow-sm">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Lens Name</label>
                 <input name="name" required defaultValue={lens.name} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all" />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Price (₹)</label>
                 <input name="price" type="number" step="0.01" required defaultValue={lens.price} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-secondary transition-all" />
              </div>
           </div>

           <div className="space-y-2 group">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Category</label>
              <select name="category" defaultValue={lens.category || "type"} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all">
                 <option value="type">Primary Vision Type (Single, Bi, Pro)</option>
                 <option value="feature">Add-on Feature (Blue Cut, Photochromic)</option>
                 <option value="coating">Optic Coating (Anti-Glare, UV)</option>
                 <option value="material">Lens Material (Polycarbonate, CR-39)</option>
                 <option value="thickness">Refractive Index (1.5, 1.6, 1.74)</option>
                 <option value="tint">Color / Tint (Grey, Brown)</option>
              </select>
           </div>

           <div className="space-y-2 group">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Description</label>
              <textarea name="description" rows={3} defaultValue={lens.description || ""} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all resize-none" />
           </div>

           <div className="space-y-2 group">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Features (JSON Array)</label>
              <textarea name="features" rows={3} defaultValue={JSON.stringify(lens.features || [], null, 2)} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[10px] font-mono tracking-wider outline-none focus:border-secondary transition-all resize-none" />
           </div>

           {/* Power Range Setup */}
           <div className="pt-4 border-t border-brand-navy/5">
              <PowerRangeEditor initialRanges={lens.power_ranges || []} />
           </div>

           {/* Progressive Tier & Performance Ratings Setup */}
           <ProgressiveTierFields
              initialTier={lens.tier}
              initialFieldOfView={lens.field_of_view}
              initialRatings={lens.performance_ratings}
              defaultOpen={lens.name?.toLowerCase().includes("progressive") || !!lens.tier}
           />

           <label className="flex items-center justify-between p-4 border border-secondary/20 bg-secondary/5 hover:bg-secondary/10 transition-all cursor-pointer group/opt">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Active</span>
                <input type="checkbox" name="is_active" value="true" className="w-4 h-4 accent-secondary" defaultChecked={lens.is_active} />
           </label>
        </section>

        <button type="submit" className="w-full bg-brand-navy text-white text-[10px] font-bold uppercase tracking-[0.4em] py-6 shadow-xl hover:bg-secondary hover:text-brand-navy transition-all duration-700 flex items-center justify-center gap-4 active:scale-95">
           <Save size={18} />
           Save Changes
        </button>
      </form>
    </div>
  );
}
