"use client";

import { useState } from "react";
import { Plus, Trash2, Sliders, RotateCcw } from "lucide-react";

export interface PowerRange {
  from: number;
  to: number;
  extra_price: number;
}

interface PowerRangeEditorProps {
  initialRanges?: PowerRange[];
}

export default function PowerRangeEditor({ initialRanges = [] }: PowerRangeEditorProps) {
  const [ranges, setRanges] = useState<PowerRange[]>(initialRanges || []);

  const addRange = () => {
    setRanges([
      ...ranges,
      { from: -6.0, to: 0.0, extra_price: 0 }
    ]);
  };

  const removeRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  const updateRange = (index: number, field: keyof PowerRange, value: number) => {
    const updated = [...ranges];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setRanges(updated);
  };

  const loadPreset = () => {
    setRanges([
      { from: -6.00, to: -3.00, extra_price: 0 },
      { from: -3.01, to: 0.00, extra_price: 200 },
      { from: 0.01, to: 4.00, extra_price: 350 },
      { from: -10.00, to: -6.01, extra_price: 600 }
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-secondary" />
          <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">
            Power Ranges & Extra Pricing (SPH)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPreset}
            className="text-[9px] font-bold uppercase tracking-wider text-brand-navy/60 hover:text-brand-navy flex items-center gap-1 transition-colors px-2 py-1 bg-brand-background border border-brand-navy/10 rounded"
          >
            <RotateCcw size={10} />
            Load Sample Presets
          </button>
          <button
            type="button"
            onClick={addRange}
            className="text-[9px] font-bold uppercase tracking-wider text-secondary hover:text-brand-navy flex items-center gap-1 transition-colors px-2.5 py-1 bg-secondary/10 hover:bg-secondary/20 rounded border border-secondary/20"
          >
            <Plus size={12} />
            Add Range
          </button>
        </div>
      </div>

      {/* Hidden input to pass data to Server Action */}
      <input type="hidden" name="power_ranges" value={JSON.stringify(ranges)} />

      {ranges.length === 0 ? (
        <div className="p-6 bg-brand-background/60 border border-dashed border-brand-navy/10 rounded-lg text-center">
          <p className="text-[11px] text-brand-text-muted">
            No specific power ranges configured. Standard lens base price applies to all powers.
          </p>
          <button
            type="button"
            onClick={addRange}
            className="mt-2 text-[10px] font-bold uppercase tracking-widest text-secondary hover:underline"
          >
            + Add First Power Range
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-brand-navy/10 rounded-lg bg-brand-background/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-navy/10 bg-brand-background">
                <th className="p-3 text-[9px] font-bold uppercase tracking-widest text-brand-navy/50">Power From (SPH)</th>
                <th className="p-3 text-[9px] font-bold uppercase tracking-widest text-brand-navy/50">Power To (SPH)</th>
                <th className="p-3 text-[9px] font-bold uppercase tracking-widest text-brand-navy/50">Extra Price (₹)</th>
                <th className="p-3 text-[9px] font-bold uppercase tracking-widest text-brand-navy/50 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy/5">
              {ranges.map((range, index) => (
                <tr key={index} className="hover:bg-white/60 transition-colors">
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.25"
                      value={range.from}
                      onChange={(e) => updateRange(index, "from", parseFloat(e.target.value) || 0)}
                      className="w-28 bg-white border border-brand-navy/10 px-3 py-1.5 text-xs font-semibold outline-none focus:border-secondary rounded"
                      placeholder="-6.00"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.25"
                      value={range.to}
                      onChange={(e) => updateRange(index, "to", parseFloat(e.target.value) || 0)}
                      className="w-28 bg-white border border-brand-navy/10 px-3 py-1.5 text-xs font-semibold outline-none focus:border-secondary rounded"
                      placeholder="-3.00"
                    />
                  </td>
                  <td className="p-3">
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-[11px] font-bold text-brand-navy/40">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={range.extra_price}
                        onChange={(e) => updateRange(index, "extra_price", Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-32 bg-white border border-brand-navy/10 pl-6 pr-3 py-1.5 text-xs font-bold text-brand-navy outline-none focus:border-secondary rounded"
                        placeholder="0"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeRange(index)}
                      className="p-1.5 text-brand-navy/40 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Remove range"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
