"use client";

import { useState, useTransition } from "react";
import {
  Tag,
  Plus,
  KeySquare,
  Trash2,
  Edit2,
  CalendarDays,
  Target,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  saveCoupon,
  toggleCouponActive,
  toggleCouponShowOnOffers,
  deleteCoupon,
  CouponPayload,
} from "./actions";
import { cn } from "@/lib/utils";

const APPLIES_TO_OPTIONS = [
  { value: "all", label: "All Products" },
  { value: "eyeglasses", label: "Eyeglasses" },
  { value: "sunglasses", label: "Sunglasses" },
  { value: "contact-lens", label: "Contact Lenses" },
  { value: "computer-glasses", label: "Computer Glasses" },
  { value: "reading-glasses", label: "Reading Glasses" },
  { value: "lenses", label: "Prescription Lenses" },
  { value: "accessories", label: "Accessories" },
];

export interface CouponItem {
  id: number;
  code: string;
  title?: string | null;
  description?: string | null;
  discount_type: "flat" | "percentage";
  discount_value: number;
  minimum_order_value?: number | null;
  min_order?: number | null;
  applicable_to?: string | null;
  applicable_category?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  expiry?: string | null;
  usage_limit?: number | null;
  usage_count?: number | null;
  is_active?: boolean | null;
  is_enabled?: boolean | null;
  show_on_offers_page?: boolean | null;
  created_at?: string | null;
}

interface CouponManagerProps {
  initialCoupons: CouponItem[];
}

export default function CouponManager({ initialCoupons }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percentage">("flat");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [minOrder, setMinOrder] = useState<string>("0");
  const [appliesTo, setAppliesTo] = useState<string>("all");
  const [validFrom, setValidFrom] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [noExpiry, setNoExpiry] = useState<boolean>(true);
  const [validUntil, setValidUntil] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [showOnOffers, setShowOnOffers] = useState<boolean>(true);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setTitle("");
    setDescription("");
    setDiscountType("flat");
    setDiscountValue("");
    setMinOrder("0");
    setAppliesTo("all");
    setValidFrom(new Date().toISOString().split("T")[0]);
    setNoExpiry(true);
    setValidUntil("");
    setUsageLimit("");
    setIsActive(true);
    setShowOnOffers(true);
    setMobileFormOpen(false);
  };

  const handleEdit = (coupon: CouponItem) => {
    setEditingId(coupon.id);
    setCode(coupon.code || "");
    setTitle(coupon.title || "");
    setDescription(coupon.description || "");
    setDiscountType(coupon.discount_type || "flat");
    setDiscountValue(String(coupon.discount_value ?? ""));
    setMinOrder(
      String(
        coupon.minimum_order_value && coupon.minimum_order_value > 0
          ? coupon.minimum_order_value
          : coupon.min_order || 0
      )
    );
    setAppliesTo(coupon.applicable_to || "all");

    if (coupon.valid_from) {
      setValidFrom(new Date(coupon.valid_from).toISOString().split("T")[0]);
    } else {
      setValidFrom(new Date().toISOString().split("T")[0]);
    }

    const expiryDate = coupon.valid_until || coupon.expiry;
    if (expiryDate) {
      setNoExpiry(false);
      setValidUntil(new Date(expiryDate).toISOString().split("T")[0]);
    } else {
      setNoExpiry(true);
      setValidUntil("");
    }

    setUsageLimit(coupon.usage_limit ? String(coupon.usage_limit) : "");
    setIsActive(coupon.is_active ?? coupon.is_enabled ?? true);
    setShowOnOffers(coupon.show_on_offers_page ?? true);

    setMobileFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }

    const payload: CouponPayload = {
      id: editingId || undefined,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      discount_type: discountType,
      discount_value: val,
      minimum_order_value: parseFloat(minOrder) || 0,
      applicable_to: appliesTo,
      valid_from: validFrom || undefined,
      valid_until: noExpiry ? null : validUntil || null,
      usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
      is_active: isActive,
      show_on_offers_page: showOnOffers,
    };

    startTransition(async () => {
      const res = await saveCoupon(payload);
      if (res.success) {
        toast.success(editingId ? "Coupon updated successfully" : "Coupon created successfully");
        setCoupons((prev) => {
          if (editingId) {
            return prev.map((c) =>
              c.id === editingId
                ? {
                    ...c,
                    ...payload,
                    min_order: payload.minimum_order_value,
                    expiry: payload.valid_until,
                    is_enabled: payload.is_active,
                  }
                : c
            );
          } else {
            const newCoupon: CouponItem = {
              id: Date.now(),
              ...payload,
              usage_count: 0,
              created_at: new Date().toISOString(),
              min_order: payload.minimum_order_value,
              expiry: payload.valid_until,
              is_enabled: payload.is_active,
            };
            return [newCoupon, ...prev];
          }
        });
        resetForm();
      } else {
        toast.error(res.error || "Failed to save coupon");
      }
    });
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    const nextVal = !(coupon.is_active ?? coupon.is_enabled ?? true);
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: nextVal, is_enabled: nextVal } : c))
    );

    startTransition(async () => {
      const res = await toggleCouponActive(coupon.id, nextVal);
      if (res.success) {
        toast.success(`Coupon ${coupon.code} is now ${nextVal ? "Active" : "Inactive"}`);
      } else {
        toast.error("Failed to update status");
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, is_active: !nextVal, is_enabled: !nextVal } : c
          )
        );
      }
    });
  };

  const handleToggleOffers = async (coupon: CouponItem) => {
    const nextVal = !(coupon.show_on_offers_page ?? true);
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, show_on_offers_page: nextVal } : c))
    );

    startTransition(async () => {
      const res = await toggleCouponShowOnOffers(coupon.id, nextVal);
      if (res.success) {
        toast.success(
          `Coupon ${coupon.code} ${nextVal ? "will show" : "is hidden"} on Offers page`
        );
      } else {
        toast.error("Failed to update visibility");
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, show_on_offers_page: !nextVal } : c))
        );
      }
    });
  };

  const handleDelete = async (coupon: CouponItem) => {
    if (!confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) {
      return;
    }

    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));

    startTransition(async () => {
      const res = await deleteCoupon(coupon.id);
      if (res.success) {
        toast.success(`Coupon ${coupon.code} deleted`);
        if (editingId === coupon.id) resetForm();
      } else {
        toast.error("Failed to delete coupon");
        setCoupons((prev) => [coupon, ...prev]);
      }
    });
  };

  const filteredCoupons = coupons.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.code.toLowerCase().includes(term) ||
      (c.title && c.title.toLowerCase().includes(term)) ||
      (c.applicable_to && c.applicable_to.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Mobile Toggle Bar to expand/collapse form on small screens */}
      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setMobileFormOpen(!mobileFormOpen)}
          className="w-full bg-brand-navy text-white px-5 py-4 rounded-2xl flex items-center justify-between font-bold text-xs uppercase tracking-widest shadow-md hover:bg-secondary transition-colors"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} />
            {editingId ? `Editing Coupon #${editingId}` : "Create New Coupon"}
          </span>
          {mobileFormOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* FORM: CREATE / EDIT (XL: 4 cols, Mobile: Collapsible or visible on edit) */}
        <div
          className={cn(
            "xl:col-span-4 w-full xl:sticky xl:top-8 z-10 transition-all",
            !mobileFormOpen && !editingId && "hidden xl:block"
          )}
        >
          <div className="bg-brand-navy p-6 sm:p-8 lg:p-9 text-white shadow-2xl border border-white/10 rounded-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/20 shrink-0">
                  <KeySquare size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white">
                    {editingId ? `Edit Coupon #${editingId}` : "New Coupon"}
                  </h3>
                  <p className="text-[10px] text-white/50 tracking-wider">
                    {editingId ? "Update promotion values" : "Configure coupon parameters"}
                  </p>
                </div>
              </div>
              {(editingId || mobileFormOpen) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[10px] uppercase font-bold tracking-widest text-secondary hover:underline px-2 py-1"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Coupon Code */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Coupon Code <span className="text-secondary">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LENZ299"
                  className="w-full bg-white/5 border border-white/15 px-4 py-3.5 text-sm sm:text-xs font-bold tracking-widest outline-none focus:border-secondary transition-all uppercase placeholder:text-white/20 rounded-xl"
                />
                <p className="text-[9px] text-white/40 italic">Auto-uppercased as you type</p>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Title (Customer facing)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Save ₹299 on your order"
                  className="w-full bg-white/5 border border-white/15 px-4 py-3 text-sm sm:text-xs tracking-wide outline-none focus:border-secondary transition-all placeholder:text-white/20 rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Use at checkout for instant discount"
                  className="w-full bg-white/5 border border-white/15 px-4 py-2.5 text-sm sm:text-xs tracking-wide outline-none focus:border-secondary transition-all placeholder:text-white/20 rounded-xl resize-none"
                />
              </div>

              {/* Discount Type Radio */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all text-xs font-bold tracking-wider",
                      discountType === "flat"
                        ? "border-secondary bg-secondary/15 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="discount_type"
                      value="flat"
                      checked={discountType === "flat"}
                      onChange={() => setDiscountType("flat")}
                      className="accent-secondary"
                    />
                    <span>Flat (₹)</span>
                  </label>
                  <label
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all text-xs font-bold tracking-wider",
                      discountType === "percentage"
                        ? "border-secondary bg-secondary/15 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="discount_type"
                      value="percentage"
                      checked={discountType === "percentage"}
                      onChange={() => setDiscountType("percentage")}
                      className="accent-secondary"
                    />
                    <span>Percent (%)</span>
                  </label>
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  {discountType === "flat" ? "Discount Amount (₹)" : "Discount Percentage (%)"}{" "}
                  <span className="text-secondary">*</span>
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0.01"
                  max={discountType === "percentage" ? "100" : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "flat" ? "299" : "20"}
                  className="w-full bg-white/5 border border-white/15 px-4 py-3 text-sm sm:text-xs font-bold tracking-widest outline-none focus:border-secondary transition-all placeholder:text-white/20 rounded-xl"
                />
              </div>

              {/* Minimum Order Value */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/15 px-4 py-3 text-sm sm:text-xs font-bold tracking-widest outline-none focus:border-secondary transition-all placeholder:text-white/20 rounded-xl"
                />
              </div>

              {/* Applies To dropdown */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Applies To
                </label>
                <select
                  value={appliesTo}
                  onChange={(e) => setAppliesTo(e.target.value)}
                  className="w-full bg-brand-navy border border-white/15 px-4 py-3 text-sm sm:text-xs font-bold tracking-wider outline-none focus:border-secondary transition-all rounded-xl cursor-pointer text-white"
                >
                  {APPLIES_TO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-brand-navy text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 px-3 py-2.5 text-xs font-mono outline-none focus:border-secondary transition-all rounded-xl [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                      Valid Until
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-[9px] text-white/60">
                      <input
                        type="checkbox"
                        checked={noExpiry}
                        onChange={(e) => {
                          setNoExpiry(e.target.checked);
                          if (e.target.checked) setValidUntil("");
                        }}
                        className="accent-secondary"
                      />
                      <span>No expiry</span>
                    </label>
                  </div>
                  {!noExpiry ? (
                    <input
                      type="date"
                      required={!noExpiry}
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 px-3 py-2.5 text-xs font-mono outline-none focus:border-secondary transition-all rounded-xl [color-scheme:dark]"
                    />
                  ) : (
                    <div className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-xs text-white/30 italic rounded-xl">
                      Never expires
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Limit */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Leave blank for unlimited"
                  className="w-full bg-white/5 border border-white/15 px-4 py-3 text-sm sm:text-xs font-bold tracking-widest outline-none focus:border-secondary transition-all placeholder:text-white/20 rounded-xl"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <p className="text-xs font-bold text-white tracking-wider">Is Active</p>
                    <p className="text-[9px] text-white/40">Coupon can be applied at checkout</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 accent-secondary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <p className="text-xs font-bold text-white tracking-wider">Show on Offers Page</p>
                    <p className="text-[9px] text-white/40">Display on customer-facing /offers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showOnOffers}
                    onChange={(e) => setShowOnOffers(e.target.checked)}
                    className="w-5 h-5 accent-secondary cursor-pointer"
                  />
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-secondary text-brand-navy hover:bg-white font-bold text-xs uppercase tracking-[0.25em] py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : editingId ? (
                    <>
                      <Edit2 size={14} /> Update Coupon
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Create Coupon
                    </>
                  )}
                </button>

                {(editingId || mobileFormOpen) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-4 border border-white/20 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* LIST VIEW (XL: 8 cols) */}
        <div className="xl:col-span-8 space-y-5">
          {/* Search bar & status summary */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 sm:p-5 rounded-2xl border border-brand-navy/10 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-navy/30"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search code or title..."
                className="w-full bg-brand-background border border-brand-navy/10 pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl outline-none focus:border-secondary"
              />
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-bold text-brand-navy/60 px-1">
              <span>
                Total: <strong className="text-brand-navy">{coupons.length}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-600">
                Active:{" "}
                <strong>
                  {
                    coupons.filter(
                      (c) =>
                        (c.is_active ?? c.is_enabled ?? true) &&
                        (!c.valid_until || new Date(c.valid_until) >= new Date())
                    ).length
                  }
                </strong>
              </span>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (< md) */}
          <div className="md:hidden space-y-4">
            {filteredCoupons.map((c) => {
              const isExpired = Boolean(
                (c.valid_until || c.expiry) &&
                  new Date(c.valid_until || c.expiry!) < new Date()
              );
              const active = c.is_active ?? c.is_enabled ?? true;
              const onOffers = c.show_on_offers_page ?? true;
              const appliesLabel =
                APPLIES_TO_OPTIONS.find((o) => o.value === c.applicable_to)?.label ||
                c.applicable_to ||
                "All Products";

              return (
                <div
                  key={c.id}
                  className={cn(
                    "bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-all",
                    editingId === c.id ? "border-secondary ring-2 ring-secondary/20 bg-secondary/[0.02]" : "border-brand-navy/10"
                  )}
                >
                  {/* Top row: Code + Status Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black tracking-wider uppercase text-brand-navy">
                        {c.code}
                      </span>
                      <p className="text-[10px] text-brand-navy/50 font-bold uppercase tracking-wider mt-0.5">
                        {appliesLabel}
                      </p>
                    </div>

                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                        <Clock size={10} /> Expired
                      </span>
                    ) : active ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        <XCircle size={10} /> Inactive
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <p className="font-bold text-xs text-brand-navy">
                      {c.title || `Save with ${c.code}`}
                    </p>
                    {c.description && (
                      <p className="text-[11px] text-brand-navy/60 mt-0.5 leading-snug">
                        {c.description}
                      </p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2.5 bg-brand-background p-3 rounded-xl border border-brand-navy/5 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-widest block">
                        Discount
                      </span>
                      <strong className="text-brand-navy text-xs">
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}% OFF`
                          : `₹${c.discount_value} FLAT`}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-widest block">
                        Min. Order
                      </span>
                      <span className="font-mono font-bold text-brand-navy text-xs">
                        ₹{(
                          c.minimum_order_value && c.minimum_order_value > 0
                            ? c.minimum_order_value
                            : c.min_order || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-widest block">
                        Valid Till
                      </span>
                      <span className={cn("text-[10px] font-medium", isExpired ? "text-red-600 font-bold" : "text-brand-navy/70")}>
                        {c.valid_until || c.expiry
                          ? new Date(c.valid_until || c.expiry!).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "No expiry"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-widest block">
                        Usage Count
                      </span>
                      <span className="text-[10px] font-bold text-brand-navy">
                        {c.usage_count || 0} {c.usage_limit ? `/ ${c.usage_limit}` : "uses"}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Toggles & Actions */}
                  <div className="pt-2 border-t border-brand-navy/5 flex items-center justify-between gap-3">
                    {/* Active switch */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                          active ? "bg-emerald-600" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            active ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className="text-[10px] font-bold text-brand-navy/70 uppercase">
                        {active ? "Active" : "Off"}
                      </span>
                    </div>

                    {/* Show on Offers switch */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleOffers(c)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                          onOffers ? "bg-secondary" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            onOffers ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                      <span className="text-[10px] font-bold text-brand-navy/70 uppercase">
                        {onOffers ? "Offers: On" : "Offers: Off"}
                      </span>
                    </div>

                    {/* Edit / Delete actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(c)}
                        className="p-2 text-brand-navy/70 hover:bg-brand-navy/5 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCoupons.length === 0 && (
              <div className="py-12 bg-white rounded-2xl border border-brand-navy/10 text-center p-6 text-brand-navy/40">
                <Tag size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No coupons match your filter</p>
              </div>
            )}
          </div>

          {/* TABLE VIEW (>= md) */}
          <div className="hidden md:block bg-white border border-brand-navy/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-navy/[0.03] border-b border-brand-navy/10 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-navy/60">
                    <th className="py-4 px-5">Code</th>
                    <th className="py-4 px-4">Title / Info</th>
                    <th className="py-4 px-4">Discount</th>
                    <th className="py-4 px-4">Min Order</th>
                    <th className="py-4 px-4">Applies To</th>
                    <th className="py-4 px-4">Valid Until</th>
                    <th className="py-4 px-4 text-center">Active</th>
                    <th className="py-4 px-4 text-center">On Offers</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-navy/5 text-xs font-medium">
                  {filteredCoupons.map((c) => {
                    const isExpired = Boolean(
                      (c.valid_until || c.expiry) &&
                        new Date(c.valid_until || c.expiry!) < new Date()
                    );
                    const active = c.is_active ?? c.is_enabled ?? true;
                    const onOffers = c.show_on_offers_page ?? true;
                    const appliesLabel =
                      APPLIES_TO_OPTIONS.find((o) => o.value === c.applicable_to)?.label ||
                      c.applicable_to ||
                      "All Products";

                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          "hover:bg-brand-navy/[0.015] transition-colors",
                          editingId === c.id && "bg-secondary/10"
                        )}
                      >
                        {/* Code + Status badge */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="font-mono font-bold text-sm tracking-wider uppercase text-brand-navy">
                              {c.code}
                            </span>
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                <Clock size={9} /> Expired
                              </span>
                            ) : active ? (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <CheckCircle2 size={9} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                <XCircle size={9} /> Inactive
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Title */}
                        <td className="py-4 px-4 max-w-[200px]">
                          <p className="font-bold text-brand-navy truncate">
                            {c.title || `Save with ${c.code}`}
                          </p>
                          {c.description && (
                            <p className="text-[10px] text-brand-navy/50 truncate">
                              {c.description}
                            </p>
                          )}
                          <p className="text-[9px] text-brand-navy/40 mt-1">
                            Used: <strong>{c.usage_count || 0}</strong>
                            {c.usage_limit ? ` / ${c.usage_limit}` : " times"}
                          </p>
                        </td>

                        {/* Discount */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-bold text-brand-navy bg-brand-navy/5 px-2.5 py-1 rounded-lg">
                            {c.discount_type === "percentage"
                              ? `${c.discount_value}% OFF`
                              : `₹${c.discount_value} FLAT`}
                          </span>
                        </td>

                        {/* Min Order */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-brand-navy/80">
                          ₹{(
                            c.minimum_order_value && c.minimum_order_value > 0
                              ? c.minimum_order_value
                              : c.min_order || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        {/* Applies To */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="text-[10px] font-semibold text-brand-navy/70 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md">
                            {appliesLabel}
                          </span>
                        </td>

                        {/* Valid Until */}
                        <td className="py-4 px-4 whitespace-nowrap text-[11px]">
                          {c.valid_until || c.expiry ? (
                            <span
                              className={cn(
                                "font-mono",
                                isExpired ? "text-red-600 font-bold" : "text-brand-navy/70"
                              )}
                            >
                              {new Date(c.valid_until || c.expiry!).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="text-brand-navy/40 italic">No expiry</span>
                          )}
                        </td>

                        {/* Active toggle */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            title={active ? "Deactivate coupon" : "Activate coupon"}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              active ? "bg-emerald-600" : "bg-gray-300"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                active ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </td>

                        {/* Show on Offers toggle */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleOffers(c)}
                            title={onOffers ? "Hide from Offers page" : "Show on Offers page"}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              onOffers ? "bg-secondary" : "bg-gray-300"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                onOffers ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(c)}
                              title="Edit Coupon"
                              className="p-2 text-brand-navy/60 hover:text-brand-navy hover:bg-brand-navy/5 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
                              title="Delete Coupon"
                              className="p-2 text-brand-navy/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCoupons.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-brand-navy/40">
                        <Tag size={36} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-semibold">No coupons match your filter</p>
                        <button
                          type="button"
                          onClick={resetForm}
                          className="mt-3 text-xs text-secondary font-bold uppercase tracking-wider underline cursor-pointer"
                        >
                          Create a coupon now
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
