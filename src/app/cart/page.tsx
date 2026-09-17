"use client";

import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { getCart, removeFromCart, addToCart, updateCartQuantity } from "@/lib/db/customer_actions";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "react-hot-toast";

const supabaseInstance = createClient();

function CartPageContent() {
  const { items, setItems, removeItem, updateQuantity } = useCartStore();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyNow = searchParams.get("buyNow");

  const supabase = useMemo(() => supabaseInstance, []);
  const channelRef = useRef<any>(null);

  const syncCartData = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }
      const cartData = await getCart();
      if (!Array.isArray(cartData)) {
        setLoading(false);
        return;
      }
      const mappedItems = cartData.map((item: any) => ({
        id: `${item.product_id}-${item.selected_color || ""}-${item.selected_size || ""}-${item.lens_id || ""}`,
        database_id: item.id,
        product_id: item.product_id,
        name: item.products?.name || "Product",
        brand: item.products?.brand || "LENZIFY",
        price: item.price || item.products?.discount_price || item.products?.offer_price || item.products?.price,
        image: item.products?.primary_image || item.products?.product_images?.[0]?.image_url || "/placeholder.jpg",
        category: item.products?.product_type === "contact-lens" || item.products?.product_type === "contact_lens" ? "Contact Lenses" : "Eyewear",
        quantity: item.quantity,
        stock: item.products?.stock ?? 99,
        lens_name: item.lens_config?.type?.name || item.lens_config?.lens_name || item.lenses?.name || (item.prescription_json ? "Custom Power Lenses" : undefined),
        lens_config: item.lens_config,
        prescription: item.prescription_json,
        selected_color: item.selected_color,
        selected_size: item.selected_size,
      }));
      setItems(mappedItems as any);
      setLoading(false);

      if (buyNow === "true" && mappedItems.length > 0) {
        const { data: { user: authUser } } = await supabaseInstance.auth.getUser();
        if (!authUser) {
          router.push("/auth/login?redirect=/checkout");
        } else {
          router.push("/checkout");
        }
      }
    } catch (err) {
      console.error("Cart Sync Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const setupSubscription = async () => {
      await syncCartData();
      if (cancelled || !user) return;
      // Unique channel name prevents Supabase reusing an already-subscribed
      // channel instance from a previous effect run that was torn down but
      // whose removeChannel hasn't fully resolved yet.
      channelRef.current = supabase
        .channel(`cart_page_sync_${user.id}_${Date.now()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cart", filter: `user_id=eq.${user.id}` },
          () => syncCartData()
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  const isContactLensItem = (item: any) => {
    const pType = item.product_type || item.products?.product_type;
    const cat = item.category || item.products?.category || item.products?.categories?.slug;
    return pType === "contact-lens" || pType === "contact_lens" || cat === "contact-lenses" || cat === "Contact Lenses";
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxableSubtotal = items
    .filter(item => !isContactLensItem(item))
    .reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = Math.round(taxableSubtotal * 0.18);
  const total = subtotal + tax;

  const handleRemove = async (dbId: number, productId: string) => {
    // Optimistic update
    removeItem(productId);
    await removeFromCart(dbId);
  };

  const handleUpdateQty = async (dbId: number, productId: string, delta: number) => {
    const item = items.find(i => i.id === productId) as any;
    if (!item) return;
    const newQty = item.quantity + delta;

    if (newQty < 1) {
      await handleRemove(dbId, productId);
      return;
    }

    if (delta > 0 && newQty > (item.stock ?? 99)) {
      toast.error(`Only ${item.stock} items available in stock.`);
      return;
    }

    // Optimistic update
    updateQuantity(productId, delta);
    await updateCartQuantity(dbId, newQty);
  };

  const handleCheckout = () => {
    if (!user) {
      router.push("/auth/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
      <p className="text-sm font-medium animate-pulse text-[#666666] tracking-widest">
        Loading your cart...
      </p>
    </div>
  );

  return (
    <div className="bg-[#F8F9FC] min-h-screen pb-20">
      {/* Page title area */}
      <div className="bg-white pt-24 md:pt-32 pb-6 border-b border-[#E8EAF2]">
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-2">Shopping cart</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-[var(--font-hero)] italic text-[#111111] leading-tight">
            Your Cart
          </h1>
        </main>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.length > 0 ? (
                items.map((item: any, i) => (
                  <motion.div
                    layout
                    key={item.database_id || item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 flex flex-col sm:flex-row gap-6 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition-all duration-300"
                  >
                    {/* Item Image */}
                    <div className="relative w-full sm:w-40 aspect-square rounded-2xl bg-[#F8F9FC] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest mb-1">
                              {item.brand}
                            </p>
                            <h3 className="text-xl font-medium text-[#111111] leading-tight">
                              {item.name}
                            </h3>
                            {item.lens_name && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-[#004AAD]/5 border border-[#004AAD]/15 text-xs font-medium text-[#004AAD] rounded-full">
                                  Lens: {item.lens_name}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xl font-bold text-[#111111] flex-shrink-0">
                            ₹{(item.price || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <div>
                            <p className="text-[10px] text-[#666666] uppercase tracking-widest font-medium">Category</p>
                            <p className="text-xs text-[#111111] font-medium mt-0.5">{item.category}</p>
                          </div>
                          {item.selected_color && (
                            <div>
                              <p className="text-[10px] text-[#666666] uppercase tracking-widest font-medium">Color</p>
                              <p className="text-xs text-[#111111] font-medium mt-0.5">{item.selected_color}</p>
                            </div>
                          )}
                          {item.selected_size && (
                            <div>
                              <p className="text-[10px] text-[#666666] uppercase tracking-widest font-medium">Size</p>
                              <p className="text-xs text-[#111111] font-medium mt-0.5">{item.selected_size}</p>
                            </div>
                          )}
                          {item.lens_config && (
                            <>
                              {(item.lens_config.thickness?.name || item.lens_config.index_label || item.lens_config.selected_index) && (
                                <div>
                                  <p className="text-[10px] text-[#666666] uppercase tracking-widest font-medium">Refractive Index</p>
                                  <p className="text-xs text-[#004AAD] font-semibold mt-0.5">
                                    {item.lens_config.thickness?.name || item.lens_config.index_label || `Index ${item.lens_config.selected_index}`}
                                  </p>
                                </div>
                              )}
                              {item.lens_config.features?.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-[#666666] uppercase tracking-widest font-medium">Features</p>
                                  <p className="text-xs text-[#004AAD] font-medium mt-0.5">
                                    +{item.lens_config.features.length} add-ons
                                  </p>
                                </div>
                              )}
                              {item.lens_config.coatings?.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-[#666666] uppercase tracking-widest font-medium">Coatings</p>
                                  <p className="text-xs text-[#111111] font-medium mt-0.5">
                                    +{item.lens_config.coatings.length} layers
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          {item.prescription && (
                            <div>
                              <p className="text-[10px] text-[#666666] uppercase tracking-widest font-medium">Prescription</p>
                              <p className="text-xs text-[#111111] font-medium mt-0.5">
                                OD: {item.prescription.od_sph} | OS: {item.prescription.os_sph}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-[#666666] uppercase tracking-widest font-medium">Stock</p>
                            {item.stock > 0 ? (
                              <p className="text-xs text-emerald-600 font-medium mt-0.5">In Stock ({item.stock})</p>
                            ) : (
                              <p className="text-xs text-red-500 font-medium mt-0.5">Out of Stock</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Remove */}
                      <div className="flex items-center justify-between mt-5">
                        <div className="flex items-center bg-[#F8F9FC] border border-[#E8EAF2] rounded-full overflow-hidden">
                          <button
                            onClick={() => handleUpdateQty(item.database_id, item.id, -1)}
                            className="w-10 h-10 flex items-center justify-center text-[#666666] hover:text-[#004AAD] hover:bg-[#004AAD]/5 transition-all font-bold text-lg"
                          >
                            −
                          </button>
                          <span className="w-10 h-10 flex items-center justify-center text-sm font-bold text-[#111111] border-x border-[#E8EAF2]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.database_id, item.id, 1)}
                            className="w-10 h-10 flex items-center justify-center text-[#666666] hover:text-[#004AAD] hover:bg-[#004AAD]/5 transition-all font-bold text-lg"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.database_id, item.id)}
                          className="text-sm text-[#666666] hover:text-red-500 transition-colors font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="py-20 md:py-40 text-center bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 md:p-16 space-y-6"
                >
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD]">
                      Your cart
                    </p>
                    <h3 className="text-4xl font-[var(--font-hero)] italic text-[#111111]/20">
                      Your cart is empty
                    </h3>
                    <p className="text-[#666666] text-sm leading-relaxed">
                      Looks like you haven&apos;t added anything yet.
                    </p>
                  </div>
                  <Link
                    href="/products"
                    className="inline-block bg-[#03173D] text-white rounded-full px-8 py-4 font-semibold hover:bg-gradient-to-r hover:from-[#03173D] hover:to-[#004AAD] transition-all duration-300"
                  >
                    Browse Products
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="lg:col-span-4 sticky top-24">
              <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 space-y-6">
                <header className="border-b border-[#E8EAF2] pb-5">
                  <h2 className="font-semibold text-[#111111] uppercase tracking-widest text-sm">
                    Order Summary
                  </h2>
                </header>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#666666] text-sm">Subtotal</span>
                    <span className="text-[#111111] font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#666666] text-sm">Shipping</span>
                    <span className="text-emerald-600 font-semibold text-sm">Free</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#666666] text-sm">GST (18% on frames)</span>
                      <span className="text-[#111111] font-semibold">₹{tax.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Free shipping progress */}
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#666666] text-xs">Free shipping progress</span>
                      <span className="text-xs font-semibold text-[#004AAD]">
                        {subtotal >= 2000 ? "Unlocked!" : `₹${(2000 - subtotal).toLocaleString()} away`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F8F9FC] border border-[#E8EAF2] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#004AAD] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((subtotal / 2000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E8EAF2] flex justify-between items-baseline">
                    <span className="text-[#666666] text-sm font-medium">Total</span>
                    <span className="text-3xl font-[var(--font-hero)] italic text-[#111111]">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                  className={cn(
                    "w-full py-4 bg-[#03173D] text-white font-semibold rounded-full hover:bg-gradient-to-r hover:from-[#03173D] hover:to-[#004AAD] transition-all duration-300 active:scale-[0.98]",
                    items.length === 0 && "opacity-30 cursor-not-allowed"
                  )}
                >
                  Proceed to Checkout
                </button>

                <div className="text-center">
                  <Link href="/products" className="text-xs text-[#666666] hover:text-[#004AAD] transition-colors font-medium">
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#004AAD] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Loading Cart...</p>
        </div>
      </div>
    }>
      <CartPageContent />
    </Suspense>
  );
}
