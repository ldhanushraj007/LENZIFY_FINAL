"use client";

import { useState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { Package, Tag, Maximize2, Info, Camera, Zap, Save, Layers, Loader2, Cpu, Sun, Laptop } from "lucide-react";
import { updateProductDirect } from "../../actions";
import { HOUSE_BRANDS } from "@/lib/data/house_brands";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-brand-navy text-white px-10 py-6 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-secondary transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Synchronizing...
        </>
      ) : (
        <>
          <Save size={16} className="group-hover:scale-110 transition-transform" />
          Finalize Changes
        </>
      )}
    </button>
  );
}

export default function EditProductForm({ 
  product, 
  categories, 
  lenses, 
  productLenses,
  productCategories = [] 
}: { 
  product: any, 
  categories: any[], 
  lenses: any[], 
  productLenses: string[],
  productCategories?: number[]
}) {
  const isSunglassesProduct = 
    product.product_type === "sunglasses" || 
    product.product_type === "sunglass" ||
    product.category_id === 5 ||
    (product.categories && (product.categories.name || "").toLowerCase().includes("sunglass")) ||
    (productCategories && productCategories.includes(5));

  const [productType, setProductType] = useState(
    product.product_type === "sunglasses" || isSunglassesProduct
      ? "sunglasses"
      : (product.product_type || "frame")
  );
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  const initialBrandId = () => {
    if (product.brand_id && HOUSE_BRANDS.some((b) => b.id === product.brand_id)) {
      return product.brand_id;
    }
    const match = HOUSE_BRANDS.find(
      (b) => b.name.toLowerCase() === (product.brand_name || product.brand || "").toLowerCase()
    );
    if (match) return match.id;
    return "custom";
  };
  const [selectedBrandId, setSelectedBrandId] = useState<string>(initialBrandId);
  const [customBrandName, setCustomBrandName] = useState<string>(
    HOUSE_BRANDS.some(
      (b) => b.name.toLowerCase() === (product.brand_name || product.brand || "").toLowerCase()
    )
      ? ""
      : (product.brand_name || product.brand || "")
  );
  // Use direct server action (no useActionState) so FormData file bytes are NOT stripped

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPrimaryPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setAdditionalPreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const [colors, setColors] = useState<{ name: string; hex: string; image: string | null; imagePreview?: string | null }[]>(() => {
    if (!product || !product.colors) return [];
    return product.colors.map((colorItem: any) => {
      if (typeof colorItem === 'string') {
        try {
          return JSON.parse(colorItem);
        } catch {
          return { name: colorItem, hex: "#000000", image: null };
        }
      }
      return colorItem;
    });
  });

  const [sizes, setSizes] = useState<{ label: string; inStock: boolean; stockQty: number }[]>(() => {
    if (!product || !product.sizes) return [];
    return product.sizes.map((sizeItem: any) => {
      if (typeof sizeItem === 'string') {
        try {
          return JSON.parse(sizeItem);
        } catch {
          return { label: sizeItem, inStock: true, stockQty: null };
        }
      }
      return sizeItem;
    });
  });

  const [hasSizeVariants, setHasSizeVariants] = useState(sizes.length > 0);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newSizeStock, setNewSizeStock] = useState(10);
  const [newSizeInStock, setNewSizeInStock] = useState(true);

  const initialSpecs = useMemo(() => {
    let s = product.specifications;
    if (typeof s === "string") {
      try {
        s = JSON.parse(s);
      } catch {
        s = {};
      }
    }
    return s || {};
  }, [product.specifications]);

  const [prescriptionAvailable, setPrescriptionAvailable] = useState<boolean>(() => {
    return Boolean(initialSpecs.prescription_available);
  });
  const [sunglassesLensColor, setSunglassesLensColor] = useState<string>(() => {
    return initialSpecs.lens_color || "Grey";
  });
  const [sunglassesLensType, setSunglassesLensType] = useState<string>(() => {
    return initialSpecs.lens_type || "Polarized";
  });
  const [uvProtection, setUvProtection] = useState<string>(() => {
    return initialSpecs.uv_protection || "UV400";
  });

  const addColor = () => {
    if (!newColorName.trim()) return;
    if (colors.some(c => c.name.toLowerCase() === newColorName.trim().toLowerCase())) {
      alert("Color name must be unique.");
      return;
    }
    setColors([...colors, { name: newColorName.trim(), hex: newColorHex, image: null }]);
    setNewColorName("");
    setNewColorHex("#000000");
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, idx) => idx !== index));
  };

  const handleColorImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = [...colors];
        updated[index] = {
          ...updated[index],
          imagePreview: reader.result as string
        };
        setColors(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSize = () => {
    if (!newSizeLabel.trim()) return;
    if (sizes.some(s => s.label.toLowerCase() === newSizeLabel.trim().toLowerCase())) {
      alert("Size label must be unique.");
      return;
    }
    setSizes([...sizes, { label: newSizeLabel.trim(), inStock: newSizeInStock, stockQty: newSizeStock }]);
    setNewSizeLabel("");
    setNewSizeStock(10);
    setNewSizeInStock(true);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, idx) => idx !== index));
  };

  return (
    <form action={updateProductDirect} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <input type="hidden" name="product_id" value={product.id} />
      <div className="lg:col-span-8 space-y-12">
        {false && (
          <div className="bg-red-50 border border-red-200 p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
             <Cpu size={18} className="text-red-500" />
             <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">Update failed</p>
          </div>
        )}
         {/* Product Type Selector */}
         <section className="bg-white border border-brand-navy/5 p-8 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy mb-4">Product Type Designation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
               {[
                 { id: "frame", label: "Frame" },
                 { id: "computer-glasses", label: "Computer Glasses" },
                 { id: "sunglasses", label: "Sunglasses" },
                 { id: "reading-glasses", label: "Reading Glasses" },
                 { id: "contact-lens", label: "Contact Lenses" },
                 { id: "accessory", label: "Accessory" }
               ].map(({ id: type, label }) => (
                 <label key={type} className={`cursor-pointer border-2 p-3 transition-all ${(productType === type || (type === "contact-lens" && productType === "lens")) ? 'border-secondary bg-secondary/5' : 'border-brand-navy/5 hover:border-brand-navy/20'}`}>
                    <input type="radio" name="product_type" value={type} className="hidden" checked={productType === type || (type === "contact-lens" && productType === "lens")} onChange={() => setProductType(type)} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy block text-center">{label}</span>
                 </label>
               ))}
            </div>
         </section>

         {/* Non-editable note for Computer Glasses */}
         {productType === "computer-glasses" && (
           <div className="p-6 bg-blue-50/90 border border-blue-200 rounded-xl space-y-2">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2.5">
                 <Laptop size={18} className="text-[#004AAD]" />
                 <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy">
                   Computer Glasses Protocol
                 </span>
               </div>
               <span className="px-3 py-1 bg-[#004AAD] text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                 Zero Power (Plano)
               </span>
             </div>
             <p className="text-[12px] font-bold text-brand-navy">
               Computer Glasses are zero power (Plano). No prescription required.
             </p>
             <p className="text-[11px] text-brand-navy/70">
               GST for Computer Glasses: 5% excluded (added on top of price at checkout).
             </p>
             <input type="hidden" name="category_id" value="7" />
           </div>
         )}

         {/* Non-editable note for Sunglasses */}
         {productType === "sunglasses" && (
           <div className="p-6 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2.5">
                 <Sun size={18} className="text-amber-800" />
                 <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                   Sunglasses Protocol
                 </span>
               </div>
               <span className="px-3 py-1 bg-amber-800 text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                 18% GST Inclusive
               </span>
             </div>
             <p className="text-[12px] font-bold text-amber-950">
               Sunglasses MRP is GST inclusive at 18%.
             </p>
             <p className="text-[11px] text-amber-900/80">
               Power pricing is fixed system-wide: 0 to -2: ₹800 | -2 to -4: ₹1,200 | -4 to -8: ₹1,600 | -8 to -12: ₹2,500. Admin does not set per-product power price.
             </p>
             <input type="hidden" name="category_id" value="5" />
           </div>
         )}

        {/* General Information */}
        <section className="bg-white border border-brand-navy/5 p-8 lg:p-12 space-y-10 shadow-sm relative overflow-hidden">
           <div className="flex items-center gap-4 mb-2">
              <Info size={16} className="text-secondary" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy">General Manifest</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors group-focus-within:text-secondary italic">Model Designation</label>
                 <input name="name" required defaultValue={product.name} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all" />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors group-focus-within:text-secondary italic">Brand Authority</label>
                 <select
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all"
                  >
                    <optgroup label="Lenzify House Brands">
                      {HOUSE_BRANDS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </optgroup>
                    <option value="custom">+ Enter a different brand</option>
                  </select>

                  {selectedBrandId === "custom" && (
                    <div className="pt-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors italic block mb-1">
                        Custom Brand Name
                      </label>
                      <input
                        type="text"
                        value={customBrandName}
                        onChange={(e) => setCustomBrandName(e.target.value)}
                        placeholder="e.g. RAY-BAN LUX"
                        required={selectedBrandId === "custom"}
                        className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all"
                      />
                    </div>
                  )}

                  <input
                    type="hidden"
                    name="brand_id"
                    value={selectedBrandId !== "custom" ? selectedBrandId : ""}
                  />
                  <input
                    type="hidden"
                    name="brand_name"
                    value={
                      selectedBrandId !== "custom"
                        ? (HOUSE_BRANDS.find((b) => b.id === selectedBrandId)?.name || "")
                        : customBrandName
                    }
                  />
                  <input
                    type="hidden"
                    name="brand"
                    value={
                      selectedBrandId !== "custom"
                        ? (HOUSE_BRANDS.find((b) => b.id === selectedBrandId)?.name || "")
                        : customBrandName
                    }
                  />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors group-focus-within:text-secondary italic">Unit SKU (Unique)</label>
                 <input name="sku" required defaultValue={product.sku} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all uppercase" />
              </div>
           </div>

           <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors group-focus-within:text-secondary italic">Tactical Brief (Description)</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const ta = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
                      if (ta) {
                        const start = ta.selectionStart;
                        const end = ta.selectionEnd;
                        const val = ta.value;
                        const insert = (start === 0 || val[start - 1] === '\n') ? "• " : "\n• ";
                        ta.value = val.substring(0, start) + insert + val.substring(end);
                        ta.focus();
                        ta.selectionStart = ta.selectionEnd = start + insert.length;
                      }
                    }}
                    className="px-2.5 py-1 bg-brand-background border border-brand-navy/10 hover:border-secondary text-[9px] font-bold uppercase tracking-wider text-brand-navy rounded transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>• Bullet Point</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ta = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
                      if (ta) {
                        const start = ta.selectionStart;
                        const end = ta.selectionEnd;
                        const selected = ta.value.substring(start, end) || "bold text";
                        const insert = `**${selected}**`;
                        ta.value = ta.value.substring(0, start) + insert + ta.value.substring(end);
                        ta.focus();
                      }
                    }}
                    className="px-2 py-1 bg-brand-background border border-brand-navy/10 hover:border-secondary text-[9px] font-bold uppercase tracking-wider text-brand-navy rounded transition-all cursor-pointer"
                  >
                    B
                  </button>
                </div>
              </div>
              <textarea name="description" rows={5} required defaultValue={product.description} placeholder="Provide detailed model specifications... Click • Bullet Point to insert formatted items." className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all resize-y" />
           </div>

           {/* Pack Configuration - only shown for contact lenses */}
           {(productType === "contact-lens" || productType === "contact_lens" || productType === "lens") && (
              <div className="space-y-4 pt-6 border-t border-brand-navy/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy">Pack Configuration</h4>
                    <p className="text-[9px] text-brand-text-muted mt-0.5">Pack size info for customer display</p>
                  </div>
                  <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-[9px] font-bold uppercase tracking-wider rounded">
                    Contact Lens Specs
                  </span>
                </div>

                <div className="max-w-md space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-brand-navy">Pack Size *</label>
                  <input
                    name="pack_size"
                    defaultValue={product.pack_size || initialSpecs.pack_size || ""}
                    placeholder="e.g. 6 lenses per pack or 30 lenses / box"
                    className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all"
                  />
                  <p className="text-[8px] text-brand-text-muted">Feeds customer-facing display on product cards & detail pages</p>
                </div>
              </div>
           )}

           {/* Deployment Sectors moved to sidebar */}
        </section>
        {/* Pricing & Stock */}
        <section className="bg-white border border-brand-navy/5 p-8 lg:p-12 space-y-10 shadow-sm relative overflow-hidden">
           <div className="flex items-center gap-4 mb-2">
              <Tag size={16} className="text-secondary" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy">Economic Protocols</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Base Value (₹)</label>
                 <input name="price" type="number" step="0.01" required defaultValue={product.price} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-secondary transition-all" />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Incentive Price (₹)</label>
                 <input name="offer_price" type="number" step="0.01" defaultValue={product.discount_price || ""} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-secondary transition-all" />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Inventory Buffer</label>
                 <input name="stock" type="number" required defaultValue={product.stock} className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-secondary transition-all" />
              </div>
           </div>
        </section>

        {/* Optical Matrix (Specifications) - only shown for frames */}
        {productType !== "accessory" && productType !== "contact-lens" && (
           <section className="bg-white border border-brand-navy/5 p-8 lg:p-12 space-y-10 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-4 mb-2">
                 <Maximize2 size={16} className="text-secondary" />
                 <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy">Optical Matrix</h3>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left mb-8">
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-secondary italic">Frame Type *</label>
                     <select 
                       name="frame_type" 
                       required 
                       defaultValue={product.frame_type || "full_rim"} 
                       className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer"
                     >
                       <option value="rimless">Rimless</option>
                       <option value="half_rim">Half Rim</option>
                       <option value="full_rim">Full Rim / Full Metal</option>
                       <option value="shell">Shell</option>
                     </select>
                  </div>
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Geometry (Shape)</label>
                     <select name="shape" defaultValue={product.shape || ""} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer">
                       <option value="">N/A</option>
                       <option value="Round">Round</option>
                       <option value="Square">Square</option>
                       <option value="Aviator">Aviator</option>
                       <option value="Rectangular">Rectangular</option>
                       <option value="Cat-Eye">Cat-Eye</option>
                       <option value="Geometric">Geometric</option>
                       <option value="Wayfarer">Wayfarer</option>
                       <option value="Clubmaster">Clubmaster</option>
                     </select>
                  </div>
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Scale Factor (Size)</label>
                     <select name="size" defaultValue={product.size || ""} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer">
                       <option value="">N/A</option>
                       <option value="Small">Small</option>
                       <option value="Medium">Medium</option>
                       <option value="Large">Large</option>
                       <option value="Extra Large">Extra Large</option>
                     </select>
                  </div>
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Frame Material</label>
                     <select name="material" defaultValue={product.material || ""} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer">
                       <option value="">N/A</option>
                       <option value="Acetate">Acetate</option>
                       <option value="Metal">Metal</option>
                       <option value="TR90">TR90 (Flexible Plastic)</option>
                       <option value="Titanium">Titanium</option>
                       <option value="Mixed">Mixed (Metal + Plastic)</option>
                       <option value="Wood">Wood</option>
                       <option value="Carbon Fiber">Carbon Fiber</option>
                     </select>
                  </div>
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Chroma Profile (Color)</label>
                     <select name="color" defaultValue={product.color || ""} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer">
                       <option value="">N/A</option>
                       <option value="Black">Black</option>
                       <option value="Gold">Gold</option>
                       <option value="Silver">Silver</option>
                       <option value="Gunmetal">Gunmetal</option>
                       <option value="Tortoise">Tortoise / Havana</option>
                       <option value="Crystal">Crystal / Transparent</option>
                       <option value="Blue">Blue</option>
                       <option value="Brown">Brown</option>
                     </select>
                  </div>
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Target Gender</label>
                     <select name="gender" defaultValue={product.gender || "Unisex"} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer">
                       <option value="Unisex">Unisex</option>
                       <option value="Men">Men</option>
                       <option value="Women">Women</option>
                       <option value="Kids">Kids</option>
                     </select>
                  </div>
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Collection (Optional)</label>
                     <input name="collection" defaultValue={product.collection || ""} placeholder="e.g. Classic, Eco" className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all" />
                  </div>
                  <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Tags (Comma-separated)</label>
                     <input name="tags" defaultValue={Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '')} placeholder="e.g. premium, lightweight" className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all" />
                  </div>
               </div>

               {/* SUNGLASSES SPECIFIC: Lens Color, Lens Type, UV Protection & Prescription Toggle */}
               {(productType === "sunglasses" || isSunglassesProduct) && (
                 <div className="space-y-6 pt-6 border-t border-brand-navy/10">
                   <div className="flex items-center gap-2">
                     <Sun size={14} className="text-secondary" />
                     <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy">Sunglasses Optical Characteristics</h4>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2 group">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Lens Color / Tint Color *</label>
                       <select name="lens_color" value={sunglassesLensColor} onChange={e => setSunglassesLensColor(e.target.value)} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer">
                         <option value="Grey">Grey / Smoke</option>
                         <option value="Black">Dark Black</option>
                         <option value="Brown">Brown / Amber</option>
                         <option value="Green">Green / G15</option>
                         <option value="Blue">Blue Mirrored</option>
                         <option value="Silver">Silver Mirrored</option>
                         <option value="Gradient Grey">Gradient Grey</option>
                         <option value="Gradient Brown">Gradient Brown</option>
                       </select>
                     </div>
                     <div className="space-y-2 group">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Lens Type *</label>
                       <select name="lens_type" value={sunglassesLensType} onChange={e => setSunglassesLensType(e.target.value)} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer">
                         <option value="Polarized">Polarized</option>
                         <option value="Non-polarized">Non-polarized</option>
                       </select>
                     </div>
                     <div className="space-y-2 group">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">UV Protection *</label>
                       <select name="uv_protection" value={uvProtection} onChange={e => setUvProtection(e.target.value)} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer">
                         <option value="UV400">UV400 (100% Protection)</option>
                         <option value="UV380">UV380</option>
                         <option value="None">None</option>
                       </select>
                     </div>
                   </div>

                   {/* POWER AVAILABILITY TOGGLE */}
                   <div className="p-6 bg-brand-background border border-brand-navy/10 rounded-xl space-y-4">
                     <div className="flex items-center justify-between">
                       <div>
                         <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy">
                           Available with Prescription Power
                         </h4>
                         <p className="text-[9px] text-brand-text-muted mt-0.5">
                           Allow customers to order this sunglasses model with prescription lenses
                         </p>
                       </div>
                       <label className="flex items-center gap-3 cursor-pointer select-none">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy">
                           {prescriptionAvailable ? "Yes (Available)" : "No (Non-Power Only)"}
                         </span>
                         <input
                           type="checkbox"
                           checked={prescriptionAvailable}
                           onChange={e => setPrescriptionAvailable(e.target.checked)}
                           className="w-5 h-5 accent-secondary cursor-pointer"
                         />
                       </label>
                     </div>
                     <input type="hidden" name="prescription_available" value={prescriptionAvailable ? "true" : "false"} />
                     <div className="p-4 bg-white border border-brand-navy/10 rounded-lg">
                       <span className="text-[9px] font-bold uppercase tracking-widest text-secondary block mb-1">
                         Fixed System Power Pricing Notice:
                       </span>
                       <p className="text-[11px] font-medium text-brand-navy">
                         Power pricing is fixed: 0 to -2: ₹800 | -2 to -4: ₹1,200 | -4 to -8: ₹1,600 | -8 to -12: ₹2,500
                       </p>
                       <p className="text-[10px] text-brand-text-muted mt-1">
                         Power price is system-wide flat and automatically added when customer selects prescription lenses in storefront.
                       </p>
                     </div>
                   </div>
                 </div>
               )}
               {/* Color & Size Variant Management UI */}
              <div className="space-y-8 pt-4 border-t border-brand-navy/10">
                 {/* Colors Section */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy block">Color Swatch Management (Required)</label>
                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-brand-background p-4 border border-brand-navy/10 rounded-lg">
                       <div className="space-y-1 flex-1 min-w-[150px]">
                          <label className="text-[8px] font-bold uppercase text-brand-text-muted">Color Name</label>
                          <input 
                             type="text" 
                             value={newColorName} 
                             onChange={(e) => setNewColorName(e.target.value)} 
                             placeholder="e.g. Matte Black" 
                             className="w-full bg-white border border-brand-navy/10 px-3 py-2 text-[10px] outline-none" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase text-brand-text-muted block">HEX Color</label>
                          <div className="flex items-center gap-2">
                             <input 
                                type="color" 
                                value={newColorHex} 
                                onChange={(e) => setNewColorHex(e.target.value)} 
                                className="w-8 h-8 cursor-pointer border border-brand-navy/10 p-0" 
                             />
                             <input 
                                type="text" 
                                value={newColorHex} 
                                onChange={(e) => setNewColorHex(e.target.value)} 
                                className="w-20 bg-white border border-brand-navy/10 px-2 py-2 text-[10px] text-center font-mono outline-none" 
                             />
                          </div>
                       </div>
                       <button 
                          type="button" 
                          onClick={addColor} 
                          className="bg-brand-navy text-white text-[9px] font-bold uppercase tracking-wider px-4 py-2.5 hover:bg-secondary transition-colors cursor-pointer"
                       >
                          Add Color
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {colors.map((c, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-brand-background border border-brand-navy/10 rounded-lg">
                             <div className="flex items-center gap-3 min-w-0">
                                <div className="w-5 h-5 rounded-full border border-brand-navy/20 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy truncate">{c.name}</span>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                {(c.imagePreview || c.image) && (
                                   <img src={c.imagePreview || c.image || ""} className="w-8 h-8 object-contain border bg-white" />
                                )}
                                <label className="cursor-pointer bg-brand-navy text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1.5 hover:bg-secondary">
                                   Photo
                                   <input 
                                      type="file" 
                                      name={`color_image_${index}`} 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => handleColorImageChange(index, e)} 
                                   />
                                </label>
                                <button 
                                   type="button" 
                                   onClick={() => removeColor(index)} 
                                   className="text-red-500 hover:text-red-700 text-[10px] font-bold cursor-pointer"
                                >
                                   Remove
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                    {colors.length === 0 && (
                       <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider italic">At least one color is required.</p>
                    )}
                    <input type="hidden" name="colors" value={JSON.stringify(colors.map(c => ({ name: c.name, hex: c.hex, image: c.image })))} />
                 </div>

                 {/* Sizes Section */}
                 <div className="space-y-4 pt-4 border-t border-brand-navy/10">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy">Size Variant Management</label>
                       <label className="flex items-center gap-2 cursor-pointer select-none">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-muted">Has Size Variants</span>
                          <input 
                             type="checkbox" 
                             checked={hasSizeVariants} 
                             onChange={(e) => setHasSizeVariants(e.target.checked)} 
                             className="w-4 h-4 accent-secondary" 
                          />
                       </label>
                    </div>

                    {hasSizeVariants && (
                       <>
                          <div className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-brand-background p-4 border border-brand-navy/10 rounded-lg">
                             <div className="space-y-1 flex-1 min-w-[120px]">
                                <label className="text-[8px] font-bold uppercase text-brand-text-muted">Size Label (e.g. 48, S, L)</label>
                                <input 
                                   type="text" 
                                   value={newSizeLabel} 
                                   onChange={(e) => setNewSizeLabel(e.target.value)} 
                                   placeholder="e.g. 50" 
                                   className="w-full bg-white border border-brand-navy/10 px-3 py-2 text-[10px] outline-none" 
                                />
                             </div>
                             <div className="space-y-1 flex-1 min-w-[80px]">
                                <label className="text-[8px] font-bold uppercase text-brand-text-muted">Stock Quantity</label>
                                <input 
                                   type="number" 
                                   value={newSizeStock} 
                                   onChange={(e) => setNewSizeStock(parseInt(e.target.value) || 0)} 
                                   className="w-full bg-white border border-brand-navy/10 px-3 py-2 text-[10px] outline-none" 
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase text-brand-text-muted block">In Stock Status</label>
                                <label className="flex items-center gap-2 cursor-pointer py-2">
                                   <input 
                                      type="checkbox" 
                                      checked={newSizeInStock} 
                                      onChange={(e) => setNewSizeInStock(e.target.checked)} 
                                      className="w-4 h-4 accent-secondary" 
                                   />
                                   <span className="text-[9px] font-bold uppercase tracking-wider text-brand-navy">In Stock</span>
                                </label>
                             </div>
                             <button 
                                type="button" 
                                onClick={addSize} 
                                className="bg-brand-navy text-white text-[9px] font-bold uppercase tracking-wider px-4 py-2.5 hover:bg-secondary transition-colors cursor-pointer"
                             >
                                Add Size
                             </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {sizes.map((s, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-brand-background border border-brand-navy/10 rounded-lg">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy">{s.label}</span>
                                      <span className="text-[8px] font-bold text-brand-text-muted uppercase tracking-wider mt-0.5">
                                         Stock: {s.stockQty} | {s.inStock ? "In Stock" : "Out of Stock"}
                                      </span>
                                   </div>
                                   <button 
                                      type="button" 
                                      onClick={() => removeSize(index)} 
                                      className="text-red-500 hover:text-red-700 text-[10px] font-bold cursor-pointer"
                                   >
                                      Remove
                                   </button>
                                </div>
                             ))}
                          </div>
                          {sizes.length === 0 && (
                             <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider italic">At least one size variant is required when variants are enabled.</p>
                          )}
                       </>
                    )}
                    <input type="hidden" name="sizes" value={JSON.stringify(hasSizeVariants ? sizes : [])} />
                 </div>
              </div>
           </section>
        )}
      </div>

      <div className="lg:col-span-4 space-y-12">
        {/* Categorization & Compatibility Options */}
        <section className="bg-[#000000] text-white p-8 lg:p-10 space-y-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl group-hover:bg-secondary/10 transition-all duration-1000"></div>
           <div className="space-y-2 border-b border-white/5 pb-6 bg-transparent relative z-10">
              <div className="flex items-center gap-4 mb-1">
                 <Layers size={16} className="text-secondary" />
                 <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">Deployment Matrix</h3>
              </div>
              <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold italic">Assign categories & modules</p>
           </div>
           
           <div className="space-y-8 relative z-10">
              {/* Categories Section */}
              <div>
                 <h4 className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-4">Target Categories</h4>
                 <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                     {/* Auto-Assigned Category Notice */}
                     {productType === "computer-glasses" && (
                       <div className="p-3 bg-blue-950/60 border border-blue-500/30 rounded text-left space-y-1 mb-2">
                         <span className="text-[8px] font-bold uppercase tracking-widest text-blue-300 block">Auto Sector Assignment</span>
                         <p className="text-[10px] font-bold text-white">Computer Glasses (Category #7)</p>
                         <p className="text-[9px] text-blue-200/70">Automatically linked to Sector 7 upon save.</p>
                         <input type="hidden" name="category_ids" value="7" />
                       </div>
                     )}
                     {(productType === "sunglasses" || isSunglassesProduct) && (
                       <div className="p-3 bg-amber-950/60 border border-amber-500/30 rounded text-left space-y-1 mb-2">
                         <span className="text-[8px] font-bold uppercase tracking-widest text-amber-300 block">Auto Sector Assignment</span>
                         <p className="text-[10px] font-bold text-white">Sunglasses (Category #5)</p>
                         <p className="text-[9px] text-amber-200/70">Automatically linked to Sector 5 upon save.</p>
                         <input type="hidden" name="category_ids" value="5" />
                       </div>
                     )}
                    {(() => {
                       const getTypes = () => {
                          if (productType === "frame") {
                             return [
                               { label: "Gender Profiles", type: "gender" },
                               { label: "Product Groups", type: "product" },
                               { label: "Usage Matrix", type: "usage" },
                               { label: "Collection Series", type: "collection" },
                               { label: "Display Protocol", type: "display" },
                               { label: "Material Type", type: "material" },
                               { label: "Frame Style", type: "frame_style" }
                             ];
                          }
                          if (productType === "lens") {
                             return [
                               { label: "Lens Type", type: "lens_type" },
                               { label: "Features", type: "feature" },
                               { label: "Material", type: "material" }
                             ];
                          }
                          return [
                             { label: "Product Groups", type: "product" },
                             { label: "Collection Series", type: "collection" },
                             { label: "Display Protocol", type: "display" }
                          ];
                       };

                       return getTypes().map((sector) => {
                          const options = categories.filter(c => c.type === sector.type);
                          if (options.length === 0) return null;

                          return (
                            <div key={sector.type} className="space-y-2">
                               <h5 className="text-[8px] font-bold uppercase tracking-widest text-secondary/70 italic border-b border-white/5 pb-1">{sector.label}</h5>
                               <div className="grid grid-cols-1 gap-2">
                                 {options.map(cat => (
                                   <label key={cat.id} className="flex items-center justify-between p-3 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/opt">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover/opt:text-white block">{cat.name}</span>
                                      <input type="checkbox" name="category_ids" value={cat.id} className="w-4 h-4 accent-secondary bg-black" defaultChecked={productCategories.includes(cat.id)} />
                                   </label>
                                 ))}
                               </div>
                            </div>
                          );
                       });
                    })()}
                 </div>
              </div>

              {/* Lens Assignment */}
              {productType === "lens" && (
                 <div className="pt-4 border-t border-white/5">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-4">Lens Assignment</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                       {lenses.length > 0 ? lenses.map((lens: any) => (
                         <label key={lens.id} className="flex items-center justify-between p-3 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/opt">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover/opt:text-white block">{lens.name}</span>
                               <span className="text-[8px] font-bold tracking-wider text-secondary/70 italic">₹{lens.price}</span>
                            </div>
                            <input type="checkbox" name="compatible_lenses" value={lens.id} className="w-4 h-4 accent-secondary bg-black" defaultChecked={productLenses.includes(lens.id)} />
                         </label>
                       )) : (
                         <p className="text-[9px] text-white/30 italic">No lenses available.</p>
                       )}
                    </div>
                 </div>
              )}

              {/* Metadata Options */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                  <label className="flex items-center justify-between p-4 border border-secondary/20 bg-secondary/5 hover:bg-secondary/10 transition-all cursor-pointer group/opt">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Mark as Featured</span>
                       <input type="checkbox" name="is_featured" value="true" className="w-4 h-4 accent-secondary bg-black" defaultChecked={product.is_featured} />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/opt">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover/opt:text-white block">Trending Model</span>
                       <input type="checkbox" name="is_trending" value="true" className="w-4 h-4 accent-secondary bg-black" defaultChecked={product.is_trending} />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/opt">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover/opt:text-white block">New Arrival</span>
                       <input type="checkbox" name="is_new_arrival" value="true" className="w-4 h-4 accent-secondary bg-black" defaultChecked={product.is_new_arrival} />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/opt">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover/opt:text-white block">Editor's Choice</span>
                       <input type="checkbox" name="is_editors_choice" value="true" className="w-4 h-4 accent-secondary bg-black" defaultChecked={product.is_editors_choice} />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer group/opt mt-6">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live Status (Enabled)</span>
                       <input type="checkbox" name="is_enabled" value="true" className="w-4 h-4 accent-emerald-500 bg-black" defaultChecked={product.is_enabled ?? true} />
                  </label>
              </div>
           </div>
        </section>

        {/* Visual Assets */}
        <section className="bg-white border border-brand-navy/5 p-8 lg:p-10 space-y-8 shadow-sm">
           <div className="flex items-center gap-4 mb-2">
              <Camera size={16} className="text-secondary" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy">Visual Interface</h3>
           </div>
           
           <div className="space-y-4">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Primary Model Image (Leave empty to keep current)</label>
                  <div className="flex gap-6 items-start">
                     <div className="flex-1">
                        <input type="file" name="primary_image_file" accept="image/*" onChange={handlePrimaryChange} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-medium tracking-wider outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-brand-navy file:text-white" />
                        {!primaryPreview && product.primary_image && (
                           <p className="text-[8px] text-brand-navy/40 mt-2 font-bold uppercase tracking-widest italic">Current Image active</p>
                        )}
                     </div>
                     {(primaryPreview || product.primary_image) && (
                        <div className="w-24 h-24 border border-brand-navy/10 bg-brand-background p-2 relative group">
                           <img src={primaryPreview || product.primary_image} alt="Preview" className="w-full h-full object-contain" />
                           <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white uppercase tracking-widest">{primaryPreview ? 'New Selection' : 'Current'}</span>
                           </div>
                        </div>
                     )}
                  </div>
               <div className="space-y-4">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Additional Views (Upload Multiple)</label>
                  <div className="space-y-4">
                     <input type="file" name="additional_images_files" accept="image/*" multiple onChange={handleAdditionalChange} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-medium tracking-wider outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-brand-navy file:text-white" />
                     {additionalPreviews.length > 0 && (
                        <div className="flex flex-wrap gap-3 p-4 border border-dashed border-brand-navy/10 bg-brand-background/50">
                           {additionalPreviews.map((preview, idx) => (
                              <div key={idx} className="w-16 h-16 border border-brand-navy/5 bg-white p-1">
                                 <img src={preview} alt={`Preview ${idx}`} className="w-full h-full object-contain" />
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
              <div className="space-y-2 p-4 border border-brand-navy/10 bg-brand-background">
                 <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-navy italic">
                   <Zap size={10} className="text-secondary" /> 360° Sequence Data (JSON URLs)
                 </label>
                 <textarea name="images_360" defaultValue={JSON.stringify(product.images_360 || [])} rows={3} className="w-full bg-transparent border-t border-brand-navy/10 mt-3 pt-3 text-[10px] font-mono tracking-wider outline-none resize-none" />
              </div>
           </div>
        </section>

        {/* Finalize */}
        <div className="pt-8">
           <SubmitButton />
        </div>
      </div>
    </form>
  );
}
