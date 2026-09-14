"use client";

import { motion } from "framer-motion";
import { Layers, ShieldCheck, Sparkles, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";

interface LensCardProps {
  lens: {
    id: string;
    name: string;
    description: string;
    price: number;
    features?: string[];
    category?: string;
    sub_category?: string;
  };
}

export default function LensCard({ lens }: LensCardProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group bg-white border border-[#ECECEC] rounded-3xl p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] transition-all duration-300 relative overflow-hidden"
    >
      {/* Background accent */}
      <div className="absolute -right-6 -top-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
        <Layers size={120} className="text-[#03173D]" />
      </div>

      <div className="space-y-5 relative z-10">
        {/* Header row */}
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 bg-[#F0F4FF] flex items-center justify-center rounded-2xl group-hover:bg-[#004AAD] transition-colors duration-300">
            <Sparkles size={18} className="text-[#004AAD] group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#004AAD] bg-[#EEF3FF] px-3 py-1 rounded-full">
            {lens.sub_category || lens.category || "Precision Lens"}
          </span>
        </div>

        {/* Name & description */}
        <div className="space-y-2">
          <h3 className="text-xl font-[var(--font-hero)] italic text-[#111111] leading-tight group-hover:text-[#03173D] transition-colors">
            {lens.name}
          </h3>
          <p className="text-sm text-[#666666] leading-relaxed line-clamp-2">
            {lens.description}
          </p>
        </div>

        {/* Feature pills */}
        {lens.features && lens.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lens.features.slice(0, 3).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F9FC] border border-[#E8EAF2] rounded-full">
                <ShieldCheck size={10} className="text-[#004AAD]" />
                <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wide">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-[#E8EAF2] space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#999999] font-medium">Starting from</span>
          <p className="text-2xl font-bold text-[#111111]">
            <span className="text-sm font-medium text-[#666666] mr-1">₹</span>
            {lens.price.toLocaleString()}
          </p>
        </div>

        <Link
          href={`/lenses/${lens.id}`}
          className="w-full bg-[#03173D] text-white text-xs font-semibold py-3 rounded-full hover:bg-[#004AAD] transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          View Options & Pricing <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}
