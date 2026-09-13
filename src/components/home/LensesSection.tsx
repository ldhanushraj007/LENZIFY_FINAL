"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const LENS_TYPES = [
  {
    name: "Bifocal",
    price: "Starts at ₹999",
    image: "/images/editorial/lifestyle_laughing.png",
    id: "5e46d84e-fc97-4ee1-b8b6-b801397ae7b5"
  },
  {
    name: "Progressive",
    price: "Starts at ₹1,799",
    image: "/images/homepage/banner_lenses_1777728807886.png",
    id: "de87ead3-c3f3-48ac-9b4d-a779b9d17cad"
  },
  {
    name: "Single Vision",
    price: "Starts at ₹799",
    image: "/images/editorial/hero_woman_reading.png",
    id: "98ed43f0-b092-4e8f-bddc-67e6ed6f62b8"
  },
  {
    name: "Zero Power",
    price: "Starts at ₹499",
    image: "/images/editorial/hero_man.png",
    id: "a7f06ca5-1234-5678-90ab-cdef01234572"
  }
];

const ENHANCEMENTS = [
  {
    name: "Anti-Fog Coating",
    price: "Starts at ₹799",
    image: "/images/homepage/banner_categories_1777728514870.png",
    id: "a7f06ca0-1234-5678-90ab-cdef01234567"
  },
  {
    name: "Anti-Reflective Coating",
    price: "Starts at ₹1,199",
    image: "/images/homepage/banner_featured_1777728455979.png",
    id: "a7f06ca1-1234-5678-90ab-cdef01234568"
  },
  {
    name: "Blue Light Protection",
    price: "Starts at ₹1,299",
    image: "/images/homepage/carousel_eyewear_1_1777728338105.png",
    id: "5e621f5d-7ad8-4c7e-854c-bbca08e78004"
  },
  {
    name: "Scratch Resistant",
    price: "Starts at ₹599",
    image: "/images/editorial/lifestyle_laughing.png",
    id: "a7f06ca2-1234-5678-90ab-cdef01234569"
  },
  {
    name: "UV Protection",
    price: "Starts at ₹499",
    image: "/images/homepage/carousel_eyewear_3_1777728409318.png",
    id: "a7f06ca3-1234-5678-90ab-cdef01234570"
  },
  {
    name: "Water Repellent",
    price: "Starts at ₹899",
    image: "/images/editorial/hero_woman_reading.png",
    id: "a7f06ca4-1234-5678-90ab-cdef01234571"
  }
];

function LensCard({ item, index }: { item: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        href={`/lenses/${item.id}`}
        className="group relative block aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-surface shadow-lg hover:shadow-2xl transition-all duration-500"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        <div className="absolute inset-0 p-4 md:p-8 flex flex-col justify-end">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5 md:space-y-1">
              <h3 className="text-sm md:text-2xl font-bold text-white tracking-tight leading-tight">{item.name}</h3>
              <p className="text-white/80 text-[10px] md:text-sm font-medium">{item.price}</p>
            </div>
            <div className="hidden md:flex bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2 rounded-full text-xs md:text-sm font-bold items-center gap-1 group-hover:bg-white group-hover:text-black transition-all duration-300 shrink-0">
              Shop <ChevronRight size={16} />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ring-2 ring-white/50 rounded-2xl md:rounded-[2.5rem]" />
      </Link>
    </motion.div>
  );
}

export default function LensesSection() {
  return (
    <section className="py-24 bg-surface-container-low overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="mb-20 text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-serif text-primary mb-6">Precision Lenses</h2>
          <p className="text-on-surface-variant text-lg md:text-xl font-body max-w-2xl leading-relaxed">
            Engineered for clarity, comfort, and protection. Choose the perfect lens for your unique visual signature.
          </p>
        </div>

        {/* Section 1: Lens Types */}
        <div className="mb-24">
          <div className="flex items-center gap-6 mb-12">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary whitespace-nowrap">Lens Types</h3>
            <div className="h-px w-full bg-outline/10" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
            {LENS_TYPES.map((lens, index) => (
              <LensCard key={lens.name} item={lens} index={index} />
            ))}
          </div>
        </div>

        {/* Section 2: Laboratory Enhancements */}
        <div>
          <div className="flex items-center gap-6 mb-12">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary whitespace-nowrap">Laboratory Enhancements</h3>
            <div className="h-px w-full bg-outline/10" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
            {ENHANCEMENTS.map((enhancement, index) => (
              <LensCard key={enhancement.name} item={enhancement} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
