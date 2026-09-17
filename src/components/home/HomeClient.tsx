"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import ProductCard from "@/components/store/ProductCard";
import HomeCarousel from "./HomeCarousel";
import {
  Star,
  ChevronRight,
  Tag,
  Truck,
  Eye,
  CheckCircle,
} from "lucide-react";

interface HomeClientProps {
  initialSections: any[];
  initialProducts?: {
    featured: any[];
    trending: any[];
    new_arrivals: any[];
  };
  stats?: {
    customerCount: number;
    productCount: number;
  };
  testimonials?: any[];
}

// ─── Top Categories Strip ─────────────────────────────────────────────────────
function TopCategoriesStrip() {
  const cats = [
    { name: "Eyeglasses", image: "/images/categories/eyeglasses.png", href: "/products?type=Eyeglasses", bg: "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-blue-200/50" },
    { name: "Sunglasses", image: "/images/categories/sunglasses.png", href: "/products?type=Sunglasses", bg: "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-200/50" },
    { name: "Computer Glasses", image: "/images/categories/computer_glasses.png", href: "/products?type=Computer Glasses", bg: "bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border-cyan-200/50" },
    { name: "Contact Lenses", image: "/images/categories/contact_lenses.png", href: "/products?type=Contact Lenses", bg: "bg-gradient-to-br from-teal-500/10 via-sky-500/5 to-transparent border-teal-200/50" },
    { name: "Kids", image: "/images/categories/kids.png", href: "/products?gender=Kids", bg: "bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border-purple-200/50" },
    { name: "Offers", image: null, href: "/offers", bg: "bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent border-rose-200/50" },
  ];

  return (
    <section className="bg-white py-8 px-4 sm:px-6 border-b border-[#E8EAF2]">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {cats.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex-1 min-w-[100px]"
            >
              <Link href={cat.href} className="flex flex-col items-center gap-3 group">
                <div className={`relative w-full aspect-square rounded-2xl ${cat.bg} overflow-hidden border group-hover:border-[#004AAD] group-hover:shadow-[0_8px_24px_rgba(0,74,173,0.12)] transition-all duration-300 shadow-sm`}>
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-contain p-3 group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag className="w-10 h-10 text-[#004AAD]" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#666666] group-hover:text-[#004AAD] transition-colors text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Category Banners Showcase (Hero Photography) ─────────────────────────────
function CategoryBannersSection() {
  const categoryBanners = [
    {
      title: "Contact Lenses",
      badge: "24-Hour Hydration",
      tagline: "Doctor-Certified Breathable Comfort",
      desc: "Daily, monthly & toric lenses with sterile moisture-lock matrix from Acuvue, Bausch+Lomb & Alcon.",
      image: "/images/banners/contact-lenses-banner.jpg",
      href: "/products?type=Contact Lenses",
      cta: "Shop Contact Lenses",
      highlight: "from-sky-500/30 to-blue-600/30",
    },
    {
      title: "Eyeglasses & Frames",
      badge: "Signature Craft",
      tagline: "Lightweight Titanium & Italian Acetate",
      desc: "Precision ophthalmic designs engineered for exceptional all-day durability and style.",
      image: "/images/banners/eyeglasses-banner.jpg",
      href: "/products?type=Eyeglasses",
      cta: "Explore Eyeglasses",
      highlight: "from-amber-500/20 to-indigo-600/30",
    },
    {
      title: "Sunglasses",
      badge: "Polarized UV400",
      tagline: "Glacier Glare Cut & Style",
      desc: "Maximum sun protection meets timeless silhouettes, gradient tints and polarized clarity.",
      image: "/images/banners/sunglasses-banner.jpg",
      href: "/products?type=Sunglasses",
      cta: "Discover Sunglasses",
      highlight: "from-orange-500/25 to-rose-600/25",
    },
    {
      title: "Computer & Screen Glasses",
      badge: "Anti-Blue Defense",
      tagline: "Zero Glare Screen Protection",
      desc: "Filter 95% of digital blue light to relieve eye strain, headaches, and insomnia.",
      image: "/images/banners/computer-glasses-banner.jpg",
      href: "/products?type=Computer Glasses",
      cta: "Shop Blue Light",
      highlight: "from-cyan-500/25 to-blue-600/25",
    },
  ];

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 bg-[#F8F9FC] border-b border-[#E8EAF2]">
      <div className="max-w-7xl mx-auto lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="text-xs font-semibold uppercase tracking-widest mb-3 block text-[#004AAD]">
            Shop By Department
          </span>
          <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl text-[#111111]">
            Curated Vision Categories
          </h2>
          <p className="text-[#666666] text-sm mt-3 font-medium max-w-xl mx-auto">
            From sterile medical-grade contact lenses to handcrafted Italian frames, explore our optical universe.
          </p>
        </motion.div>

        {/* Primary 2-column feature banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {categoryBanners.slice(0, 2).map((banner, i) => (
            <motion.div
              key={banner.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Link
                href={banner.href}
                className="group relative block aspect-[16/10] rounded-3xl overflow-hidden shadow-[0_12px_36px_rgba(3,23,61,0.08)] hover:shadow-[0_24px_54px_rgba(3,23,61,0.18)] transition-all duration-500 hover:-translate-y-1.5"
              >
                {/* Image */}
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#03173D]/95 via-[#03173D]/60 to-transparent transition-opacity" />
                <div className={`absolute inset-0 bg-gradient-to-br ${banner.highlight} opacity-40 group-hover:opacity-60 transition-opacity`} />

                {/* Content */}
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/30 text-white px-3.5 py-1 rounded-full shadow-sm">
                      {banner.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-white/80 text-xs md:text-sm font-medium tracking-wide uppercase">
                      {banner.tagline}
                    </p>
                    <h3 className="text-2xl md:text-4xl font-serif italic text-white leading-tight">
                      {banner.title}
                    </h3>
                    <p className="text-white/80 text-xs md:text-sm line-clamp-2 max-w-md">
                      {banner.desc}
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-white bg-white/20 backdrop-blur-md border border-white/30 group-hover:bg-white group-hover:text-[#03173D] px-5 py-2.5 rounded-full transition-all duration-300">
                        {banner.cta}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Secondary 2-column banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryBanners.slice(2, 4).map((banner, i) => (
            <motion.div
              key={banner.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
            >
              <Link
                href={banner.href}
                className="group relative block aspect-[16/9] rounded-3xl overflow-hidden shadow-[0_12px_36px_rgba(3,23,61,0.08)] hover:shadow-[0_24px_54px_rgba(3,23,61,0.18)] transition-all duration-500 hover:-translate-y-1.5"
              >
                {/* Image */}
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#03173D]/95 via-[#03173D]/60 to-transparent transition-opacity" />
                <div className={`absolute inset-0 bg-gradient-to-br ${banner.highlight} opacity-40 group-hover:opacity-60 transition-opacity`} />

                {/* Content */}
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/30 text-white px-3.5 py-1 rounded-full shadow-sm">
                      {banner.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-white/80 text-xs font-medium tracking-wide uppercase">
                      {banner.tagline}
                    </p>
                    <h3 className="text-xl md:text-3xl font-serif italic text-white leading-tight">
                      {banner.title}
                    </h3>
                    <p className="text-white/80 text-xs md:text-sm line-clamp-2 max-w-md">
                      {banner.desc}
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-white/20 backdrop-blur-md border border-white/30 group-hover:bg-white group-hover:text-[#03173D] px-4 py-2 rounded-full transition-all duration-300">
                        {banner.cta}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Collection Showcase ───────────────────────────────────────────────────────
function CollectionShowcase({ items }: { items?: any[] }) {
  const collections = (items && items.length > 0 ? items : []).map((c: any) => ({
    name: c.name,
    desc: c.description || c.type || "Curated collection",
    href: c.href || `/products?collection=${encodeURIComponent(c.name)}`,
    image: c.banner_url || "/images/editorial/hero_woman_reading.png",
  }));

  if (collections.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest mb-3 block text-[#004AAD]">
            Collections
          </span>
          <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl text-[#111111]">
            Explore Collections
          </h2>
          <p className="text-[#666666] text-sm mt-4 font-medium">
            Designed for every personality.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {collections.map((col, i) => (
            <motion.div
              key={col.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Link
                href={col.href}
                className="group relative aspect-[3/4] block rounded-3xl overflow-hidden bg-[#F8F9FC] border border-[#ECECEC] hover:border-transparent transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] hover:-translate-y-2"
              >
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#03173D]/80 via-[#03173D]/10 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
                    {col.desc}
                  </p>
                  <h3 className="text-base md:text-xl font-bold uppercase tracking-tight text-white leading-tight">
                    {col.name}
                  </h3>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 bg-white">
                  <ChevronRight className="w-4 h-4 text-[#03173D]" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Row ───────────────────────────────────────────────────────────────
function ProductRow({
  title,
  subtitle,
  filterField,
  initialData,
  gray = false,
}: {
  title: string;
  subtitle?: string;
  filterField?: string;
  initialData?: any[];
  gray?: boolean;
}) {
  const [products, setProducts] = useState<any[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const supabase = createClient();

  useEffect(() => {
    if (initialData && initialData.length > 0) return;
    const fetchProducts = async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_enabled", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (filterField === "featured") query = query.eq("is_featured", true);
      else if (filterField === "trending") query = query.eq("is_trending", true);
      else if (filterField === "new_arrival") query = query.eq("is_new_arrival", true);
      else if (filterField === "best_seller") query = query.eq("is_editors_choice", true);
      const { data } = await query;
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [supabase, filterField, initialData]);

  if (loading) {
    return (
      <section className={`py-12 md:py-20 ${gray ? "bg-[#F8F9FC]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((p) => (
              <div
                key={p}
                className="aspect-[4/5] bg-[#F0F2F8] animate-pulse rounded-3xl"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className={`py-12 md:py-20 px-4 sm:px-6 ${gray ? "bg-[#F8F9FC]" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-between items-end mb-10 md:mb-14"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest mb-2 block text-[#004AAD]">
              {subtitle || "Curated"}
            </span>
            <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl text-[#111111]">
              {title}
            </h2>
          </div>
          <Link
            href="/products"
            className="text-[10px] font-bold uppercase tracking-widest text-[#004AAD] border border-[#004AAD] hover:bg-[#004AAD] hover:text-white px-5 py-2.5 rounded-full transition-all duration-300"
          >
            View All →
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Premium Brand Banner ──────────────────────────────────────────────────────
function PremiumBrandBanner({ brands }: { brands?: any[] }) {
  const premiumBrands = (brands || []).map((b: any) => b.name).filter(Boolean);

  if (premiumBrands.length === 0) return null;

  return (
    <section
      className="py-12 md:py-20 px-4 sm:px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #03173D 0%, #004AAD 60%, #009DFF 100%)" }}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/3 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto lg:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest mb-3 block text-white/60">
            Premium Partners
          </span>
          <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            Discover Premium Brands
          </h2>
          <p className="text-white/60 text-sm font-medium max-w-xl mx-auto">
            We stock only the finest eyewear brands from across the world, curated for quality and style.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {premiumBrands.map((brand, i) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={`/products?brand=${brand.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                className="flex items-center justify-center py-5 px-4 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
              >
                <span className="text-sm font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                  {brand}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#03173D] font-semibold text-sm hover:bg-white/90 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          >
            Shop All Brands
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Brands Marquee ────────────────────────────────────────────────────────────
function BrandsMarquee({ items }: { items?: any[] }) {
  const brands = (items || []).map((b: any) => b.name).filter(Boolean);

  if (brands.length === 0) return null;

  return (
    <section className="py-16 border-y border-[#E8EAF2] bg-[#F8F9FC] overflow-hidden">
      <div className="flex gap-0">
        <div className="flex gap-20 items-center animate-marquee shrink-0 pr-20">
          {[...brands, ...brands].map((brand, i) => (
            <span
              key={`${brand}-${i}`}
              className="text-[#111111] opacity-30 font-bold text-xl lg:text-2xl uppercase tracking-[0.15em] whitespace-nowrap hover:opacity-100 hover:text-[#004AAD] transition-all cursor-default"
            >
              {brand}
            </span>
          ))}
        </div>
        <div
          aria-hidden
          className="flex gap-20 items-center animate-marquee shrink-0 pr-20"
        >
          {[...brands, ...brands].map((brand, i) => (
            <span
              key={`dup-${brand}-${i}`}
              className="text-[#111111] opacity-30 font-bold text-xl lg:text-2xl uppercase tracking-[0.15em] whitespace-nowrap"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why Lenzify ──────────────────────────────────────────────────────────────
function WhyLenzify({ stats: liveStats }: { stats?: { customerCount: number; productCount: number } }) {
  const fmt = (n: number) => (n >= 1000 ? `${Math.floor(n / 1000)}k+` : n > 0 ? `${n}+` : "New");
  const stats = [
    { icon: Star, number: fmt(liveStats?.customerCount || 0), label: "Happy Customers" },
    { icon: Eye, number: fmt(liveStats?.productCount || 0), label: "Frames Available" },
    { icon: Truck, number: "24 Hr", label: "Delivery" },
    { icon: CheckCircle, number: "Free", label: "Eye Test" },
  ];

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto lg:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
        >
          <Image
            src="/images/why-lenzify.jpg"
            alt="Why Lenzify"
            fill
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(3,23,61,0.7) 0%, transparent 60%)",
            }}
          />
          <div className="absolute bottom-10 left-10 right-10">
            <p className="text-white font-bold text-2xl uppercase tracking-tight">
              Premium Vision
            </p>
            <p className="text-white/60 text-sm mt-2">
              Crafted for the modern visionary
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest mb-4 block text-[#004AAD]">
            Why Choose Us
          </span>
          <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl text-[#111111] mb-4">
            India&apos;s Most Trusted Optical Brand
          </h2>
          <p className="text-[#666666] text-sm leading-relaxed mb-8 md:mb-12 max-w-md">
            From clinical eye tests to the latest smart eyewear, we combine cutting-edge
            technology with unmatched personal care.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-2xl p-6 group hover:-translate-y-1 transition-transform duration-300 bg-white border border-[#E8EAF2] shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-[#004AAD]/20"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-[#E8EEF8]">
                  <stat.icon className="w-5 h-5 text-[#004AAD]" />
                </div>
                <p className="text-2xl font-bold text-[#111111]">{stat.number}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#666666] mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}


// ─── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials({ items }: { items?: any[] }) {
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const reviews = (items || []).map((r: any) => ({
    name: r.users?.name || "Verified Customer",
    location: r.products?.name || "",
    text: r.review,
    rating: r.rating || 5,
  }));

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % reviews.length), 4500);
    return () => clearInterval(t);
  }, [reviews.length]);

  const prev = () => setActive((p) => (p - 1 + reviews.length) % reviews.length);
  const next = () => setActive((p) => (p + 1) % reviews.length);

  if (reviews.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 bg-[#F8F9FC]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="text-xs font-semibold uppercase tracking-widest mb-3 block text-[#004AAD]">
            Testimonials
          </span>
          <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl text-[#111111]">
            What Our Customers Say
          </h2>
        </motion.div>

        {/* ── Mobile: 3D rotating carousel ── */}
        <div className="md:hidden">
          <div
            style={{ perspective: 900, perspectiveOrigin: "50% 50%" }}
            className="relative"
            // height = card height + some breathing room
            // Card is ~220px, we leave 240px
            // Side cards shift back so they peek out
          >
            <div className="relative" style={{ height: 248 }}>
              {reviews.map((r, i) => {
                const total   = reviews.length;
                const offset  = (i - active + total) % total;
                // Normalise: 0=centre, 1=right, -1=left
                const norm    = offset > Math.floor(total / 2) ? offset - total : offset;
                const absNorm = Math.abs(norm);

                return (
                  <motion.div
                    key={r.name}
                    animate={{
                      rotateY: norm * -38,
                      x: `${norm * 74}%`,
                      scale: absNorm === 0 ? 1 : 0.76,
                      opacity: absNorm === 0 ? 1 : absNorm === 1 ? 0.48 : 0,
                      zIndex: absNorm === 0 ? 10 : 10 - absNorm,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 32 }}
                    style={{
                      position: "absolute",
                      width: "90%",
                      left: "5%",
                      transformStyle: "preserve-3d",
                      transformOrigin: "center center",
                      cursor: absNorm !== 0 ? "pointer" : "default",
                      pointerEvents: absNorm > 1 ? "none" : "auto",
                    }}
                    onClick={() => { if (absNorm !== 0) setActive(i); }}
                  >
                    <div
                      className={`rounded-2xl p-5 border bg-white transition-shadow ${
                        active === i
                          ? "border-[#004AAD] shadow-[0_8px_32px_rgba(0,74,173,0.14)]"
                          : "border-[#ECECEC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                      }`}
                    >
                      <div className="flex gap-1 mb-3">
                        {[...Array(r.rating)].map((_, j) => (
                          <Star key={j} className="w-3 h-3 fill-current text-[#D4A853]" />
                        ))}
                      </div>
                      <p className="text-[#666666] text-xs leading-relaxed mb-4 font-medium line-clamp-3">
                        &ldquo;{r.text}&rdquo;
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#004AAD] flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{r.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#111111]">
                            {r.name}
                          </p>
                          <p className="text-[9px] text-[#999999] font-bold uppercase tracking-widest line-clamp-1">
                            {r.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                suppressHydrationWarning
                onClick={prev}
                className="w-8 h-8 rounded-full border border-[#E8EAF2] bg-white flex items-center justify-center text-[#004AAD] text-lg font-bold shadow-sm"
              >
                ‹
              </button>
              <div className="flex gap-2">
                {reviews.map((_, i) => (
                  <button
                    suppressHydrationWarning
                    key={i}
                    onClick={() => setActive(i)}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: active === i ? 24 : 8,
                      background: active === i ? "#004AAD" : "#E8EAF2",
                    }}
                  />
                ))}
              </div>
              <button
                suppressHydrationWarning
                onClick={next}
                className="w-8 h-8 rounded-full border border-[#E8EAF2] bg-white flex items-center justify-center text-[#004AAD] text-lg font-bold shadow-sm"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* ── Desktop: grid ── */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl p-8 border transition-all duration-500 cursor-pointer bg-white ${
                active === i
                  ? "border-[#004AAD] shadow-[0_10px_40px_rgba(0,74,173,0.12)]"
                  : "border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
              }`}
              onClick={() => setActive(i)}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(r.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current text-[#D4A853]" />
                ))}
              </div>
              <p className="text-[#666666] text-sm leading-relaxed mb-6 font-medium">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#004AAD] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{r.name[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#111111]">
                    {r.name}
                  </p>
                  <p className="text-[9px] text-[#999999] font-bold uppercase tracking-widest line-clamp-1">
                    {r.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop dots */}
        <div className="hidden md:flex justify-center gap-2 mt-8">
          {reviews.map((_, i) => (
            <button
              suppressHydrationWarning
              key={i}
              onClick={() => setActive(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: active === i ? 24 : 8,
                background: active === i ? "#004AAD" : "#E8EAF2",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust Badges ─────────────────────────────────────────────────────────────
function TrustBadges() {
  const badges = [
    { icon: Truck, title: "Free Shipping", desc: "On all orders above ₹999" },
    { icon: CheckCircle, title: "2-Year Warranty", desc: "On all frames & lenses" },
    { icon: Eye, title: "Expert Opticians", desc: "Certified lens specialists" },
    { icon: Star, title: "Easy Returns", desc: "7-day hassle-free returns" },
  ];

  return (
    <section className="py-16 px-6 bg-white border-t border-[#E8EAF2]">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-[#E8EAF2] shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:border-[#004AAD]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#E8EEF8] group-hover:bg-[#D8E8FF] transition-colors">
              <badge.icon className="w-6 h-6 text-[#004AAD]" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-1">
              {badge.title}
            </p>
            <p className="text-[10px] text-[#666666] font-medium">{badge.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Newsletter ────────────────────────────────────────────────────────────────
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    const { subscribeNewsletter } = await import("@/lib/db/newsletter_actions");
    const res = await subscribeNewsletter(email.trim());
    setSubmitting(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Subscribed! Watch your inbox for exclusive offers.");
      setEmail("");
    }
  };

  return (
    <section
      className="py-12 md:py-20 px-4 sm:px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #03173D 0%, #004AAD 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center relative z-10"
      >
        <span className="text-xs font-semibold uppercase tracking-widest mb-4 block text-white/60">
          Newsletter
        </span>
        <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl text-white mb-4">
          Get Exclusive Offers
        </h2>
        <p className="text-white/60 text-sm font-medium mb-8 leading-relaxed">
          Join 10,000+ visionaries. Early access to new drops, member-only discounts, and
          insider style guides.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            suppressHydrationWarning
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 rounded-full px-6 py-4 bg-white/10 border border-white/20 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors"
          />
          <button
            suppressHydrationWarning
            onClick={handleSubscribe}
            disabled={submitting}
            className="px-8 py-4 rounded-full text-sm font-semibold bg-white text-[#03173D] hover:bg-white/90 transition-all hover:scale-105 shadow-[0_8px_24px_rgba(0,0,0,0.2)] whitespace-nowrap disabled:opacity-60"
          >
            {submitting ? "Subscribing..." : "Subscribe"}
          </button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Replace Lenses CTA ────────────────────────────────────────────────────────
function ReplaceLensesCTA() {
  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 bg-[#F8F9FC]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center"
      >
        <span className="text-xs font-semibold uppercase tracking-widest mb-4 block text-[#004AAD]">
          Service
        </span>
        <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl text-[#111111] mb-4">
          Replace Your Lenses
        </h2>
        <p className="text-[#666666] text-sm leading-relaxed max-w-xl mx-auto mb-10">
          Love your frames? Send them to us. Our master opticians will fit state-of-the-art
          lenses at unbeatable prices.
        </p>
        <Link
          href="/replace-lenses"
          className="inline-flex items-center gap-2 px-12 py-5 rounded-full text-sm font-semibold bg-[#03173D] text-white hover:bg-gradient-to-r hover:from-[#03173D] hover:to-[#004AAD] transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(3,23,61,0.25)]"
        >
          Start Replacement
          <ChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </section>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function HomeClient({ initialSections, initialProducts, stats, testimonials }: HomeClientProps) {
  const [sections, setSections] = useState(initialSections);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("homepage_cms_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homepage_config" },
        async () => {
          const { data } = await supabase
            .from("homepage_config")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });
          if (data) setSections(data);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const featuredSection = sections.find((s) => s.section_key === "featured_products");
  const trendingSection = sections.find((s) => s.section_key === "trending_products");
  const collectionsSection = sections.find((s) => s.section_key === "collections_gallery");
  const brandsSection = sections.find((s) => s.section_key === "brand_section");

  return (
    <div className="bg-white">
      {/* 1. Hero Carousel — dark navy gradient */}
      <HomeCarousel />

      {/* 2. Quick Category Strip — white */}
      <TopCategoriesStrip />

      {/* 3. High-Impact Category Banners (Contact Lenses, Eyeglasses, Sunglasses, Screen) */}
      <CategoryBannersSection />

      {/* 4. Featured Collections — white, large cards */}
      <CollectionShowcase items={collectionsSection?.content?.items} />

      {/* 4. Featured Products — white */}
      {featuredSection && (
        <ProductRow
          title={featuredSection.content.title || "Featured"}
          subtitle={featuredSection.content.subtitle || "Handpicked"}
          filterField="featured"
          initialData={initialProducts?.featured}
        />
      )}

      {/* 5. Trending Products — gray */}
      {trendingSection && (
        <ProductRow
          title={trendingSection.content.title || "Trending Now"}
          subtitle={trendingSection.content.subtitle || "Most Popular"}
          filterField="trending"
          initialData={initialProducts?.trending}
          gray
        />
      )}

      {/* 6. New Arrivals — white */}
      <ProductRow
        title="New Arrivals"
        subtitle="Just Landed"
        filterField="new_arrival"
        initialData={initialProducts?.new_arrivals}
      />

      {/* 7. Premium Brand Banner — dark navy gradient */}
      <PremiumBrandBanner brands={brandsSection?.content?.items} />

      {/* 8. Best Sellers — white */}
      <ProductRow
        title="Best Sellers"
        subtitle="Customer Favourites"
        filterField="best_seller"
      />

      {/* 9. Brand Marquee — gray */}
      <BrandsMarquee items={brandsSection?.content?.items} />

      {/* 10. Why LENZIFY / Trust Section — white */}
      <WhyLenzify stats={stats} />

      {/* 11. Testimonials — gray */}
      <Testimonials items={testimonials} />

      {/* Trust Badges — white */}
      <TrustBadges />

      {/* 12. Newsletter — dark navy gradient */}
      <NewsletterSection />

      {/* Replace Lenses CTA — gray */}
      <ReplaceLensesCTA />
    </div>
  );
}
