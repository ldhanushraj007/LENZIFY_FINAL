/**
 * GST Calculation helper based on product category & type:
 * - Contact Lenses: 0% (GST already included in price)
 * - Sunglasses: 18% (added on top of price)
 * - Eyeglasses / Computer Glasses / Reading Glasses / Accessories / Prescription lenses: 5%
 */

export type GSTRateResult = 0.05 | 0.18 | 'included';

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
    productOrItem.product?.categories?.slug ||
    productOrItem.product_type ||
    productOrItem.products?.product_type ||
    productOrItem.type ||
    ''
  ).toLowerCase();

  if (cat.includes('contact')) return 'included';
  if (cat.includes('sunglass')) return 0.18;
  return 0.05;
}

export interface GSTBreakdown {
  subtotal: number;
  discountedSubtotal: number;
  gst5Total: number;
  gst18Total: number;
  hasContactLens: boolean;
  totalGST: number;
  grandTotal: number;
}

export function calculateCartGST(items: any[], couponDiscount: number = 0): GSTBreakdown {
  const subtotal = items.reduce(
    (acc, item) =>
      acc + (item.price || item.products?.offer_price || item.products?.price || 0) * (item.quantity || 1),
    0
  );

  const discountedSubtotal = Math.max(0, subtotal - (couponDiscount || 0));

  let gst5Total = 0;
  let gst18Total = 0;
  let hasContactLens = false;

  items.forEach((item) => {
    const rate = getGSTRate(item);
    const itemPrice = item.price || item.products?.offer_price || item.products?.price || 0;
    const itemTotal = itemPrice * (item.quantity || 1);

    if (rate === 'included') {
      hasContactLens = true;
    } else if (rate === 0.18) {
      gst18Total += Math.round(itemTotal * 0.18);
    } else if (rate === 0.05) {
      gst5Total += Math.round(itemTotal * 0.05);
    }
  });

  const totalGST = gst5Total + gst18Total;
  const grandTotal = discountedSubtotal + totalGST;

  return {
    subtotal,
    discountedSubtotal,
    gst5Total,
    gst18Total,
    hasContactLens,
    totalGST,
    grandTotal
  };
}
