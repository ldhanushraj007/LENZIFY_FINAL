"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Package, Tag, Maximize2, Info, Camera, Zap, ChevronRight, Save, Layers, Loader2, Cpu } from "lucide-react";
import { createProduct } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-brand-navy text-white text-[10px] font-bold uppercase tracking-[0.4em] py-6 shadow-xl hover:bg-secondary transition-all duration-700 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" /> AUTHORIZING DEPLOYMENT...
        </>
      ) : (
        <>
          <Save size={18} className="group-hover:scale-110 transition-transform" /> AUTHORIZE DEPLOYMENT
        </>
      )}
    </button>
  );
}

export default function NewProductForm({ categories, lenses }: { categories: any[], lenses: any[] }) {
  const [productType, setProductType] = useState("frame");
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);


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

  const [colors, setColors] = useState<{ name: string; hex: string; image: string | null; imagePreview?: string | null }[]>([]);
  const [sizes, setSizes] = useState<{ label: string; inStock: boolean; stockQty: number }[]>([]);
  const [hasSizeVariants, setHasSizeVariants] = useState(true);

  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newSizeStock, setNewSizeStock] = useState(10);
  const [newSizeInStock, setNewSizeInStock] = useState(true);

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

  const genders = categories.filter(c => c.type === 'gender').map(c => c.name);
  const collections = categories.filter(c => c.type === 'collection').map(c => c.name);
  const usageTypes = categories.filter(c => c.type === 'usage').map(c => c.name);
  const displayTypes = categories.filter(c => c.type === 'display').map(c => c.name);

  return (
    <form action={createProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8 space-y-12">
         {/* Product Type Selector */}
         <section className="bg-white border border-brand-navy/5 p-8 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy mb-4">Product Type Designation</h3>
            <div className="grid grid-cols-3 gap-6">
               {["frame", "lens", "accessory"].map(type => (
                 <label key={type} className={`cursor-pointer border-2 p-6 transition-all ${productType === type ? 'border-secondary bg-secondary/5' : 'border-brand-navy/5 hover:border-brand-navy/20'}`}>
                    <input type="radio" name="product_type" value={type} className="hidden" checked={productType === type} onChange={() => setProductType(type)} />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-brand-navy block text-center">{type}</span>
                 </label>
               ))}
            </div>
         </section>

        {/* General Information */}
        <section className="bg-white border border-brand-navy/5 p-8 lg:p-12 space-y-10 shadow-sm relative overflow-hidden">
           <div className="flex items-center gap-4 mb-2">
              <Info size={16} className="text-secondary" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy">General Manifest</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors group-focus-within:text-secondary italic">Model Designation</label>
                 <input name="name" required placeholder="e.g. AERO STEALTH BLUE" className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all" suppressHydrationWarning />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors group-focus-within:text-secondary italic">Brand Authority</label>
                 <input name="brand" required placeholder="e.g. RAY-BAN LUX" className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all" suppressHydrationWarning />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors group-focus-within:text-secondary italic">Unit SKU (Unique)</label>
                 <input name="sku" required placeholder="LZ-AERO-001" className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all uppercase" suppressHydrationWarning />
              </div>
           </div>

           <div className="space-y-2 group">
              <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted transition-colors group-focus-within:text-secondary italic">Tactical Brief (Description)</label>
              <textarea name="description" rows={4} required placeholder="Provide detailed model specifications..." className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-medium tracking-wider outline-none focus:border-secondary transition-all resize-none" suppressHydrationWarning />
           </div>

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
                 <input name="price" type="number" step="0.01" required className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-secondary transition-all" suppressHydrationWarning />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Incentive Price (₹)</label>
                 <input name="offer_price" type="number" step="0.01" className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-secondary transition-all" suppressHydrationWarning />
              </div>
              <div className="space-y-2 group">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Inventory Buffer</label>
                 <input name="stock" type="number" defaultValue="0" required className="w-full bg-brand-background border border-brand-navy/10 px-6 py-4 text-[11px] font-bold tracking-wider outline-none focus:border-secondary transition-all" suppressHydrationWarning />
              </div>
           </div>
        </section>

        {/* Optical Matrix (Specifications) */}
        {productType !== "accessory" && (
           <section className="bg-white border border-brand-navy/5 p-8 lg:p-12 space-y-10 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-4 mb-2">
                 <Maximize2 size={16} className="text-secondary" />
                 <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy">Optical Matrix (Specs & Variants)</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center md:text-left mb-8">
                 {[
                   { label: "Unit Geometry", name: "shape", options: ["Round", "Square", "Aviator", "Rectangular", "Cat-Eye"] },
                   { label: "Chroma Profile", name: "color", options: ["Black", "Gold", "Silver", "Tortoise", "Crystal"] },
                   { label: "Scale Factor", name: "size", options: ["Small", "Medium", "Large"] },
                 ].map((spec) => (
                   <div key={spec.name} className="space-y-2 group">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">{spec.label}</label>
                      <select name={spec.name} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-secondary transition-all cursor-pointer" suppressHydrationWarning>
                        <option value="">N/A</option>
                        {spec.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                   </div>
                 ))}
              </div>
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
                                      <input type="checkbox" name="category_ids" value={cat.id} className="w-4 h-4 accent-secondary bg-black" />
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
                            <input type="checkbox" name="compatible_lenses" value={lens.id} className="w-4 h-4 accent-secondary bg-black" defaultChecked />
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
                       <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Mark as Featured Model</span>
                       <input type="checkbox" name="is_featured" value="true" className="w-4 h-4 accent-secondary bg-black" />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/opt">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover/opt:text-white block">Trending Model</span>
                       <input type="checkbox" name="is_trending" value="true" className="w-4 h-4 accent-secondary bg-black" />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/opt">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover/opt:text-white block">New Arrival</span>
                       <input type="checkbox" name="is_new_arrival" value="true" className="w-4 h-4 accent-secondary bg-black" />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/opt">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover/opt:text-white block">Editor's Choice</span>
                       <input type="checkbox" name="is_editors_choice" value="true" className="w-4 h-4 accent-secondary bg-black" />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer group/opt mt-6">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Initial Live Status (Enabled)</span>
                       <input type="checkbox" name="is_enabled" value="true" className="w-4 h-4 accent-emerald-500 bg-black" defaultChecked />
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
              <div className="space-y-4">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Primary Model Image</label>
                  <div className="flex gap-6 items-start">
                     <div className="flex-1">
                        <input type="file" name="primary_image_file" accept="image/*" required onChange={handlePrimaryChange} className="w-full bg-brand-background border border-brand-navy/10 px-4 py-3 text-[10px] font-medium tracking-wider outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-brand-navy file:text-white" />
                     </div>
                     {primaryPreview && (
                        <div className="w-24 h-24 border border-brand-navy/10 bg-brand-background p-2 relative group">
                           <img src={primaryPreview} alt="Preview" className="w-full h-full object-contain" />
                           <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white uppercase tracking-widest">Selected</span>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted italic">Additional Views</label>
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
           </div>
           <div className="space-y-2 p-4 border border-brand-navy/10 bg-brand-background">
              <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-navy italic">
                <Zap size={10} className="text-secondary" /> 360° Sequence Data (JSON URLs)
              </label>
              <textarea name="images_360" defaultValue="[]" rows={3} className="w-full bg-transparent border-t border-brand-navy/10 mt-3 pt-3 text-[10px] font-mono tracking-wider outline-none resize-none" />
           </div>
        </section>

        {/* Finalize */}
        <div className="pt-8">
           <SubmitButton />
           <p className="text-center text-[7px] text-brand-navy/20 uppercase font-bold tracking-widest mt-6 italic">Protocol v4.0.2 - Secured Upload</p>
        </div>
      </div>
    </form>
  );
}
