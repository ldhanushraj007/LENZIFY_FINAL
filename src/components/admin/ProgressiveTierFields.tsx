"use client";

import { useState } from "react";
import { Sliders, Eye, Sparkles } from "lucide-react";

interface PerformanceRatings {
  distance: number;
  intermediate: number;
  reading: number;
  constant: number;
}

interface ProgressiveTierFieldsProps {
  initialTier?: string | null;
  initialFieldOfView?: string | null;
  initialRatings?: PerformanceRatings | null;
  defaultOpen?: boolean;
}

export default function ProgressiveTierFields({
  initialTier,
  initialFieldOfView,
  initialRatings,
  defaultOpen = false,
}: ProgressiveTierFieldsProps) {
  const [isProgressive, setIsProgressive] = useState<boolean>(
    defaultOpen || !!initialTier || false
  );
  const [tier, setTier] = useState<string>(initialTier || "silver");
  const [fieldOfView, setFieldOfView] = useState<string>(
    initialFieldOfView || "narrow"
  );
  const [ratings, setRatings] = useState<PerformanceRatings>(
    initialRatings || {
      distance: 7,
      intermediate: 5,
      reading: 6,
      constant: 6,
    }
  );

  const handleRatingChange = (key: keyof PerformanceRatings, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [key]: Math.min(9, Math.max(1, value)),
    }));
  };

  return (
    <div className="space-y-6 pt-4 border-t border-brand-navy/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-secondary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy">
            Progressive Lens Tier Configuration
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isProgressive}
            onChange={(e) => setIsProgressive(e.target.checked)}
            className="w-4 h-4 accent-secondary"
          />
          <span className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">
            Enable Progressive Tier Options
          </span>
        </label>
      </div>

      {isProgressive && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-6 animate-fadeIn">
          {/* Hidden inputs to pass data via standard FormData */}
          <input type="hidden" name="tier" value={tier} />
          <input type="hidden" name="field_of_view" value={fieldOfView} />
          <input
            type="hidden"
            name="performance_ratings"
            value={JSON.stringify(ratings)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tier Selector */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic flex items-center gap-1.5">
                <Sparkles size={12} className="text-secondary" />
                Lens Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-secondary transition-all"
              >
                <option value="silver">Silver Tier (Fast adaptation, value design)</option>
                <option value="gold">Gold Tier (First-time presbyopes, wider corridor)</option>
                <option value="platinum">Platinum Tier (Ultra-premium, widest vision fields)</option>
              </select>
            </div>

            {/* Field of View Selector */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic flex items-center gap-1.5">
                <Eye size={12} className="text-secondary" />
                Field of View
              </label>
              <select
                value={fieldOfView}
                onChange={(e) => setFieldOfView(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-secondary transition-all"
              >
                <option value="narrow">Narrow Corridor</option>
                <option value="wide">Wide Corridor</option>
                <option value="widest">Widest Panoramic View</option>
              </select>
            </div>
          </div>

          {/* Performance Ratings (1 - 9) */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-secondary" />
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-700">
                Visual Performance Ratings (Scale 1 to 9)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  { key: "distance", label: "Distance Vision" },
                  { key: "intermediate", label: "Intermediate (Computer/Screen)" },
                  { key: "reading", label: "Reading & Near Focus" },
                  { key: "constant", label: "Adaptation / Ease of Use" },
                ] as const
              ).map(({ key, label }) => (
                <div
                  key={key}
                  className="bg-white p-3 rounded border border-slate-200 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-700">
                      {label}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary font-bold text-xs rounded">
                      {ratings[key]} / 9
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="9"
                    step="1"
                    value={ratings[key]}
                    onChange={(e) =>
                      handleRatingChange(key, parseInt(e.target.value))
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
