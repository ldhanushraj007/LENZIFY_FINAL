import { isContactLensItem, getItemPricing } from "./pricing";

export interface QualifiedOffer {
  code: string;
  discount: number;
  message: string;
  category: "contact-lens" | "eyewear" | "all";
  description: string;
}

export interface NextTierNudge {
  amountNeeded: number;
  discount: number;
  code: string;
  message: string;
}

export interface CartOffersResult {
  hasContactLens: boolean;
  hasEyewear: boolean;
  contactLensSubtotal: number;
  eyewearSubtotal: number;
  qualifiedEyewearOffer: QualifiedOffer | null;
  qualifiedContactLensOffer: QualifiedOffer | null;
  allQualifiedOffers: QualifiedOffer[];
  nextTierNudge: NextTierNudge | null;
}

/**
 * Evaluates cart items to determine applicable offers:
 * - Contact Lenses: CL200 (₹200 OFF)
 * - Spectacles, Sunglasses & Accessories: LENZ299 (₹999+), LENZ599 (₹1999+), LENZ999 (₹2999+)
 * Note: Contact lenses DO NOT count towards the spectacle offers subtotal.
 */
export function evaluateCartOffers(items: any[]): CartOffersResult {
  if (!items || items.length === 0) {
    return {
      hasContactLens: false,
      hasEyewear: false,
      contactLensSubtotal: 0,
      eyewearSubtotal: 0,
      qualifiedEyewearOffer: null,
      qualifiedContactLensOffer: null,
      allQualifiedOffers: [],
      nextTierNudge: null,
    };
  }

  let contactLensSubtotal = 0;
  let eyewearSubtotal = 0;
  let hasContactLens = false;
  let hasEyewear = false;

  items.forEach((item) => {
    const isContact = isContactLensItem(item);
    const itemTotal = getItemPricing(item).totalPrice;
    if (isContact) {
      hasContactLens = true;
      contactLensSubtotal += itemTotal;
    } else {
      hasEyewear = true;
      eyewearSubtotal += itemTotal;
    }
  });

  // 1. Contact Lens Offer: CL200 for ₹200 off
  let qualifiedContactLensOffer: QualifiedOffer | null = null;
  if (hasContactLens) {
    qualifiedContactLensOffer = {
      code: "CL200",
      discount: Math.min(200, contactLensSubtotal),
      message: "Contact Lens Special: ₹200 OFF with code CL200!",
      category: "contact-lens",
      description: "Flat ₹200 off on Contact Lenses",
    };
  }

  // 2. Spectacles, Sunglasses & Accessories Tiered Offers (LENZ299, LENZ599, LENZ999)
  let qualifiedEyewearOffer: QualifiedOffer | null = null;
  let nextTierNudge: NextTierNudge | null = null;

  if (hasEyewear) {
    if (eyewearSubtotal >= 2999) {
      qualifiedEyewearOffer = {
        code: "LENZ999",
        discount: 999,
        message: "You qualify for ₹999 off on Eyewear & Accessories!",
        category: "eyewear",
        description: "Save ₹999 on orders above ₹2999",
      };
    } else if (eyewearSubtotal >= 1999) {
      qualifiedEyewearOffer = {
        code: "LENZ599",
        discount: 599,
        message: "You qualify for ₹599 off on Eyewear & Accessories!",
        category: "eyewear",
        description: "Save ₹599 on orders above ₹1999",
      };
      const diff = 2999 - eyewearSubtotal;
      nextTierNudge = {
        amountNeeded: diff,
        discount: 999,
        code: "LENZ999",
        message: `Add ₹${diff.toLocaleString("en-IN")} more of eyewear or accessories to unlock ₹999 off with LENZ999`,
      };
    } else if (eyewearSubtotal >= 999) {
      qualifiedEyewearOffer = {
        code: "LENZ299",
        discount: 299,
        message: "You qualify for ₹299 off on Eyewear & Accessories!",
        category: "eyewear",
        description: "Save ₹299 on orders above ₹999",
      };
      const diff = 1999 - eyewearSubtotal;
      nextTierNudge = {
        amountNeeded: diff,
        discount: 599,
        code: "LENZ599",
        message: `Add ₹${diff.toLocaleString("en-IN")} more of eyewear or accessories to unlock ₹599 off with LENZ599`,
      };
    } else {
      const diff = 999 - eyewearSubtotal;
      nextTierNudge = {
        amountNeeded: diff,
        discount: 299,
        code: "LENZ299",
        message: `Add ₹${diff.toLocaleString("en-IN")} more of eyewear or accessories to unlock ₹299 off with LENZ299`,
      };
    }
  }

  const allQualifiedOffers: QualifiedOffer[] = [];
  if (qualifiedContactLensOffer) allQualifiedOffers.push(qualifiedContactLensOffer);
  if (qualifiedEyewearOffer) allQualifiedOffers.push(qualifiedEyewearOffer);

  return {
    hasContactLens,
    hasEyewear,
    contactLensSubtotal,
    eyewearSubtotal,
    qualifiedEyewearOffer,
    qualifiedContactLensOffer,
    allQualifiedOffers,
    nextTierNudge,
  };
}

export const APPLIES_TO_NAMES: Record<string, string> = {
  all: "All Products",
  eyeglasses: "Eyeglasses",
  sunglasses: "Sunglasses",
  "contact-lens": "Contact Lenses",
  "computer-glasses": "Computer Glasses",
  "reading-glasses": "Reading Glasses",
  lenses: "Prescription Lenses",
  accessories: "Accessories",
  eyewear_accessories: "Spectacles, Sunglasses & Accessories",
};

/**
 * Format category strings (supports comma-separated categories or single keys)
 */
export function getCategoryLabel(applicableTo?: string | null): string {
  if (!applicableTo || applicableTo === "all") return "All Products";
  if (applicableTo === "eyewear_accessories") return "Spectacles, Sunglasses & Accessories";

  const parts = applicableTo.split(",").map((s) => s.trim().toLowerCase());
  const hasContact = parts.includes("contact-lens");
  const hasEyewear = parts.some((p) => p !== "contact-lens");

  if (!hasContact && hasEyewear) {
    if (
      parts.includes("eyeglasses") &&
      parts.includes("sunglasses") &&
      parts.includes("accessories")
    ) {
      return "Spectacles, Sunglasses & Accessories";
    }
  }

  const labels = parts
    .map((p) => APPLIES_TO_NAMES[p] || p)
    .filter(Boolean);

  return labels.join(", ");
}

/**
 * Check if a single item matches an applicable category key
 */
export function checkItemMatchesSingleRule(item: any, rule: string): boolean {
  if (!rule || rule === "all") return true;

  const isContact = isContactLensItem(item);
  const pType = (item.product_type || item.products?.product_type || "").toLowerCase();
  const cat = (
    item.category ||
    item.products?.category ||
    item.products?.categories?.name ||
    item.products?.categories?.slug ||
    ""
  ).toLowerCase();
  const name = (item.name || item.products?.name || "").toLowerCase();

  // If testing contact lens rule
  if (rule === "contact-lens") {
    return isContact;
  }

  // If item is a contact lens, it CANNOT match any eyewear/accessory rule
  if (isContact) {
    return false;
  }

  // Eyewear and Accessories preset
  if (rule === "eyewear_accessories") {
    return true; // Any non-contact lens item is eyewear/accessory/lens
  }

  const hasLens = Boolean(
    item.lens_id ||
    (item.lens_price && Number(item.lens_price) > 0) ||
    item.lens_config?.type ||
    item.lens_config?.package ||
    item.lens_config?.package_name ||
    (item.lens_config?.lens_price && Number(item.lens_config?.lens_price) > 0) ||
    (item.lens_config?.total_price && Number(item.lens_config?.total_price) > 0)
  );

  switch (rule) {
    case "eyeglasses":
      return (
        pType === "eyeglasses" ||
        pType === "eyewear" ||
        pType === "frame" ||
        cat.includes("eyeglass") ||
        cat.includes("eyeglasses") ||
        cat.includes("frames") ||
        (!cat.includes("sunglass") &&
          !cat.includes("reading") &&
          !cat.includes("computer") &&
          !cat.includes("accessor"))
      );
    case "sunglasses":
      return (
        pType === "sunglasses" ||
        pType === "sunglass" ||
        cat.includes("sunglass") ||
        name.includes("sunglass")
      );
    case "computer-glasses":
      return (
        pType === "computer-glasses" ||
        cat.includes("computer") ||
        name.includes("computer")
      );
    case "reading-glasses":
      return (
        pType === "reading-glasses" ||
        pType === "reading_glasses" ||
        cat.includes("reading") ||
        name.includes("reading")
      );
    case "lenses":
      return hasLens || cat.includes("lens") || pType === "lens";
    case "accessories":
      return (
        pType === "accessory" ||
        pType === "accessories" ||
        cat.includes("accessor") ||
        name.includes("cleaning kit") ||
        name.includes("case") ||
        name.includes("chain")
      );
    default:
      return true;
  }
}

/**
 * Check if an item matches the coupon's category restrictions (supports comma-separated list)
 */
export function checkItemMatchesApplicable(item: any, applicableTo: string): boolean {
  if (!applicableTo || applicableTo === "all") return true;

  const rules = applicableTo.split(",").map((s) => s.trim().toLowerCase());
  return rules.some((rule) => checkItemMatchesSingleRule(item, rule));
}

