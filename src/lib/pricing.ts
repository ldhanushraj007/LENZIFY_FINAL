/**
 * Unified Pricing Utility for Lenzify
 * Single source of truth for:
 * - Frame price (resolving offer_price vs discount_price vs regular price)
 * - Lens price (package base + index surcharge + power extra)
 * - Line item totals & breakdown
 * - Cart subtotals, GST, and grand total
 */

import { getGSTRate } from "./gst";

export interface ItemPricingBreakdown {
  frameUnitPrice: number;
  frameOriginalPrice: number;
  hasFrameDiscount: boolean;
  lensUnitPrice: number;
  packagePrice: number;
  indexPrice: number;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  gstRate: number;
  hasLens: boolean;
  lensType: string;
  lensPackage: string;
  indexLabel: string | null;
  indexNumber: string | null;
  coatingsCount: number;
  isContactLens: boolean;
  isReadingGlasses: boolean;
  isAccessory: boolean;
  isComputerGlasses: boolean;
  isFrameOnly: boolean;
}

export function isContactLensItem(item: any): boolean {
  if (!item) return false;
  const pType = (item.product_type || item.products?.product_type || "").toLowerCase();
  const cat = (
    item.category ||
    item.products?.category ||
    item.products?.categories?.slug ||
    item.products?.categories?.name ||
    ""
  ).toLowerCase();
  return (
    pType === "contact-lens" ||
    pType === "contact_lens" ||
    cat.includes("contact")
  );
}

export function isReadingGlassesItem(item: any): boolean {
  if (!item) return false;
  const pType = (item.product_type || item.products?.product_type || "").toLowerCase();
  const cat = (
    item.category ||
    item.products?.category ||
    item.products?.categories?.slug ||
    item.products?.categories?.name ||
    ""
  ).toLowerCase();
  const name = (item.name || item.products?.name || "").toLowerCase();
  const brand = (item.brand || item.products?.brand || "").toLowerCase();
  return (
    pType === "reading-glasses" ||
    pType === "reading_glasses" ||
    cat.includes("reading") ||
    name.includes("reading glass") ||
    brand.includes("reading glass")
  );
}

export function isAccessoryItem(item: any): boolean {
  if (!item) return false;
  const pType = (item.product_type || item.products?.product_type || "").toLowerCase();
  const cat = (
    item.category ||
    item.products?.category ||
    item.products?.categories?.slug ||
    item.products?.categories?.name ||
    ""
  ).toLowerCase();
  const name = (item.name || item.products?.name || "").toLowerCase();
  return (
    pType === "accessory" ||
    pType === "accessories" ||
    cat.includes("accessor") ||
    name.includes("accessory") ||
    name.includes("cleaning kit") ||
    name.includes("case") ||
    name.includes("chain")
  );
}

export function isComputerGlassesItem(item: any): boolean {
  if (!item) return false;
  const cat = (
    item.category ||
    item.products?.category ||
    item.products?.categories?.slug ||
    item.products?.categories?.name ||
    ""
  ).toLowerCase();
  const name = (item.name || item.products?.name || "").toLowerCase();
  return cat.includes("computer") || name.includes("computer glass");
}

export function isItemWithPrescriptionLens(item: any): boolean {
  if (!item) return false;
  if (isContactLensItem(item) || isReadingGlassesItem(item) || isAccessoryItem(item) || isComputerGlassesItem(item)) {
    return false;
  }
  return Boolean(
    item.lens_id ||
    (item.lens_config && (
      item.lens_config.type ||
      item.lens_config.package ||
      item.lens_config.package_name ||
      item.lens_config.selected_index ||
      item.lens_config.thickness ||
      Number(item.lens_config.lens_price) > 0 ||
      Number(item.lens_config.total_price) > 0 ||
      Number(item.lens_price) > 0
    ))
  );
}

/**
 * Resolves the effective selling price of a product/frame (discount/offer price prioritized over MRP)
 */
export function getProductEffectivePrice(product: any): number {
  if (!product) return 0;
  const offer = Number(product.offer_price);
  if (!isNaN(offer) && offer > 0) return offer;

  const discount = Number(product.discount_price);
  if (!isNaN(discount) && discount > 0) return discount;

  const regular = Number(product.price);
  if (!isNaN(regular) && regular > 0) return regular;

  return 0;
}

/**
 * Resolves the full original price (MRP) of a product/frame
 */
export function getProductOriginalPrice(product: any): number {
  if (!product) return 0;
  const regular = Number(product.price);
  if (!isNaN(regular) && regular > 0) return regular;
  return getProductEffectivePrice(product);
}

/**
 * Computes exact item pricing with consistent breakdown for frames and lenses.
 */
export function getItemPricing(item: any): ItemPricingBreakdown {
  const isContact = isContactLensItem(item);
  const isReading = isReadingGlassesItem(item);
  const isAccessory = isAccessoryItem(item);
  const isComputer = isComputerGlassesItem(item);
  const hasLens = isItemWithPrescriptionLens(item);
  const isFrameOnly = !isContact && !isReading && !isAccessory && !isComputer && !hasLens;

  const prodObj = item.products || item.product || null;

  // 1. Frame Base Selling Price & Original Price
  const frameOriginalPrice = getProductOriginalPrice(prodObj) || Number(item.price) || 0;
  let frameUnitPrice = getProductEffectivePrice(prodObj);

  // If no product object is attached, fallback to item.frame_price or item.price
  if (frameUnitPrice <= 0) {
    if (Number(item.frame_price) > 0) {
      frameUnitPrice = Number(item.frame_price);
    } else if (!hasLens && Number(item.price) > 0) {
      frameUnitPrice = Number(item.price);
    }
  }

  // 2. Lens Pricing Calculation
  let lensUnitPrice = 0;
  let indexPrice = 0;
  let packagePrice = 0;

  if (hasLens) {
    const lensCfg = item.lens_config || {};
    indexPrice = Number(lensCfg.index_price ?? lensCfg.thickness?.price ?? 0);

    // Explicitly stored lens price
    const explicitLensPrice = Number(
      item.lens_price ||
      lensCfg.lens_price ||
      lensCfg.total_price ||
      lensCfg.price ||
      0
    );

    const explicitPkgPrice = Number(lensCfg.package_price || 0);

    if (explicitLensPrice > 0) {
      lensUnitPrice = explicitLensPrice;
      packagePrice = explicitPkgPrice > 0 ? explicitPkgPrice : Math.max(0, lensUnitPrice - indexPrice);
    } else if (explicitPkgPrice > 0) {
      packagePrice = explicitPkgPrice;
      lensUnitPrice = packagePrice + indexPrice;
    } else {
      // Deduce lens price from item.price if item.price was saved as total (frame + lens)
      const storedItemPrice = Number(item.price) || 0;
      if (storedItemPrice > 0) {
        // Did storedItemPrice include frameOriginalPrice (e.g. 2995) or frameUnitPrice (e.g. 1695)?
        if (frameOriginalPrice > 0 && storedItemPrice > frameOriginalPrice) {
          lensUnitPrice = storedItemPrice - frameOriginalPrice;
        } else if (frameUnitPrice > 0 && storedItemPrice > frameUnitPrice) {
          lensUnitPrice = storedItemPrice - frameUnitPrice;
        }
        packagePrice = Math.max(0, lensUnitPrice - indexPrice);
      }
    }
  }

  // If frameUnitPrice was still 0 for a lens-bearing item, deduce from item.price - lensUnitPrice
  if (frameUnitPrice <= 0 && Number(item.price) > 0) {
    frameUnitPrice = Math.max(0, Number(item.price) - lensUnitPrice);
  }

  // Fallback sanity check: if frameUnitPrice is still 0 and frameOriginalPrice > 0
  if (frameUnitPrice <= 0 && frameOriginalPrice > 0) {
    frameUnitPrice = frameOriginalPrice;
  }

  const hasFrameDiscount = frameOriginalPrice > frameUnitPrice;
  const unitPrice = frameUnitPrice + lensUnitPrice;
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const totalPrice = unitPrice * quantity;

  // GST Calculation
  const rateResult = getGSTRate(item);
  const isGstIncluded = rateResult === "included" || rateResult === "included-18";
  const numericGstRate = isGstIncluded ? 0 : (rateResult === 0.18 ? 0.18 : 0.05);
  const gstAmount = isGstIncluded ? 0 : Math.round(totalPrice * numericGstRate);

  // Labels
  const lensCfg = item.lens_config || {};
  const rawType = lensCfg.type_name || lensCfg.lens_type_name || item.lens_name || lensCfg.type;
  const lensType = (
    typeof rawType === "string"
      ? rawType
      : (rawType && typeof rawType === "object" ? (rawType.name || rawType.title || "") : "")
  ) || (hasLens ? "Prescription Lens" : "");

  const rawPackage = lensCfg.package_name || lensCfg.package;
  const lensPackage = (
    typeof rawPackage === "string"
      ? rawPackage
      : (rawPackage && typeof rawPackage === "object" ? (rawPackage.label || rawPackage.name || "") : "")
  ) || (hasLens ? "Standard" : "");

  const rawIndex =
    lensCfg.selected_index ||
    lensCfg.thickness?.indexValue ||
    (typeof lensCfg.index_label === "string" ? lensCfg.index_label.match(/1\.\d{2}/)?.[0] : null) ||
    (typeof lensCfg.thickness?.name === "string" ? lensCfg.thickness.name.match(/1\.\d{2}/)?.[0] : null) ||
    null;

  const indexNumber = rawIndex ? String(rawIndex).trim() : null;
  const indexLabel = indexNumber ? `Index ${indexNumber}` : null;

  const coatings = Array.isArray(lensCfg.coatings) ? lensCfg.coatings : [];
  const features = Array.isArray(lensCfg.features) ? lensCfg.features : [];
  const coatingsCount = coatings.length + features.length > 0 ? (coatings.length + features.length) : 4;

  return {
    frameUnitPrice,
    frameOriginalPrice,
    hasFrameDiscount,
    lensUnitPrice,
    packagePrice,
    indexPrice,
    unitPrice,
    totalPrice,
    gstAmount,
    gstRate: numericGstRate,
    hasLens,
    lensType,
    lensPackage,
    indexLabel,
    indexNumber,
    coatingsCount,
    isContactLens: isContact,
    isReadingGlasses: isReading,
    isAccessory,
    isComputerGlasses: isComputer,
    isFrameOnly,
  };
}

export interface CartTotals {
  subtotal: number;
  discountedSubtotal: number;
  gst5Total: number;
  gst18Total: number;
  totalGST: number;
  shippingFee: number;
  grandTotal: number;
  hasContactLens: boolean;
  hasSunglasses: boolean;
}

export function calculateUnifiedCartTotals(items: any[], couponDiscount: number = 0): CartTotals {
  let subtotal = 0;
  let gst5Total = 0;
  let gst18Total = 0;
  let hasContactLens = false;
  let hasSunglasses = false;

  items.forEach((item) => {
    const pricing = getItemPricing(item);
    subtotal += pricing.totalPrice;

    const rate = getGSTRate(item);
    if (rate === "included") {
      hasContactLens = true;
    } else if (rate === "included-18") {
      hasSunglasses = true;
    } else if (rate === 0.18) {
      gst18Total += Math.round(pricing.totalPrice * 0.18);
    } else if (rate === 0.05) {
      gst5Total += Math.round(pricing.totalPrice * 0.05);
    }
  });

  const discountedSubtotal = Math.max(0, subtotal - (couponDiscount || 0));
  const totalGST = gst5Total + gst18Total;
  const shippingFee = 0; // Free delivery
  const grandTotal = discountedSubtotal + totalGST;

  return {
    subtotal,
    discountedSubtotal,
    gst5Total,
    gst18Total,
    totalGST,
    shippingFee,
    grandTotal,
    hasContactLens,
    hasSunglasses,
  };
}
