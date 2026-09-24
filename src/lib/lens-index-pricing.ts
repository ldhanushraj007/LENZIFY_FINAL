export interface IndexOption {
  id: string;
  name: string;
  indexValue: string; // e.g. "1.56", "1.59", "1.60", "1.67", "1.74"
  label: string;
  desc: string;
  material: string;
  price: number; // additional surcharge on top of base price
  available: boolean;
  unavailableReason?: string;
  isRecommended?: boolean;
}

export interface LensIndexPricingContext {
  lensType?: string; // "single_vision" | "bifocal" | "progressive" | string
  tier?: string | null; // "silver" | "gold" | "platinum" | null
  frameType?: string | null; // "rimless" | "half_rim" | "full_rim" | "shell" | string
  sphMax?: number | null; // Max absolute sphere power from prescription
}

/**
 * Normalizes lens category/type string into: "single_vision" | "bifocal" | "progressive"
 */
export function normalizeLensCategory(name?: string, category?: string): "single_vision" | "bifocal" | "progressive" {
  const str = `${name || ""} ${category || ""}`.toLowerCase();
  if (str.includes("progressive")) return "progressive";
  if (str.includes("bifocal")) return "bifocal";
  return "single_vision";
}

/**
 * Recommends an index based on SPH power
 */
export function getRecommendedIndexValue(sphMax?: number | null, isRimless: boolean = false): string {
  if (isRimless) return "1.59";
  if (sphMax === undefined || sphMax === null || isNaN(sphMax)) return "1.56";
  const abs = Math.abs(sphMax);
  if (abs <= 2.00) return "1.56";
  if (abs <= 4.00) return "1.60";
  if (abs <= 6.00) return "1.67";
  return "1.74";
}

/**
 * Returns available index options and exact surcharge for the given configuration
 */
export function getIndexOptions(ctx: LensIndexPricingContext): IndexOption[] {
  const normalizedType = normalizeLensCategory(ctx.lensType);
  const normalizedTier = ctx.tier ? ctx.tier.toLowerCase() : null;
  const isRimless = (ctx.frameType || "").toLowerCase() === "rimless";
  const recVal = getRecommendedIndexValue(ctx.sphMax, isRimless);

  // 1. RIMLESS RULES
  // Polycarbonate 1.59 is automatically locked for rimless frames
  if (isRimless) {
    let rimlessPrice = 499; // default single vision
    if (normalizedType === "single_vision") {
      rimlessPrice = 499;
    } else if (normalizedType === "bifocal") {
      rimlessPrice = 1999;
    } else if (normalizedType === "progressive") {
      // Silver: +2999, Gold: +2999, Platinum: +2999 (1.60 / 1.59)
      rimlessPrice = 2999;
    }

    const indexName = (normalizedType === "progressive" && normalizedTier === "platinum")
      ? "1.60 — High Index (Rimless Polycarbonate/High Index)"
      : "1.59 — Polycarbonate (Impact Resistant)";

    const indexVal = (normalizedType === "progressive" && normalizedTier === "platinum") ? "1.60" : "1.59";

    return [
      {
        id: indexVal,
        name: indexName,
        indexValue: indexVal,
        label: "Polycarbonate (Impact Resistant)",
        desc: "High-impact polycarbonate lens calibrated specifically for rimless mounts to prevent drill-hole chipping.",
        material: "Polycarbonate",
        price: rimlessPrice,
        available: true,
        isRecommended: true,
      }
    ];
  }

  // 2. STANDARD / HALF RIM / FULL RIM / SHELL RULES

  // --- SINGLE VISION ---
  if (normalizedType === "single_vision") {
    return [
      {
        id: "1.56",
        name: "1.56 — Standard Mid-Index",
        indexValue: "1.56",
        label: "Standard Mid-Index",
        desc: "Everyday clarity. Ideal for mild prescriptions (0.00 to ±2.00 SPH).",
        material: "Organic CR-39",
        price: 0,
        available: true,
        isRecommended: recVal === "1.56",
      },
      {
        id: "1.60",
        name: "1.60 — High Index",
        indexValue: "1.60",
        label: "High Index (Slim)",
        desc: "Up to 20% thinner and lighter. Ideal for moderate powers (±2.25 to ±4.00 SPH).",
        material: "High-Index Polymer",
        price: 499,
        available: true,
        isRecommended: recVal === "1.60",
      },
      {
        id: "1.67",
        name: "1.67 — Ultra-Thin Index",
        indexValue: "1.67",
        label: "Ultra-Thin Index",
        desc: "Up to 35% thinner. Ultra-aesthetic profile for strong powers (±4.25 to ±6.00 SPH).",
        material: "MR-7 Ultra-Thin",
        price: 1999,
        available: true,
        isRecommended: recVal === "1.67",
      },
      {
        id: "1.74",
        name: "1.74 — Maximum Slim Index",
        indexValue: "1.74",
        label: "Maximum Slim Index",
        desc: "Thinnest and flattest optical profile available. For heavy prescriptions (> ±6.00 SPH).",
        material: "MR-174 Hyper-Index",
        price: 4999,
        available: true,
        isRecommended: recVal === "1.74",
      }
    ];
  }

  // --- BIFOCAL ---
  if (normalizedType === "bifocal") {
    return [
      {
        id: "1.56",
        name: "1.56 — Standard Bifocal",
        indexValue: "1.56",
        label: "Standard Bifocal",
        desc: "Dual vision segment for distance and near reading.",
        material: "CR-39 Resin",
        price: 0,
        available: true,
        isRecommended: recVal === "1.56",
      },
      {
        id: "1.60",
        name: "1.60 — High Index Bifocal",
        indexValue: "1.60",
        label: "High Index Bifocal",
        desc: "Slimmer segment profile with enhanced optical clarity.",
        material: "High-Index Polymer",
        price: 1000,
        available: true,
        isRecommended: recVal === "1.60",
      },
      {
        id: "1.67",
        name: "1.67 — Ultra-Thin Bifocal",
        indexValue: "1.67",
        label: "Ultra-Thin Bifocal",
        desc: "Maximum thinness for high prescription bifocals.",
        material: "Ultra-Thin Polymer",
        price: 5000,
        available: true,
        isRecommended: recVal === "1.67" || recVal === "1.74",
      },
      {
        id: "1.74",
        name: "1.74 — Not Available",
        indexValue: "1.74",
        label: "Not Available",
        desc: "1.74 index is not produced in bifocal segment geometries.",
        material: "N/A",
        price: 0,
        available: false,
        unavailableReason: "1.74 index is not available in bifocal format.",
        isRecommended: false,
      }
    ];
  }

  // --- PROGRESSIVE ---
  // Platinum tier has 1.74 available (+8999). Silver and Gold do not have 1.74.
  const isPlatinum = normalizedTier === "platinum";

  const options: IndexOption[] = [
    {
      id: "1.56",
      name: "1.56 — Standard Progressive",
      indexValue: "1.56",
      label: "Standard Mid-Index",
      desc: "Smooth corridor with balanced visual zones.",
      material: "Organic Resin",
      price: 0,
      available: true,
      isRecommended: recVal === "1.56",
    },
    {
      id: "1.60",
      name: "1.60 — High Index Progressive",
      indexValue: "1.60",
      label: "High Index Progressive",
      desc: "Up to 25% thinner with reduced peripheral aberration.",
      material: "High-Index Polymer",
      price: 2999,
      available: true,
      isRecommended: recVal === "1.60",
    },
    {
      id: "1.67",
      name: "1.67 — Ultra-Thin Progressive",
      indexValue: "1.67",
      label: "Ultra-Thin Progressive",
      desc: "Ultra-flat design with widest visual comfort for medium-to-high prescriptions.",
      material: "MR-7 Ultra-Thin",
      price: 6999,
      available: true,
      isRecommended: recVal === "1.67" || (!isPlatinum && recVal === "1.74"),
    }
  ];

  if (isPlatinum) {
    options.push({
      id: "1.74",
      name: "1.74 — Maximum Slim Progressive",
      indexValue: "1.74",
      label: "Maximum Slim Progressive",
      desc: "Flagship ultra-thin progressive for strong prescriptions. Zero cosmetic bulge.",
      material: "MR-174 Hyper-Index",
      price: 8999,
      available: true,
      isRecommended: recVal === "1.74",
    });
  }

  return options;
}
