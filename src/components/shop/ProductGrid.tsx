"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/store/ProductCard";
import LensCard from "@/components/store/LensCard";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    if (val === "[]") return [];
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return [val];
  }
  return [];
};

const COLOR_HEX_MAP: Record<string, string> = {
  transparent: "#E0F2FE",
  clear: "#F1F5F9",
  white: "#FFFFFF",
  black: "#111827",
  blue: "#2563EB",
  green: "#16A34A",
  brown: "#78350F",
  hazel: "#A16207",
  grey: "#6B7280",
  gray: "#6B7280",
  amber: "#D97706",
  violet: "#7C3AED",
  purple: "#9333EA",
  pink: "#EC4899",
  gold: "#EAB308",
  silver: "#CBD5E1",
  gunmetal: "#374151",
  matteblack: "#18181B",
  mattblack: "#18181B",
  shinyblack: "#000000",
};

export interface ParsedColor {
  name: string;
  hex: string;
}

const parseColorItem = (val: any): ParsedColor | null => {
  if (!val) return null;
  let item = val;
  if (typeof item === "string") {
    try {
      item = JSON.parse(item);
    } catch {
      const trimmed = val.trim();
      if (!trimmed) return null;
      const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
      const mappedHex = COLOR_HEX_MAP[normalized];
      return {
        name: trimmed,
        hex: trimmed.startsWith("#") ? trimmed : (mappedHex || "#000000"),
      };
    }
  }
  if (item && typeof item === "object") {
    const name = item.name || item.label || item.color || "";
    let hex = item.hex || item.colorHex || "";
    if (!hex && typeof name === "string" && name.startsWith("#")) {
      hex = name;
    }
    if (!hex && typeof name === "string") {
      const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      hex = COLOR_HEX_MAP[normalized] || "#000000";
    }
    if (!hex) hex = "#000000";
    if (name) {
      return { name: String(name).trim(), hex: String(hex).trim() };
    }
  }
  return null;
};

const isContactLensProduct = (p: any): boolean => {
  const pt = (p.product_type || "").toLowerCase();
  const cat = (p.category || "").toLowerCase();
  const hasContactCat = p.product_categories?.some((pc: any) =>
    (pc.categories?.name || "").toLowerCase().includes("contact")
  );
  return (
    pt === "contact-lens" ||
    pt === "contact_lens" ||
    pt.includes("contact") ||
    cat === "contact-lenses" ||
    cat === "contact lenses" ||
    cat.includes("contact") ||
    Boolean(hasContactCat)
  );
};

const isReadingGlassesProduct = (p: any): boolean => {
  const pt = (p.product_type || "").toLowerCase();
  const cat = (p.category || "").toLowerCase();
  const hasReadingCat = p.product_categories?.some((pc: any) =>
    (pc.categories?.name || "").toLowerCase().includes("reading")
  );
  return (
    pt === "reading-glasses" ||
    pt === "reading_glasses" ||
    pt.includes("reading") ||
    cat === "reading-glasses" ||
    cat === "reading glasses" ||
    cat.includes("reading") ||
    Boolean(hasReadingCat)
  );
};

const parseSizeItem = (val: any): string[] => {
  if (!val) return [];
  let item = val;
  if (typeof item === "string") {
    try {
      item = JSON.parse(item);
    } catch {
      item = { label: val };
    }
  }
  let label = "";
  if (item && typeof item === "object") {
    label = item.label || item.size || item.name || "";
  } else if (typeof item === "string") {
    label = item;
  }
  if (!label) return [];

  return String(label)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FilterSectionProps {
  title: string;
  activeCount: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, activeCount, children, defaultOpen = false }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#ECECEC] pb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#111111]">{title}</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#004AAD] text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={14} className="text-[#666666]" />
        ) : (
          <ChevronDown size={14} className="text-[#666666]" />
        )}
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

interface CheckboxOptionProps {
  opt: string;
  checked: boolean;
  onChange: () => void;
}

function CheckboxOption({ opt, checked, onChange }: CheckboxOptionProps) {
  return (
    <label className="flex items-center gap-3 py-2 cursor-pointer group">
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked
            ? "bg-[#03173D] border-[#03173D]"
            : "border-[#E8EAF2] bg-white group-hover:border-[#004AAD]"
        }`}
      >
        {checked && <Check size={10} className="text-white" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-sm text-[#666666] group-hover:text-[#111111] transition-colors">
        {opt}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GridMode = "2col" | "3col" | "4col";
type SortMode = "newest" | "price_asc" | "price_desc" | "popularity";

interface ProductGridProps {
  initialCategory?: string;
  initialGender?: string;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProductGrid({ initialCategory, initialGender }: ProductGridProps) {
  // ---- data state ----
  const [products, setProducts] = useState<any[]>([]);
  const [lenses, setLenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [categories, setCategories] = useState<any[]>([]);

  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const routerSearch = searchParams.get("q")?.toLowerCase() || "";
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === (searchParams.get("q") || "")) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);
  const searchGender = searchParams.get("gender") || "";
  const searchType = searchParams.get("type") || "";
  const searchLensType = searchParams.get("lens_type") || "";
  const searchCollection = searchParams.get("collection") || "";
  const searchBrand = searchParams.get("brand") || "";
  const searchMaxPrice = searchParams.get("max_price");

  // ---- ui state ----
  const [viewMode, setViewMode] = useState<SortMode>("newest");
  const [gridMode, setGridMode] = useState<GridMode>("4col");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: searchMaxPrice ? parseInt(searchMaxPrice, 10) : 25000,
  });

  // ---- filter state ----
  const [selectedGenders, setSelectedGenders] = useState<string[]>(
    searchGender ? [searchGender] : initialGender ? [initialGender] : []
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchType ? [searchType] : initialCategory ? [initialCategory] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchBrand ? [searchBrand] : []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFrameTypes, setSelectedFrameTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    searchCollection ? [searchCollection] : []
  );

  // ---- data fetching ----
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      setPage(1);

      try {
        const promises: any[] = [
          supabase
            .from("products")
            .select(
              `*, product_categories (categories (id, name, type)), product_images (image_url, is_primary)`
            )
            .eq("is_enabled", true),
          supabase.from("categories").select("*"),
          supabase.from("order_items").select("product_id"),
        ];

        if (searchType === "lens" || selectedTypes.includes("lens")) {
          promises.push(
            supabase.from("lenses").select("*").eq("is_active", true)
          );
        }

        const [productsRes, catRes, orderItemsRes, lensesRes] = await Promise.all(promises);

        if (productsRes?.error) throw productsRes.error;
        if (productsRes?.data) {
          const orderCounts: Record<string, number> = {};
          for (const row of orderItemsRes?.data || []) {
            orderCounts[row.product_id] = (orderCounts[row.product_id] || 0) + 1;
          }
          setProducts(
            productsRes.data.map((p: any) => ({ ...p, _orderCount: orderCounts[p.id] || 0 }))
          );
        }
        if (catRes?.data) setCategories(catRes.data);
        if (lensesRes?.data) setLenses(lensesRes.data);
      } catch (err: any) {
        setFetchError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, searchType, selectedTypes]);

  // ---- url sync effects ----
  useEffect(() => {
    setSelectedBrands(searchBrand ? [searchBrand] : []);
  }, [searchBrand]);

  useEffect(() => {
    setSelectedGenders(
      searchGender ? [searchGender] : initialGender ? [initialGender] : []
    );
  }, [searchGender, initialGender]);

  useEffect(() => {
    setSelectedTypes(
      searchType ? [searchType] : initialCategory ? [initialCategory] : []
    );
  }, [searchType, initialCategory]);

  useEffect(() => {
    setSelectedCollections(searchCollection ? [searchCollection] : []);
  }, [searchCollection]);

  // ---- derived filter options ----
  const genderCategories = useMemo(
    () => categories.filter((c) => c.type === "gender").map((c) => c.name),
    [categories]
  );
  const productTypeCategories = useMemo(
    () => categories.filter((c) => c.type === "product").map((c) => c.name),
    [categories]
  );
  const collectionCategories = useMemo(
    () => categories.filter((c) => c.type === "collection").map((c) => c.name),
    [categories]
  );

  const dynamicGenders = useMemo(() => {
    const fromCats = products.flatMap(
      (p) =>
        p.product_categories
          ?.map((pc: any) =>
            pc.categories?.type === "gender" ? pc.categories.name : null
          )
          .filter(Boolean) || []
    );
    const fromProps = products.flatMap((p) => parseArray(p.gender));
    return Array.from(new Set([...genderCategories, ...fromCats, ...fromProps]))
      .filter(Boolean)
      .sort();
  }, [genderCategories, products]);

  const dynamicTypes = useMemo(() => {
    const fromCats = products.flatMap(
      (p) =>
        p.product_categories
          ?.map((pc: any) =>
            pc.categories?.type === "product" ? pc.categories.name : null
          )
          .filter(Boolean) || []
    );
    const fromProps = products.flatMap((p) => parseArray(p.product_type));
    return Array.from(
      new Set([...productTypeCategories, ...fromCats, ...fromProps])
    )
      .filter((t) => Boolean(t) && t.toLowerCase() !== "frame")
      .sort();
  }, [productTypeCategories, products]);

  const dynamicCollections = useMemo(() => {
    const fromCats = products.flatMap(
      (p) =>
        p.product_categories
          ?.map((pc: any) =>
            pc.categories?.type === "collection" ? pc.categories.name : null
          )
          .filter(Boolean) || []
    );
    const fromProps = products.flatMap((p) => parseArray(p.collection));
    return Array.from(
      new Set([...collectionCategories, ...fromCats, ...fromProps])
    )
      .filter(Boolean)
      .sort();
  }, [collectionCategories, products]);

  const isContactLensPage = useMemo(() => {
    const typeParam = (searchParams.get("type") || "").toLowerCase();
    const catParam = (searchParams.get("category") || "").toLowerCase();
    const hasContactInTypes = selectedTypes.some((t) => {
      const lower = (t || "").toLowerCase();
      return (
        lower.includes("contact") ||
        lower === "contact-lens" ||
        lower === "contact_lens"
      );
    });

    return (
      initialCategory === "contact-lenses" ||
      initialCategory === "contact_lens" ||
      initialCategory === "contact-lens" ||
      pathname === "/contact-lenses" ||
      pathname.startsWith("/contact-lenses") ||
      typeParam.includes("contact") ||
      catParam.includes("contact") ||
      hasContactInTypes
    );
  }, [initialCategory, pathname, selectedTypes, searchParams]);

  const isReadingGlassesPage = useMemo(() => {
    const typeParam = (searchParams.get("type") || "").toLowerCase();
    const catParam = (searchParams.get("category") || "").toLowerCase();
    const hasReadingInTypes = selectedTypes.some((t) => {
      const lower = (t || "").toLowerCase();
      return (
        lower.includes("reading") ||
        lower === "reading-glasses" ||
        lower === "reading_glasses"
      );
    });

    return (
      initialCategory === "reading-glasses" ||
      initialCategory === "reading_glasses" ||
      pathname === "/reading-glasses" ||
      pathname.startsWith("/reading-glasses") ||
      typeParam.includes("reading") ||
      catParam.includes("reading") ||
      hasReadingInTypes
    );
  }, [initialCategory, pathname, selectedTypes, searchParams]);

  const brands = useMemo(() => {
    const source = isContactLensPage
      ? products.filter(isContactLensProduct)
      : products;
    return Array.from(new Set(source.map((p) => p.brand).filter(Boolean))).sort();
  }, [products, isContactLensPage]);

  const colors = useMemo(() => {
    const map = new Map<string, ParsedColor>();
    const source = isContactLensPage
      ? products.filter(isContactLensProduct)
      : products;
    source.forEach((p) => {
      const pColors = parseArray(p.colors);
      pColors.forEach((c: any) => {
        const parsed = parseColorItem(c);
        if (parsed) {
          const key = parsed.name.toLowerCase();
          if (!map.has(key)) {
            map.set(key, parsed);
          }
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, isContactLensPage]);

  const sizes = useMemo(() => {
    const allSizes = products.flatMap((p) => {
      const pSizes = p.sizes || [];
      return pSizes.flatMap((s: any) => parseSizeItem(s));
    });
    const distinct = Array.from(new Set(allSizes.filter(Boolean)));
    return distinct.sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [products]);

  const frameTypes = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.frame_type).filter(Boolean))).sort(),
    [products]
  );
  const materials = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.material).filter(Boolean))).sort(),
    [products]
  );
  const shapes = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.shape).filter(Boolean))).sort(),
    [products]
  );

  // ---- filter toggle helper ----
  const toggleFilter = (setState: any, item: string) => {
    setState((prev: string[]) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  // ---- clear all ----
  const clearAll = () => {
    setPriceRange({ min: 0, max: 25000 });
    setSelectedGenders([]);
    setSelectedTypes(
      isContactLensPage
        ? (searchType ? [searchType] : initialCategory ? [initialCategory] : ["contact-lens"])
        : []
    );
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedFrameTypes([]);
    setSelectedMaterials([]);
    setSelectedShapes([]);
    setSelectedCollections([]);
  };

  const totalActiveFilters =
    selectedGenders.length +
    selectedTypes.length +
    selectedBrands.length +
    selectedColors.length +
    selectedSizes.length +
    selectedFrameTypes.length +
    selectedMaterials.length +
    selectedShapes.length +
    selectedCollections.length +
    (priceRange.max < 25000 ? 1 : 0);

  // ---- filtered + sorted products ----
  const filteredProducts = useMemo(() => {
    const isLensMode =
      searchType === "lens" || selectedTypes.includes("lens");

    if (isLensMode) {
      let result = [...lenses];
      if (routerSearch) {
        result = result.filter(
          (l) =>
            l.name.toLowerCase().includes(routerSearch) ||
            l.description?.toLowerCase().includes(routerSearch)
        );
      }
      if (searchLensType) {
        result = result.filter(
          (l) =>
            l.sub_category?.toLowerCase() === searchLensType.toLowerCase() ||
            l.category?.toLowerCase() === searchLensType.toLowerCase()
        );
      }
      result = result.filter(
        (l) => l.price >= priceRange.min && l.price <= priceRange.max
      );
      return result.map((l) => ({ ...l, isLens: true }));
    }

    let result = [...products];

    // On contact lens pages or filters, strictly constrain result to contact lens products
    if (isContactLensPage) {
      result = result.filter(isContactLensProduct);
    }

    // On reading glasses pages or filters, strictly constrain result to reading glasses products
    if (isReadingGlassesPage) {
      result = result.filter(isReadingGlassesProduct);
    }

    if (routerSearch) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(routerSearch) ||
          p.brand?.toLowerCase().includes(routerSearch) ||
          p.description?.toLowerCase().includes(routerSearch)
      );
    }

    if (selectedGenders.length > 0) {
      result = result.filter((p) => {
        const pGenders = parseArray(p.gender).map((g) => g.toLowerCase());
        const selectedLower = selectedGenders.map((g) => g.toLowerCase());
        return (
          pGenders.some((g) => selectedLower.includes(g)) ||
          p.product_categories?.some(
            (pc: any) =>
              pc.categories?.type === "gender" &&
              selectedLower.includes(pc.categories.name.toLowerCase())
          )
        );
      });
    }

    if (selectedTypes.length > 0) {
      result = result.filter((p) => {
        const pTypes = parseArray(p.product_type).map((t) => t.toLowerCase());
        const selectedLower = selectedTypes.map((t) => t.toLowerCase());

        const matchesType = pTypes.some((t) => {
          if (selectedLower.includes(t)) return true;
          if (t === "accessory" && selectedLower.includes("accessories"))
            return true;
          if (t === "accessories" && selectedLower.includes("accessory"))
            return true;
          if (
            (t === "contact-lens" || t === "contact_lens" || t.includes("contact")) &&
            selectedLower.some((s) => s.includes("contact"))
          )
            return true;
          if (
            (t === "reading-glasses" || t === "reading_glasses" || t.includes("reading")) &&
            selectedLower.some((s) => s.includes("reading"))
          )
            return true;
          return false;
        });

        const matchesCategory = p.product_categories?.some(
          (pc: any) =>
            pc.categories?.type === "product" &&
            (selectedLower.includes(pc.categories.name.toLowerCase()) ||
              (selectedLower.some((s) => s.includes("contact")) &&
                pc.categories.name.toLowerCase().includes("contact")) ||
              (selectedLower.some((s) => s.includes("reading")) &&
                pc.categories.name.toLowerCase().includes("reading")))
        );

        return matchesType || matchesCategory;
      });
    }

    if (selectedCollections.length > 0) {
      result = result.filter((p) => {
        const pCollections = parseArray(p.collection).map((c) => c.toLowerCase());
        const selectedLower = selectedCollections.map((c) => c.toLowerCase());
        return (
          pCollections.some((col) => selectedLower.includes(col)) ||
          p.product_categories?.some(
            (pc: any) =>
              pc.categories?.type === "collection" &&
              selectedLower.includes(pc.categories.name.toLowerCase())
          )
        );
      });
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) =>
        selectedBrands.some(
          (b) => b.toLowerCase() === (p.brand || "").toLowerCase()
        )
      );
    }
    if (selectedColors.length > 0) {
      result = result.filter((p) => {
        const rawColors = parseArray(p.colors);
        if (!rawColors || rawColors.length === 0) return false;
        const pColorNames = rawColors
          .map((c: any) => parseColorItem(c)?.name.toLowerCase())
          .filter(Boolean);
        return selectedColors.some((selectedName) =>
          pColorNames.includes(selectedName.toLowerCase())
        );
      });
    }
    if (selectedSizes.length > 0) {
      result = result.filter((p) => {
        if (!p.sizes || !Array.isArray(p.sizes)) return false;
        const pSizeTokens = p.sizes
          .flatMap((s: any) => parseSizeItem(s))
          .map((s: string) => s.toLowerCase());
        return selectedSizes.some((selectedSize) =>
          pSizeTokens.includes(selectedSize.toLowerCase())
        );
      });
    }
    if (selectedFrameTypes.length > 0) {
      result = result.filter((p) =>
        selectedFrameTypes.some(
          (ft) => ft.toLowerCase() === (p.frame_type || "").toLowerCase()
        )
      );
    }
    if (selectedMaterials.length > 0) {
      result = result.filter((p) =>
        selectedMaterials.some(
          (m) => m.toLowerCase() === (p.material || "").toLowerCase()
        )
      );
    }
    if (selectedShapes.length > 0) {
      result = result.filter((p) =>
        selectedShapes.some(
          (sh) => sh.toLowerCase() === (p.shape || "").toLowerCase()
        )
      );
    }

    result = result.filter((p) => {
      const effectivePrice = p.discount_price || p.price;
      return effectivePrice >= priceRange.min && effectivePrice <= priceRange.max;
    });

    if (viewMode === "price_asc") {
      result.sort(
        (a, b) =>
          (a.discount_price || a.price) - (b.discount_price || b.price)
      );
    } else if (viewMode === "price_desc") {
      result.sort(
        (a, b) =>
          (b.discount_price || b.price) - (a.discount_price || a.price)
      );
    } else if (viewMode === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (viewMode === "popularity") {
      result.sort((a, b) => (b._orderCount || 0) - (a._orderCount || 0));
    }

    return result;
  }, [
    products,
    lenses,
    searchType,
    searchLensType,
    routerSearch,
    selectedGenders,
    selectedTypes,
    selectedCollections,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedFrameTypes,
    selectedMaterials,
    selectedShapes,
    priceRange,
    viewMode,
    isContactLensPage,
  ]);

  // ---- derived heading ----
  const pageTitle = routerSearch
    ? `Results for "${routerSearch}"`
    : isContactLensPage
    ? "Contact Lenses"
    : [...selectedTypes, ...selectedGenders, ...selectedCollections].join(", ") ||
      "Shop Eyewear";

  const activeCrumb =
    (isContactLensPage ? "Contact Lenses" : null) ||
    [...selectedTypes, ...selectedGenders, ...selectedCollections][0] ||
    "All";

  // ---- grid classes ----
  const gridColClass =
    gridMode === "2col"
      ? "grid-cols-2"
      : gridMode === "3col"
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  // ---- sidebar content (shared between desktop and mobile drawer) ----
  const SidebarContent = () => (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#ECECEC]">
        <span className="text-sm font-semibold text-[#111111]">Filters</span>
        {totalActiveFilters > 0 && (
          <button
            onClick={clearAll}
            className="bg-[#F8F9FC] border border-[#ECECEC] text-sm text-[#666666] rounded-full px-4 py-1.5 hover:border-[#004AAD] hover:text-[#004AAD] transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {!isContactLensPage && dynamicGenders.length > 0 && (
        <FilterSection
          title="Gender"
          activeCount={selectedGenders.length}
          defaultOpen
        >
          {dynamicGenders.map((opt) => (
            <CheckboxOption
              key={opt}
              opt={opt}
              checked={selectedGenders.includes(opt)}
              onChange={() => toggleFilter(setSelectedGenders, opt)}
            />
          ))}
        </FilterSection>
      )}

      {!isContactLensPage && dynamicTypes.length > 0 && (
        <FilterSection
          title="Type"
          activeCount={selectedTypes.length}
          defaultOpen
        >
          {dynamicTypes.map((opt) => (
            <CheckboxOption
              key={opt}
              opt={opt}
              checked={selectedTypes.includes(opt)}
              onChange={() => toggleFilter(setSelectedTypes, opt)}
            />
          ))}
        </FilterSection>
      )}

      {!isContactLensPage && dynamicCollections.length > 0 && (
        <FilterSection
          title="Collection"
          activeCount={selectedCollections.length}
        >
          {dynamicCollections.map((opt) => (
            <CheckboxOption
              key={opt}
              opt={opt}
              checked={selectedCollections.includes(opt)}
              onChange={() => toggleFilter(setSelectedCollections, opt)}
            />
          ))}
        </FilterSection>
      )}

      {brands.length > 0 && (
        <FilterSection title="Brand" activeCount={selectedBrands.length}>
          {brands.map((opt) => (
            <CheckboxOption
              key={opt}
              opt={opt}
              checked={selectedBrands.includes(opt)}
              onChange={() => toggleFilter(setSelectedBrands, opt)}
            />
          ))}
        </FilterSection>
      )}

      {/* Price Slider - hidden on contact lens page */}
      {!isContactLensPage && (
        <FilterSection
          title="Price"
          activeCount={priceRange.max < 25000 ? 1 : 0}
          defaultOpen
        >
          <div className="space-y-3 pt-1 pb-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#666666]">₹0</span>
              <span className="font-semibold text-[#03173D]">
                ₹{priceRange.max.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25000"
              step="500"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange((prev) => ({
                  ...prev,
                  max: Number(e.target.value),
                }))
              }
              className="w-full accent-[#03173D] h-1.5 rounded-full cursor-pointer"
            />
          </div>
        </FilterSection>
      )}

      {!isContactLensPage && frameTypes.length > 0 && (
        <FilterSection
          title="Frame Type"
          activeCount={selectedFrameTypes.length}
        >
          {frameTypes.map((opt) => (
            <CheckboxOption
              key={opt}
              opt={opt}
              checked={selectedFrameTypes.includes(opt)}
              onChange={() => toggleFilter(setSelectedFrameTypes, opt)}
            />
          ))}
        </FilterSection>
      )}

      {!isContactLensPage && materials.length > 0 && (
        <FilterSection title="Material" activeCount={selectedMaterials.length}>
          {materials.map((opt) => (
            <CheckboxOption
              key={opt}
              opt={opt}
              checked={selectedMaterials.includes(opt)}
              onChange={() => toggleFilter(setSelectedMaterials, opt)}
            />
          ))}
        </FilterSection>
      )}

      {!isContactLensPage && shapes.length > 0 && (
        <FilterSection title="Shape" activeCount={selectedShapes.length}>
          {shapes.map((opt) => (
            <CheckboxOption
              key={opt}
              opt={opt}
              checked={selectedShapes.includes(opt)}
              onChange={() => toggleFilter(setSelectedShapes, opt)}
            />
          ))}
        </FilterSection>
      )}

      {colors.length > 0 && (
        <FilterSection title="Colors" activeCount={selectedColors.length}>
          <div className="flex flex-wrap gap-2.5 pt-1 pb-2">
            {colors.map((colorObj) => {
              const isSelected = selectedColors.includes(colorObj.name);
              const hexLower = (colorObj.hex || "").toLowerCase();
              const isLight =
                hexLower === "#ffffff" ||
                hexLower === "#fafafa" ||
                hexLower === "#f1f5f9" ||
                hexLower === "#e0f2fe" ||
                colorObj.name.toLowerCase().includes("transparent") ||
                colorObj.name.toLowerCase().includes("clear");
              return (
                <button
                  key={colorObj.name}
                  type="button"
                  title={colorObj.name}
                  onClick={() => toggleFilter(setSelectedColors, colorObj.name)}
                  className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center relative shadow-xs ${
                    isSelected
                      ? "border-[#004AAD] ring-2 ring-[#004AAD] ring-offset-1 scale-105"
                      : isLight
                      ? "border-slate-300 hover:border-slate-400"
                      : "border-black/10 hover:border-black/30"
                  }`}
                  style={{
                    backgroundColor: colorObj.hex,
                  }}
                >
                  {isSelected && (
                    <Check
                      size={12}
                      className={isLight ? "text-slate-800" : "text-white"}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {selectedColors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100">
              {selectedColors.map((colName) => (
                <span
                  key={colName}
                  className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-medium"
                >
                  {colName}
                  <button
                    type="button"
                    onClick={() => toggleFilter(setSelectedColors, colName)}
                    className="hover:text-red-500 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </FilterSection>
      )}

      {!isContactLensPage && sizes.length > 0 && (
        <FilterSection title="Size" activeCount={selectedSizes.length}>
          {sizes.map((opt) => (
            <CheckboxOption
              key={opt}
              opt={opt}
              checked={selectedSizes.includes(opt)}
              onChange={() => toggleFilter(setSelectedSizes, opt)}
            />
          ))}
        </FilterSection>
      )}
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* Dynamic Hero Category Banner with Rich Photography                  */}
      {/* ------------------------------------------------------------------ */}
      {(() => {
        const c = (activeCrumb || "").toLowerCase();
        const t = (pageTitle || "").toLowerCase();

        let banner = {
          image: "/images/banners/shop-all-banner.jpg",
          tagline: "Discover India's Premier Curated Eyewear & Contact Lens Boutique",
          badges: ["🏆 10,000+ Happy Eyes", "🚚 Free Fast Shipping Above ₹999", "⭐ 2-Year Frame Warranty"],
        };

        if (c.includes("contact") || t.includes("contact")) {
          banner = {
            image: "/images/banners/contact-lenses-banner.jpg",
            tagline: "Ultra-Hydrating Moisture Matrix • Daily, Monthly & Toric Optics with 100% Breathability",
            badges: ["💧 100% Moisture Lock", "🩺 Optom Certified Lenses", "⚡ 100% Fresh Sterile Stock"],
          };
        } else if (c.includes("sun") || t.includes("sun")) {
          banner = {
            image: "/images/banners/sunglasses-banner.jpg",
            tagline: "UV400 Polarized Precision Optics • High-Fashion Silhouettes & Tinted Glass",
            badges: ["☀️ 100% UV Protection", "🕶️ Polarized Glare-Cut", "💎 Italian Inspired Design"],
          };
        } else if (c.includes("computer") || t.includes("computer") || c.includes("blue") || t.includes("blue")) {
          banner = {
            image: "/images/banners/computer-glasses-banner.jpg",
            tagline: "Blue-Light Filtration Shield • Digital Eye Strain Relief & Screen Defense",
            badges: ["💻 95% Blue Light Cut", "👁️ Zero Glare Multi-Coat", "😴 Enhanced Sleep Quality"],
          };
        } else if (c.includes("read") || t.includes("read")) {
          banner = {
            image: "/images/editorial/hero_woman_reading.png",
            tagline: "Crystal-Clear Near-Vision Optics • Ergonomic Lightweight Reading Comfort",
            badges: ["📖 Precision Magnification", "🪶 Featherlight Frame", "👓 Scratch Resistant"],
          };
        } else if (c.includes("kid") || t.includes("kid")) {
          banner = {
            image: "/images/categories/kids.png",
            tagline: "Drop-Safe, Bendable & Fun Eyewear Specially Engineered For Children",
            badges: ["🎈 Bendable & Flexible", "🛡️ Impact Resistant", "🎨 Kid-Friendly Hues"],
          };
        } else if (c.includes("eye") || t.includes("eye") || c.includes("frame") || t.includes("spectacle")) {
          banner = {
            image: "/images/banners/eyeglasses-banner.jpg",
            tagline: "Handcrafted Luxury Titanium & Acetate • Tailored Clinical Vision Correction",
            badges: ["✨ Premium Handcrafted", "🛡️ Anti-Glare Multi-Coating", "👁️ Doctor Verified Fit"],
          };
        }

        return (
          <div className="relative overflow-hidden bg-[#03173D] text-white pt-24 md:pt-32 pb-10 md:pb-14 px-4 sm:px-6 lg:px-12 border-b border-white/10 shadow-inner">
            {/* Background Image with Cinematic Overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src={banner.image}
                alt={pageTitle}
                fill
                priority
                className="object-cover object-center scale-105 transition-transform duration-1000 ease-out brightness-[0.95]"
              />
              {/* Luxury dark gradient overlays for crystal-clear text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#03173D]/95 via-[#03173D]/80 to-[#03173D]/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#03173D] via-transparent to-black/40" />
            </div>

            {/* Banner Content */}
            <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                {/* Breadcrumb Frosted Glass Pill */}
                <nav className="inline-flex items-center gap-2 text-xs text-white/90 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full shadow-sm">
                  <Link href="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                  <span className="text-white/40">/</span>
                  <Link
                    href="/products"
                    className="hover:text-white transition-colors"
                  >
                    Shop
                  </Link>
                  <span className="text-white/40">/</span>
                  <span className="text-white font-semibold">{activeCrumb}</span>
                </nav>

                {/* Main Heading */}
                <h1
                  className="text-3xl md:text-5xl lg:text-6xl font-[var(--font-hero)] italic text-white tracking-tight leading-tight drop-shadow-md"
                  style={{ fontFamily: "var(--font-hero, serif)" }}
                >
                  {pageTitle}
                </h1>

                {/* Tagline / Subtitle */}
                <p className="text-sm md:text-base text-white/90 font-medium leading-relaxed drop-shadow-sm">
                  {banner.tagline}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {banner.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-[11px] font-semibold tracking-wide bg-white/15 backdrop-blur-md border border-white/25 text-white px-3.5 py-1 rounded-full shadow-sm"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Results Counter Pill */}
              <div className="shrink-0">
                <div className="inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-5 py-3 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-sm font-semibold text-white tracking-wide">
                    {loading ? "Loading styles..." : `${filteredProducts.length} Results Available`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* Sticky Toolbar                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white border-b border-[#ECECEC] sticky top-0 z-30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="px-4 sm:px-6 lg:px-12 py-3 md:py-4 flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Mobile filter toggle */}
          <button
            className="lg:hidden flex items-center gap-2 rounded-full border border-[#E8EAF2] text-[#111111] text-sm px-4 py-2.5 hover:border-[#004AAD] transition-colors"
            onClick={() => setMobileFilterOpen(true)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {totalActiveFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#004AAD] text-white text-[10px] font-bold flex items-center justify-center">
                {totalActiveFilters}
              </span>
            )}
          </button>

          {/* Search */}
          <input
            type="text"
            placeholder="Search eyewear..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-full px-4 py-2.5 text-sm w-36 sm:w-56 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none"
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Results count */}
          <span className="hidden sm:block text-sm text-[#666666]">
            {loading ? "—" : `${filteredProducts.length} items`}
          </span>

          {/* Sort */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as SortMode)}
            className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-full px-4 py-2.5 text-sm text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popularity">Popularity</option>
          </select>

          {/* Grid toggle */}
          <div className="hidden md:flex items-center gap-1 bg-[#F8F9FC] border border-[#E8EAF2] rounded-full p-1">
            <button
              onClick={() => setGridMode("2col")}
              className={`p-1.5 rounded-full transition-all ${
                gridMode === "2col"
                  ? "bg-[#03173D] text-white"
                  : "text-[#666666] hover:text-[#111111]"
              }`}
              title="2 columns"
            >
              <Grid2X2 size={14} />
            </button>
            <button
              onClick={() => setGridMode("3col")}
              className={`p-1.5 rounded-full transition-all ${
                gridMode === "3col"
                  ? "bg-[#03173D] text-white"
                  : "text-[#666666] hover:text-[#111111]"
              }`}
              title="3 columns"
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setGridMode("4col")}
              className={`p-1.5 rounded-full transition-all ${
                gridMode === "4col"
                  ? "bg-[#03173D] text-white"
                  : "text-[#666666] hover:text-[#111111]"
              }`}
              title="4 columns"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile Filter Drawer                                                  */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto p-6 shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-base font-semibold text-[#111111]">
                  Filters
                </span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F8F9FC] text-[#666666] hover:text-[#111111] transition-all"
                >
                  <X size={16} />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* Main Content                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-10 flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white border border-[#ECECEC] rounded-3xl p-6 space-y-2 sticky top-24">
            <SidebarContent />
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-1 min-w-0">
          {loading ? (
            <div
              className={`grid ${gridColClass} gap-6 md:gap-8`}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#F8F9FC] rounded-3xl animate-pulse border border-[#ECECEC] aspect-square"
                />
              ))}
            </div>
          ) : fetchError ? (
            <div className="py-32 text-center flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-[#F8F9FC] border border-[#ECECEC] flex items-center justify-center text-2xl">
                📡
              </div>
              <h3 className="text-xl font-semibold text-[#111111]">
                Failed to load products
              </h3>
              <p className="text-sm text-[#666666]">{fetchError}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#03173D] text-white rounded-full px-8 py-3 font-semibold hover:bg-[#004AAD] transition-all"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className={`grid ${gridColClass} gap-6 md:gap-8`}>
                <AnimatePresence mode="popLayout">
                  {filteredProducts.slice(0, page * PAGE_SIZE).map((item, i) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        duration: 0.4,
                        delay: (i % 12) * 0.04,
                      }}
                    >
                      {item.isLens ? (
                        <LensCard lens={item} />
                      ) : (
                        <ProductCard product={item} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More */}
              {filteredProducts.length > page * PAGE_SIZE && (
                <div className="mt-12 mx-auto flex flex-col items-center gap-3">
                  <p className="text-sm text-[#666666]">
                    Showing{" "}
                    {Math.min(page * PAGE_SIZE, filteredProducts.length)} of{" "}
                    {filteredProducts.length}
                  </p>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-[#03173D] text-white rounded-full px-10 py-4 font-semibold hover:bg-[#004AAD] transition-all"
                  >
                    Load More
                  </button>
                </div>
              )}

              {filteredProducts.length <= page * PAGE_SIZE &&
                filteredProducts.length > PAGE_SIZE && (
                  <p className="mt-12 text-center text-sm text-[#666666]">
                    All {filteredProducts.length} results shown
                  </p>
                )}
            </>
          ) : (
            <div className="py-32 text-center flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-[#F8F9FC] border border-[#ECECEC] flex items-center justify-center text-2xl">
                🔍
              </div>
              <h3 className="text-xl font-semibold text-[#111111]">
                No matches found
              </h3>
              <p className="text-sm text-[#666666]">
                Try adjusting your filters to find what you&apos;re looking for.
              </p>
              <button
                onClick={clearAll}
                className="bg-[#03173D] text-white rounded-full px-8 py-3 font-semibold hover:bg-[#004AAD] transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
