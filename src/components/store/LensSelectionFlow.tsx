"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ChevronRight, ArrowLeft, Info, HelpCircle, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

import { getIndexOptions, IndexOption } from "@/lib/lens-index-pricing";
import { resolveProductImage } from "@/lib/image_utils";

interface LensSelectionFlowProps {
  product: any;
  availableLenses: any[];
  onClose: () => void;
  onAddToCart: (lensData: any) => void;
}

type Step = "PRESCRIPTION" | "TYPE" | "MATERIAL" | "PACKAGES" | "SUMMARY";
type PackageKey = "standard" | "photochromatic" | "photochromatic_bluecut";

export default function LensSelectionFlow({ product, availableLenses, onClose, onAddToCart }: LensSelectionFlowProps) {
  const [step, setStep] = useState<Step>("PRESCRIPTION");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  
  // Selections state
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [selectedTier, setSelectedTier] = useState<any | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>("standard");
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [selectedThickness, setSelectedThickness] = useState<any | null>(null);
  const [selectedTint, setSelectedTint] = useState<any | null>(null);

  // Prescription State (Step 1 - Mandatory)
  const [prescription, setPrescription] = useState({
    od_sph: "", od_cyl: "", od_axis: "", od_add: "",
    os_sph: "", os_cyl: "", os_axis: "", os_add: "",
    pd: "",
    age: "",
    file_url: ""
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if ADD power is present (non-zero on either eye)
  const odAddVal = parseFloat(prescription.od_add) || 0;
  const osAddVal = parseFloat(prescription.os_add) || 0;
  const hasAdd = odAddVal > 0 || osAddVal > 0;
  const ageVal = parseInt(prescription.age || "0", 10);

  // Filter main lens types (parent lenses only, exclude standalone Blue Cut, Photochromic, and individual Progressive child tiers)
  const lensTypes = useMemo(() => {
    return availableLenses.filter(l => {
      if (l.category !== "type") return false;
      const nameLower = l.name?.toLowerCase() || "";
      if (nameLower === "blue cut") return false;
      if (nameLower.includes("photochro")) return false;
      if (l.tier && ["silver", "gold", "platinum"].includes(l.tier.toLowerCase())) return false;
      if (nameLower.startsWith("progressive ") && (nameLower.includes("silver") || nameLower.includes("gold") || nameLower.includes("platinum"))) return false;
      return true;
    });
  }, [availableLenses]);

  // Strict Filter for Step 2:
  // - No ADD: render ONLY Single Vision
  // - ADD present: render ONLY Bifocal + Progressive (Single Vision excluded)
  const filteredLensTypes = useMemo(() => {
    if (!hasAdd) {
      return lensTypes.filter(l => l.name.toLowerCase().includes("single"));
    } else {
      return lensTypes.filter(l => 
        l.name.toLowerCase().includes("bifocal") || 
        l.name.toLowerCase().includes("progressive")
      );
    }
  }, [lensTypes, hasAdd]);

  // Progressive tiers lookup
  const progressiveTiers = useMemo(() => {
    const silver = availableLenses.find(l => l.tier === "silver" || l.name === "Progressive Silver");
    const gold = availableLenses.find(l => l.tier === "gold" || l.name === "Progressive Gold");
    const platinum = availableLenses.find(l => l.tier === "platinum" || l.name === "Progressive Platinum");

    return [
      {
        tier: "silver",
        displayName: "Silver Tier",
        fov: "Narrow Field of View",
        fovLabel: "Narrow Field of View",
        ratings: { distance: 7, intermediate: 5, reading: 6, adaptation: 6 },
        lens: silver,
        price: silver?.price || 1799,
        badge: "Standard",
        description: silver?.description || "Comfortable corridor for balanced daily vision."
      },
      {
        tier: "gold",
        displayName: "Gold Tier",
        fov: "Wide Field of View",
        fovLabel: "Wide Field of View",
        ratings: { distance: 8, intermediate: 6, reading: 7, adaptation: 8 },
        lens: gold,
        price: gold?.price || 2799,
        badge: "Most Popular",
        description: gold?.description || "Wider corridor with reduced peripheral distortion."
      },
      {
        tier: "platinum",
        displayName: "Platinum Tier",
        fov: "Widest Field of View",
        fovLabel: "Widest Field of View",
        ratings: { distance: 9, intermediate: 8, reading: 8, adaptation: 9 },
        lens: platinum,
        price: platinum?.price || 4299,
        badge: "Ultra-Premium",
        description: platinum?.description || "Ultra-wide optical corridor with instant adaptation."
      }
    ];
  }, [availableLenses]);

  const isRimless = (product?.frame_type || "").toLowerCase() === "rimless";

  // Maximum SPH from manual prescription
  const maxSph = useMemo(() => {
    const od_sph = parseFloat(prescription.od_sph);
    const os_sph = parseFloat(prescription.os_sph);
    const hasOd = !isNaN(od_sph);
    const hasOs = !isNaN(os_sph);
    if (!hasOd && !hasOs) return null;
    return Math.max(hasOd ? Math.abs(od_sph) : 0, hasOs ? Math.abs(os_sph) : 0);
  }, [prescription.od_sph, prescription.os_sph]);

  // Dynamic Refractive Index Options based on Lens Type, Tier, Frame Type, and Power
  const indexOptions = useMemo(() => {
    return getIndexOptions({
      lensType: selectedType?.name,
      tier: selectedTier?.tier,
      frameType: product?.frame_type,
      sphMax: maxSph
    });
  }, [selectedType, selectedTier, product?.frame_type, maxSph]);

  // Index auto-recommendation according to requirements:
  // SPH ≤ ±2.00 → recommend 1.50 or 1.56
  // SPH ±2.25 to ±3.00 → recommend 1.60
  // SPH > ±3.00 → recommend 1.67
  const getRecommendedIndex = () => {
    if (isRimless) return "1.59";
    if (maxSph === null || isNaN(maxSph)) return "1.56";
    if (maxSph <= 2.00) return "1.56";
    if (maxSph <= 3.00) return "1.60";
    return "1.67";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError(null);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `prescriptions/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setPrescription(prev => ({ ...prev, file_url: publicUrl }));
      setUploadedFileName(file.name);
    } catch (err: any) {
      console.error("Prescription upload error:", err);
      setError(err.message || "Failed to upload prescription file.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Package Flat Pricing Lookup
  const getPackagePricing = () => {
    const typeName = selectedType?.name?.toLowerCase() || "";
    const tierKey = selectedTier?.tier?.toLowerCase() || "";

    if (typeName.includes("progressive")) {
      const activeTierPrice = selectedTier?.lens?.price ?? (tierKey === "silver" ? 1799 : (tierKey === "gold" ? 2799 : 4299));
      return {
        standard: { price: activeTierPrice, label: "Standard", desc: "All 4 core coatings included" },
        photochromatic: { price: activeTierPrice + 1000, label: "+ Photochromatic", desc: "Light-responsive tint with all coatings" },
        photochromatic_bluecut: { price: activeTierPrice + 1700, label: "+ Photochromatic + Blue Cut", desc: "Full digital protection + light-adaptive tint" },
      };
    } else if (typeName.includes("bifocal")) {
      const base = selectedType?.price ?? 999;
      return {
        standard: { price: base, label: "Standard", desc: "All 4 core coatings included" },
        photochromatic: { price: base + 800, label: "+ Photochromatic", desc: "Light-responsive tint with all coatings" },
        photochromatic_bluecut: { price: base + 1500, label: "+ Photochromatic + Blue Cut", desc: "Full digital protection + light-adaptive tint" },
      };
    } else {
      // Single Vision or other standard type
      const base = selectedType?.price ?? 799;
      return {
        standard: { price: base, label: "Standard", desc: "All 4 core coatings included" },
        photochromatic: { price: base + 400, label: "+ Photochromatic", desc: "Light-responsive tint with all coatings" },
        photochromatic_bluecut: { price: base + 1000, label: "+ Photochromatic + Blue Cut", desc: "Full digital protection + light-adaptive tint" },
      };
    }
  };

  const packagePricing = getPackagePricing();
  const currentPackagePrice = packagePricing[selectedPackage]?.price || 799;

  const calculatePowerRangeExtra = () => {
    const activeLens = selectedTier?.lens || selectedType;
    if (!activeLens?.power_ranges || !Array.isArray(activeLens.power_ranges) || activeLens.power_ranges.length === 0) return 0;
    const od_sph = parseFloat(prescription.od_sph);
    const os_sph = parseFloat(prescription.os_sph);

    const checkPower = (sph: number) => {
      if (isNaN(sph)) return 0;
      for (const range of activeLens.power_ranges) {
        const from = parseFloat(range.from);
        const to = parseFloat(range.to);
        const extra = parseFloat(range.extra_price) || 0;
        const minVal = Math.min(from, to);
        const maxVal = Math.max(from, to);
        if (sph >= minVal && sph <= maxVal) {
          return extra;
        }
      }
      return 0;
    };

    const odExtra = checkPower(od_sph);
    const osExtra = checkPower(os_sph);
    return Math.max(odExtra, osExtra);
  };

  const calculateTotalLensPrice = () => {
    let total = currentPackagePrice;
    total += calculatePowerRangeExtra();
    if (selectedMaterial) total += selectedMaterial.price;
    if (selectedThickness?.price) total += selectedThickness.price;
    if (selectedTint) total += selectedTint.price;
    return total;
  };

  const calculateGrandTotal = () => {
    const framePrice = product.discount_price || product.price;
    return framePrice + calculateTotalLensPrice();
  };

  const isProgressive = selectedType?.name?.toLowerCase().includes("progressive");

  const handleNext = () => {
    // STEP 1 -> STEP 2: PRESCRIPTION -> TYPE
    if (step === "PRESCRIPTION") {
      const od_sph = prescription.od_sph.trim();
      const os_sph = prescription.os_sph.trim();

      if (!od_sph || !os_sph) {
        setError("Both Right Eye (OD) and Left Eye (OS) SPH values are required to proceed.");
        return;
      }

      const od_cyl = prescription.od_cyl.trim();
      const od_axis = prescription.od_axis.trim();
      const os_cyl = prescription.os_cyl.trim();
      const os_axis = prescription.os_axis.trim();

      if (od_cyl !== "" && od_axis === "") {
        setError("Axis is required for Right Eye (OD) when Cylinder is present.");
        return;
      }
      if (os_cyl !== "" && os_axis === "") {
        setError("Axis is required for Left Eye (OS) when Cylinder is present.");
        return;
      }

      // Auto-select lens type based on prescription ADD and Age
      if (!hasAdd) {
        const sv = lensTypes.find(l => l.name.toLowerCase().includes("single")) || lensTypes[0];
        setSelectedType(sv);
        setSelectedTier(null);
      } else {
        if (ageVal >= 40) {
          const prog = lensTypes.find(l => l.name.toLowerCase().includes("progressive")) || lensTypes[0];
          setSelectedType(prog);
          setSelectedTier(progressiveTiers[0]);
        } else {
          const bifocal = lensTypes.find(l => l.name.toLowerCase().includes("bifocal")) || lensTypes.find(l => l.name.toLowerCase().includes("progressive")) || lensTypes[0];
          setSelectedType(bifocal);
          setSelectedTier(null);
        }
      }

      setError(null);
      setStep("TYPE");
    }
    // STEP 2 -> STEP 3: TYPE -> MATERIAL (REFRACTIVE INDEX)
    else if (step === "TYPE") {
      if (!selectedType) {
        setError("Please select a lens type.");
        return;
      }
      if (isProgressive && !selectedTier) {
        setError("Please select a Progressive tier (Silver, Gold, or Platinum) before proceeding.");
        return;
      }

      // Auto-set recommended refractive index
      const rec = getRecommendedIndex();
      if (isRimless) {
        setSelectedThickness(indexOptions[0]);
        setSelectedMaterial({ name: "Polycarbonate", price: 0 });
      } else {
        const matchingOpt = indexOptions.find(o => o.indexValue === rec && o.available) || indexOptions.find(o => o.available) || indexOptions[0];
        setSelectedThickness(matchingOpt);
      }

      setError(null);
      setStep("MATERIAL");
    }
    // STEP 3 -> STEP 4: MATERIAL -> PACKAGES
    else if (step === "MATERIAL") {
      if (!selectedThickness) {
        setError("Please select a refractive index.");
        return;
      }
      setError(null);
      setStep("PACKAGES");
    }
    // STEP 4 -> STEP 5: PACKAGES -> SUMMARY
    else if (step === "PACKAGES") {
      setError(null);
      setStep("SUMMARY");
    }
    // STEP 5: FINAL CONFIRMATION & INJECT TO CART
    else if (step === "SUMMARY") {
      const activeLens = selectedTier?.lens || selectedType;
      const finalLensName = selectedTier 
        ? `${selectedType.name} (${selectedTier.displayName})` 
        : selectedType.name;

      onAddToCart({
        lens_id: activeLens.id || selectedType.id,
        lens_name: finalLensName,
        lens_price: calculateTotalLensPrice(),
        power_range_extra: calculatePowerRangeExtra(),
        lens_config: {
          type: activeLens,
          tier: selectedTier ? selectedTier.tier : null,
          package: selectedPackage,
          package_name: packagePricing[selectedPackage].label,
          features: selectedPackage !== "standard" ? [{ name: packagePricing[selectedPackage].label, price: currentPackagePrice }] : [],
          coatings: [
            { name: "UV Block Protection", price: 0 },
            { name: "Blue Cut", price: 0 },
            { name: "Scratch Resistant Shield", price: 0 },
            { name: "Anti-Reflective Coating", price: 0 },
          ],
          material: selectedMaterial,
          thickness: selectedThickness,
          selected_index: selectedThickness?.indexValue || "1.56",
          index_label: selectedThickness?.name || "1.56 Standard",
          index_price: selectedThickness?.price || 0,
          frame_type: product?.frame_type || "full_rim",
          tint: selectedTint,
          power_range_extra: calculatePowerRangeExtra()
        },
        prescription_json: prescription
      });
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === "TYPE") setStep("PRESCRIPTION");
    else if (step === "MATERIAL") setStep("TYPE");
    else if (step === "PACKAGES") setStep("MATERIAL");
    else if (step === "SUMMARY") setStep("PACKAGES");
  };

  const stepInfo = {
    PRESCRIPTION: { title: "Step 01: Prescription", subtitle: "Enter clinical metrics calibrated for your lenses." },
    TYPE: { title: "Step 02: Lens Matrix", subtitle: "Auto-filtered options based on your prescription." },
    MATERIAL: { title: "Step 03: Refractive Index", subtitle: "Thickness profile calibrated for your optical power." },
    PACKAGES: { title: "Step 04: Lens Packages", subtitle: "All 4 essential coatings included free. Select an upgrade package." },
    SUMMARY: { title: "Step 05: Final Review", subtitle: "Review your configuration before calibration." }
  };

  const isRxFilled = prescription.od_sph.trim() !== "" && prescription.os_sph.trim() !== "";
  const isProceedDisabled =
    (step === "PRESCRIPTION" && !isRxFilled) ||
    (step === "TYPE" && (!selectedType || (isProgressive && !selectedTier))) ||
    (step === "MATERIAL" && !selectedThickness);

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-md">
      <motion.div 
        data-lenis-prevent
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl bg-white shadow-[0_0_100px_rgba(0,0,0,0.3)] flex flex-col md:flex-row overflow-hidden h-[90vh] max-h-[90vh] min-h-[550px] rounded-2xl"
      >
        {/* Left Side: Dynamic configuration info */}
        <div className="w-full md:w-[32%] bg-brand-background p-8 border-r border-brand-navy/5 flex flex-col justify-between hidden md:flex h-full min-h-0 overflow-hidden">
          <div data-lenis-prevent className="space-y-8 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
            <div>
               <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-secondary italic mb-2">Build Manifest</p>
               <h2 className="text-3xl font-serif italic text-brand-navy tracking-tight leading-none uppercase">Lens Calibration<br/><span className="text-secondary">Protocol</span></h2>
            </div>

            <div className="space-y-6">
               <div className="aspect-[4/3] bg-white border border-brand-navy/5 p-6 flex items-center justify-center relative group">
                  <img src={resolveProductImage(product)} alt={product.name} className="object-contain w-full h-full mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-brand-navy text-white text-[7px] font-bold tracking-widest uppercase italic">Archive Entry</div>
               </div>
               
               <div className="space-y-3 text-brand-navy text-[11px]">
                  <div className="flex justify-between items-end border-b border-brand-navy/5 pb-2">
                     <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 italic">Base Frame</span>
                     <span className="font-bold tracking-wider italic">₹{(product.discount_price || product.price).toLocaleString()}</span>
                  </div>

                  {prescription.od_sph && prescription.os_sph && (
                    <div className="border-b border-brand-navy/5 pb-2 text-[10px] space-y-1">
                      <span className="uppercase font-bold tracking-widest opacity-40 italic">Prescription (OD / OS)</span>
                      <p className="font-bold text-brand-navy">
                        OD: {prescription.od_sph} {prescription.od_cyl && `| Cyl ${prescription.od_cyl}`}
                      </p>
                      <p className="font-bold text-brand-navy">
                        OS: {prescription.os_sph} {prescription.os_cyl && `| Cyl ${prescription.os_cyl}`}
                      </p>
                      {hasAdd && (
                        <p className="text-[9px] text-secondary font-semibold">
                          ADD: +{prescription.od_add || prescription.os_add} {prescription.age ? `(Age ${prescription.age})` : ""}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {selectedType && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-start border-b border-brand-navy/5 pb-2">
                       <div>
                         <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 italic">Lens & Package</p>
                         <p className="font-bold text-xs text-brand-navy">
                           {selectedType.name}
                           {selectedTier && <span className="text-secondary"> ({selectedTier.displayName})</span>}
                         </p>
                         <p className="text-[9px] text-secondary font-semibold mt-0.5">{packagePricing[selectedPackage].label}</p>
                       </div>
                       <span className="font-bold tracking-wider italic">₹{currentPackagePrice.toLocaleString()}</span>
                    </motion.div>
                  )}

                  <div className="flex justify-between items-end border-b border-brand-navy/5 pb-2 text-[10px]">
                     <span className="uppercase font-bold tracking-widest opacity-40 italic">Included Coatings (4)</span>
                     <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[9px]">FREE</span>
                  </div>

                  {calculatePowerRangeExtra() > 0 && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-end border-b border-brand-navy/5 pb-2">
                       <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 italic">Power Surcharge</span>
                       <span className="font-bold tracking-wider text-secondary italic">+₹{calculatePowerRangeExtra().toLocaleString()}</span>
                    </motion.div>
                  )}

                  {selectedThickness && (
                    <div className="flex justify-between items-end border-b border-brand-navy/5 pb-2 text-[10px]">
                       <span className="uppercase font-bold tracking-widest opacity-40 italic">{selectedThickness.name}</span>
                       <span className="font-bold tracking-wider">₹{selectedThickness.price.toLocaleString()}</span>
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="border-t-2 border-brand-navy pt-6 shrink-0">
             <p className="text-[9px] uppercase font-black tracking-[0.5em] text-secondary italic mb-1">Total Calibrated Value</p>
             <div className="text-3xl font-serif italic text-brand-navy">₹{calculateGrandTotal().toLocaleString()}</div>
          </div>
        </div>

        {/* Right Side: Step Matrix */}
        <div data-lenis-prevent className="w-full md:w-[68%] flex flex-col bg-white overflow-hidden h-full max-h-full min-h-0">
          <header className="p-8 border-b border-brand-navy/5 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
            <div className="flex gap-6 items-center">
               {step !== "PRESCRIPTION" && (
                   <button onClick={handleBack} className="p-3 border border-brand-navy/10 text-brand-navy hover:text-secondary hover:border-secondary transition-all group rounded-xl">
                     <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                   </button>
               )}
               <div className="space-y-1">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-navy">{stepInfo[step].title}</h3>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-brand-text-muted italic">{stepInfo[step].subtitle}</p>
               </div>
            </div>
            <button onClick={onClose} className="p-3 text-brand-navy/20 hover:text-secondary transition-colors"><X size={20} /></button>
          </header>

          <div 
            data-lenis-prevent
            className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar bg-white min-h-0"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#004AAD #F0F2F8' }}
          >
             <div className="p-8 lg:p-10 space-y-8 pb-24">
             <AnimatePresence mode="wait">
                {/* STEP 1: PRESCRIPTION (MANDATORY) */}
                {step === "PRESCRIPTION" && (
                   <motion.div key="st-pres" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center gap-3">
                        <Info size={18} className="text-amber-600 shrink-0" />
                        <p className="text-xs font-semibold">
                          Prescription is required before configuring lenses. Please fill at least Right Eye (OD) and Left Eye (OS) SPH values.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                         {/* Right Eye */}
                         <div className="bg-brand-navy p-8 text-white space-y-6 rounded-2xl">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                               <h4 className="text-[11px] font-black uppercase tracking-[0.5em]">Right Eye (OD)</h4>
                               <span className="text-[10px] italic opacity-50 uppercase tracking-widest">Oculus Dexter</span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                               {["SPH", "CYL", "AXIS", "ADD"].map(f => (
                                  <div key={`od-${f}`} className="space-y-2">
                                     <label className="text-[8px] font-bold tracking-widest uppercase opacity-40">
                                       {f} {f === "SPH" && <span className="text-secondary">*</span>}
                                     </label>
                                     <input 
                                       value={prescription[`od_${f.toLowerCase()}` as keyof typeof prescription]}
                                       onChange={(e) => setPrescription({...prescription, [`od_${f.toLowerCase()}`]: e.target.value})}
                                       className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-bold outline-none focus:border-secondary transition-all rounded-xl" 
                                       placeholder={f === "AXIS" ? "0° - 180°" : f === "ADD" ? "+0.00" : "+0.00"}
                                     />
                                  </div>
                               ))}
                            </div>
                         </div>

                         {/* Left Eye */}
                         <div className="bg-brand-navy p-8 text-white space-y-6 rounded-2xl">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                               <h4 className="text-[11px] font-black uppercase tracking-[0.5em]">Left Eye (OS)</h4>
                               <span className="text-[10px] italic opacity-50 uppercase tracking-widest">Oculus Sinister</span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                               {["SPH", "CYL", "AXIS", "ADD"].map(f => (
                                  <div key={`os-${f}`} className="space-y-2">
                                     <label className="text-[8px] font-bold tracking-widest uppercase opacity-40">
                                       {f} {f === "SPH" && <span className="text-secondary">*</span>}
                                     </label>
                                     <input 
                                       value={prescription[`os_${f.toLowerCase()}` as keyof typeof prescription]}
                                       onChange={(e) => setPrescription({...prescription, [`os_${f.toLowerCase()}`]: e.target.value})}
                                       className="w-full bg-white/5 border border-white/10 p-4 text-[11px] font-bold outline-none focus:border-secondary transition-all rounded-xl" 
                                       placeholder={f === "AXIS" ? "0° - 180°" : f === "ADD" ? "+0.00" : "+0.00"}
                                     />
                                  </div>
                               ))}
                            </div>
                         </div>
                         
                         {/* PD and Age (Optional) */}
                         <div className="p-8 border border-brand-navy/10 space-y-6 rounded-2xl bg-slate-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
                                    Pupillary Distance (PD)
                                  </label>
                                  <input 
                                    value={prescription.pd}
                                    onChange={(e) => setPrescription({...prescription, pd: e.target.value})}
                                    className="w-full bg-white border border-brand-navy/10 p-4 text-[11px] font-bold outline-none focus:border-secondary transition-all rounded-xl" 
                                    placeholder="e.g. 62"
                                  />
                                  <p className="text-[9px] text-brand-text-muted">Optional. Used for optical centering alignment.</p>
                               </div>

                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
                                    Age (Years) — Optional
                                  </label>
                                  <input 
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={prescription.age}
                                    onChange={(e) => setPrescription({...prescription, age: e.target.value})}
                                    className="w-full bg-white border border-brand-navy/10 p-4 text-[11px] font-bold outline-none focus:border-secondary transition-all rounded-xl" 
                                    placeholder="e.g. 45"
                                  />
                                  <p className="text-[9px] text-brand-text-muted">Used to calibrate Bifocal vs Progressive recommendation when ADD is present.</p>
                               </div>
                            </div>

                            {calculatePowerRangeExtra() > 0 && (
                               <div className="p-4 bg-secondary/10 border border-secondary/20 flex items-center justify-between text-brand-navy rounded-xl">
                                  <div>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-brand-navy">High Power Prescription Surcharge</p>
                                     <p className="text-[9px] text-brand-text-muted mt-0.5">Applied automatically based on power range requirements.</p>
                                  </div>
                                  <span className="text-xs font-black text-secondary">+₹{calculatePowerRangeExtra().toLocaleString()}</span>
                                </div>
                            )}

                            {/* Optional Prescription File Upload */}
                            <div className="pt-4 border-t border-brand-navy/5">
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept="image/*,application/pdf" 
                                className="hidden" 
                              />
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-brand-navy/15 bg-white rounded-xl p-5 text-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all"
                              >
                                {uploadingFile ? (
                                  <p className="text-[11px] font-bold text-secondary uppercase tracking-widest animate-pulse">Uploading prescription slip...</p>
                                ) : prescription.file_url ? (
                                  <div className="flex items-center justify-center gap-2 text-emerald-700">
                                    <CheckCircle2 size={16} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">
                                      Prescription Slip Attached {uploadedFileName ? `(${uploadedFileName})` : ""}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-3 text-brand-navy">
                                    <Upload size={16} className="text-secondary" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                      Attach Prescription Slip / Photo (Optional)
                                    </span>
                                    <span className="text-[9px] text-brand-text-muted">JPG, PNG or PDF</span>
                                  </div>
                                )}
                              </div>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                )}

                {/* STEP 2: LENS TYPE MATRIX (STRICT FILTERING & AUTO-SELECTION) */}
                {step === "TYPE" && (
                   <motion.div key="st-type" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                      {/* Recommendation Header Banner */}
                      {!hasAdd ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-bold text-emerald-950">
                              Based on your prescription: <span className="font-black text-[#004AAD]">Single Vision recommended</span> (No ADD power detected)
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full shadow-sm">
                            Auto-Selected
                          </span>
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-[#004AAD]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#004AAD]" />
                            <span className="text-[11px] font-bold text-[#03173D]">
                              Based on your prescription (ADD power present):{" "}
                              <span className="font-black text-[#004AAD]">
                                {ageVal >= 40 ? "Progressive recommended (Age 40+)" : "Bifocal recommended"}
                              </span>
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-[#004AAD] text-white px-3.5 py-1.5 rounded-full shadow-sm">
                            Multifocal Calibrated
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         {filteredLensTypes.map(lens => {
                            const isThisProgressive = lens.name.toLowerCase().includes("progressive");
                            const isSelected = selectedType?.id === lens.id;

                            return (
                              <button 
                                key={lens.id} 
                                onClick={() => {
                                  setSelectedType(lens);
                                  if (!isThisProgressive) {
                                    setSelectedTier(null);
                                  } else if (!selectedTier) {
                                    setSelectedTier(progressiveTiers[0]); // default to Silver
                                  }
                                }}
                                className={cn(
                                  "p-6 border transition-all duration-500 relative text-left group overflow-hidden rounded-xl",
                                  isSelected ? "border-secondary bg-brand-navy shadow-xl" : "border-brand-navy/10 hover:border-brand-navy/30 bg-white"
                                )}
                              >
                                 <div className="relative z-10 space-y-2">
                                    <div className="flex justify-between items-start">
                                       <h4 className={cn("text-xs font-black uppercase tracking-widest", isSelected ? "text-white" : "text-brand-navy")}>{lens.name}</h4>
                                       <span className={cn("text-[10px] font-bold italic", isSelected ? "text-secondary" : "text-brand-navy/50")}>
                                         {isThisProgressive ? "From ₹1,799" : `₹${lens.price.toLocaleString()}`}
                                       </span>
                                    </div>
                                    <p className={cn("text-[10px] leading-relaxed tracking-wider", isSelected ? "text-white/70" : "text-brand-text-muted")}>
                                      {lens.description || (isThisProgressive ? "Seamless multifocal vision across distance, intermediate, and reading." : "Single correction design.")}
                                    </p>
                                 </div>
                                 {isSelected && <div className="absolute top-1/2 right-3 -translate-y-1/2 text-white/5 pointer-events-none"><CheckCircle2 size={100} /></div>}
                              </button>
                            );
                         })}
                      </div>

                      {/* Inline Progressive Tier Selection */}
                      {isProgressive && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-slate-50 border-2 border-secondary/30 rounded-2xl p-6 space-y-6"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-brand-navy flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-secondary" />
                                Select Progressive Tier
                              </h4>
                              <p className="text-[10px] text-brand-text-muted mt-0.5">Choose your optical corridor width and adaptation technology</p>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary px-3 py-1 rounded-full w-fit">
                              Tier Selection Required
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {progressiveTiers.map((tier) => {
                              const isTierSelected = selectedTier?.tier === tier.tier;
                              return (
                                <div
                                  key={tier.tier}
                                  onClick={() => setSelectedTier(tier)}
                                  className={cn(
                                    "p-5 rounded-xl border-2 transition-all cursor-pointer space-y-3 relative flex flex-col justify-between",
                                    isTierSelected 
                                      ? "bg-white border-secondary shadow-md ring-2 ring-secondary/20" 
                                      : "bg-white/80 border-slate-200 hover:border-slate-300"
                                  )}
                                >
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={cn(
                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                                        tier.tier === "platinum" ? "bg-purple-100 text-purple-800" :
                                        tier.tier === "gold" ? "bg-amber-100 text-amber-800" :
                                        "bg-slate-100 text-slate-800"
                                      )}>
                                        {tier.displayName}
                                      </span>
                                      <span className="text-xs font-black text-brand-navy">₹{tier.price.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">{tier.fovLabel}</p>
                                    <p className="text-[10px] text-slate-600 leading-snug mt-2">{tier.description}</p>
                                  </div>

                                  {/* Performance Indicators */}
                                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[9px]">
                                    <div className="flex justify-between text-slate-500">
                                      <span>Distance Vision</span>
                                      <span className="font-bold text-slate-700">{tier.ratings.distance}/9</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                      <span>Intermediate / PC</span>
                                      <span className="font-bold text-slate-700">{tier.ratings.intermediate}/9</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                      <span>Reading & Near</span>
                                      <span className="font-bold text-slate-700">{tier.ratings.reading}/9</span>
                                    </div>
                                  </div>

                                  {isTierSelected && (
                                    <div className="absolute top-2 right-2">
                                      <CheckCircle2 size={16} className="text-secondary" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                   </motion.div>
                )}

                {/* STEP 3: REFRACTIVE INDEX (THICKNESS) — AUTO RECOMMENDED */}
                {step === "MATERIAL" && (
                   <motion.div key="st-mat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      {/* Rimless Frame Notice or Clinical Recommendation */}
                      {isRimless ? (
                        <div className="bg-blue-50 border-2 border-[#004AAD]/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#004AAD] block mb-1">
                              Rimless Frame Requirement
                            </span>
                            <p className="text-[11px] font-black uppercase tracking-widest text-[#03173D] flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#004AAD]" />
                              Polycarbonate 1.59 Required: <span className="text-[#004AAD] font-black">Impact-Resistant Calibrated</span>
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1">
                              Rimless frames require polycarbonate material to prevent stress cracking around drill holes.
                            </p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-[#004AAD] text-white px-3.5 py-1.5 rounded-full shadow">
                            Rimless Locked
                          </span>
                        </div>
                      ) : getRecommendedIndex() ? (
                        <div className="bg-secondary/15 border-2 border-secondary rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-navy block mb-1">
                              Clinical Index Recommendation
                            </span>
                            <p className="text-[11px] font-black uppercase tracking-widest text-brand-navy flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                              Recommended for your power: <span className="text-secondary font-black underline">{getRecommendedIndex()} ({indexOptions.find(o => o.indexValue === getRecommendedIndex())?.label})</span>
                            </p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-brand-navy text-white px-3.5 py-1.5 rounded-full shadow">
                            Auto-Recommended
                          </span>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-1">
                          <p className="text-[11px] font-black uppercase tracking-widest text-brand-navy">
                            Select your preferred refractive index & thickness
                          </p>
                          <p className="text-[9px] text-brand-text-muted">
                            Higher index numbers provide thinner, flatter profiles for stronger prescriptions.
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy flex items-center gap-3">
                               <span className="w-2 h-2 bg-secondary rounded-full" />
                               Refractive Index (Thickness)
                            </h4>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-brand-text-muted">
                              Select Preferred Profile
                            </span>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {indexOptions.map(opt => {
                               const isRecommended = getRecommendedIndex() === opt.indexValue;
                               const isSelected = selectedThickness?.indexValue === opt.indexValue;
                               const isAvailable = opt.available;

                               return (
                                 <button 
                                   key={opt.id} 
                                   disabled={!isAvailable}
                                   onClick={() => {
                                     if (isAvailable) setSelectedThickness(opt);
                                   }}
                                   className={cn(
                                     "p-6 border text-left transition-all rounded-2xl relative flex flex-col justify-between space-y-4",
                                     !isAvailable && "opacity-40 cursor-not-allowed grayscale",
                                     isSelected 
                                       ? "bg-brand-navy text-white border-secondary shadow-xl ring-2 ring-secondary/20" 
                                       : isRecommended 
                                         ? "bg-secondary/5 border-secondary/50 text-brand-navy hover:border-secondary" 
                                         : "bg-brand-background border-brand-navy/10 text-brand-navy hover:border-brand-navy/30"
                                   )}
                                 >
                                    <div>
                                       <div className="flex justify-between items-start mb-1">
                                          <span className={cn(
                                            "text-xs font-black uppercase tracking-wider",
                                            isSelected ? "text-white" : "text-brand-navy"
                                          )}>
                                             {opt.name}
                                          </span>
                                          {isRecommended && isAvailable && (
                                            <span className="text-[8px] font-black uppercase tracking-wider bg-secondary text-brand-navy px-2 py-0.5 rounded-full">
                                              ★ Recommended
                                            </span>
                                          )}
                                          {!isAvailable && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                              N/A
                                            </span>
                                          )}
                                       </div>
                                       <p className={cn("text-[10px] leading-relaxed mt-1", isSelected ? "text-white/70" : "text-brand-text-muted")}>
                                          {opt.unavailableReason || opt.desc}
                                       </p>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-brand-navy/5">
                                       <span className={cn("text-[9px] font-bold uppercase tracking-wider", isSelected ? "text-secondary" : "text-brand-text-muted")}>
                                          {opt.material}
                                       </span>
                                       <div className="flex items-center gap-2">
                                          <span className={cn("text-[11px] font-black", isSelected ? "text-secondary" : "text-brand-navy")}>
                                            {opt.price > 0 ? `+₹${opt.price.toLocaleString('en-IN')}` : "Included"}
                                          </span>
                                          {isSelected && (
                                            <CheckCircle2 size={16} className="text-secondary" />
                                          )}
                                       </div>
                                    </div>
                                 </button>
                               );
                            })}
                         </div>
                      </div>
                   </motion.div>
                )}

                {/* STEP 4: INCLUDED COATINGS & UPGRADE PACKAGES */}
                {step === "PACKAGES" && (
                   <motion.div key="st-packages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      {/* Included in your lens block */}
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-950 flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              Included in your lens
                            </h4>
                            <p className="text-[10px] text-emerald-800/80 mt-0.5">All essential protective optic armor comes standard with every lens</p>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-200/60 text-emerald-900 px-3 py-1 rounded-full w-fit">
                            All coatings included at no extra charge
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          {[
                            "UV Block Protection",
                            "Blue Cut",
                            "Scratch Resistant Shield",
                            "Anti-Reflective Coating",
                          ].map((coating) => (
                            <div key={coating} className="bg-white/80 border border-emerald-200/60 rounded-xl p-3 flex items-center gap-2.5">
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                              <span className="text-[10px] font-bold text-emerald-950">{coating}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Flat Upgrade Packages */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-widest text-brand-navy">
                            Choose an Upgrade Package
                          </h4>
                          <span className="text-[10px] text-brand-text-muted">Flat package pricing</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {(
                            [
                              {
                                key: "standard" as PackageKey,
                                title: "Standard Package",
                                subtitle: "All 4 included coatings — UV Block, Blue Cut, Scratch Shield & Anti-Reflective",
                                price: packagePricing.standard.price,
                              },
                              {
                                key: "photochromatic" as PackageKey,
                                title: "+ Photochromatic",
                                subtitle: "Transitions automatically from clear indoors to dark sunglasses outdoors in sunlight",
                                price: packagePricing.photochromatic.price,
                              },
                              {
                                key: "photochromatic_bluecut" as PackageKey,
                                title: "+ Photochromatic + Blue Cut",
                                subtitle: "The ultimate duo: light-adaptive transition tint with maximum digital blue ray filtration",
                                price: packagePricing.photochromatic_bluecut.price,
                              },
                            ]
                          ).map((pkg) => {
                            const isPkgSelected = selectedPackage === pkg.key;
                            return (
                              <div
                                key={pkg.key}
                                onClick={() => setSelectedPackage(pkg.key)}
                                className={cn(
                                  "p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                                  isPkgSelected
                                    ? "bg-secondary/5 border-secondary shadow-md ring-2 ring-secondary/20"
                                    : "bg-white border-brand-navy/10 hover:border-brand-navy/30"
                                )}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all",
                                    isPkgSelected ? "border-secondary bg-secondary" : "border-slate-300"
                                  )}>
                                    {isPkgSelected && <div className="w-2 h-2 rounded-full bg-brand-navy" />}
                                  </div>
                                  <div className="space-y-1">
                                    <h5 className="text-xs font-black uppercase tracking-wider text-brand-navy">{pkg.title}</h5>
                                    <p className="text-[10px] text-slate-600 max-w-lg">{pkg.subtitle}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 pl-9 sm:pl-0">
                                  <span className="text-lg font-black text-brand-navy">₹{pkg.price.toLocaleString()}</span>
                                  <p className="text-[9px] text-brand-text-muted font-bold uppercase tracking-wider">Total Lens Price</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                   </motion.div>
                )}

                {/* STEP 5: FINAL CONFIRMATION & CALIBRATION REVIEW */}
                {step === "SUMMARY" && (
                   <motion.div key="st-sum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <div className="p-8 bg-brand-background border border-brand-navy/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                         <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary block mb-1">Configuration Lock</span>
                            <h3 className="text-2xl font-serif italic text-brand-navy">Review & Calibrate</h3>
                         </div>
                         <div className="text-center sm:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy opacity-40">Integrated Lens Add-on</p>
                            <p className="text-3xl font-serif italic text-secondary font-black">₹{calculateTotalLensPrice().toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-navy opacity-40 italic">Optical Architecture</h4>
                            <div className="space-y-2">
                               <div className="flex justify-between p-4 bg-brand-background border-l-4 border-secondary rounded-r-xl">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-navy">Lens Category</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
                                    {selectedType?.name} {selectedTier && `(${selectedTier.displayName})`}
                                  </span>
                               </div>
                               <div className="flex justify-between p-4 bg-brand-background border-l-4 border-secondary rounded-r-xl">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-navy">Selected Package</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
                                    {packagePricing[selectedPackage].label} (₹{currentPackagePrice.toLocaleString()})
                                  </span>
                               </div>
                               {calculatePowerRangeExtra() > 0 && (
                                 <div className="flex justify-between p-4 bg-brand-background border-l-4 border-secondary rounded-r-xl">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-navy">Power Surcharge</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">+₹{calculatePowerRangeExtra().toLocaleString()}</span>
                                 </div>
                               )}
                               {selectedThickness && (
                                 <div className="flex justify-between p-4 bg-brand-background border-l-4 border-secondary rounded-r-xl">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-navy">Refractive Index</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
                                      {selectedThickness.name} {selectedThickness.price > 0 ? `(+₹{selectedThickness.price.toLocaleString('en-IN')})` : "(Included)"}
                                    </span>
                                 </div>
                               )}
                            </div>
                         </div>

                         <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-navy opacity-40 italic">Included Coatings (Free)</h4>
                            <div className="flex flex-wrap gap-2">
                               {[
                                 "UV Block Protection",
                                 "Blue Cut",
                                 "Scratch Resistant Shield",
                                 "Anti-Reflective Coating",
                               ].map((coating) => (
                                 <span key={coating} className="px-3.5 py-2 border border-emerald-300 text-[9px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 rounded-lg flex items-center gap-1.5">
                                   <CheckCircle2 size={12} className="text-emerald-600" />
                                   {coating}
                                 </span>
                               ))}
                            </div>
                         </div>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
             </div>
          </div>

          <footer className="p-8 border-t border-brand-navy/5 bg-white flex-shrink-0">
             {error && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-3 italic rounded-xl">
                  <Info size={14} />
                  {error}
               </motion.div>
             )}
             <button 
               onClick={handleNext}
               disabled={isProceedDisabled}
               className="w-full py-7 bg-brand-navy text-white text-[12px] font-black uppercase tracking-[0.5em] hover:bg-secondary hover:text-brand-navy transition-all duration-700 flex items-center justify-center gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)] disabled:opacity-20 disabled:grayscale active:scale-95 rounded-xl"
             >
                <span>{step === "SUMMARY" ? "INJECT TO CART" : "PROCEED TO NEXT PHASE"}</span>
                <ChevronRight size={18} />
             </button>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
