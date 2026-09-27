"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Check, ShoppingBag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SunglassesLensFlowProps {
  product: any;
  onClose: () => void;
  onAddToCart: (lensData: any) => void;
}

interface PowerTier {
  id: "0_to_2" | "2_to_4" | "4_to_8" | "8_to_12";
  rangeLabel: string;
  price: number;
}

const POWER_TIERS: PowerTier[] = [
  { id: "0_to_2", rangeLabel: "0 to -2.00", price: 800 },
  { id: "2_to_4", rangeLabel: "-2.00 to -4.00", price: 1200 },
  { id: "4_to_8", rangeLabel: "-4.00 to -8.00", price: 1600 },
  { id: "8_to_12", rangeLabel: "-8.00 to -12.00", price: 2500 },
];

// Generate SPH options from 0.00 down to -12.00
const SPH_OPTIONS = [
  "0.00",
  "-0.25", "-0.50", "-0.75", "-1.00",
  "-1.25", "-1.50", "-1.75", "-2.00",
  "-2.25", "-2.50", "-2.75", "-3.00",
  "-3.25", "-3.50", "-3.75", "-4.00",
  "-4.25", "-4.50", "-4.75", "-5.00",
  "-5.25", "-5.50", "-5.75", "-6.00",
  "-6.50", "-7.00", "-7.50", "-8.00",
  "-8.50", "-9.00", "-9.50", "-10.00",
  "-10.50", "-11.00", "-11.50", "-12.00"
];

// Optional CYL options (0.00 down to -4.00)
const CYL_OPTIONS = [
  "0.00", "-0.25", "-0.50", "-0.75", "-1.00",
  "-1.25", "-1.50", "-1.75", "-2.00",
  "-2.25", "-2.50", "-2.75", "-3.00",
  "-3.25", "-3.50", "-3.75", "-4.00"
];

export default function SunglassesLensFlow({
  product,
  onClose,
  onAddToCart,
}: SunglassesLensFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Prescription Power Form state
  const [odSph, setOdSph] = useState<string>("-1.00");
  const [osSph, setOsSph] = useState<string>("-1.00");
  const [odCyl, setOdCyl] = useState<string>("0.00");
  const [osCyl, setOsCyl] = useState<string>("0.00");
  const [odAxis, setOdAxis] = useState<string>("");
  const [osAxis, setOsAxis] = useState<string>("");

  // Step 2: Tint Style state
  const [selectedTint, setSelectedTint] = useState<"solid" | "gradient">("solid");

  // Calculate power tier and price automatically based on entered SPH
  const activePowerTier = useMemo((): PowerTier => {
    const p1 = Math.abs(parseFloat(odSph) || 0);
    const p2 = Math.abs(parseFloat(osSph) || 0);
    const maxPower = Math.max(p1, p2);

    if (maxPower <= 2.00) {
      return POWER_TIERS[0]; // 0 to -2.00 -> 800
    } else if (maxPower <= 4.00) {
      return POWER_TIERS[1]; // -2.00 to -4.00 -> 1200
    } else if (maxPower <= 8.00) {
      return POWER_TIERS[2]; // -4.00 to -8.00 -> 1600
    } else {
      return POWER_TIERS[3]; // -8.00 to -12.00 -> 2500
    }
  }, [odSph, osSph]);

  const framePrice = Number(product.offer_price ?? product.discount_price ?? product.price ?? 0);
  const lensPrice = activePowerTier.price;
  const lensGst = Math.round(lensPrice * 0.05);
  const grandTotal = framePrice + lensPrice + lensGst;

  const handleComplete = () => {
    const lensConfig = {
      flow_type: "sunglasses",
      power_range: activePowerTier.id,
      lens_price: activePowerTier.price,
      tint_style: selectedTint,
      is_prescription: true,
      gst_rate: 0.05,
      gst_amount: lensGst,
    };

    onAddToCart({
      lens_price: activePowerTier.price,
      lens_name: `Prescription Sunglasses Lens (${selectedTint === "solid" ? "Solid Tint" : "Gradient Tint"})`,
      lens_config: lensConfig,
      prescription_json: {
        od_sph: odSph,
        os_sph: osSph,
        od_cyl: odCyl !== "0.00" ? odCyl : undefined,
        os_cyl: osCyl !== "0.00" ? osCyl : undefined,
        od_axis: odAxis || undefined,
        os_axis: osAxis || undefined,
        power_range: activePowerTier.rangeLabel,
        tint_style: selectedTint === "solid" ? "Solid Tint" : "Gradient Tint",
        is_sunglasses_rx: true,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#ECEFF5]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#ECEFF5] flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="p-1.5 rounded-full hover:bg-[#F8F9FC] text-[#666666] hover:text-[#111111] transition-colors"
                aria-label="Previous step"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#004AAD]">
                Step {currentStep} of 3
              </span>
              <h2 className="text-lg font-bold text-[#111111]">
                {currentStep === 1 && "Fill in Your Power"}
                {currentStep === 2 && "Choose Your Tint"}
                {currentStep === 3 && "Your Configuration"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F8F9FC] text-[#666666] hover:text-[#111111] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="w-full bg-[#ECEFF5] h-1">
          <div
            className="bg-[#004AAD] h-1 transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Interactive Power Form */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[#666666] leading-relaxed">
                    Select your spherical power (SPH) for each eye. The lens price automatically updates in real-time based on your prescription.
                  </p>
                </div>

                {/* Prescription Input Form Table */}
                <div className="bg-[#F8F9FC] border border-[#ECEFF5] rounded-2xl p-5 space-y-5">
                  {/* Right Eye (OD) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#004AAD]"></span>
                        Right Eye (OD)
                      </span>
                      <span className="text-[11px] font-semibold text-[#004AAD]">
                        SPH: {odSph}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#666666] tracking-wider block">
                          Sphere (SPH) *
                        </label>
                        <select
                          value={odSph}
                          onChange={(e) => setOdSph(e.target.value)}
                          className="w-full bg-white border border-[#CCD2E0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#111111] outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                        >
                          {SPH_OPTIONS.map((val) => (
                            <option key={`od-sph-${val}`} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#666666] tracking-wider block">
                          Cylinder (CYL)
                        </label>
                        <select
                          value={odCyl}
                          onChange={(e) => setOdCyl(e.target.value)}
                          className="w-full bg-white border border-[#CCD2E0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#111111] outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                        >
                          {CYL_OPTIONS.map((val) => (
                            <option key={`od-cyl-${val}`} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#666666] tracking-wider block">
                          Axis (0-180°)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          placeholder="e.g. 90"
                          value={odAxis}
                          onChange={(e) => setOdAxis(e.target.value)}
                          className="w-full bg-white border border-[#CCD2E0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#111111] outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Eye (OS) */}
                  <div className="space-y-2.5 pt-4 border-t border-[#ECEFF5]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#004AAD]"></span>
                        Left Eye (OS)
                      </span>
                      <span className="text-[11px] font-semibold text-[#004AAD]">
                        SPH: {osSph}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#666666] tracking-wider block">
                          Sphere (SPH) *
                        </label>
                        <select
                          value={osSph}
                          onChange={(e) => setOsSph(e.target.value)}
                          className="w-full bg-white border border-[#CCD2E0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#111111] outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                        >
                          {SPH_OPTIONS.map((val) => (
                            <option key={`os-sph-${val}`} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#666666] tracking-wider block">
                          Cylinder (CYL)
                        </label>
                        <select
                          value={osCyl}
                          onChange={(e) => setOsCyl(e.target.value)}
                          className="w-full bg-white border border-[#CCD2E0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#111111] outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                        >
                          {CYL_OPTIONS.map((val) => (
                            <option key={`os-cyl-${val}`} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#666666] tracking-wider block">
                          Axis (0-180°)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          placeholder="e.g. 90"
                          value={osAxis}
                          onChange={(e) => setOsAxis(e.target.value)}
                          className="w-full bg-white border border-[#CCD2E0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#111111] outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Tint Style Selection */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[#666666] leading-relaxed">
                    Select your preferred lens tint style. Both tint styles include standard UV protection and are available at the same lens price.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Solid Tint */}
                  <button
                    type="button"
                    onClick={() => setSelectedTint("solid")}
                    className={cn(
                      "text-left p-5 rounded-2xl border-2 transition-all flex flex-col cursor-pointer group",
                      selectedTint === "solid"
                        ? "border-[#004AAD] bg-blue-50/40 shadow-sm"
                        : "border-[#ECEFF5] bg-white hover:border-[#004AAD]/40 hover:bg-[#F8F9FC]"
                    )}
                  >
                    {/* Solid Dark Rectangle SVG */}
                    <div className="w-full h-24 rounded-xl overflow-hidden mb-4 border border-black/10 bg-[#F4F5F8] flex items-center justify-center p-2">
                      <svg width="100%" height="100%" viewBox="0 0 200 80" className="rounded-lg shadow-inner">
                        <rect width="200" height="80" rx="8" fill="#1C1F26" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[#111111]">Solid Tint</span>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          selectedTint === "solid"
                            ? "border-[#004AAD] bg-[#004AAD] text-white"
                            : "border-[#CCD2E0] bg-white"
                        )}
                      >
                        {selectedTint === "solid" && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#666666]">
                      Uniform color across the entire lens for consistent glare reduction.
                    </p>
                  </button>

                  {/* Option 2: Gradient Tint */}
                  <button
                    type="button"
                    onClick={() => setSelectedTint("gradient")}
                    className={cn(
                      "text-left p-5 rounded-2xl border-2 transition-all flex flex-col cursor-pointer group",
                      selectedTint === "gradient"
                        ? "border-[#004AAD] bg-blue-50/40 shadow-sm"
                        : "border-[#ECEFF5] bg-white hover:border-[#004AAD]/40 hover:bg-[#F8F9FC]"
                    )}
                  >
                    {/* Gradient Dark-to-Light Rectangle SVG */}
                    <div className="w-full h-24 rounded-xl overflow-hidden mb-4 border border-black/10 bg-[#F4F5F8] flex items-center justify-center p-2">
                      <svg width="100%" height="100%" viewBox="0 0 200 80" className="rounded-lg shadow-inner">
                        <defs>
                          <linearGradient id="sunglassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1C1F26" stopOpacity="0.95" />
                            <stop offset="60%" stopColor="#2A303C" stopOpacity="0.65" />
                            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.25" />
                          </linearGradient>
                        </defs>
                        <rect width="200" height="80" rx="8" fill="url(#sunglassGradient)" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[#111111]">Gradient Tint</span>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          selectedTint === "gradient"
                            ? "border-[#004AAD] bg-[#004AAD] text-white"
                            : "border-[#CCD2E0] bg-white"
                        )}
                      >
                        {selectedTint === "gradient" && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#666666]">
                      Color fades dark to light from top to bottom, ideal for driving and reading outdoors.
                    </p>
                  </button>
                </div>

                {/* Selected power & price reminder */}
                <div className="p-4 bg-[#F8F9FC] border border-[#ECEFF5] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#666666]">
                      Power: OD: <strong className="text-[#111111]">{odSph}</strong> | OS: <strong className="text-[#111111]">{osSph}</strong>
                    </span>
                  </div>
                  <span className="text-[#004AAD] font-bold text-sm">
                    Lens price: ₹{activePowerTier.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Order Summary */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-[#F8F9FC] border border-[#ECEFF5] rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-[#666666]">Sunglasses frame ({product.name}):</span>
                    <span className="font-semibold text-[#111111]">₹{framePrice.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="text-[#666666] block">
                        Prescription lens:
                      </span>
                      <span className="text-[10px] text-[#888888]">
                        OD: {odSph} {odCyl !== "0.00" && `· CYL ${odCyl}`} | OS: {osSph} {osCyl !== "0.00" && `· CYL ${osCyl}`}
                      </span>
                    </div>
                    <span className="font-semibold text-[#111111]">₹{lensPrice.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-[#666666]">Tint style:</span>
                    <span className="font-semibold text-[#111111] capitalize">
                      {selectedTint === "solid" ? "Solid Tint" : "Gradient Tint"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-700">
                    <span className="font-medium">GST (5% on lens only):</span>
                    <span className="font-semibold">₹{lensGst.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="border-t border-[#ECEFF5] pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#111111]">Total:</span>
                      <p className="text-[10px] text-[#666666] mt-0.5">
                        Frame GST (18%) is included in frame price
                      </p>
                    </div>
                    <span className="text-xl font-bold text-[#004AAD]">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-900 text-xs">
                  <ShieldCheck size={16} className="text-[#004AAD] flex-shrink-0" />
                  <span>
                    Your customized prescription sunglasses will be carefully crafted with high-clarity optical resin and full UV protection.
                  </span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#ECEFF5] bg-[#F8F9FC] flex items-center justify-between gap-3">
          {currentStep === 1 && (
            <div className="flex items-center justify-between w-full">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#666666] tracking-wider block">
                  Lens Price
                </span>
                <span className="text-base font-bold text-[#004AAD]">
                  ₹{activePowerTier.price.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-[#03173D] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#004AAD] transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                Next: Choose Tint
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 border border-[#CCD2E0] text-[#111111] text-xs font-semibold rounded-full hover:bg-white transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-[#03173D] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#004AAD] transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                Next: View Summary
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 border border-[#CCD2E0] text-[#111111] text-xs font-semibold rounded-full hover:bg-white transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="px-8 py-3.5 bg-[#03173D] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#004AAD] transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
              >
                <ShoppingBag size={16} />
                Add to Cart
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
