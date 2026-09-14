import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Shield, Activity, Eye, Sparkles, ChevronRight, Zap, CheckCircle2, Info, Users, ListChecks } from "lucide-react";
import { LENS_CONTENT } from "@/lib/data/lenses";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import LensPackageSelector from "@/components/store/LensPackageSelector";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FEATURE_ICONS = [Shield, Activity, Eye, Sparkles];

export default async function LensDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [lensRes, allLensesRes] = await Promise.all([
    supabase.from("lenses").select("*").eq("id", id).single(),
    supabase.from("lenses").select("*").eq("is_active", true),
  ]);

  const lens = lensRes.data;
  const allLenses = allLensesRes.data || [];

  if (lensRes.error && lensRes.error.code !== "PGRST116") {
    return (
      <div className="pt-32 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error loading lens</h1>
        <p className="text-gray-500 mt-2">{lensRes.error?.message}</p>
      </div>
    );
  }

  if (!lens) return notFound();

  const isProgressive = lens.name.toLowerCase().includes("progressive");
  const isSingleVision = lens.name.toLowerCase().includes("single");
  const isBifocal = lens.name.toLowerCase().includes("bifocal");
  
  // Starting price dynamically prioritizing database price over fallbacks
  const progressiveSilver = allLenses.find((l: any) => l.tier === "silver" || l.name === "Progressive Silver");
  const startingPrice = (lens.price && lens.price > 0)
    ? lens.price
    : (isProgressive 
        ? (progressiveSilver?.price || 1799) 
        : (isSingleVision ? 799 : (isBifocal ? 999 : (lens.base_price || 799))));

  const slug = lens.name.toLowerCase().replace(/[\s()\/]+/g, "-").replace(/-+/g, "-");
  const baseEditorial = Object.entries(LENS_CONTENT).find(([key]) => slug.includes(key))?.[1] || {
    name: lens.name,
    headline: "Precision crafted for clarity and comfort.",
    description: lens.description || "Premium quality lenses tailored for your unique visual needs.",
    what_it_is: lens.description || "A premium optical lens engineered to precise specifications.",
    use_cases: ["Daily vision correction", "UV protection", "Comfortable all-day wear"],
    ideal_for: ["All prescription needs", "Active lifestyles", "Daily use"],
    features: lens.features || ["High-Contrast Clarity", "UV Protection", "Scratch Resistant", "Durable Build"],
    feature_details: (lens.features || ["High-Contrast Clarity", "UV Protection", "Scratch Resistant", "Durable Build"]).map((f: string) => ({
      title: f, detail: "Premium quality certified to optical health standards."
    }))
  };

  const customFeatures = Array.isArray(lens.features) && lens.features.length > 0 ? lens.features : null;
  const editorial = {
    ...baseEditorial,
    headline: lens.description || baseEditorial.headline,
    what_it_is: lens.description || baseEditorial.what_it_is,
    features: customFeatures || baseEditorial.features,
    feature_details: customFeatures 
      ? customFeatures.map((f: any) => ({
          title: typeof f === "string" ? f : f.title || "Optical Feature",
          detail: typeof f === "object" && f.detail ? f.detail : "Verified optical enhancement calibrated to clinical prescription tolerances."
        }))
      : baseEditorial.feature_details
  };

  const categoryLabel = lens.sub_category || lens.category || "Premium Lens";

  return (
    <main className="bg-white min-h-screen font-sans">

      {/* Page Header — no image */}
      <section className="bg-[#03173D] pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/40 mb-8">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/lenses" className="hover:text-white/70 transition-colors">Lenses</Link>
            <span>/</span>
            <span className="text-white/70">{lens.name}</span>
          </div>

          <div className="max-w-3xl space-y-5">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.35em] text-[#00AEEF] bg-[#00AEEF]/10 px-3 py-1.5 rounded-full">
              {categoryLabel}
            </span>
            <h1 className="text-5xl md:text-6xl font-[var(--font-hero)] italic text-white leading-none">
              {lens.name}
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-xl">
              {editorial.headline}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <div className="bg-white/10 border border-white/10 rounded-2xl px-6 py-3">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Starting from</p>
                <p className="text-2xl font-bold text-white">₹{startingPrice.toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/replace-lenses?lensId=${lens.id}`}
                  className="bg-white text-[#03173D] rounded-full px-7 py-3.5 font-semibold text-sm hover:bg-[#00AEEF] hover:text-white transition-all inline-flex items-center gap-2"
                >
                  Replace Lenses <ArrowRight size={15} />
                </Link>
                <Link
                  href="/products"
                  className="border border-white/30 text-white rounded-full px-7 py-3.5 font-semibold text-sm hover:border-white hover:bg-white/10 transition-all"
                >
                  Shop Frames
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is it */}
      <section className="py-14 bg-[#F8F9FC] border-b border-[#ECECEC]">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-[#03173D] rounded-lg flex items-center justify-center">
                <Info size={14} className="text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#004AAD]">What is it?</span>
            </div>
            <p className="text-[#333333] text-base md:text-lg leading-relaxed">
              {editorial.what_it_is}
            </p>
          </div>
        </div>
      </section>

      {/* Coating Enhancements & Upgrade Packages / Progressive Tiers */}
      <section className="py-16 bg-white border-b border-[#ECECEC]">
        <div className="container mx-auto px-6 lg:px-12">
          <LensPackageSelector
            lensName={lens.name}
            lensId={lens.id}
            basePrice={startingPrice}
            availableLenses={allLenses}
          />
        </div>
      </section>

      {/* Use Cases + Ideal For */}
      <section className="py-16 bg-white border-b border-[#ECECEC]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Use Cases */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#EEF3FF] rounded-lg flex items-center justify-center">
                  <ListChecks size={14} className="text-[#004AAD]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#004AAD]">Common Uses</span>
              </div>
              <h3 className="text-2xl font-[var(--font-hero)] italic text-[#111111]">What it's used for</h3>
              <ul className="space-y-3">
                {editorial.use_cases.map((use, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#004AAD] mt-2 shrink-0" />
                    <span className="text-sm text-[#444444] leading-relaxed">{use}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ideal For */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#EEF3FF] rounded-lg flex items-center justify-center">
                  <Users size={14} className="text-[#004AAD]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#004AAD]">Who It's For</span>
              </div>
              <h3 className="text-2xl font-[var(--font-hero)] italic text-[#111111]">Ideal for</h3>
              <ul className="space-y-3">
                {editorial.ideal_for.map((who, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={15} className="text-[#004AAD] mt-0.5 shrink-0" />
                    <span className="text-sm text-[#444444] leading-relaxed">{who}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#F8F9FC]">
        <div className="container mx-auto px-6 lg:px-12 space-y-10">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#004AAD]">Key Features</span>
            <h2 className="text-3xl font-[var(--font-hero)] italic text-[#111111]">What's included</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(editorial.feature_details || []).map((fd: { title: string; detail: string }, i: number) => {
              const Icon = FEATURE_ICONS[i % 4];
              return (
                <div key={i} className="bg-white border border-[#ECECEC] rounded-2xl p-6 hover:border-[#004AAD]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="w-10 h-10 bg-[#EEF3FF] rounded-xl flex items-center justify-center mb-4">
                    <Icon size={18} className="text-[#004AAD]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#111111] leading-tight mb-2">{fd.title}</h4>
                  <p className="text-xs text-[#777777] leading-relaxed">{fd.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-[#ECECEC]">
        <div className="container mx-auto px-6 lg:px-12 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#004AAD]">Get Started</span>
            <h2 className="text-3xl md:text-4xl font-[var(--font-hero)] italic text-[#111111]">
              How would you like {lens.name} lenses?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            <div className="bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl p-10 text-left hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 group">
              <div className="w-11 h-11 bg-[#03173D] text-white flex items-center justify-center rounded-xl mb-5 group-hover:bg-[#004AAD] transition-colors">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-[var(--font-hero)] italic text-[#111111] mb-2">Replace Existing Lenses</h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-7">
                Keep your current frames. We'll fit them with {lens.name} lenses — includes pickup and precision lab fitting.
              </p>
              <Link
                href={`/replace-lenses?lensId=${lens.id}`}
                className="inline-flex items-center gap-2 bg-[#03173D] text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-[#004AAD] transition-all"
              >
                Order Lens Only <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl p-10 text-left hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 group">
              <div className="w-11 h-11 bg-[#EEF3FF] text-[#004AAD] flex items-center justify-center rounded-xl mb-5 group-hover:bg-[#004AAD] group-hover:text-white transition-colors">
                <Sparkles size={20} />
              </div>
              <h3 className="text-xl font-[var(--font-hero)] italic text-[#111111] mb-2">Shop with New Frames</h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-7">
                Pair {lens.name} lenses with a new frame from our collection. Includes personalized fitting at your doorstep.
              </p>
              <Link
                href="/products?category=spectacles"
                className="inline-flex items-center gap-2 border border-[#03173D] text-[#03173D] rounded-full px-6 py-3 text-sm font-semibold hover:bg-[#03173D] hover:text-white transition-all"
              >
                Explore Frames <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-16 bg-gradient-to-br from-[#03173D] via-[#004AAD] to-[#009DFF]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00AEEF]">Optics Standard</p>
              <h4 className="text-base font-bold text-white">Precision Lab Surfacing</h4>
              <p className="text-sm text-white/55 leading-relaxed">
                All lenses are surfaced and verified to rigorous optical alignment and prescription clarity standards.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00AEEF]">Guarantee</p>
              <h4 className="text-base font-bold text-white">12-Month Warranty</h4>
              <p className="text-sm text-white/55 leading-relaxed">
                Full coverage against manufacturing defects and lab-surfacing errors for one full year.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00AEEF]">Delivery</p>
              <h4 className="text-base font-bold text-white">3–5 Day Processing</h4>
              <p className="text-sm text-white/55 leading-relaxed">
                Your lenses are precision surfaced and dispatched within 3–5 working days of order confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
