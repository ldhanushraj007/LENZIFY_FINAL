"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { toggleWishlist } from "@/lib/db/customer_actions";
import { useAuth } from "@/components/providers/AuthProvider";
import { Heart } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number | string;
    primary_image?: string;
    image?: string;
    product_images?: Array<{ image_url: string; is_primary: boolean }>;
    category?: string;
    categories?: { name: string; slug: string };
    brand?: string;
    rating?: number;
    slug?: string;
    discount_price?: number;
    colors?: any[];
    stock?: number;
    availability?: string;
  };
}

const parseColor = (val: any): { name: string; hex: string } | null => {
  if (!val) return null;
  let item = val;
  if (typeof item === "string") {
    try {
      item = JSON.parse(item);
    } catch {
      const trimmed = val.trim();
      if (!trimmed) return null;
      return {
        name: trimmed,
        hex: trimmed.startsWith("#") ? trimmed : trimmed,
      };
    }
  }
  if (item && typeof item === "object") {
    const name = item.name || item.label || item.color || "";
    let hex = item.hex || item.colorHex || "";
    if (!hex && typeof name === "string" && name.startsWith("#")) {
      hex = name;
    }
    if (!hex) hex = "#000000";
    if (name) {
      return { name: String(name).trim(), hex: String(hex).trim() };
    }
  }
  return null;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const router = useRouter();
  const { user } = useAuth();

  const parsedColors = (product.colors || [])
    .map(parseColor)
    .filter((c): c is { name: string; hex: string } => c !== null);

  const getInitialImage = () => {
    // Check primary_image but skip the generic placeholder — it means no real image was saved
    const primaryImg = product.primary_image;
    if (primaryImg && primaryImg !== "/placeholder.jpg" && !primaryImg.startsWith("/placeholder")) {
      return primaryImg;
    }
    // Fall through to the product_images junction table (has the real uploaded URL)
    if (product.product_images && product.product_images.length > 0) {
      const primary = product.product_images.find((img: any) => img.is_primary);
      const best = primary || product.product_images[0];
      if (best?.image_url && best.image_url !== "/placeholder.jpg") {
        return best.image_url;
      }
    }
    // Legacy fallback
    if (product.image && product.image !== "/placeholder.jpg") return product.image;
    return "/placeholder.jpg";
  };

  const [imgSrc, setImgSrc] = useState(getInitialImage());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(getInitialImage());
    setIsLoaded(false);
  }, [product.id, product.primary_image, product.image, product.product_images]);

  const rawPrice = Number(product.price) || 0;
  const rawDiscount = product.discount_price ? Number(product.discount_price) : null;

  const hasValidDiscount = rawDiscount !== null && rawDiscount < rawPrice;
  const displayPrice = hasValidDiscount ? rawDiscount : rawPrice;
  const originalPrice = rawPrice;
  const hasDiscount = hasValidDiscount;

  const isOutOfStock = product.stock === 0 || product.availability === "unavailable" || product.availability === "discontinued";
  const isLowStock = !isOutOfStock && typeof product.stock === "number" && product.stock > 0 && product.stock <= 5;
  const isComingSoon = product.availability === "coming_soon";

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const result = await toggleWishlist(product.id);
      if (result.success) {
        if (isInWishlist(product.id)) {
          removeFromWishlist(product.id);
        } else {
          addToWishlist(product as any);
        }

        toast.success("Wishlist updated", {
          style: {
            background: "#ffffff",
            color: "#111111",
            border: "1px solid #E8EAF2",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "600",
          },
        });
      }
    } catch (err) {
      toast.error("Wishlist error", {
        style: {
          background: "#ffffff",
          color: "#111111",
          border: "1px solid #E8EAF2",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
        },
      });
    }
  };

  const wishlisted = isInWishlist(product.id);

  return (
    <div className="group relative bg-white border border-[#ECECEC] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300">
      <Link
        href={`/product/${product.slug || product.id}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        {/* Image Area */}
        <div className="relative aspect-square bg-[#F8F9FC] overflow-hidden rounded-2xl m-3">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            onError={() => setImgSrc("/placeholder.jpg")}
            onLoad={() => setIsLoaded(true)}
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />

          {/* Out of Stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 z-20 pointer-events-none flex items-center justify-center">
              <span className="bg-white border border-[#ECECEC] text-[#444444] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                Out of Stock
              </span>
            </div>
          )}

          {/* Coming Soon overlay */}
          {isComingSoon && !isOutOfStock && (
            <div className="absolute inset-0 bg-white/50 z-20 pointer-events-none flex items-center justify-center">
              <span className="bg-[#004AAD] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                Coming Soon
              </span>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-20 pointer-events-none">
            {hasDiscount && !isOutOfStock && (
              <span className="bg-[#004AAD] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Sale
              </span>
            )}
            {isLowStock && (
              <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Only {product.stock} left
              </span>
            )}
          </div>
        </div>

        {/* Info Area */}
        <div className="px-4 pb-4 pt-1 space-y-1">
          <p className="text-xs font-semibold text-[#004AAD] uppercase tracking-wider">
            {product.brand || "Lenzify"}
          </p>
          <h4 className="text-sm font-medium text-[#111111] leading-snug line-clamp-1 group-hover:text-[#004AAD] transition-colors">
            {product.name}
          </h4>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {hasDiscount && (
                <span className="text-xs text-[#666666] line-through">
                  ₹{originalPrice.toLocaleString()}
                </span>
              )}
              <span className="text-base font-bold text-[#111111]">
                ₹{displayPrice.toLocaleString()}
              </span>
            </div>

            {parsedColors.length > 0 && (
              <div className="flex items-center gap-1">
                {parsedColors.slice(0, 4).map((color, i) => {
                  const hexLower = (color.hex || "").toLowerCase();
                  const isLight =
                    hexLower === "#ffffff" ||
                    hexLower === "#fafafa" ||
                    color.name.toLowerCase().includes("transparent");
                  return (
                    <span
                      key={i}
                      title={color.name}
                      className={`w-3.5 h-3.5 rounded-full inline-block flex-shrink-0 shadow-xs ${
                        isLight ? "border border-slate-300" : "border border-black/10"
                      }`}
                      style={{
                        backgroundColor: color.hex,
                      }}
                    />
                  );
                })}
                {parsedColors.length > 4 && (
                  <span className="text-[9px] text-[#666666] font-bold">
                    +{parsedColors.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist Button */}
      <button
        suppressHydrationWarning
        onClick={handleWishlist}
        className={`absolute top-6 right-6 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md opacity-90 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-1 md:group-hover:translate-y-0 transition-all duration-200 z-30 ${
          wishlisted ? "text-red-500" : "text-[#666666] hover:text-red-500"
        }`}
        aria-label="Toggle wishlist"
      >
        <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
