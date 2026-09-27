import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { HOUSE_BRANDS } from "@/lib/data/house_brands";
import ProductGrid from "@/components/shop/ProductGrid";
import { ChevronRight, ShieldCheck, Sparkles, Truck } from "lucide-react";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = HOUSE_BRANDS.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
  if (!brand) return { title: "Brand Not Found | Lenzify" };
  return {
    title: `${brand.name} Eyewear & Sunglasses | Lenzify House Brands`,
    description: `Shop the official ${brand.name} collection on Lenzify. Handcrafted frames, sunglasses, and optical lenses engineered for everyday luxury.`,
  };
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = HOUSE_BRANDS.find((b) => b.slug.toLowerCase() === slug.toLowerCase());

  if (!brand) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="border-b border-[#ECECEC] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#004AAD] transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-slate-400" />
          <Link href="/products" className="hover:text-[#004AAD] transition-colors">
            Brands
          </Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="font-semibold text-slate-900">{brand.name}</span>
        </div>
      </div>

      {/* ── Brand Hero Header ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F8FF] to-white border-b border-[#ECECEC] py-12 md:py-16 px-4 sm:px-6">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Large Brand Logo Container */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-3xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-0 flex items-center justify-center shrink-0 relative overflow-hidden group">
              <div className="relative w-full h-full rounded-3xl overflow-hidden">
                <Image
                  src={brand.logo_url}
                  alt={brand.name}
                  fill
                  sizes="(max-width: 768px) 180px, 220px"
                  priority
                  className="object-cover w-full h-full scale-105 group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Brand Information */}
            <div className="text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004AAD]/10 text-[#004AAD] text-xs font-bold uppercase tracking-widest">
                <Sparkles size={12} />
                <span>Lenzify House Brand</span>
              </div>
              <h1 className="font-serif italic text-4xl sm:text-5xl md:text-6xl text-[#111111] leading-tight">
                {brand.name}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
                Discover the official collection of {brand.name}. Handcrafted precision frames, premium polarized sunglasses, and signature optical designs engineered exclusively for Lenzify.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#004AAD]" /> 100% Authentic Quality
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Truck size={16} className="text-[#004AAD]" /> Fast Nationwide Delivery
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Free Case & Cloth
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Products Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ProductGrid
          searchBrand={brand.slug}
          initialBrand={brand.name}
          hideBanner={true}
        />
      </main>
    </div>
  );
}
