"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import { useAuth } from "@/components/providers/AuthProvider";
import { getCart, getWishlist } from "@/lib/db/customer_actions";
import { resolveProductImage } from "@/lib/image_utils";

// Mega Menu Content
const SHOP_CATEGORIES = [
  { name: "Eyeglasses", href: "/products?type=Eyeglasses" },
  { name: "Sunglasses", href: "/products?type=Sunglasses" },
  { name: "Computer Glasses", href: "/products?type=Computer Glasses" },
  { name: "Reading Glasses", href: "/reading-glasses" },
  { name: "Contact Lenses", href: "/contact-lenses" },
  { name: "Accessories", href: "/products?type=Accessories" },
];

const SHOP_GENDER = [
  { name: "Men", href: "/products?gender=Men" },
  { name: "Women", href: "/products?gender=Women" },
  { name: "Kids", href: "/products?gender=Kids" },
];

const SHOP_COLLECTION = [
  { name: "New Arrivals", href: "/products?collection=New Arrivals" },
  { name: "Trending", href: "/products?collection=Trending" },
  { name: "Best Sellers", href: "/products?collection=Best Sellers" },
  { name: "Premium Collection", href: "/products?collection=Premium Collection" },
];

const OFFERS = [
  { name: "Discounts", href: "/offers?type=discounts" },
  { name: "Coupons", href: "/offers?type=coupons" },
  { name: "Seasonal Sales", href: "/offers?type=seasonal-sales" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const [brands, setBrands] = useState<{ name: string; slug: string }[]>([]);
  const [contactLensBrands, setContactLensBrands] = useState<{ name: string; slug: string }[]>([]);
  const [lenses, setLenses] = useState<{ name: string; id: string }[]>([]);
  const [coatings, setCoatings] = useState<{ name: string; id: string }[]>([]);

  const rawTotalItems = useCartStore((state) =>
    state.items.reduce((acc, item) => acc + Number(item.quantity || 0), 0)
  );
  const totalItems = user ? rawTotalItems : 0;
  const setItems = useCartStore((state) => state.setItems);
  const setWishlistItems = useWishlistStore((state) => state.setItems);

  // Sync cart count
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const supabase = createClient();

    const syncCart = async () => {
      try {
        const cartData = await getCart();
        if (!Array.isArray(cartData)) return;
        const mappedItems = cartData.map((item: any) => ({
          id: `${item.product_id}-${item.selected_color || ""}-${item.selected_size || ""}-${item.lens_id || ""}`,
          database_id: item.id,
          product_id: item.product_id,
          name: item.products?.name || "Eyewear",
          brand: item.products?.brand || "LENZIFY",
          price: item.price || item.products?.discount_price || item.products?.offer_price || item.products?.price,
          image: resolveProductImage(item.products) || item.image || "/placeholder.jpg",
          category: "Eyewear",
          quantity: item.quantity,
          stock: item.products?.stock ?? 99,
          lens_name: item.lens_config?.type?.name || item.lens_config?.lens_name || item.lenses?.name,
          lens_config: item.lens_config,
          prescription: item.prescription_json,
          selected_color: item.selected_color,
          selected_size: item.selected_size,
        }));
        setItems(mappedItems as any);
      } catch (err) {
        console.error("Navbar cart sync error:", err);
      }
    };

    syncCart();

    const channel = supabase
      .channel(`cart_sync_global_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          syncCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, setItems]);

  const zustandWishlistCount = useWishlistStore((state) => state.items.length);

  // Sync wishlist
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    const syncWishlist = async () => {
      const { data: wishlistData } = await supabase
        .from("wishlist")
        .select("*, products(*, product_images(*))")
        .eq("user_id", user.id);

      const mappedItems = (wishlistData || []).map((item: any) => ({
        ...item.products,
      }));
      setWishlistItems(mappedItems);
    };

    syncWishlist();

    const channel = supabase
      .channel(`wishlist_sync_global_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wishlist",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          syncWishlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, setWishlistItems]);

  const wishlistCount = zustandWishlistCount;

  const supabase = createClient();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("type", "brand")
        .eq("is_enabled", true)
        .order("name", { ascending: true });

      if (data && data.length > 0) {
        setBrands(data);
      } else {
        setBrands([
          { name: "RayBan", slug: "rayban" },
          { name: "Titan", slug: "titan" },
          { name: "Fastrack", slug: "fastrack" },
          { name: "Oakley", slug: "oakley" },
        ]);
      }
    };

    const fetchLenses = async () => {
      const { data } = await supabase
        .from("lenses")
        .select("id, name, tier")
        .eq("is_active", true)
        .eq("category", "type")
        .order("name", { ascending: true });

      if (data) {
        // Filter out standalone Blue Cut, individual progressive tiers, and Photochromic (now an upgrade package)
        const filtered = data.filter((l: any) => {
          const nameLower = l.name.toLowerCase();
          if (nameLower === "blue cut") return false;
          if (nameLower.includes("photochro")) return false;
          if (l.tier && ["silver", "gold", "platinum"].includes(l.tier.toLowerCase())) return false;
          if (nameLower.startsWith("progressive ") && (nameLower.includes("silver") || nameLower.includes("gold") || nameLower.includes("platinum"))) return false;
          return true;
        });
        setLenses(filtered);
      }
    };

    const fetchCoatings = async () => {
      // Fix 5: Standalone coating pages removed from navigation as all 4 core coatings are standard
      setCoatings([]);
    };

    const fetchContactLensBrands = async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select("brand")
          .or("product_type.eq.contact-lens,product_type.eq.contact_lens")
          .not("brand", "is", null);

        const uniqueBrands: string[] = Array.from(
          new Set(
            (data || [])
              .map((p: any) => (p.brand ? String(p.brand).trim() : ""))
              .filter((b: string) => Boolean(b))
          )
        );

        if (uniqueBrands.length > 0) {
          setContactLensBrands(
            uniqueBrands.map((b: string) => ({
              name: b,
              slug: b.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            }))
          );
        } else {
          setContactLensBrands([
            { name: "Acuvue", slug: "acuvue" },
            { name: "Bausch + Lomb", slug: "bausch-lomb" },
            { name: "Alcon", slug: "alcon" },
            { name: "CooperVision", slug: "coopervision" },
          ]);
        }
      } catch {
        setContactLensBrands([
          { name: "Acuvue", slug: "acuvue" },
          { name: "Bausch + Lomb", slug: "bausch-lomb" },
          { name: "Alcon", slug: "alcon" },
          { name: "CooperVision", slug: "coopervision" },
        ]);
      }
    };

    fetchBrands();
    fetchContactLensBrands();
    fetchLenses();
    fetchCoatings();
  }, [supabase]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_enabled", true)
        .ilike("name", `%${q}%`)
        .limit(5);
      setSearchSuggestions(data || []);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery, supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      setSearchQuery("");
      setSearchSuggestions([]);
      setActiveMenu(null);
    }
  };

  const goToSuggestion = (product: { id: string; name: string }) => {
    router.push(`/product/${product.id}`);
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery("");
    setSearchSuggestions([]);
  };

  const toggleMenu = (menu: string) => {
    if (activeMenu === menu) setActiveMenu(null);
    else setActiveMenu(menu);
  };

  // Hero is now white — always use white navbar mode
  const isWhiteMode = true;
  const linkColor = "text-[#111111] hover:text-[#004AAD]";
  const iconColor = "text-[#111111]";
  const logoColor = "text-[#111111]";

  return (
    <header
      ref={navRef}
      style={{ maxWidth: "100vw" }}
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 print:hidden",
        isWhiteMode
          ? "bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] py-2.5 md:py-4"
          : "bg-transparent py-3 md:py-6"
      )}
    >
      <nav className="flex justify-between items-center px-3 sm:px-6 lg:px-12 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Back Button (Conditional) */}
          {pathname !== "/" && (
            <button
              onClick={() => router.back()}
              className={cn(
                "transition-colors p-1 flex items-center gap-1 group",
                isWhiteMode
                  ? "text-[#666666] hover:text-[#111111]"
                  : "text-white/70 hover:text-white"
              )}
              title="Go Back"
              suppressHydrationWarning
            >
              <span className="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="hidden sm:inline text-[8px] font-black uppercase tracking-widest">
                Back
              </span>
            </button>
          )}

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn("lg:hidden focus:outline-none p-1", iconColor)}
            suppressHydrationWarning
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>

          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "text-2xl font-serif italic tracking-tighter transition-all hover:opacity-70",
              logoColor
            )}
          >
            LENZIFY
          </Link>
        </div>

        {/* Center Navigation */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-8 flex-1 justify-center">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              "font-medium transition-all duration-300 py-1",
              pathname === "/"
                ? isWhiteMode
                  ? "text-[#004AAD] border-b border-[#004AAD]"
                  : "text-white border-b border-white"
                : linkColor
            )}
          >
            Home
          </Link>

          {/* Shop */}
          <div className="relative">
            <button
              onClick={() => toggleMenu("shop")}
              className={cn(
                "font-medium transition-all duration-300 py-1 flex items-center gap-1",
                activeMenu === "shop" || (pathname.startsWith("/products") && !pathname.includes("Contact"))
                  ? isWhiteMode
                    ? "text-[#004AAD] border-b border-[#004AAD]"
                    : "text-white border-b border-white"
                  : linkColor
              )}
              suppressHydrationWarning
            >
              Shop
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>

          {/* Reading Glasses */}
          <Link
            href="/reading-glasses"
            className={cn(
              "font-medium transition-all duration-300 py-1",
              pathname === "/reading-glasses" || pathname.startsWith("/reading-glasses")
                ? isWhiteMode
                  ? "text-[#004AAD] border-b border-[#004AAD]"
                  : "text-white border-b border-white"
                : linkColor
            )}
          >
            Reading Glasses
          </Link>

          {/* Contact Lenses */}
          <div className="relative">
            <button
              onClick={() => toggleMenu("contact-lenses")}
              className={cn(
                "font-medium transition-all duration-300 py-1 flex items-center gap-1",
                activeMenu === "contact-lenses" || pathname.startsWith("/contact-lenses")
                  ? isWhiteMode
                    ? "text-[#004AAD] border-b border-[#004AAD]"
                    : "text-white border-b border-white"
                  : linkColor
              )}
              suppressHydrationWarning
            >
              Contact Lenses
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>

          {/* Lenses */}
          <div className="relative">
            <button
              onClick={() => toggleMenu("lenses")}
              className={cn(
                "font-medium transition-all duration-300 py-1 flex items-center gap-1",
                activeMenu === "lenses"
                  ? isWhiteMode
                    ? "text-[#004AAD] border-b border-[#004AAD]"
                    : "text-white border-b border-white"
                  : linkColor
              )}
              suppressHydrationWarning
            >
              Lenses
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>

          {/* Replace Lenses */}
          <Link
            href="/replace-lenses"
            className={cn(
              "font-medium transition-all duration-300 py-1",
              pathname === "/replace-lenses"
                ? isWhiteMode
                  ? "text-[#004AAD] border-b border-[#004AAD]"
                  : "text-white border-b border-white"
                : linkColor
            )}
          >
            Replace Lenses
          </Link>

          {/* Try at Home */}
          <Link
            href="/try-at-home"
            className={cn(
              "font-medium transition-all duration-300 py-1",
              pathname === "/try-at-home"
                ? isWhiteMode
                  ? "text-[#004AAD] border-b border-[#004AAD]"
                  : "text-white border-b border-white"
                : linkColor
            )}
          >
            Try at Home
          </Link>

          {/* Offers */}
          <div className="relative">
            <button
              onClick={() => toggleMenu("offers")}
              className={cn(
                "font-medium transition-all duration-300 py-1 flex items-center gap-1",
                activeMenu === "offers"
                  ? isWhiteMode
                    ? "text-[#004AAD] border-b border-[#004AAD]"
                    : "text-white border-b border-white"
                  : linkColor
              )}
              suppressHydrationWarning
            >
              Offers
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>

        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Search */}
          <div className="hidden md:block relative">
            <div
              className={cn(
                "flex items-center transition-all duration-500",
                isSearchOpen
                  ? isWhiteMode
                    ? "w-48 border-b border-[#E8EAF2]"
                    : "w-48 border-b border-white/30"
                  : "w-8 border-b border-transparent"
              )}
            >
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={cn(
                  "transition-colors p-1 flex items-center",
                  isSearchOpen ? "text-[#004AAD]" : iconColor
                )}
                suppressHydrationWarning
              >
                <span className="material-symbols-outlined text-2xl">search</span>
              </button>
              <form
                onSubmit={handleSearch}
                className={cn("flex-grow", !isSearchOpen && "hidden")}
              >
                <input
                  type="text"
                  placeholder="Product Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "bg-transparent border-none focus:ring-0 text-[10px] uppercase font-bold tracking-widest w-full px-2",
                    isWhiteMode
                      ? "text-[#111111] placeholder:text-[#999999]"
                      : "text-white placeholder:text-white/30"
                  )}
                />
              </form>
            </div>

            {isSearchOpen && searchSuggestions.length > 0 && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl border border-[#ECEFF5] shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden z-50">
                {searchSuggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => goToSuggestion(product)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-medium text-[#333333] hover:bg-[#F8F9FC] transition-colors border-b border-[#F1F2F6] last:border-b-0"
                  >
                    <span className="material-symbols-outlined text-base text-[#999999]">search</span>
                    <span className="truncate">{product.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* Wishlist */}
          <Link href="/wishlist" className="relative group p-1 transition-transform hover:scale-110">
            <span
              className={cn(
                "material-symbols-outlined text-2xl transition-colors",
                isWhiteMode
                  ? "text-[#111111] hover:text-[#004AAD]"
                  : "text-white hover:text-white/70"
              )}
            >
              favorite
            </span>
            {mounted && wishlistCount > 0 && (
              <span
                suppressHydrationWarning
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#004AAD] text-[8px] font-bold text-white shadow-sm"
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative group p-1 transition-transform hover:scale-110">
            <span
              className={cn(
                "material-symbols-outlined text-2xl transition-colors",
                isWhiteMode
                  ? "text-[#111111] hover:text-[#004AAD]"
                  : "text-white hover:text-white/70"
              )}
            >
              shopping_cart
            </span>
            {mounted && Boolean(user) && totalItems > 0 && (
              <span
                suppressHydrationWarning
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#004AAD] text-[8px] font-bold text-white shadow-sm"
              >
                {totalItems}
              </span>
            )}
          </Link>

          {/* Account */}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link href="/auth/login" className="group p-1 transition-transform hover:scale-110">
              <span
                className={cn(
                  "material-symbols-outlined text-2xl transition-colors",
                  isWhiteMode
                    ? "text-[#111111] hover:text-[#004AAD]"
                    : "text-white hover:text-white/70"
                )}
              >
                person
              </span>
            </Link>
          )}

          {/* Support */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => toggleMenu("support")}
              className="group p-1 transition-transform hover:scale-110 flex items-center"
              suppressHydrationWarning
            >
              <span
                className={cn(
                  "material-symbols-outlined text-2xl transition-colors",
                  isWhiteMode
                    ? "text-[#111111] hover:text-[#004AAD]"
                    : "text-white hover:text-white/70"
                )}
              >
                support_agent
              </span>
            </button>

            <AnimatePresence>
              {activeMenu === "support" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-6 w-48 bg-white border border-[#E8EAF2] shadow-xl p-2 flex flex-col gap-1 z-50 rounded-2xl"
                >
                  <Link
                    href="/contact"
                    className="px-4 py-3 hover:bg-[#F8F9FC] text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#004AAD] transition-colors rounded-xl"
                  >
                    Contact Us
                  </Link>
                  <Link
                    href="/help"
                    className="px-4 py-3 hover:bg-[#F8F9FC] text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#004AAD] transition-colors rounded-xl"
                  >
                    Help
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Mega Menu Dropdowns (Desktop) */}
      <AnimatePresence>
        {activeMenu === "shop" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 w-full bg-white border-t border-[#E8EAF2] shadow-2xl overflow-hidden z-40 hidden lg:block"
          >
            <div className="max-w-screen-2xl mx-auto px-12 py-10 flex gap-20">
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#666666] mb-2">
                  By Category
                </h3>
                {SHOP_CATEGORIES.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#666666] mb-2">
                  By Gender
                </h3>
                {SHOP_GENDER.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#666666] mb-2">
                  By Collection
                </h3>
                {SHOP_COLLECTION.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="flex-1 bg-[#F8F9FC] p-8 rounded-2xl shrink-0 border border-[#E8EAF2] relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-xl font-serif italic text-[#111111] mb-2">
                    Find Your Perfect Pair
                  </h3>
                  <p className="text-xs text-[#666666] mb-6 max-w-[200px]">
                    Explore our curated collections designed for every face shape and aesthetic.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block border-b border-[#004AAD] text-xs font-bold uppercase tracking-widest text-[#004AAD] hover:text-[#03173D] hover:border-[#03173D] transition-all"
                  >
                    Shop All
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contact Lenses Dropdown */}
        {activeMenu === "contact-lenses" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-[calc(50%-220px)] bg-white border border-[#E8EAF2] shadow-2xl p-4 flex flex-col gap-2 z-50 rounded-2xl hidden lg:flex min-w-[320px] mt-4"
          >
            <div className="flex items-center justify-between border-b border-[#E8EAF2] pb-2 px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666666]">
                Featured Lens Brands
              </h3>
              <span className="text-[9px] font-bold text-[#004AAD] bg-[#004AAD]/10 px-2 py-0.5 rounded">
                100% Authentic
              </span>
            </div>
            <div className="flex flex-col gap-1 py-1">
              {contactLensBrands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/contact-lenses?brand=${encodeURIComponent(brand.name)}`}
                  className="px-4 py-2.5 hover:bg-[#F8F9FC] text-xs font-semibold text-[#111111] hover:text-[#004AAD] transition-colors rounded-xl flex items-center justify-between group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">{brand.name}</span>
                  <span className="text-[10px] text-[#004AAD] opacity-0 group-hover:opacity-100 transition-opacity">View Brand →</span>
                </Link>
              ))}
            </div>
            <div className="border-t border-[#E8EAF2] pt-2">
              <Link
                href="/contact-lenses"
                className="w-full py-2.5 px-4 bg-[#03173D] hover:bg-[#004AAD] text-white text-xs font-bold rounded-xl text-center block transition-colors"
              >
                View All Contact Lenses →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Small Dropdowns */}
        {(activeMenu === "lenses" ||
          activeMenu === "offers") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "absolute top-full bg-white border border-[#E8EAF2] shadow-2xl p-2 flex flex-col gap-1 z-50 rounded-2xl hidden lg:flex min-w-[200px] mt-4",
              activeMenu === "lenses" &&
                "left-[calc(50%-180px)] min-w-[360px] p-4",
              activeMenu === "offers" && "left-[calc(50%+60px)]"
            )}
          >
            {activeMenu === "lenses" && (
              <div className="space-y-3 p-2">
                <div className="flex items-center justify-between border-b border-[#E8EAF2] pb-2 px-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666666]">
                    Prescription Lens Types
                  </h3>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    4 Core Coatings Included Free
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {lenses.map((lens) => (
                    <Link
                      key={lens.id}
                      href={`/lenses/${lens.id}`}
                      className="px-4 py-3 hover:bg-[#F8F9FC] text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#004AAD] transition-colors rounded-xl flex items-center justify-between"
                    >
                      <span>{lens.name}</span>
                      <span className="text-[10px] text-[#004AAD] font-semibold">Explore →</span>
                    </Link>
                  ))}
                  <Link
                    href="/replace-lenses"
                    className="px-4 py-3 bg-[#F8F9FC] hover:bg-[#EEF2F6] text-xs font-bold uppercase tracking-widest text-[#004AAD] transition-colors rounded-xl mt-2 flex items-center justify-between"
                  >
                    <span>Replace Your Lenses</span>
                    <span className="text-[10px] font-semibold">Fitting Service →</span>
                  </Link>
                </div>
              </div>
            )}
            {activeMenu === "offers" &&
              OFFERS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-4 py-3 hover:bg-[#F8F9FC] text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#004AAD] transition-colors rounded-xl"
                >
                  {link.name}
                </Link>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-[#111111]/20 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 w-[85%] max-w-sm h-full bg-white shadow-[0_0_40px_rgba(0,0,0,0.15)] p-8 flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-serif italic tracking-tighter text-[#111111]"
                >
                  LENZIFY
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-[#666666] hover:text-[#111111] p-2 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Mobile Search */}
              <div className="mb-8">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center border-b border-[#E8EAF2] pb-2"
                >
                  <span className="material-symbols-outlined text-xl text-[#999999] mr-3">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-widest text-[#111111] placeholder:text-[#999999] w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                {searchSuggestions.length > 0 && (
                  <div className="mt-3 bg-[#F8F9FC] rounded-2xl border border-[#ECEFF5] overflow-hidden">
                    {searchSuggestions.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => goToSuggestion(product)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-medium text-[#333333] hover:bg-white transition-colors border-b border-[#ECEFF5] last:border-b-0"
                      >
                        <span className="material-symbols-outlined text-base text-[#999999]">search</span>
                        <span className="truncate">{product.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Links */}
              <div className="space-y-6 flex-1">
                {/* Home */}
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-colors",
                    pathname === "/"
                      ? "text-[#004AAD]"
                      : "text-[#111111] hover:text-[#004AAD]"
                  )}
                >
                  <span className="material-symbols-outlined text-xl">home</span>
                  Home
                </Link>

                {/* Reading Glasses */}
                <Link
                  href="/reading-glasses"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-colors",
                    pathname.startsWith("/reading-glasses")
                      ? "text-[#004AAD]"
                      : "text-[#111111] hover:text-[#004AAD]"
                  )}
                >
                  <span className="material-symbols-outlined text-xl">auto_stories</span>
                  Reading Glasses
                </Link>

                {/* Shop */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#999999] mb-4 border-b border-[#E8EAF2] pb-2">
                    Shop
                  </h3>
                  <div className="space-y-4 pl-2">
                    <div className="space-y-3 pb-2 border-b border-[#F0F2F8]">
                      <p className="text-[10px] font-bold text-[#999999] uppercase">
                        By Category
                      </p>
                      {SHOP_CATEGORIES.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                    <div className="space-y-3 pb-2 border-b border-[#F0F2F8]">
                      <p className="text-[10px] font-bold text-[#999999] uppercase">
                        By Gender
                      </p>
                      {SHOP_GENDER.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-[#999999] uppercase">
                        By Collection
                      </p>
                      {SHOP_COLLECTION.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contact Lenses Mobile Section */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#999999] mb-4 border-b border-[#E8EAF2] pb-2">
                    Contact Lenses
                  </h3>
                  <div className="space-y-3 pl-2">
                    <Link
                      href="/contact-lenses"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-bold text-[#004AAD] transition-colors"
                    >
                      All Contact Lenses →
                    </Link>
                    <p className="text-[10px] font-bold text-[#999999] uppercase pt-1">
                      By Brand
                    </p>
                    {contactLensBrands.map((brand) => (
                      <Link
                        key={brand.slug}
                        href={`/contact-lenses?brand=${encodeURIComponent(brand.name)}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                      >
                        {brand.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Lenses */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#999999] mb-4 border-b border-[#E8EAF2] pb-2">
                    Lenses
                  </h3>
                  <div className="space-y-6 pl-2">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-[#999999] uppercase">
                        Lens Types
                      </p>
                      {lenses.map((lens) => (
                        <Link
                          key={lens.id}
                          href={`/lenses/${lens.id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                        >
                          {lens.name}
                        </Link>
                      ))}
                    </div>

                    <Link
                      href="/replace-lenses"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-medium text-[#004AAD] mt-2"
                    >
                      Replace Your Lenses
                    </Link>
                  </div>
                </div>

                {/* Offers */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#999999] mb-4 border-b border-[#E8EAF2] pb-2">
                    Offers
                  </h3>
                  <div className="space-y-3 pl-2">
                    {OFFERS.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Try at Home */}
                <div>
                  <Link
                    href="/try-at-home"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-colors",
                      pathname === "/try-at-home"
                        ? "text-[#004AAD]"
                        : "text-[#111111] hover:text-[#004AAD]"
                    )}
                  >
                    <span className="material-symbols-outlined text-xl">home_work</span>
                    Try at Home
                  </Link>
                </div>

                {/* Support */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#999999] mb-4 border-b border-[#E8EAF2] pb-2">
                    Support
                  </h3>
                  <div className="space-y-3 pl-2">
                    <Link
                      href="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                    >
                      Contact Us
                    </Link>
                    <Link
                      href="/help"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-medium text-[#111111] hover:text-[#004AAD] transition-colors"
                    >
                      Help
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6 pt-8 border-t border-[#E8EAF2] mb-8">
                <div className="flex items-center gap-6">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#111111] hover:text-[#004AAD] transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">person</span>
                    Account
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#111111] hover:text-[#004AAD] transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl text-[#004AAD]">
                      favorite
                    </span>
                    Wishlist
                  </Link>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#999999] italic">
                  © 2026 Lenzify
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
