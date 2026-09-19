"use client";

import { useState, useEffect } from "react";
import { FileText, Search, CheckCircle2, XCircle, Download, Trash2, Hash } from "lucide-react";
import { updatePrescriptionStatus, deletePrescription, getAdminPrescriptions } from "./actions";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    setLoading(true);
    const data = await getAdminPrescriptions();
    if (data) setPrescriptions(data);
    setLoading(false);
  }

  const filtered = prescriptions.filter(p =>
    p.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.users?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-brand-navy/5 pb-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary italic mb-2">Customer Prescriptions</p>
          <h1 className="text-4xl font-serif italic text-brand-navy tracking-tight uppercase">Prescription <span className="text-secondary">Records</span></h1>
          <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-brand-navy/40 mt-3 italic">
            Pending Review: {prescriptions.filter(p => p.status === 'pending').length}
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="bg-white border border-brand-navy/5 p-8 shadow-sm">
        <div className="relative w-full md:w-[450px] group">
          <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-navy/30 group-focus-within:text-secondary transition-colors" />
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-background border border-brand-navy/5 pl-16 pr-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] outline-none focus:border-secondary transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filtered.map((p) => (
          <div key={p.id} className="group bg-white border border-brand-navy/5 p-8 flex flex-col lg:flex-row gap-10 transition-all duration-700 hover:border-secondary shadow-sm">
            {/* Prescription Values */}
            <div className="lg:w-1/3 space-y-6">
              <div className="flex items-center justify-between border-b border-brand-navy/5 pb-4">
                <div className="flex items-center gap-3">
                  <Hash size={14} className="text-secondary" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy">Prescription</h4>
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 border transition-all italic",
                  p.status === 'approved' ? "border-emerald-500 text-emerald-500 bg-emerald-50" :
                  p.status === 'rejected' ? "border-red-500 text-red-500 bg-red-50" :
                  "border-brand-navy/20 text-brand-navy/40 bg-brand-background"
                )}>
                  {p.status === 'approved' ? "Approved" : p.status === 'rejected' ? "Rejected" : "Pending Review"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Right Eye */}
                <div className="bg-brand-background p-5 border border-brand-navy/5 space-y-4">
                  <p className="text-[8px] font-black uppercase tracking-widest text-brand-navy/30 italic">Right Eye (OD)</p>
                  <div className="grid grid-cols-2 gap-y-3">
                    {['sph', 'cyl', 'axis', 'add'].map(k => (
                      <div key={k} className="space-y-1">
                        <p className="text-[7px] text-brand-navy/20 font-bold uppercase">{k}</p>
                        <p className="text-xs font-serif font-black text-brand-navy">{p.right_eye?.[k] || '—'}{k === 'axis' && p.right_eye?.[k] ? '°' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Left Eye */}
                <div className="bg-brand-background p-5 border border-brand-navy/5 space-y-4">
                  <p className="text-[8px] font-black uppercase tracking-widest text-brand-navy/30 italic">Left Eye (OS)</p>
                  <div className="grid grid-cols-2 gap-y-3">
                    {['sph', 'cyl', 'axis', 'add'].map(k => (
                      <div key={k} className="space-y-1">
                        <p className="text-[7px] text-brand-navy/20 font-bold uppercase">{k}</p>
                        <p className="text-xs font-serif font-black text-brand-navy">{p.left_eye?.[k] || '—'}{k === 'axis' && p.left_eye?.[k] ? '°' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-secondary/10 border border-secondary/20 p-4 flex justify-between items-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-secondary">Pupillary Distance (PD)</p>
                <p className="text-sm font-serif font-black text-secondary">{p.pd || 'N/A'} mm</p>
              </div>
            </div>

            {/* Patient Info & Actions */}
            <div className="flex-1 flex flex-col justify-between py-2">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-brand-navy text-white flex items-center justify-center text-lg font-black italic rounded-full ring-4 ring-brand-navy/5">
                    {p.users?.name?.[0] || 'C'}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-serif italic text-brand-navy font-black tracking-tight">{p.users?.name || 'Unknown Customer'}</h3>
                    <p className="text-[9px] text-brand-navy/30 uppercase font-black tracking-widest">{p.users?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {p.file_url && (
                    <Link
                      href={p.file_url}
                      target="_blank"
                      className="flex items-center gap-3 px-6 py-4 bg-brand-background border border-brand-navy/10 text-[9px] font-black uppercase tracking-widest text-brand-navy hover:bg-white transition-all shadow-sm"
                    >
                      <Download size={14} className="text-secondary" />
                      View File
                    </Link>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => { await updatePrescriptionStatus(p.id, 'approved'); fetchPrescriptions(); }}
                      className={cn(
                        "px-8 py-4 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-xl",
                        p.status === 'approved' ? "bg-emerald-600 text-white" : "bg-brand-navy text-white hover:bg-secondary"
                      )}
                    >
                      <CheckCircle2 size={14} />
                      Approve
                    </button>
                    <button
                      onClick={async () => { await updatePrescriptionStatus(p.id, 'rejected'); fetchPrescriptions(); }}
                      className={cn(
                        "px-8 py-4 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-xl",
                        p.status === 'rejected' ? "bg-red-600 text-white" : "bg-brand-background text-brand-navy/40 hover:bg-red-50"
                      )}
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 lg:mt-0">
                <div className="space-y-1">
                  <p className="text-[8px] text-brand-navy/30 uppercase font-black tracking-widest italic">Submitted</p>
                  <p className="text-[10px] font-bold text-brand-navy uppercase tracking-widest">{new Date(p.created_at).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] text-brand-navy/30 uppercase font-black tracking-widest italic">Linked Order</p>
                  <p className="text-[10px] font-bold text-brand-navy uppercase tracking-widest">
                    {p.order_id ? `ORD-${p.order_id.slice(0, 8)}` : 'Not Linked'}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 self-end">
                  <button
                    onClick={async () => { if (confirm("Delete this prescription?")) { await deletePrescription(p.id); fetchPrescriptions(); } }}
                    className="p-4 bg-brand-background text-brand-navy/30 hover:text-red-500 transition-all border border-brand-navy/5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="py-40 bg-white border border-brand-navy/5 text-center shadow-sm">
            <FileText size={64} className="mx-auto text-brand-navy/[0.05] mb-8" />
            <h3 className="text-2xl font-serif italic text-brand-navy tracking-widest uppercase">No Prescriptions Found</h3>
            <p className="text-[10px] text-brand-navy/20 uppercase tracking-[0.4em] font-bold mt-4">
              {searchQuery ? "No results match your search." : "No prescriptions submitted yet."}
            </p>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center">
            <p className="text-sm text-brand-navy/40">Loading prescriptions...</p>
          </div>
        )}
      </div>
    </div>
  );
}
