import { createLens } from "../actions";
import { ArrowLeft, Save, Cpu } from "lucide-react";
import Link from "next/link";
import PowerRangeEditor from "@/components/admin/PowerRangeEditor";
import ProgressiveTierFields from "@/components/admin/ProgressiveTierFields";

export default async function NewLensPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 border-b border-brand-navy/5 pb-10">
        <div className="space-y-2">
           <Link href="/admin/lenses" className="text-[9px] font-bold uppercase tracking-[0.4em] text-secondary flex items-center gap-2 hover:translate-x-1 transition-transform mb-4">
              <ArrowLeft size={10} />
              Return to Lens Matrix
           </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary italic">Optic Module Registration</p>
          <h1 className="text-4xl md:text-5xl font-serif italic text-brand-navy tracking-tight">New <span className="text-secondary">Lens</span></h1>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-100 p-8 flex items-center gap-6 shadow-xl">
           <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Cpu size={24} />
           </div>
           <div className="flex-1">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-900">Registration Failure</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-600 mt-1 italic leading-relaxed">{error}</p>
           </div>
        </div>
      )}

      <form action={async (formData) => { "use server"; await createLens(formData); }} className="max-w-3xl space-y-12">
        <section className="bg-white border border-brand-navy/5 p-8 lg:p-12 space-y-10 shadow-sm">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Lens Name</label>
                 <input 
                   name="name" 
                   required 
                   placeholder="e.g. Single Vision Pro" 
                   className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all" 
                 />
              </div>

              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Category</label>
                 <div className="relative">
                   <select 
                     name="category" 
                     required 
                     className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all appearance-none"
                   >
                      <option value="type">Primary Vision Type (Single, Bi, Pro)</option>
                      <option value="feature">Add-on Feature (Blue Cut, Photochromic)</option>
                      <option value="coating">Optic Coating (Anti-Glare, UV)</option>
                      <option value="material">Lens Material (Polycarbonate, CR-39)</option>
                      <option value="thickness">Refractive Index (1.5, 1.6, 1.74)</option>
                      <option value="tint">Color / Tint (Grey, Brown)</option>
                   </select>
                   <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-brand-navy/20">
                      <Save size={12} className="rotate-90" />
                   </div>
                 </div>
              </div>

              <div className="space-y-2 group md:col-span-2">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Price (₹)</label>
                 <input 
                   name="price" 
                   type="number" 
                   step="0.01" 
                   required 
                   placeholder="500" 
                   className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-secondary transition-all" 
                 />
              </div>
           </div>

           <div className="space-y-2 group">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Description</label>
              <textarea 
                name="description" 
                rows={3} 
                placeholder="Describe this lens type..." 
                className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all resize-none" 
              />
           </div>

           <div className="space-y-2 group">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Features (JSON Array)</label>
              <textarea 
                name="features" 
                rows={3} 
                defaultValue='["Anti-glare coating", "Scratch resistant"]'
                className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[10px] font-mono tracking-wider outline-none focus:border-secondary transition-all resize-none" 
              />
           </div>

           {/* Power Range Setup */}
           <div className="pt-4 border-t border-brand-navy/5">
              <PowerRangeEditor initialRanges={[]} />
           </div>

           {/* Progressive Tier & Performance Ratings Setup */}
           <ProgressiveTierFields />

           <label className="flex items-center justify-between p-4 border border-secondary/20 bg-secondary/5 hover:bg-secondary/10 transition-all cursor-pointer group/opt">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Active on Launch</span>
                <input type="checkbox" name="is_active" value="true" className="w-4 h-4 accent-secondary" defaultChecked />
           </label>
        </section>

        <button type="submit" className="w-full bg-brand-navy text-white text-[10px] font-bold uppercase tracking-[0.4em] py-6 shadow-xl hover:bg-secondary hover:text-brand-navy transition-all duration-700 flex items-center justify-center gap-4 active:scale-95">
           <Save size={18} />
           REGISTER LENS MODULE
        </button>
      </form>
    </div>
  );
}
