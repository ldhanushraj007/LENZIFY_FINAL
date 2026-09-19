/**
 * Robust product image URL resolver for Lenzify
 * Guarantees that the real uploaded product image is always resolved and displayed,
 * proxying Supabase storage URLs through the Next.js origin to prevent ISP/DNS blocks
 * or cross-origin failure in customer browsers.
 */

export function resolveProductImage(product?: {
  primary_image?: string | null;
  image?: string | null;
  product_images?: Array<{ image_url: string; is_primary?: boolean }> | null;
} | null): string {
  if (!product) return "/placeholder.jpg";

  let rawUrl: string | null = null;

  // 1. Check primary_image
  if (
    product.primary_image &&
    product.primary_image !== "/placeholder.jpg" &&
    !product.primary_image.startsWith("/placeholder")
  ) {
    rawUrl = product.primary_image;
  }

  // 2. Check product_images junction array
  if (!rawUrl && product.product_images && product.product_images.length > 0) {
    const primary = product.product_images.find((img) => img.is_primary);
    const candidate = primary || product.product_images[0];
    if (candidate?.image_url && candidate.image_url !== "/placeholder.jpg") {
      rawUrl = candidate.image_url;
    }
  }

  // 3. Legacy product.image fallback
  if (!rawUrl && product.image && product.image !== "/placeholder.jpg") {
    rawUrl = product.image;
  }

  // If no uploaded image exists, return the default placeholder
  if (!rawUrl) {
    return "/placeholder.jpg";
  }

  // If URL is from Supabase Storage, route through same-origin image proxy
  // This bypasses Indian ISP/DNS blocks (Jio/Airtel) and ensures 100% reliable delivery
  if (rawUrl.includes(".supabase.co/storage/v1/object/public/")) {
    return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  }

  return rawUrl;
}
