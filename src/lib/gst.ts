/**
 * GST Calculation helper based on exact product_type values:
 * - 'contact-lens': 5% included (display: "GST (5%): Included in price")
 * - 'sunglasses' WITHOUT lens: 18% included (display: "GST (18%): Included in price")
 * - 'sunglasses' WITH lens (is_prescription: true in lens_config): split
 *     frame: 18% included (no addition)
 *     lens portion only: 5% excluded (add on top)
 *     display: "Frame GST (18%): Included | Lens GST (5%): ₹[amount]"
 * - 'computer-glasses': 5% excluded (display: "GST (5%): ₹[amount]")
 * - 'frame': 5% excluded (display: "GST (5%): ₹[amount]")
 * - 'reading-glasses': 5% excluded (display: "GST (5%): ₹[amount]")
 */

export type GSTRateResult = 0.05 | 0.18 | 'included' | 'included-5' | 'included-18' | 'split';

export function getGSTRate(productOrItem: any): GSTRateResult {
  if (!productOrItem) return 0.05;

  const pType = (
    productOrItem.product_type ||
    productOrItem.products?.product_type ||
    productOrItem.type ||
    ''
  ).toLowerCase();

  const cat = (
    productOrItem.category ||
    productOrItem.category_name ||
    productOrItem.category_slug ||
    productOrItem.products?.category ||
    productOrItem.products?.categories?.name ||
    productOrItem.products?.categories?.slug ||
    productOrItem.product?.category ||
    productOrItem.product?.categories?.name ||
    productOrItem.product_categories?.map((pc: any) => `${pc.categories?.name} ${pc.categories?.slug}`).join(' ') ||
    productOrItem.products?.product_categories?.map((pc: any) => `${pc.categories?.name} ${pc.categories?.slug}`).join(' ') ||
    ''
  ).toLowerCase();

  // Contact Lenses: 5% included
  if (pType === 'contact-lens' || pType === 'contact_lens' || cat.includes('contact')) {
    return 'included-5';
  }

  // Sunglasses
  const name = (
    productOrItem.name ||
    productOrItem.products?.name ||
    productOrItem.product?.name ||
    ''
  ).toLowerCase();

  const isSunglasses = (
    pType === 'sunglasses' ||
    pType === 'sunglass' ||
    cat.includes('sunglass') ||
    name.includes('sunglass') ||
    productOrItem.lens_config?.flow_type === 'sunglasses' ||
    productOrItem.lens_config?.is_sunglasses_rx ||
    productOrItem.prescription_json?.is_sunglasses_rx
  );

  if (isSunglasses) {
    const isRx = Boolean(
      productOrItem.lens_config?.is_prescription ||
      productOrItem.lens_config?.flow_type === 'sunglasses' ||
      productOrItem.lens_config?.is_sunglasses_rx ||
      productOrItem.prescription_json?.is_sunglasses_rx ||
      Number(productOrItem.lens_config?.lens_price) > 0 ||
      Number(productOrItem.lens_price) > 0
    );
    if (isRx) {
      return 'split';
    }
    return 'included-18';
  }

  // Computer glasses, frames, reading glasses, accessories: 5% excluded
  return 0.05;
}

import { getItemPricing } from "./pricing";

export const FREE_SHIPPING_THRESHOLD = 2000;
export const STANDARD_SHIPPING_FEE = 99;

export interface GSTBreakdown {
  subtotal: number;
  discountedSubtotal: number;
  gst5Total: number;
  gst18Total: number;
  hasContactLens: boolean;
  hasSunglasses: boolean;
  hasSunglassesWithoutLens: boolean;
  hasSunglassesWithLens: boolean;
  sunglassesLensGstTotal: number;
  hasStandardGst5: boolean;
  standardGst5Total: number;
  totalGST: number;
  shippingFee: number;
  grandTotal: number;
}

export function calculateCartGST(items: any[], couponDiscount: number = 0): GSTBreakdown {
  let subtotal = 0;
  let gst5Total = 0;
  let gst18Total = 0;
  let hasContactLens = false;
  let hasSunglassesWithoutLens = false;
  let hasSunglassesWithLens = false;
  let sunglassesLensGstTotal = 0;
  let hasStandardGst5 = false;
  let standardGst5Total = 0;

  (items || []).forEach((item) => {
    const pricing = getItemPricing(item);
    const itemTotal = pricing.totalPrice;
    subtotal += itemTotal;

    const rate = getGSTRate(item);
    if (rate === 'included-5' || rate === 'included') {
      hasContactLens = true;
    } else if (rate === 'included-18') {
      hasSunglassesWithoutLens = true;
    } else if (rate === 'split') {
      hasSunglassesWithLens = true;
      const lensUnitPrice = Number(item.lens_config?.lens_price || pricing.lensUnitPrice || 0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const itemLensGst = Number(item.lens_config?.gst_amount) || Math.round(lensUnitPrice * qty * 0.05);
      sunglassesLensGstTotal += itemLensGst;
      gst5Total += itemLensGst;
    } else if (rate === 0.18) {
      gst18Total += Math.round(itemTotal * 0.18);
    } else if (rate === 0.05) {
      hasStandardGst5 = true;
      const itemGst = Math.round(itemTotal * 0.05);
      standardGst5Total += itemGst;
      gst5Total += itemGst;
    }
  });

  const discountedSubtotal = Math.max(0, subtotal - (couponDiscount || 0));
  const totalGST = gst5Total + gst18Total;
  const shippingFee = 0;
  const grandTotal = discountedSubtotal + totalGST;

  return {
    subtotal,
    discountedSubtotal,
    gst5Total,
    gst18Total,
    hasContactLens,
    hasSunglasses: hasSunglassesWithoutLens || hasSunglassesWithLens,
    hasSunglassesWithoutLens,
    hasSunglassesWithLens,
    sunglassesLensGstTotal,
    hasStandardGst5,
    standardGst5Total,
    totalGST,
    shippingFee,
    grandTotal
  };
}
