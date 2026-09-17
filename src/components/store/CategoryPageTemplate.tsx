"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ProductCard from "@/components/store/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORY_IMAGES: Record<string, string> = {
    "contact-lenses": "/images/banners/contact-lenses-banner.jpg",
    "spectacles": "/images/banners/eyeglasses-banner.jpg",
    "sunglasses": "/images/banners/sunglasses-banner.jpg",
    "lenses": "/images/banners/computer-glasses-banner.jpg",
    "accessories": "/images/banners/shop-all-banner.jpg",
};

interface CategoryPageProps {
    category: "spectacles" | "lenses" | "contact-lenses" | "sunglasses" | "accessories";
    title: string;
    description: string;
}

export default function CategoryPageTemplate({ category, title, description }: CategoryPageProps) {
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("featured");
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            let query = supabase
                .from("products")
                .select("*, categories!inner(slug)")
                .eq("is_enabled", true);

            if (category) {
                query = query.eq("categories.slug", category);
            }

            const { data, error } = await query;

            if (data) {
                let result = [...data];

                if (searchQuery) {
                    result = result.filter(p =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                }

                if (sortBy === "price-low") {
                    result.sort((a, b) => a.price - b.price);
                } else if (sortBy === "price-high") {
                    result.sort((a, b) => b.price - a.price);
                } else if (sortBy === "rating") {
                    result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                }

                setFilteredProducts(result);
            }
            setLoading(false);
        };

        fetchProducts();
    }, [category, sortBy, searchQuery]);

    return (
        <div className="bg-white min-h-screen pb-32">
            {/* Category Hero */}
            <section className="relative bg-[#03173D] pt-40 pb-20 overflow-hidden">
                {/* Photographic Hero Background with Overlays */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                        src={CATEGORY_IMAGES[category] || "/images/banners/shop-all-banner.jpg"}
                        alt={title}
                        fill
                        priority
                        className="object-cover object-center scale-105 brightness-[0.85]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#03173D]/95 via-[#03173D]/80 to-[#03173D]/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#03173D] via-transparent to-black/30" />
                </div>

                {/* Floating white blur shapes */}
                <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-white/3 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-screen-2xl mx-auto px-8 md:px-12">
                    <div className="max-w-3xl space-y-8">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#00AEEF]">
                                Lenzify
                            </span>
                            <span className="text-white/40 text-[10px]">/</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#00AEEF]">
                                {title}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <span className="text-xs font-semibold uppercase tracking-widest text-[#00AEEF] block">
                                Collection
                            </span>
                            <h1 className="text-5xl md:text-8xl font-[var(--font-hero)] italic text-white leading-none">
                                {title}
                            </h1>
                        </div>
                        <p className="text-white/60 text-sm md:text-lg leading-relaxed max-w-xl">
                            {description}
                        </p>
                        <div className="pt-4">
                            <div className="h-px w-24 bg-white/20" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter Bar */}
            <section className="bg-white border-y border-[#E8EAF2] sticky top-0 z-30 shadow-sm">
                <div className="max-w-screen-2xl mx-auto px-8 md:px-12">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 py-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative w-full md:w-80">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#F8F9FC] border border-[#E8EAF2] rounded-full pl-12 pr-6 py-3 text-sm outline-none focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 transition-all text-[#111111] placeholder:text-[#666666]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 justify-between lg:justify-end">
                            <p className="text-xs text-[#666666] uppercase tracking-widest font-medium">
                                {filteredProducts.length} products
                            </p>

                            <div className="relative">
                                <select
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-[#F8F9FC] border border-[#E8EAF2] rounded-full pl-5 pr-10 py-3 text-xs font-medium text-[#111111] outline-none focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 cursor-pointer transition-all"
                                >
                                    <option value="featured">Sort: Featured</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="rating">Rating: High to Low</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#666666]" />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Product Grid */}
            <section className="bg-white max-w-screen-2xl mx-auto px-8 md:px-12 pt-16">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-[#F8F9FC] rounded-3xl animate-pulse border border-[#E8EAF2]">
                                    <div className="aspect-square rounded-t-3xl bg-[#ECECEC]" />
                                    <div className="p-6 space-y-3">
                                        <div className="h-3 bg-[#E8EAF2] rounded w-1/3" />
                                        <div className="h-5 bg-[#E8EAF2] rounded w-2/3" />
                                        <div className="h-4 bg-[#E8EAF2] rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : filteredProducts.length > 0 ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                            {filteredProducts.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                                >
                                    <ProductCard product={p} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="py-48 text-center space-y-8 bg-white border border-[#ECECEC] rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                        >
                            <div className="space-y-4">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD]">
                                    No Results
                                </p>
                                <h3 className="text-5xl font-[var(--font-hero)] italic text-[#111111]/10 uppercase">
                                    Nothing Found
                                </h3>
                                <p className="text-[#666666] text-sm leading-relaxed max-w-sm mx-auto">
                                    No products match your current filters. Try adjusting your search.
                                </p>
                            </div>
                            <button
                                onClick={() => { setSearchQuery(""); setSortBy("featured"); }}
                                className="bg-[#03173D] text-white rounded-full px-8 py-4 font-semibold hover:bg-gradient-to-r hover:from-[#03173D] hover:to-[#004AAD] transition-all duration-300"
                            >
                                Reset Filters
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}
