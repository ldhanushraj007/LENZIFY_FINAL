"use client";

import React, { useState } from "react";
import { Eye, Check, ChevronDown, ChevronUp, Copy, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContactLensEyePower {
  sph: string;
  cyl: string;
  axis: string;
  bc: string;
  dia: string;
  add: string;
}

export interface ContactLensPrescriptionData {
  is_contact_lens: true;
  right_eye: ContactLensEyePower;
  left_eye: ContactLensEyePower;
  notes?: string;
}

export function validateContactLensPower(data: ContactLensPrescriptionData | null): {
  isValid: boolean;
  errors: {
    right_sph?: string;
    right_axis?: string;
    left_sph?: string;
    left_axis?: string;
  };
} {
  if (!data || !data.right_eye || !data.left_eye) {
    return {
      isValid: false,
      errors: {
        right_sph: "Right eye sphere (SPH) is required",
        left_sph: "Left eye sphere (SPH) is required",
      },
    };
  }

  const errors: {
    right_sph?: string;
    right_axis?: string;
    left_sph?: string;
    left_axis?: string;
  } = {};

  if (!data.right_eye.sph || data.right_eye.sph.trim() === "") {
    errors.right_sph = "Please select Right Eye (OD) Sphere";
  }

  if (
    data.right_eye.cyl &&
    data.right_eye.cyl !== "0.00 (None)" &&
    (!data.right_eye.axis || data.right_eye.axis === "None")
  ) {
    errors.right_axis = "Axis is required when Cylinder is specified";
  }

  if (!data.left_eye.sph || data.left_eye.sph.trim() === "") {
    errors.left_sph = "Please select Left Eye (OS) Sphere";
  }

  if (
    data.left_eye.cyl &&
    data.left_eye.cyl !== "0.00 (None)" &&
    (!data.left_eye.axis || data.left_eye.axis === "None")
  ) {
    errors.left_axis = "Axis is required when Cylinder is specified";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

interface ContactLensPowerCustomizerProps {
  value: ContactLensPrescriptionData | null;
  onChange: (prescription: ContactLensPrescriptionData | null) => void;
  productDefaultBc?: string;
  productDefaultDia?: string;
  required?: boolean;
}

// Standard options
const SPH_OPTIONS = (() => {
  const list: string[] = [];
  // Minus powers (-12.00 to -0.25)
  for (let i = -12.0; i <= -0.25; i += 0.25) {
    list.push(i.toFixed(2));
  }
  list.push("0.00 (PL)");
  // Plus powers (+0.25 to +8.00)
  for (let i = 0.25; i <= 8.0; i += 0.25) {
    list.push(`+${i.toFixed(2)}`);
  }
  return list;
})();

const CYL_OPTIONS = [
  "0.00 (None)",
  "-0.75",
  "-1.25",
  "-1.75",
  "-2.25",
  "-2.75",
];

const AXIS_OPTIONS = [
  "None",
  ...Array.from({ length: 18 }, (_, i) => `${(i + 1) * 10}°`),
];

const BC_OPTIONS = ["8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9"];
const DIA_OPTIONS = ["13.8", "14.0", "14.2", "14.5"];
const ADD_OPTIONS = ["None", "Low (+1.00)", "Med (+1.75)", "High (+2.50)", "+1.00", "+1.50", "+2.00", "+2.50"];

export default function ContactLensPowerCustomizer({
  value,
  onChange,
  productDefaultBc = "8.6",
  productDefaultDia = "14.2",
  required = true,
}: ContactLensPowerCustomizerProps) {
  const [isOpen, setIsOpen] = useState(required ? true : !!value);
  const [sameForBoth, setSameForBoth] = useState(false);
  const [touched, setTouched] = useState(false);

  // Form states
  const [rightEye, setRightEye] = useState<ContactLensEyePower>(
    value?.right_eye || {
      sph: "-1.00",
      cyl: "0.00 (None)",
      axis: "None",
      bc: productDefaultBc || "8.6",
      dia: productDefaultDia || "14.2",
      add: "None",
    }
  );

  const [leftEye, setLeftEye] = useState<ContactLensEyePower>(
    value?.left_eye || {
      sph: "-1.00",
      cyl: "0.00 (None)",
      axis: "None",
      bc: productDefaultBc || "8.6",
      dia: productDefaultDia || "14.2",
      add: "None",
    }
  );

  // Compute live validation
  const validation = validateContactLensPower({
    is_contact_lens: true,
    right_eye: rightEye,
    left_eye: sameForBoth ? rightEye : leftEye,
  });

  const syncToParent = (rEye: ContactLensEyePower, lEye: ContactLensEyePower, isSame: boolean) => {
    const finalLeft = isSame ? { ...rEye } : lEye;
    const currentData: ContactLensPrescriptionData = {
      is_contact_lens: true,
      right_eye: rEye,
      left_eye: finalLeft,
    };
    const v = validateContactLensPower(currentData);
    if (v.isValid) {
      onChange(currentData);
    } else {
      onChange(null);
    }
  };

  const handleRightChange = (field: keyof ContactLensEyePower, val: string) => {
    setTouched(true);
    const updated = { ...rightEye, [field]: val };
    setRightEye(updated);
    const newLeft = sameForBoth ? updated : leftEye;
    if (sameForBoth) {
      setLeftEye(updated);
    }
    syncToParent(updated, newLeft, sameForBoth);
  };

  const handleLeftChange = (field: keyof ContactLensEyePower, val: string) => {
    setTouched(true);
    const updated = { ...leftEye, [field]: val };
    setLeftEye(updated);
    syncToParent(rightEye, updated, sameForBoth);
  };

  const handleToggleSameForBoth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameForBoth(checked);
    const newLeft = checked ? { ...rightEye } : leftEye;
    if (checked) {
      setLeftEye({ ...rightEye });
    }
    syncToParent(rightEye, newLeft, checked);
  };

  const handleApply = () => {
    setTouched(true);
    if (!validation.isValid) return;
    const finalLeft = sameForBoth ? { ...rightEye } : leftEye;
    onChange({
      is_contact_lens: true,
      right_eye: rightEye,
      left_eye: finalLeft,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setTouched(false);
    if (!required) setIsOpen(false);
  };

  return (
    <div className="border border-[#004AAD]/20 bg-[#F8F9FC]/70 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header Banner / Trigger Button */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#004AAD]/10 text-[#004AAD] flex items-center justify-center flex-shrink-0">
            <Eye size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[#111111]">Customize Your Power</p>
              {value && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Check size={10} /> Configured
                </span>
              )}
            </div>
            <p className="text-xs text-[#666666]">
              {value
                ? `OD: ${value.right_eye.sph} SPH | OS: ${value.left_eye.sph} SPH`
                : "Enter sphere, cylinder, axis & multifocal specs"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {value && (
            <button
              onClick={handleClear}
              type="button"
              className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 transition-colors"
              title="Remove power customization"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              isOpen
                ? "bg-[#03173D] text-white"
                : "bg-white border border-[#E8EAF2] text-[#004AAD] hover:border-[#004AAD]"
            )}
          >
            {isOpen ? (
              <>
                Collapse <ChevronUp size={14} />
              </>
            ) : value ? (
              <>
                Edit Power <ChevronDown size={14} />
              </>
            ) : (
              <>
                Customize <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Power Form */}
      {isOpen && (
        <div className="border-t border-[#E8EAF2] bg-white p-5 sm:p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Quick sync checkbox */}
          <div className="flex items-center justify-between bg-[#F8F9FC] p-3 rounded-xl border border-[#ECECEC]">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sameForBoth}
                onChange={handleToggleSameForBoth}
                className="w-4 h-4 text-[#004AAD] rounded focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#111111]">
                Same prescription for both eyes
              </span>
            </label>
            <span className="text-[10px] uppercase tracking-wider text-[#888888] font-semibold hidden sm:inline">
              Clinical OD/OS Matrix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RIGHT EYE (OD) */}
            <div className="bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#ECECEC] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#004AAD]">
                  Right Eye (OD)
                </span>
                <span className="text-[10px] text-[#888888] font-medium">Oculus Dexter</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* SPH */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Sphere (SPH) *
                  </label>
                  <select
                    value={rightEye.sph}
                    onChange={(e) => handleRightChange("sph", e.target.value)}
                    className={cn(
                      "w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:border-[#004AAD] outline-none",
                      touched && validation.errors.right_sph ? "border-red-500 bg-red-50/40" : "border-[#E8EAF2]"
                    )}
                  >
                    {SPH_OPTIONS.map((opt) => (
                      <option key={`r-sph-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {touched && validation.errors.right_sph && (
                    <p className="text-[9px] font-semibold text-red-600 mt-1">{validation.errors.right_sph}</p>
                  )}
                </div>

                {/* CYL */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Cylinder (CYL)
                  </label>
                  <select
                    value={rightEye.cyl}
                    onChange={(e) => handleRightChange("cyl", e.target.value)}
                    className="w-full bg-white border border-[#E8EAF2] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:border-[#004AAD] outline-none"
                  >
                    {CYL_OPTIONS.map((opt) => (
                      <option key={`r-cyl-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Axis */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Axis (°)
                  </label>
                  <select
                    value={rightEye.axis}
                    onChange={(e) => handleRightChange("axis", e.target.value)}
                    className={cn(
                      "w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:border-[#004AAD] outline-none",
                      touched && validation.errors.right_axis ? "border-red-500 bg-red-50/40" : "border-[#E8EAF2]"
                    )}
                  >
                    {AXIS_OPTIONS.map((opt) => (
                      <option key={`r-axis-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {touched && validation.errors.right_axis && (
                    <p className="text-[9px] font-semibold text-red-600 mt-1">{validation.errors.right_axis}</p>
                  )}
                </div>



                {/* Add */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Add (Multifocal)
                  </label>
                  <select
                    value={rightEye.add}
                    onChange={(e) => handleRightChange("add", e.target.value)}
                    className="w-full bg-white border border-[#E8EAF2] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:border-[#004AAD] outline-none"
                  >
                    {ADD_OPTIONS.map((opt) => (
                      <option key={`r-add-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* LEFT EYE (OS) */}
            <div className={cn(
              "bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl p-4 sm:p-5 space-y-4 transition-opacity",
              sameForBoth && "opacity-75"
            )}>
              <div className="flex items-center justify-between border-b border-[#ECECEC] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#004AAD]">
                  Left Eye (OS)
                </span>
                <span className="text-[10px] text-[#888888] font-medium">
                  {sameForBoth ? "(Mirrored from OD)" : "Oculus Sinister"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* SPH */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Sphere (SPH) *
                  </label>
                  <select
                    disabled={sameForBoth}
                    value={sameForBoth ? rightEye.sph : leftEye.sph}
                    onChange={(e) => handleLeftChange("sph", e.target.value)}
                    className={cn(
                      "w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:border-[#004AAD] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed",
                      !sameForBoth && touched && validation.errors.left_sph ? "border-red-500 bg-red-50/40" : "border-[#E8EAF2]"
                    )}
                  >
                    {SPH_OPTIONS.map((opt) => (
                      <option key={`l-sph-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {!sameForBoth && touched && validation.errors.left_sph && (
                    <p className="text-[9px] font-semibold text-red-600 mt-1">{validation.errors.left_sph}</p>
                  )}
                </div>

                {/* CYL */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Cylinder (CYL)
                  </label>
                  <select
                    disabled={sameForBoth}
                    value={sameForBoth ? rightEye.cyl : leftEye.cyl}
                    onChange={(e) => handleLeftChange("cyl", e.target.value)}
                    className="w-full bg-white border border-[#E8EAF2] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:border-[#004AAD] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {CYL_OPTIONS.map((opt) => (
                      <option key={`l-cyl-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Axis */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Axis (°)
                  </label>
                  <select
                    disabled={sameForBoth}
                    value={sameForBoth ? rightEye.axis : leftEye.axis}
                    onChange={(e) => handleLeftChange("axis", e.target.value)}
                    className={cn(
                      "w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:border-[#004AAD] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed",
                      !sameForBoth && touched && validation.errors.left_axis ? "border-red-500 bg-red-50/40" : "border-[#E8EAF2]"
                    )}
                  >
                    {AXIS_OPTIONS.map((opt) => (
                      <option key={`l-axis-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {!sameForBoth && touched && validation.errors.left_axis && (
                    <p className="text-[9px] font-semibold text-red-600 mt-1">{validation.errors.left_axis}</p>
                  )}
                </div>



                {/* Add */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Add (Multifocal)
                  </label>
                  <select
                    disabled={sameForBoth}
                    value={sameForBoth ? rightEye.add : leftEye.add}
                    onChange={(e) => handleLeftChange("add", e.target.value)}
                    className="w-full bg-white border border-[#E8EAF2] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:border-[#004AAD] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {ADD_OPTIONS.map((opt) => (
                      <option key={`l-add-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#ECECEC] text-xs font-semibold text-[#666666] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              type="button"
              className="px-6 py-2.5 rounded-xl bg-[#03173D] text-white text-xs font-bold hover:bg-[#004AAD] transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check size={14} /> Apply Prescription Power
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
