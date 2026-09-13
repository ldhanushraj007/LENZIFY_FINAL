"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Layers, Search, CheckCircle2, XCircle, Save, X } from "lucide-react";
import { deleteLens, toggleLensStatus, updateLensPrice } from "./actions";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminLensesPage() {
  const [lenses, setLenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");
  const [savingPrice, setSavingPrice] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchLenses();
  }, []);

  async function fetchLenses() {
    setLoading(true);
    const { data } = await supabase.from("lenses").select("*").order("name");
    if (data) setLenses(data);
    setLoading(false);
  }

  function startEditingPrice(lens: any) {
    setEditingPriceId(lens.id);
    setPriceInput(String(lens.price));
  }

  function cancelEditingPrice() {
    setEditingPriceId(null);
    setPriceInput("");
  }

  async function savePrice(id: string) {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    setSavingPrice(true);
    const result = await updateLensPrice(id, price);
    setSavingPrice(false);
    if (result?.error) {
      toast.error("Failed to update price: " + result.error);
    } else {
      toast.success("Price updated.");
      setLenses(prev => prev.map(l => l.id === id ? { ...l, price } : l));
      setEditingPriceId(null);
    }
  }

  const filteredLenses = lenses.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-brand-navy/5 pb-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary italic mb-2">Prescription Optics</p>
          <h1 className="text-4xl font-serif italic text-brand-navy tracking-tight uppercase">Prescription <span className="text-secondary">Lenses (for Frames)</span></h1>
          <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-brand-text-muted mt-3">{lenses.length} prescription lenses registered</p>
        </div>
        <Link
          href="/admin/lenses/new"
          className="bg-brand-navy text-white px-10 py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-secondary hover:text-brand-navy transition-all shadow-xl group border border-transparent active:scale-95"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
          Add New Lens
        </Link>
      </header>

      {/* Search */}
      <div className="bg-white border border-brand-navy/5 p-6 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-sm group">
          <Search size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-navy/30 group-focus-within:text-secondary transition-colors" />
          <input
            type="text"
            placeholder="Search lenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-background border border-brand-navy/5 pl-12 pr-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] outline-none focus:border-secondary transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLenses.map((lens) => (
          <div key={lens.id} className="group bg-white border border-brand-navy/5 overflow-hidden transition-all duration-300 hover:border-secondary hover:-translate-y-0.5 shadow-sm p-7 space-y-5 flex flex-col">

            {/* Header row */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-serif italic text-brand-navy tracking-tight leading-tight">{lens.name}</h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {lens.tier && (
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      lens.tier === "platinum"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : lens.tier === "gold"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}>
                      {lens.tier}
                    </span>
                  )}
                  {lens.field_of_view && (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {lens.field_of_view} FoV
                    </span>
                  )}
                  {lens.category && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">
                      {lens.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Link
                  href={`/admin/lenses/${lens.id}/edit`}
                  className="p-2.5 bg-brand-background hover:bg-white border border-brand-navy/5 text-brand-navy/30 hover:text-secondary transition-all"
                >
                  <Edit size={14} />
                </Link>
                <button
                  onClick={async () => {
                    if (confirm("Delete this lens?")) {
                      await deleteLens(lens.id);
                      fetchLenses();
                    }
                  }}
                  className="p-2.5 bg-brand-background hover:bg-red-50 border border-brand-navy/5 text-brand-navy/30 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Inline price edit */}
            <div className="bg-brand-background border border-brand-navy/5 p-4 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-navy/40">Price (₹)</p>
              {editingPriceId === lens.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") savePrice(lens.id);
                      if (e.key === "Escape") cancelEditingPrice();
                    }}
                    className="flex-1 bg-white border border-secondary px-3 py-2 text-sm font-bold text-brand-navy outline-none"
                    autoFocus
                    min={0}
                    step={1}
                  />
                  <button
                    onClick={() => savePrice(lens.id)}
                    disabled={savingPrice}
                    className="p-2 bg-secondary text-white hover:bg-brand-navy transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={cancelEditingPrice}
                    className="p-2 bg-brand-background border border-brand-navy/10 text-brand-navy/40 hover:text-red-500 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditingPrice(lens)}
                  className="w-full text-left group/price flex items-center justify-between"
                >
                  <span className="text-xl font-bold text-brand-navy">₹{Number(lens.price).toLocaleString()}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-secondary opacity-0 group-hover/price:opacity-100 transition-opacity">
                    Click to edit
                  </span>
                </button>
              )}
            </div>

            {/* Description */}
            {lens.description && (
              <p className="text-xs text-brand-text-muted leading-relaxed flex-grow">{lens.description}</p>
            )}

            {/* Feature pills */}
            {(lens.features || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(lens.features || []).slice(0, 3).map((f: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-brand-background text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">
                    {f}
                  </span>
                ))}
                {(lens.features || []).length > 3 && (
                  <span className="px-2 py-1 bg-brand-background text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">
                    +{lens.features.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Status toggle */}
            <div className="pt-4 border-t border-brand-navy/5">
              <button
                onClick={async () => {
                  await toggleLensStatus(lens.id, lens.is_active);
                  fetchLenses();
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 border transition-all text-[9px] font-bold uppercase tracking-[0.2em]",
                  lens.is_active
                    ? "border-secondary/20 bg-secondary/5 text-secondary hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                    : "border-brand-navy/10 text-brand-navy/30 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                )}
              >
                {lens.is_active ? <><CheckCircle2 size={12} /> Active</> : <><XCircle size={12} /> Inactive</>}
              </button>
            </div>
          </div>
        ))}

        {filteredLenses.length === 0 && !loading && (
          <div className="col-span-full py-32 bg-white border border-brand-navy/5 text-center shadow-sm">
            <Layers size={48} className="mx-auto text-brand-navy/[0.05] mb-6" />
            <h3 className="text-2xl font-serif italic text-brand-navy tracking-widest">No lenses found</h3>
            <p className="text-[10px] text-brand-navy/30 uppercase tracking-[0.3em] font-bold mt-3">
              {searchQuery ? "Try a different search term" : "Add your first lens to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
