/**
 * GST Calculation helper based on product category & type:
 * - Contact Lenses: 0% (GST already included in price)
 * - Sunglasses: 18% (added on top of price)
 * - Eyeglasses / Computer Glasses / Reading Glasses / Accessories / Prescription lenses: 5%
 */

export type GSTRateResult = 0.05 | 0.18 | 'included' | 'included-18';

export function getGSTRate(productOrItem: any): GSTRateResult {
  if (!productOrItem) return 0.05;

  // Check category or type strings across various item formats
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
    productOrItem.product_type ||
    productOrItem.products?.product_type ||
    productOrItem.type ||
    ''
  ).toLowerCase();

  if (cat.includes('contact')) return 'included';
  if (cat.includes('sunglass')) return 'included-18';
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
  totalGST: number;
  shippingFee: number;
  grandTotal: number;
}

export function calculateCartGST(items: any[], couponDiscount: number = 0): GSTBreakdown {
  let subtotal = 0;
  let gst5Total = 0;
  let gst18Total = 0;
  let hasContactLens = false;
  let hasSunglasses = false;

  (items || []).forEach((item) => {
    const pricing = getItemPricing(item);
    const itemTotal = pricing.totalPrice;
    subtotal += itemTotal;

    const rate = getGSTRate(item);
    if (rate === 'included') {
      hasContactLens = true;
    } else if (rate === 'included-18') {
      hasSunglasses = true;
    } else if (rate === 0.18) {
      gst18Total += Math.round(itemTotal * 0.18);
    } else if (rate === 0.05) {
      gst5Total += Math.round(itemTotal * 0.05);
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
    hasSunglasses,
    totalGST,
    shippingFee,
    grandTotal
  };
}

