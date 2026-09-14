"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface LensPackageSelectorProps {
  lensName: string;
  lensId: string;
  basePrice: number;
  availableLenses?: any[];
}

export default function LensPackageSelector({
  lensName,
  lensId,
  basePrice,
  availableLenses = [],
}: LensPackageSelectorProps) {
  const nameLower = lensName.toLowerCase();
  const isProgressive = nameLower.includes("progressive");
  const isBifocal = nameLower.includes("bifocal");

  // State for upgrade packages on Single Vision and Bifocal
  const [selectedPackage, setSelectedPackage] = useState<
    "standard" | "photochromatic" | "photochromatic_bluecut"
  >("standard");

  const base = basePrice > 0 ? basePrice : (isBifocal ? 999 : 799);

  const singleVisionPackages = [
    {
      key: "standard" as const,
      name: "Standard",
      price: base,
      includedText: "All 4 core coatings included at no extra cost",
      details: "UV Block, Blue Cut, Scratch Shield & Anti-Reflective Coating.",
    },
    {
      key: "photochromatic" as const,
      name: "+ Photochromatic",
      price: base + 400,
      includedText: "All 4 coatings + Light-responsive Photochromatic lens",
      details: "Transitions automatically from clear indoors to sunglasses in UV light.",
    },
    {
      key: "photochromatic_bluecut" as const,
      name: "+ Photochromatic + Blue Cut",
      price: base + 1000,
      includedText: "All 4 coatings + Photochromatic + Maximum Digital Blue Light filtration",
      details: "Advanced adaptive darkening combined with high-grade blue-violet ray defense.",
    },
  ];

  const bifocalPackages = [
    {
      key: "standard" as const,
      name: "Standard",
      price: base,
      includedText: "All 4 core coatings included at no extra cost",
      details: "Dual-focal segment with UV Block, Blue Cut, Scratch Shield & Anti-Reflective.",
    },
    {
      key: "photochromatic" as const,
      name: "+ Photochromatic",
      price: base + 800,
      includedText: "All 4 coatings + Light-responsive Photochromatic bifocal lens",
      details: "Smooth reading & distance focus with automatic outdoor darkening.",
    },
    {
      key: "photochromatic_bluecut" as const,
      name: "+ Photochromatic + Blue Cut",
      price: base + 1500,
      includedText: "All 4 coatings + Photochromatic + Maximum Digital Blue Light filtration",
      details: "Dual vision focal zones, digital glare defense, and sunlight transition.",
    },
  ];

  const packages = isBifocal ? bifocalPackages : singleVisionPackages;
  const currentPkg = packages.find((p) => p.key === selectedPackage) || packages[0];

  return (
    <div className="space-y-16 w-full">
      {/* SECTION 1: 4 CORE COATINGS INCLUDED (On Every Lens at No Extra Charge) */}
      <section className="bg-gradient-to-br from-[#03173D]/[0.02] via-[#004AAD]/[0.03] to-white border border-[#004AAD]/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#004AAD]/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#004AAD]">
              <ShieldCheck size={20} className="text-[#004AAD]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Optic Standard
              </span>
            </div>
            <h3 className="text-2xl font-serif italic text-brand-navy">
              All 4 Core Coatings Included
            </h3>
          </div>
          <span className="inline-flex items-center gap-2 bg-[#03173D] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-sm self-start sm:self-auto">
            <CheckCircle2 size={14} className="text-emerald-400" />
            Standard in every lens at ₹0 extra charge
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {[
            {
              title: "UV Block Protection",
              desc: "100% UV400 shield protects eyes from harmful UVA/UVB radiation.",
              badge: "UV400 Shield",
            },
            {
              title: "Blue Cut Protection",
              desc: "Filters high-energy blue-violet light from screens and digital devices.",
              badge: "Digital Defense",
            },
            {
              title: "Scratch Resistant Shield",
              desc: "Hard diamond-coat barrier reduces everyday abrasions and micro-scratches.",
              badge: "Hard Coat",
            },
            {
              title: "Anti-Reflective Coating",
              desc: "Eliminates glare, surface reflections, and halo effects for crystal clarity.",
              badge: "Zero Glare",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white border border-[#ECECEC] hover:border-[#004AAD]/40 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 h-full transition-all duration-300 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-[#004AAD]/10 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-[#004AAD] shrink-0" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-[#004AAD] bg-[#004AAD]/5 px-2 py-0.5 rounded-full">
                    {c.badge}
                  </span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] pt-1">
                  {c.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {c.desc}
                </p>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest pt-2.5 border-t border-slate-100 block">
                ✓ Included Standard (₹0)
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: UPGRADE PACKAGES (For Single Vision & Bifocal) */}
      {!isProgressive && (
        <section className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#004AAD]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#004AAD]">
                Customization
              </span>
            </div>
            <h3 className="text-3xl font-serif italic text-[#111111]">
              Upgrade Packages
            </h3>
            <p className="text-sm text-slate-600">
              Select an enhancement package with transparent flat pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {packages.map((pkg) => {
              const isSelected = selectedPackage === pkg.key;
              return (
                <div
                  key={pkg.key}
                  onClick={() => setSelectedPackage(pkg.key)}
                  className={cn(
                    "rounded-3xl border-2 p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between h-full relative group",
                    isSelected
                      ? "border-[#004AAD] bg-[#004AAD]/[0.03] shadow-lg ring-2 ring-[#004AAD]/20"
                      : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                  )}
                >
                  <div className="flex-1 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#004AAD] bg-[#004AAD]/10 px-3 py-1 rounded-full">
                        {pkg.name}
                      </span>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected
                            ? "border-[#004AAD] bg-[#004AAD]"
                            : "border-slate-300 group-hover:border-slate-400"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-3xl font-bold text-[#111111] tracking-tight">
                        ₹{pkg.price.toLocaleString()}
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Flat Package Price
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-100 flex-1">
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {pkg.includedText}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {pkg.details}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/70 space-y-2">
                    <Link
                      href={`/products?lensId=${lensId}&package=${pkg.key}`}
                      className={cn(
                        "w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all inline-flex items-center justify-center gap-2",
                        isSelected
                          ? "bg-[#03173D] text-white hover:bg-[#004AAD]"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      Shop Frames <ArrowRight size={13} />
                    </Link>
                    <Link
                      href={`/replace-lenses?lensId=${lensId}&package=${pkg.key}`}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-center text-[#004AAD] hover:underline block"
                    >
                      Replace Existing Lenses →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 3: PROGRESSIVE TIER COMPARISON (Fix 3) */}
      {isProgressive && (
        <section className="space-y-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#004AAD]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#004AAD]">
                Tier Differentiation
              </span>
            </div>
            <h3 className="text-3xl font-serif italic text-[#111111]">
              Compare Progressive Tiers
            </h3>
            <p className="text-sm text-slate-600">
              Select your optical corridor width and visual adaptation technology.
            </p>
          </div>

          {(() => {
            const silverLens = availableLenses.find((l: any) => l.tier === "silver" || l.name === "Progressive Silver");
            const goldLens = availableLenses.find((l: any) => l.tier === "gold" || l.name === "Progressive Gold");
            const platinumLens = availableLenses.find((l: any) => l.tier === "platinum" || l.name === "Progressive Platinum");

            const progressiveTiersData = [
              {
                tier: "SILVER",
                price: silverLens?.price ?? 1799,
                label: silverLens?.field_of_view ? `${silverLens.field_of_view.toUpperCase()} FIELD OF VIEW` : "NARROWER FIELD OF VIEW",
                measureLine: "├───┤",
                corridorWidth: "28%",
                corridorSvgWidth: 16,
                description:
                  silverLens?.description ||
                  "Excellent all-purpose progressive design with fast adaptation and strong performance in all visual fields.",
                ratings: silverLens?.performance_ratings || { distance: 7, intermediate: 5, reading: 6, constant: 6 },
              },
              {
                tier: "GOLD",
                price: goldLens?.price ?? 2799,
                label: goldLens?.field_of_view ? `${goldLens.field_of_view.toUpperCase()} FIELD OF VIEW` : "WIDE FIELD OF VIEW",
                measureLine: "├───────┤",
                corridorWidth: "55%",
                corridorSvgWidth: 32,
                description:
                  goldLens?.description ||
                  "Recommended for presbyopes choosing their first progressive design.",
                ratings: goldLens?.performance_ratings || { distance: 8, intermediate: 6, reading: 7, constant: 6 },
              },
              {
                tier: "PLATINUM",
                price: platinumLens?.price ?? 4299,
                label: platinumLens?.field_of_view ? `${platinumLens.field_of_view.toUpperCase()} FIELD OF VIEW` : "WIDEST FIELD OF VIEW",
                measureLine: "├───────────┤",
                corridorWidth: "82%",
                corridorSvgWidth: 48,
                description:
                  platinumLens?.description ||
                  "Designed to excel in all visual departments, this is the ultra-premium everyday lens.",
                ratings: platinumLens?.performance_ratings || { distance: 9, intermediate: 8, reading: 8, constant: 8 },
              },
            ];

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                {progressiveTiersData.map((col) => (
              <div
                key={col.tier}
                className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 hover:border-[#004AAD] transition-all duration-300 shadow-sm flex flex-col justify-between h-full space-y-6"
              >
                {/* Top content wrapper */}
                <div className="flex-1 flex flex-col space-y-6">
                  {/* Row 1: Tier Name & Price */}
                  <div className="border-b border-slate-100 pb-5 space-y-1 text-center">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block",
                        col.tier === "PLATINUM"
                          ? "bg-purple-100 text-purple-800"
                          : col.tier === "GOLD"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-800"
                      )}
                    >
                      {col.tier} TIER
                    </span>
                    <div className="text-3xl font-bold text-[#111111] pt-1">
                      ₹{col.price.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Starting Base Price
                    </p>
                  </div>

                  {/* Row 2: SVG Lens Diagram showing Corridor Width */}
                  <div className="flex flex-col items-center space-y-3 bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
                    <svg
                      viewBox="0 0 120 90"
                      className="w-32 h-24 stroke-[#03173D]"
                      fill="none"
                    >
                      {/* Outer lens silhouette */}
                      <path
                        d="M 15 25 C 15 15, 30 10, 60 10 C 90 10, 105 15, 105 25 C 105 50, 95 80, 60 80 C 25 80, 15 50, 15 25 Z"
                        strokeWidth="2.5"
                        fill="#FFFFFF"
                      />
                      {/* Upper distance zone indicator */}
                      <path
                        d="M 25 35 Q 60 40 95 35"
                        stroke="#94A3B8"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      {/* Reading Corridor Funnel */}
                      <path
                        d={`M ${60 - col.corridorSvgWidth / 2} 36 Q ${
                          60 - col.corridorSvgWidth / 2
                        } 55 ${60 - col.corridorSvgWidth / 2 - 2} 75`}
                        stroke="#004AAD"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      <path
                        d={`M ${60 + col.corridorSvgWidth / 2} 36 Q ${
                          60 + col.corridorSvgWidth / 2
                        } 55 ${60 + col.corridorSvgWidth / 2 + 2} 75`}
                        stroke="#004AAD"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      {/* Highlighted reading corridor fill */}
                      <path
                        d={`M ${60 - col.corridorSvgWidth / 2} 36 Q ${
                          60 - col.corridorSvgWidth / 2
                        } 55 ${60 - col.corridorSvgWidth / 2 - 2} 75 L ${
                          60 + col.corridorSvgWidth / 2 + 2
                        } 75 Q ${60 + col.corridorSvgWidth / 2} 55 ${
                          60 + col.corridorSvgWidth / 2
                        } 36 Z`}
                        fill="#00AEEF"
                        fillOpacity="0.18"
                      />
                    </svg>

                    <div className="text-center space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#004AAD] block">
                        {col.label}
                      </span>
                      <span className="font-mono text-xs text-slate-500 font-bold block">
                        {col.measureLine}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Description Text */}
                  <p className="text-xs text-slate-700 leading-relaxed text-center min-h-[48px]">
                    {col.description}
                  </p>

                  {/* Row 4: Performance Dots (out of 9) */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">
                      Visual Performance (Score / 9)
                    </p>

                    {[
                      { label: "Distance", score: col.ratings.distance },
                      { label: "Intermediate", score: col.ratings.intermediate },
                      { label: "Reading", score: col.ratings.reading },
                      { label: "Constant Adapt.", score: col.ratings.constant },
                    ].map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-[11px] font-medium text-slate-600">
                          {r.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 9 }).map((_, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                "w-2 h-2 rounded-full inline-block transition-all",
                                idx < r.score
                                  ? "bg-[#004AAD]"
                                  : "bg-slate-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 5: Actions pinned to bottom */}
                <div className="pt-6 mt-6 border-t border-slate-100 space-y-2.5">
                  <Link
                    href={`/products?lensTier=${col.tier.toLowerCase()}`}
                    className="w-full py-3 px-4 rounded-xl bg-[#03173D] text-white font-semibold text-xs hover:bg-[#004AAD] transition-all inline-flex items-center justify-center gap-2 shadow-sm"
                  >
                    Shop Frames <ArrowRight size={13} />
                  </Link>
                  <Link
                    href={`/replace-lenses?lensTier=${col.tier.toLowerCase()}`}
                    className="w-full py-2 px-4 rounded-xl text-xs font-medium text-center text-[#004AAD] hover:underline block"
                  >
                    Replace Lenses with {col.tier} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}
