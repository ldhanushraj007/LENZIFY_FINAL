"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { addToCart, toggleWishlist } from "@/lib/db/customer_actions";
import { cn } from "@/lib/utils";
import { Star, ShoppingBag, Heart, Verified, RotateCw, ChevronRight, Truck, Shield, RefreshCw, BadgeCheck } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuth } from "@/components/providers/AuthProvider";
import dynamic from "next/dynamic";

const Product360Viewer = dynamic(() => import("./Product360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-[#F8F9FC] rounded-3xl flex items-center justify-center animate-pulse">
      <span className="text-xs text-[#666666]">Loading 360° viewer...</span>
    </div>
  ),
});
const LensSelectionFlow = dynamic(() => import("@/components/store/LensSelectionFlow"), {
  ssr: false,
});
const ReviewForm = dynamic(() => import("@/components/shop/ReviewForm"), {
  ssr: false,
});
import { ProductJsonLd } from "@/components/seo/JsonLd";
import ProductCard from "@/components/store/ProductCard";
import toast from "react-hot-toast";
import ContactLensPowerCustomizer, { ContactLensPrescriptionData, validateContactLensPower } from "@/components/store/ContactLensPowerCustomizer";
const LoginPromptModal = dynamic(() => import("@/components/auth/LoginPromptModal"), {
  ssr: false,
});
import { resolveProductImage } from "@/lib/image_utils";

interface ProductDetailsClientProps {
  product: any;
  user: any;
  similarProducts: any[];
  initialReviews: any[];
  isInWishlist: boolean;
  availableLenses?: any[];
}

export default function ProductDetailsClient({
  product,
  user,
  similarProducts,
  initialReviews,
  isInWishlist,
  availableLenses = []
}: ProductDetailsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { user: currentUser } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist: isItemInWishlist } = useWishlistStore();
  const [isInWish, setIsInWish] = useState(isInWishlist);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState("Please log in to add items to your cart");

  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");

  const allCategories = useMemo(() => {
    const list: any[] = [];
    if (product.categories) {
      if (Array.isArray(product.categories)) list.push(...product.categories);
      else list.push(product.categories);
    }
    if (Array.isArray((product as any).product_categories)) {
      (product as any).product_categories.forEach((pc: any) => {
        if (pc.categories) list.push(pc.categories);
      });
    }
    return list;
  }, [product.categories, (product as any).product_categories]);

  const hasEyeglassesCategory = useMemo(() => {
    return allCategories.some((c: any) => {
      const name = (c?.name || "").toLowerCase();
      const slug = (c?.slug || "").toLowerCase();
      return name === "eyeglasses" || slug === "eyeglasses";
    });
  }, [allCategories]);

  const isContactLens = useMemo(() => {
    const pType = (product.product_type || "").toLowerCase();
    return (
      pType === "contact-lens" ||
      pType === "contact_lens" ||
      pType === "contactlens" ||
      allCategories.some((c: any) => {
        const name = (c?.name || "").toLowerCase();
        const slug = (c?.slug || "").toLowerCase();
        return name.includes("contact") || slug.includes("contact");
      })
    );
  }, [product.product_type, allCategories]);

  const isReadingGlasses = useMemo(() => {
    const pType = (product.product_type || "").toLowerCase();
    return (
      pType === "reading-glasses" ||
      pType === "reading_glasses" ||
      allCategories.some((c: any) => {
        const name = (c?.name || "").toLowerCase();
        const slug = (c?.slug || "").toLowerCase();
        return name.includes("reading") || slug.includes("reading");
      })
    );
  }, [product.product_type, allCategories]);

  const isComputerGlasses = useMemo(() => {
    if (hasEyeglassesCategory) return false;
    const pType = (product.product_type || "").toLowerCase();
    return (
      pType === "computer-glasses" ||
      pType === "computer_glasses" ||
      allCategories.some((c: any) => {
        const name = (c?.name || "").toLowerCase();
        const slug = (c?.slug || "").toLowerCase();
        return name.includes("computer") || slug.includes("computer");
      })
    );
  }, [product.product_type, allCategories, hasEyeglassesCategory]);

  const isSunglasses = useMemo(() => {
    const pType = (product.product_type || "").toLowerCase();
    return (
      pType === "sunglasses" ||
      pType === "sunglass" ||
      allCategories.some((c: any) => {
        const name = (c?.name || "").toLowerCase();
        const slug = (c?.slug || "").toLowerCase();
        return name.includes("sunglass") || slug.includes("sunglass");
      })
    );
  }, [product.product_type, allCategories]);

  const parsedContactSpecs = useMemo(() => {
    let s = product.specifications;
    if (typeof s === "string") {
      try {
        s = JSON.parse(s);
      } catch {
        s = {};
      }
    }
    return s || {};
  }, [product.specifications]);

  const [customPower, setCustomPower] = useState<ContactLensPrescriptionData | null>(null);
  const [readingPower, setReadingPower] = useState<string>("");
  const parsedColors = useMemo(() => {
    if (!product.colors) return [];
    return product.colors.map((colorItem: any) => {
      if (typeof colorItem === 'string') {
        try {
          return JSON.parse(colorItem);
        } catch {
          console.warn("Legacy plain text color variant detected:", colorItem);
          return { name: colorItem, hex: colorItem, image: null };
        }
      }
      return colorItem;
    });
  }, [product.colors]);

  const parsedSizes = useMemo(() => {
    if (!product.sizes) return [];
    return product.sizes.map((sizeItem: any) => {
      if (typeof sizeItem === 'string') {
        try {
          return JSON.parse(sizeItem);
        } catch {
          console.warn("Legacy plain text size variant detected:", sizeItem);
          return { label: sizeItem, inStock: true, stockQty: null };
        }
      }
      return sizeItem;
    });
  }, [product.sizes]);

  const [selectedColor, setSelectedColor] = useState<string>(parsedColors[0]?.name || "");
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const firstInStock = parsedSizes.find((s: any) => s.inStock);
    return firstInStock ? firstInStock.label : (parsedSizes[0]?.label || "");
  });

  // Select the first available in-stock size on mount/updates
  useEffect(() => {
    const activeSizeObj = parsedSizes.find((s: any) => s.label === selectedSize);
    if (activeSizeObj && !activeSizeObj.inStock) {
      const firstInStock = parsedSizes.find((s: any) => s.inStock);
      if (firstInStock) {
        setSelectedSize(firstInStock.label);
      }
    }
  }, [parsedSizes, selectedSize]);
  const [viewMode, setViewMode] = useState<"static" | "360">("static");
  const [showLensFlow, setShowLensFlow] = useState(false);

  const initialPrimaryImage = resolveProductImage(product);
  const [mainImageSrc, setMainImageSrc] = useState(initialPrimaryImage);

  const handleAddToCart = async (lensData?: any, isBuyNow: boolean = false) => {
    const activeUser = currentUser || user;
    if (!activeUser) {
      setLoginModalMessage(isBuyNow ? "Please log in to complete your purchase" : "Please log in to add items to your cart");
      setShowLoginModal(true);
      return;
    }

    const framePrice = Number(product.offer_price ?? product.discount_price ?? product.price ?? 0);
    const lensPrice = Number(lensData?.lens_price || 0);
    const displayPrice = framePrice + lensPrice;

    const cartItemId = `${product.id}-${selectedColor || ''}-${selectedSize || ''}-${lensData?.lens_id || ''}-${customPower ? 'rx' : ''}-${readingPower ? `rp-${readingPower}` : ''}`;
    const cartItem = {
      id: cartItemId,
      product_id: product.id,
      name: product.name,
      brand: product.brand || "LENZIFY",
      price: displayPrice,
      frame_price: framePrice,
      lens_price: lensPrice,
      image: mainImageSrc || "/placeholder.jpg",
      category: isContactLens ? "Contact Lenses" : isReadingGlasses ? "Reading Glasses" : isComputerGlasses ? "Computer Glasses" : "Eyewear",
      product_type: product.product_type || (isReadingGlasses ? "reading-glasses" : isContactLens ? "contact-lens" : "frame"),
      quantity: 1,
      stock: product.stock,
      selected_color: selectedColor,
      selected_size: selectedSize,
      reading_power: isReadingGlasses ? readingPower : undefined,
      lens_name: isReadingGlasses
        ? undefined
        : isContactLens
        ? (customPower ? "Custom Power Lenses" : "Standard Contact Lens")
        : (lensData?.lens_config?.type?.name || lensData?.lens_name),
      lens_config: isReadingGlasses ? undefined : lensData?.lens_config,
      prescription: isReadingGlasses
        ? { reading_power: readingPower }
        : (customPower || lensData?.prescription_json),
    };

    // 1. Always add to local persistent cart
    addItem(cartItem as any);

    const toastId = toast.loading('Adding to cart...', {
      style: {
        background: '#ffffff',
        color: '#111111',
        border: '1px solid #E8EAF2',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
      }
    });

    try {
      // 2. If logged in, sync with Supabase cart table
      if (currentUser) {
        await addToCart(product.id, {
          quantity: 1,
          color: selectedColor,
          size: selectedSize,
          price: displayPrice,
          lens_id: lensData?.lens_id || null,
          lens_config: lensData?.lens_config || null,
          prescription_json: isReadingGlasses
            ? { reading_power: readingPower }
            : (customPower || lensData?.prescription_json || null)
        });
      }

      toast.success(`Added to cart: ${product.name}`, {
        id: toastId,
        style: {
          background: '#ffffff',
          color: '#111111',
          border: '1px solid #E8EAF2',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
        }
      });
      setShowLensFlow(false);
      router.push(isBuyNow ? "/cart?buyNow=true" : "/cart");
    } catch (err) {
      console.error("Cart sync notice:", err);
      // Item is still successfully added to local cart!
      toast.success(`Added to cart: ${product.name}`, {
        id: toastId,
        style: {
          background: '#ffffff',
          color: '#111111',
          border: '1px solid #E8EAF2',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
        }
      });
      setShowLensFlow(false);
      router.push(isBuyNow ? "/cart?buyNow=true" : "/cart");
    }
  };

  const handleWishlist = async () => {
    const activeUser = currentUser || user;
    if (!activeUser) {
      setLoginModalMessage("Please log in to save items to your wishlist");
      setShowLoginModal(true);
      return;
    }
    const res = await toggleWishlist(product.id);
    if (res.success) {
        if (isItemInWishlist(product.id)) {
            removeFromWishlist(product.id);
            setIsInWish(false);
        } else {
            addToWishlist(product as any);
            setIsInWish(true);
        }
    }
  };

  const handleOpenLensFlow = () => {
    const activeUser = currentUser || user;
    if (!activeUser) {
      setLoginModalMessage("Please log in to customize lenses and proceed with your order");
      setShowLoginModal(true);
      return;
    }
    setShowLensFlow(true);
  };

  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url || product.product_images?.[0]?.image_url;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lenzify.in';

  // Price logic
  const frameEffectivePrice = Number(product.offer_price ?? product.discount_price ?? product.price ?? 0);
  const originalPrice = Number(product.price || frameEffectivePrice || 0);
  const hasDiscount = originalPrice > frameEffectivePrice;
  const displayPrice = frameEffectivePrice;
  const savingsAmount = hasDiscount ? originalPrice - displayPrice : 0;
  const savingsPercent = hasDiscount && originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;

  // Average rating
  const avgRating = initialReviews.length > 0
    ? initialReviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / initialReviews.length
    : product.rating || 0;

  // Delivery estimate
  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });
  }, []);

  // Specs for the Specifications tab (Filter out frame specs for contact lenses, display contact lens parameters)
  const specs = isContactLens
    ? [
        { label: "Pack Size", value: product.pack_size || parsedContactSpecs.pack_size },
        { label: "Material", value: product.material || parsedContactSpecs.material },
        { label: "Water Content", value: parsedContactSpecs.water_content || parsedContactSpecs.waterContent },
        { label: "Base Curve (BC)", value: parsedContactSpecs.base_curve || parsedContactSpecs.baseCurve || parsedContactSpecs.bc },
        { label: "Diameter (DIA)", value: parsedContactSpecs.diameter || parsedContactSpecs.dia },
        { label: "Replacement Schedule", value: parsedContactSpecs.replacement_schedule || parsedContactSpecs.usage_schedule || parsedContactSpecs.replacement },
        { label: "Disposability", value: parsedContactSpecs.disposability },
        { label: "Packaging", value: parsedContactSpecs.packaging },
        ...Object.entries(parsedContactSpecs)
          .filter(([k]) => !["pack_size", "material", "water_content", "waterContent", "base_curve", "baseCurve", "bc", "diameter", "dia", "replacement_schedule", "usage_schedule", "replacement", "disposability", "packaging", "usage_type"].includes(k))
          .map(([k, v]) => ({ label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value: String(v) }))
      ].filter(s => s.value)
    : [
        { label: "Frame Type", value: product.frame_type },
        { label: "Shape", value: product.shape },
        { label: "Material", value: product.material },
        { label: "Gender", value: product.gender },
        { label: "Color", value: product.color },
        { label: "Size", value: product.size },
      ].filter(s => s.value);

  return (
    <div className="bg-white text-[#111111] min-h-screen">
      <ProductJsonLd product={product} url={`${siteUrl}/product/${product.id}`} />

      {/* Breadcrumb */}
      <nav className="bg-white pt-20 md:pt-24 pb-0 px-4 sm:px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-[#666666] py-4">
          <Link href="/" className="hover:text-[#004AAD] transition-colors">Home</Link>
          <span className="text-[#ECECEC]">/</span>
          <Link href="/products" className="hover:text-[#004AAD] transition-colors">Products</Link>
          {product.categories && product.categories.length > 0 && (
            <>
              <span className="text-[#ECECEC]">/</span>
              <Link
                href={`/products?category=${product.categories[0].slug}`}
                className="hover:text-[#004AAD] transition-colors"
              >
                {product.categories[0].name}
              </Link>
            </>
          )}
          <span className="text-[#ECECEC]">/</span>
          <span className="text-[#111111] font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </nav>

      {/* Main product section */}
      <main className="max-w-screen-2xl mx-auto px-6 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* ── Left column (sticky image viewer) ── */}
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Main image / 360 toggle */}
            <AnimatePresence mode="wait">
              {viewMode === "static" ? (
                <motion.div
                  key="static"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-[#F8F9FC] rounded-3xl aspect-square overflow-hidden flex items-center justify-center p-8 group"
                >
                  <Image
                    src={mainImageSrc}
                    alt={product.name}
                    fill
                    priority
                    unoptimized
                    onError={() => {
                      const raw = product.primary_image || product.product_images?.[0]?.image_url;
                      if (raw && raw !== mainImageSrc && raw !== "/placeholder.jpg") {
                        setMainImageSrc(raw);
                      } else {
                        setMainImageSrc("/placeholder.jpg");
                      }
                    }}
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* 360 trigger */}
                  {product.images_360?.length > 0 && (
                    <button
                      onClick={() => setViewMode("360")}
                      suppressHydrationWarning
                      className="absolute bottom-4 right-4 bg-white text-[#03173D] border border-[#E8EAF2] rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-md hover:bg-[#03173D] hover:text-white transition-all"
                    >
                      <RotateCw size={13} />
                      360° View
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="360"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl overflow-hidden"
                >
                  <Product360Viewer images={product.images_360} />
                  <button
                    onClick={() => setViewMode("static")}
                    suppressHydrationWarning
                    className="mt-4 text-xs font-semibold text-[#666666] hover:text-[#111111] underline underline-offset-2 transition-colors"
                  >
                    Back to photo view
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thumbnail strip */}
            {product.product_images && product.product_images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.product_images.map((img: any) => {
                  const resolvedThumb = resolveProductImage({ primary_image: img.image_url });
                  return (
                    <button
                      key={img.id}
                      onClick={() => { setMainImageSrc(resolvedThumb); setViewMode("static"); }}
                      suppressHydrationWarning
                      className={cn(
                        "flex-shrink-0 w-20 h-20 rounded-2xl bg-[#F8F9FC] border-2 cursor-pointer overflow-hidden transition-all duration-200",
                        mainImageSrc === resolvedThumb
                          ? "border-[#03173D]"
                          : "border-transparent hover:border-[#004AAD]/30"
                      )}
                    >
                      <Image
                        src={resolvedThumb}
                        alt="Product thumbnail"
                        width={80}
                        height={80}
                        unoptimized
                        className="object-contain w-full h-full p-2"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-8">

            {/* Brand & Frame Type (Hide frame type for contact lenses) */}
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm font-semibold text-[#004AAD] uppercase tracking-widest">
                {product.brand || "Lenzify"}
              </p>
              {!isContactLens && product.frame_type && (
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  product.frame_type === 'rimless'
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-[#03173D]/5 text-[#03173D] border-[#03173D]/10"
                )}>
                  {product.frame_type.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-4xl md:text-5xl font-[var(--font-hero)] italic text-[#111111] leading-tight -mt-4">
              {product.name}
            </h1>

            {/* Rating row */}
            {avgRating > 0 && (
              <div className="flex items-center gap-3 -mt-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={15}
                      className={cn(
                        star <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-[#E8EAF2] text-[#E8EAF2]"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#666666]">
                  {avgRating.toFixed(1)} ({initialReviews.length} {initialReviews.length === 1 ? "review" : "reviews"})
                </span>
                <button
                  onClick={() => setActiveTab("reviews")}
                  suppressHydrationWarning
                  className="text-sm text-[#004AAD] hover:underline"
                >
                  See all
                </button>
              </div>
            )}

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                {hasDiscount && (
                  <span className="text-lg text-[#999999] line-through">
                    ₹{originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-3xl font-bold text-[#111111]">
                  ₹{displayPrice.toLocaleString()}
                </span>
                {hasDiscount && savingsPercent > 0 && (
                  <span className="bg-[#004AAD]/10 text-[#004AAD] text-sm font-semibold rounded-full px-3 py-1">
                    {savingsPercent}% off
                  </span>
                )}
              </div>
              {isSunglasses && (
                <p className="text-xs font-semibold text-emerald-700 mt-1">
                  MRP inclusive of 18% GST
                </p>
              )}
            </div>

            {/* Pack Size Display (Contact Lenses) */}
            {isContactLens && (product.pack_size || parsedContactSpecs.pack_size) && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#004AAD]/5 border border-[#004AAD]/15 text-[#004AAD] text-xs font-semibold">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#004AAD]/70">Pack Size:</span>
                <span>{product.pack_size || parsedContactSpecs.pack_size}</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[#E8EAF2]" />

            {/* Color selector */}
            {parsedColors.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#111111]">
                  Color — <span className="font-semibold">{selectedColor}</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {parsedColors.map((color: any) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setSelectedColor(color.name);
                        if (color.image) {
                          setMainImageSrc(color.image);
                          setViewMode("static");
                        }
                      }}
                      suppressHydrationWarning
                      title={color.name}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 cursor-pointer transition-all",
                        selectedColor === color.name
                          ? "border-[#03173D] ring-2 ring-[#03173D]/20"
                          : "border-transparent hover:border-[#004AAD]"
                      )}
                      style={{
                        backgroundColor: color.hex,
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {parsedSizes.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#111111]">Size</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {parsedSizes.map((size: any) => {
                    const isSelected = selectedSize === size.label;
                    return (
                      <button
                        key={size.label}
                        disabled={!size.inStock}
                        onClick={() => size.inStock && setSelectedSize(size.label)}
                        suppressHydrationWarning
                        className={cn(
                          "border rounded-full px-4 py-2 text-sm cursor-pointer transition-all",
                          isSelected
                            ? "bg-[#03173D] text-white border-[#03173D]"
                            : size.inStock
                              ? "border-[#E8EAF2] text-[#666666] hover:border-[#004AAD] hover:text-[#004AAD]"
                              : "border-[#ECECEC] text-[#CCCCCC] bg-[#F8F9FC] cursor-not-allowed line-through opacity-45"
                        )}
                      >
                        {size.label} {!size.inStock && "(Out of Stock)"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}


            {/* LensSelectionFlow modal */}
            {showLensFlow && !isReadingGlasses && !isComputerGlasses && (
              <LensSelectionFlow
                product={product}
                availableLenses={availableLenses}
                onClose={() => setShowLensFlow(false)}
                onAddToCart={handleAddToCart}
              />
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {(hasEyeglassesCategory || product.product_type === "frame" || isSunglasses) && !isReadingGlasses && !isComputerGlasses ? (
                <>
                  <button
                    onClick={handleOpenLensFlow}
                    disabled={product.stock <= 0}
                    suppressHydrationWarning
                    className="w-full bg-[#03173D] text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 hover:bg-[#004AAD] transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ShoppingBag size={18} />
                    Buy with Lenses
                  </button>
                  <button
                    onClick={() => handleAddToCart(undefined, false)}
                    disabled={product.stock <= 0}
                    suppressHydrationWarning
                    className="w-full border border-[#03173D] text-[#03173D] rounded-full py-4 font-semibold hover:bg-[#03173D] hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {product.stock > 0 ? (isSunglasses ? "Add Sunglasses to Cart" : "Add Frame Only") : "Out of Stock"}
                  </button>
                </>
              ) : (
                <>
                  {/* Customize Your Power Section for Contact Lenses */}
                  {isContactLens && (
                    <div className="mb-2">
                      <ContactLensPowerCustomizer
                        value={customPower}
                        onChange={setCustomPower}
                        productDefaultBc={parsedContactSpecs.base_curve || "8.6"}
                        productDefaultDia={parsedContactSpecs.diameter || "14.2"}
                        required={true}
                      />
                    </div>
                  )}

                  {/* Reading Power Selector for Reading Glasses */}
                  {isReadingGlasses && (
                    <div className="mb-4 p-4 bg-[#F8F9FC] border border-[#ECEFF5] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                            Select Reading Power <span className="text-red-500">*</span>
                          </p>
                          <p className="text-[11px] text-[#666666]">Choose magnification strength</p>
                        </div>
                        {readingPower && (
                          <span className="text-xs font-bold text-[#004AAD] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                            {readingPower}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {["+1.00", "+1.25", "+1.50", "+1.75", "+2.00", "+2.25", "+2.50", "+2.75", "+3.00"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setReadingPower(p)}
                            className={cn(
                              "py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center",
                              readingPower === p
                                ? "bg-[#004AAD] text-white border-[#004AAD] shadow-sm"
                                : "bg-white text-[#111111] border-[#ECEFF5] hover:border-[#004AAD]/40"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const isClValid = isContactLens ? validateContactLensPower(customPower).isValid : true;
                    const isRgValid = isReadingGlasses ? !!readingPower : true;
                    const canPurchase = isClValid && isRgValid;
                    return (
                      <>
                        <button
                          onClick={() => handleAddToCart(undefined, false)}
                          disabled={product.stock <= 0 || !canPurchase}
                          suppressHydrationWarning
                          className="w-full bg-[#03173D] text-white rounded-full py-4 font-semibold flex items-center justify-center gap-2 hover:bg-[#004AAD] transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <ShoppingBag size={18} />
                          {product.stock > 0 ? (isSunglasses ? "Add Sunglasses to Cart" : "Add to Cart") : "Out of Stock"}
                        </button>
                        {product.stock > 0 && !isSunglasses && (
                          <button
                            onClick={() => handleAddToCart(undefined, true)}
                            disabled={!canPurchase}
                            suppressHydrationWarning
                            className="w-full border border-[#03173D] text-[#03173D] rounded-full py-4 font-semibold hover:bg-[#03173D] hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
                          >
                            Buy Now
                          </button>
                        )}
                        {isContactLens && !isClValid && (
                          <p className="text-[11px] font-semibold text-amber-800 bg-amber-50/90 border border-amber-200/80 px-4 py-2.5 rounded-2xl text-center leading-relaxed">
                            ⚠️ Power Customization Required: Please configure your left and right eye power above to enable purchasing.
                          </p>
                        )}
                        {isReadingGlasses && !isRgValid && (
                          <p className="text-[11px] font-semibold text-amber-800 bg-amber-50/90 border border-amber-200/80 px-4 py-2.5 rounded-2xl text-center leading-relaxed">
                            ⚠️ Reading Power Required: Please select your reading magnification strength above before adding to cart.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </>
              )}

              {/* Wishlist */}
              <button
                onClick={handleWishlist}
                suppressHydrationWarning
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all",
                  isInWish
                    ? "text-red-500 bg-red-50"
                    : "text-[#666666] hover:text-red-500 hover:bg-red-50"
                )}
              >
                <Heart size={16} className={cn(isInWish && "fill-red-500")} />
                {isInWish ? "Saved to Wishlist" : "Save to Wishlist"}
              </button>
            </div>

            {/* Trust badges (Contact lenses omit frame warranty & returns) */}
            <div className="grid grid-cols-4 gap-2 py-2">
              {(isContactLens
                ? [
                    { icon: <Truck size={16} />, label: "Free Shipping" },
                    { icon: <Shield size={16} />, label: "Sterile & Sealed" },
                    { icon: <RotateCw size={16} />, label: "100% Fresh Batch" },
                    { icon: <BadgeCheck size={16} />, label: "Authentic" },
                  ]
                : [
                    { icon: <Truck size={16} />, label: "Free Shipping" },
                    { icon: <Shield size={16} />, label: "2-Year Warranty" },
                    { icon: <RefreshCw size={16} />, label: "Free Returns" },
                    { icon: <BadgeCheck size={16} />, label: "Authentic" },
                  ]
              ).map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-[#004AAD]">{icon}</span>
                  <span className="text-[10px] text-[#666666] leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Delivery estimate */}
            <p className="text-sm text-[#666666]">
              Estimated delivery: <span className="font-medium text-[#111111]">{deliveryDate}</span>
            </p>
          </div>
        </div>

        {/* ── Tab section ── */}
        <div className="mt-16">
          {/* Tab bar */}
          <div className="border-b border-[#E8EAF2] flex gap-8">
            {[
              { id: "description", label: "Description" },
              { id: "specs", label: "Specifications" },
              { id: "reviews", label: `Reviews (${initialReviews.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                suppressHydrationWarning
                className={cn(
                  "pb-4 text-sm font-medium transition-all relative",
                  activeTab === tab.id
                    ? "text-[#111111] font-semibold border-b-2 border-[#03173D] -mb-px"
                    : "text-[#666666] hover:text-[#111111]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-8 min-h-[200px]">
            <AnimatePresence mode="wait">
              {activeTab === "description" && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="prose max-w-none text-[#666666] leading-relaxed space-y-2"
                >
                  {(() => {
                    const text = product.description || "No description available for this product.";
                    const lines = text.split("\n");
                    const elements: React.ReactNode[] = [];
                    let currentBullets: string[] = [];

                    lines.forEach((line: string, idx: number) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("•") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                        const cleanText = trimmed.replace(/^[•\-\*]\s*/, "");
                        currentBullets.push(cleanText);
                      } else {
                        if (currentBullets.length > 0) {
                          elements.push(
                            <ul key={`ul-${idx}`} className="list-disc pl-5 my-2 space-y-1 text-[#555555]">
                              {currentBullets.map((b, bIdx) => (
                                <li key={`b-${bIdx}`}>{b}</li>
                              ))}
                            </ul>
                          );
                          currentBullets = [];
                        }
                        if (trimmed) {
                          elements.push(<p key={`p-${idx}`}>{trimmed}</p>);
                        }
                      }
                    });

                    if (currentBullets.length > 0) {
                      elements.push(
                        <ul key="ul-end" className="list-disc pl-5 my-2 space-y-1 text-[#555555]">
                          {currentBullets.map((b, bIdx) => (
                            <li key={`b-${bIdx}`}>{b}</li>
                          ))}
                        </ul>
                      );
                    }

                    return elements.length > 0 ? elements : <p>{text}</p>;
                  })()}
                </motion.div>
              )}

              {activeTab === "specs" && (
                <motion.div
                  key="specs"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="divide-y divide-[#E8EAF2] max-w-xl"
                >
                  {specs.length > 0 ? specs.map(spec => (
                    <div key={spec.label} className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-[#111111]">{spec.label}</span>
                      <span className="text-sm text-[#666666] capitalize">{spec.value}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-[#666666] py-4">No specifications available.</p>
                  )}
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* ReviewForm */}
                  <ReviewForm productId={product.id} userId={currentUser?.id} />

                  {/* Review list */}
                  <div className="space-y-4">
                    {initialReviews.map(review => (
                      <div
                        key={review.id}
                        className="bg-white border border-[#ECECEC] rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#111111]">
                            {review.users?.name || "Anonymous"}
                          </p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={12}
                                className={cn(
                                  star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-[#E8EAF2] text-[#E8EAF2]"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-[#666666] leading-relaxed">
                          {review.review}
                        </p>
                        <p className="text-xs text-[#999999]">
                          {new Date(review.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                    {initialReviews.length === 0 && (
                      <p className="text-sm text-[#666666] text-center py-8">
                        No reviews yet. Be the first to share your experience!
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Similar Products ── */}
        {similarProducts.length > 0 && (
          <section className="mt-24 bg-white">
            <div className="space-y-3 mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD]">
                You May Also Like
              </p>
              <h2 className="text-3xl font-[var(--font-hero)] italic text-[#111111]">
                Similar Eyewear
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to continue"
        message={loginModalMessage}
      />
    </div>
  );
}
