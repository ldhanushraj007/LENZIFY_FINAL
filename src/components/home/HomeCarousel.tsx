"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Images ───────────────────────────────────────────────────────────────────
const FRAMES = [
  { src: "/images/hero/hero1.jpg", label: "Editorial Luxe" },
  { src: "/images/hero/hero6.jpg", label: "Dark Fashion" },
  { src: "/images/hero/hero8.jpg", label: "Artisan Craft" },
  { src: "/images/hero/hero5.jpg", label: "Classic Frame" },
  { src: "/images/hero/hero7.jpg", label: "Street Style" },
  { src: "/images/hero/hero2.jpg", label: "Modern Lifestyle" },
  { src: "/images/hero/hero9.jpg", label: "Everyday Confidence" },
  { src: "/images/hero/hero10.jpg", label: "Campus Crew" },
  { src: "/images/hero/hero11.jpg", label: "Sharp Focus" },
  { src: "/images/hero/hero12.jpg", label: "Sunlit Cool" },
];

const N = FRAMES.length; // 10

// ─── Desktop stack / fan positions ────────────────────────────────────────────
const STACK_DESKTOP = [
  { x: -90, y: 48, rotate: -8, scale: 0.72, opacity: 0.20 },
  { x:  80, y: 40, rotate:  8, scale: 0.79, opacity: 0.32 },
  { x: -55, y: 30, rotate: -5, scale: 0.86, opacity: 0.48 },
  { x:  48, y: 20, rotate:  4, scale: 0.91, opacity: 0.65 },
  { x: -20, y: 10, rotate: -2, scale: 0.96, opacity: 0.82 },
  { x:   0, y:  0, rotate:  0, scale: 1.00, opacity: 1.00 },
];

const FAN_DESKTOP = [
  { x: -480, y: 38, rotate: -20, scale: 0.82 },
  { x: -288, y: 16, rotate: -12, scale: 0.88 },
  { x:  -96, y:  4, rotate:  -4, scale: 0.94 },
  { x:   96, y:  4, rotate:   4, scale: 0.94 },
  { x:  288, y: 16, rotate:  12, scale: 0.88 },
  { x:  480, y: 38, rotate:  20, scale: 0.82 },
];

// ─── Mobile stack / fan positions (tighter) ───────────────────────────────────
const STACK_MOBILE = [
  { x: -45, y: 24, rotate: -8, scale: 0.72, opacity: 0.20 },
  { x:  40, y: 20, rotate:  8, scale: 0.79, opacity: 0.32 },
  { x: -28, y: 15, rotate: -5, scale: 0.86, opacity: 0.48 },
  { x:  24, y: 10, rotate:  4, scale: 0.91, opacity: 0.65 },
  { x: -10, y:  5, rotate: -2, scale: 0.96, opacity: 0.82 },
  { x:   0, y:  0, rotate:  0, scale: 1.00, opacity: 1.00 },
];

const FAN_MOBILE = [
  { x: -210, y: 18, rotate: -18, scale: 0.82 },
  { x: -126, y:  8, rotate: -10, scale: 0.88 },
  { x:  -42, y:  2, rotate:  -3, scale: 0.94 },
  { x:   42, y:  2, rotate:   3, scale: 0.94 },
  { x:  126, y:  8, rotate:  10, scale: 0.88 },
  { x:  210, y: 18, rotate:  18, scale: 0.82 },
];

// ─── LetterReveal ─────────────────────────────────────────────────────────────
function LetterReveal({
  text,
  delay = 0,
  style = {},
}: {
  text: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span style={{ display: "block", ...style }}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          style={{ display: "inline-block" }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.032, ease: [0.22, 1, 0.36, 1] }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Solitaire Stack ──────────────────────────────────────────────────────────
function SolitaireStack() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [activeInFan, setActiveInFan] = useState(N - 1);
  const [isMobile, setIsMobile] = useState(false);

  // Mouse parallax (desktop only)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 25, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 25, damping: 30 });
  const rotateX = useTransform(springY, [-300, 300], [6, -6]);
  const rotateY = useTransform(springX, [-500, 500], [-8, 8]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  // Auto-cycle
  useEffect(() => {
    const fanMode = isHovered && !isMobile;
    const interval = setInterval(() => {
      if (fanMode) {
        setActiveInFan((i) => (i + 1) % N);
      } else {
        setHeroIdx((i) => (i + 1) % N);
      }
    }, fanMode ? 2000 : 5000);
    return () => clearInterval(interval);
  }, [isHovered, isMobile]);

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    const newHero = (heroIdx + N - 1 - activeInFan + N) % N;
    setHeroIdx(newHero);
    setActiveInFan(N - 1);
  };

  // Responsive dimensions
  const cardW = isMobile ? 264 : 520;
  const cardH = isMobile ? 184 : 360;
  const STACK = isMobile ? STACK_MOBILE : STACK_DESKTOP;
  const FAN   = isMobile ? FAN_MOBILE   : FAN_DESKTOP;

  const imageAt = (slotIdx: number) =>
    FRAMES[(heroIdx + (N - 1 - slotIdx) + N * 2) % N];

  const isFrontSlot    = (slotIdx: number) => slotIdx === N - 1;
  const isActiveInFan  = (slotIdx: number) => isHovered && !isMobile && slotIdx === activeInFan;

  return (
    <div
      style={{ perspective: 1200, perspectiveOrigin: "50% 40%" }}
      className="relative flex items-center justify-center"
    >
      <motion.div
        style={{
          rotateX: isMobile ? 0 : rotateX,
          rotateY: isMobile ? 0 : rotateY,
          transformStyle: "preserve-3d",
          position: "relative",
          width: cardW,
          height: cardH + (isMobile ? 40 : 80),
          margin: "0 auto",
        }}
        onMouseEnter={() => {
          if (!isMobile) { setIsHovered(true); setActiveInFan(N - 1); }
        }}
        onMouseLeave={handleMouseLeave}
        // Mobile: tap whole stack to advance
        onClick={() => {
          if (isMobile) setHeroIdx((i) => (i + 1) % N);
        }}
      >
        {STACK.map((stackPos, slotIdx) => {
          const frame     = imageAt(slotIdx);
          const fanPos    = FAN[slotIdx];
          const inFanMode = isHovered && !isMobile;
          const pos       = inFanMode ? fanPos : stackPos;
          const isFront   = isFrontSlot(slotIdx);
          const isActive  = isActiveInFan(slotIdx);
          const shadowBlur  = isFront || isActive ? 60 : 20;
          const shadowAlpha = isFront || isActive ? 0.18 : 0.07;

          return (
            <motion.div
              key={slotIdx}
              animate={{
                x:       pos.x,
                y:       inFanMode ? pos.y : stackPos.y,
                rotate:  pos.rotate,
                scale:   isActive ? 1.06 : (inFanMode ? pos.scale : stackPos.scale),
                opacity: inFanMode ? (isActive ? 1 : 0.72) : stackPos.opacity,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.8 }}
              onClick={(e) => {
                if (inFanMode) { e.stopPropagation(); setActiveInFan(slotIdx); }
              }}
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                marginLeft: -cardW / 2,
                width:  cardW,
                height: cardH,
                zIndex: inFanMode ? (isActive ? 20 : slotIdx + 1) : slotIdx + 1,
                cursor: isMobile ? "pointer" : (inFanMode ? "pointer" : "default"),
                transformOrigin: "center bottom",
              }}
            >
              <div
                className="w-full h-full relative overflow-hidden"
                style={{
                  borderRadius: isMobile ? 20 : 28,
                  border: isFront || isActive
                    ? "1px solid rgba(0,0,0,0.06)"
                    : "1px solid rgba(0,0,0,0.04)",
                  boxShadow: `0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0,0,0,${shadowAlpha}), 0 4px 12px rgba(0,0,0,0.04)`,
                  background: "#f5f5f5",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={frame.src + slotIdx}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65 }}
                  >
                    <Image
                      src={frame.src}
                      alt={frame.label}
                      fill
                      className="object-cover"
                      sizes={`${cardW}px`}
                      priority={isFront}
                    />
                  </motion.div>
                </AnimatePresence>

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    borderRadius: isMobile ? 20 : 28,
                    background: "linear-gradient(to top, rgba(0,0,0,0.42) 0%, transparent 50%)",
                    opacity: isFront || isActive ? 1 : 0.6,
                  }}
                />

                {(isFront || isActive) && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={frame.label}
                      className="absolute left-5"
                      style={{ bottom: isMobile ? 14 : 20 }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                    >
                      <p
                        className="font-black uppercase tracking-[0.45em]"
                        style={{ fontSize: isMobile ? 8 : 10, color: "rgba(255,255,255,0.72)" }}
                      >
                        {frame.label}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}

                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: isMobile ? 20 : 28,
                      boxShadow: "inset 0 0 0 2px rgba(0,174,239,0.5)",
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {!isHovered && (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute text-center w-full font-bold uppercase tracking-[0.4em]"
              style={{
                fontSize: 9,
                bottom: isMobile ? -20 : -36,
                color: "rgba(0,0,0,0.22)",
                left: 0,
              }}
            >
              {isMobile ? "Tap to explore" : "Hover to explore"}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress dots */}
      <div
        className="absolute flex gap-2 pointer-events-none"
        style={{ bottom: isMobile ? -44 : -64, left: "50%", transform: "translateX(-50%)" }}
      >
        {FRAMES.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: i === heroIdx ? 22 : 6,
              background: i === heroIdx ? "#00AEEF" : "rgba(0,0,0,0.14)",
            }}
            style={{ height: 3 }}
            transition={{ duration: 0.35 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Spectacle Background ─────────────────────────────────────────────────────
function SpectacleBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 16, damping: 55 });
  const springY = useSpring(mouseY, { stiffness: 16, damping: 55 });
  const parallaxX = useTransform(springX, [-700, 700], [-18, 18]);
  const parallaxY = useTransform(springY, [-500, 500], [-11, 11]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <div
      className="absolute inset-0 pointer-events-none flex justify-center overflow-hidden"
      style={{ zIndex: 5, alignItems: "flex-start", paddingTop: "calc(18vh + 30px)" }}
    >
      <motion.div
        style={{
          x: parallaxX,
          y: parallaxY,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Concentric halo rings */}
        {[
          { w: 520, h: 210, opacity: 0.10, blur: 2 },
          { w: 680, h: 275, opacity: 0.06, blur: 4 },
          { w: 840, h: 340, opacity: 0.04, blur: 7 },
        ].map(({ w, h, opacity, blur }, i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.018, 1], opacity: [opacity, opacity * 1.5, opacity] }}
            transition={{ duration: 9 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            style={{
              position: "absolute",
              width: w,
              height: h,
              borderRadius: "50%",
              border: "1.5px solid rgba(0, 74, 173, 0.9)",
              opacity,
              filter: `blur(${blur}px)`,
            }}
          />
        ))}

        {/* Glasses silhouette */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            scale: [1, 1.026, 1],
            rotate: [-1.2, 1.2, -1.2],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }}
          style={{
            filter: "blur(5px)",
            opacity: 0.28,
            color: "#004AAD",
          }}
        >
          <svg
            viewBox="0 0 800 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: 860, height: "auto", overflow: "visible" }}
          >
            <rect x="48"  y="28" width="280" height="178" rx="44" ry="44" stroke="currentColor" strokeWidth="2.5" />
            <rect x="472" y="28" width="280" height="178" rx="44" ry="44" stroke="currentColor" strokeWidth="2.5" />
            <path d="M 328 82 C 363 128 437 128 472 82" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M 48 152 Q -56 167 -210 186"  stroke="currentColor" strokeWidth="2"   strokeLinecap="round" fill="none" />
            <path d="M 752 152 Q 856 167 1010 186" stroke="currentColor" strokeWidth="2"   strokeLinecap="round" fill="none" />
            <path d="M 322 90 L 314 115" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 478 90 L 486 115" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="49"  cy="117" r="5" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="751" cy="117" r="5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="64"  y="44" width="248" height="146" rx="34" ry="34" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            <rect x="488" y="44" width="248" height="146" rx="34" ry="34" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          </svg>
        </motion.div>

        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            width: 760,
            height: 300,
            background: "radial-gradient(ellipse at center, rgba(0, 100, 255, 0.09) 0%, transparent 68%)",
            filter: "blur(40px)",
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── Hero Background Carousel ────────────────────────────────────────────────
const HERO_BG_IMAGES = [
  "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1920&q=80",
  "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1920&q=80",
  "https://images.unsplash.com/photo-1494735777773-f0aa8a9d7cd0?w=1920&q=80",
  "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=1920&q=80",
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1920&q=80",
];

function HeroBackgroundCarousel() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_BG_IMAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={HERO_BG_IMAGES[currentIdx]}
            alt="Lenzify eyewear editorial background"
            fill
            priority={currentIdx === 0}
            loading={currentIdx === 0 ? undefined : "lazy"}
            className="object-cover object-center transform scale-105"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient overlay for readability across mobile & desktop */}
      <div
        className="absolute inset-0 z-10 bg-gradient-to-b from-black/75 via-black/55 to-black/85 md:from-black/65 md:via-black/40 md:to-black/75"
      />
    </div>
  );
}

// ─── Floating Hero Offer Cards (Glassmorphism) ───────────────────────────────
interface HeroCoupon {
  id: string;
  code: string;
  title?: string | null;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  minimum_order_value?: number | null;
  min_order?: number | null;
}

function HeroOfferCards() {
  const [coupons, setCoupons] = useState<HeroCoupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadActiveCoupons() {
      try {
        const supabase = createClient();
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("coupons")
          .select("id, code, title, description, discount_type, discount_value, minimum_order_value, min_order")
          .eq("is_active", true)
          .eq("show_on_offers_page", true)
          .or(`valid_until.is.null,valid_until.gt.${now}`)
          .order("discount_value", { ascending: false })
          .limit(3);

        if (!error && data && data.length > 0) {
          setCoupons(data);
        } else {
          setCoupons([]);
        }
      } catch {
        setCoupons([]);
      }
    }

    loadActiveCoupons();
  }, []);

  // Disappear completely if no active coupons exist
  if (coupons.length === 0) {
    return null;
  }

  const handleCopy = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 md:mt-12 z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {coupons.map((coupon, idx) => {
          const min = Number(
            coupon.minimum_order_value && coupon.minimum_order_value > 0
              ? coupon.minimum_order_value
              : coupon.min_order || 0
          );
          const discountLabel =
            coupon.discount_type === "percentage"
              ? `${coupon.discount_value}% OFF`
              : `₹${coupon.discount_value} OFF`;

          return (
            <motion.div
              key={coupon.id || coupon.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + idx * 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative rounded-[16px] p-4 sm:p-5 flex flex-col justify-between transition-shadow duration-300 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {coupon.code}
                  </span>
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="text-[10px] font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCode === coupon.code ? "COPIED!" : "COPY"}
                  </button>
                </div>

                <h4 className="text-white text-lg sm:text-xl font-bold tracking-tight">
                  {coupon.title || discountLabel}
                </h4>

                <p className="text-white/70 text-xs mt-1 line-clamp-1">
                  {coupon.description || (min > 0 ? `On orders above ₹${min.toLocaleString("en-IN")}` : "No minimum order")}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                  Active Offer
                </span>
                <Link
                  href="/products"
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/30 hover:bg-white hover:text-black transition-all duration-200"
                >
                  Shop Now →
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Hero ────────────────────────────────────────────────────────────────
export default function HomeHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#050B18" }}
    >
      {/* Background Photography Carousel */}
      <HeroBackgroundCarousel />

      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,130,255,0.08) 0%, transparent 100%)",
        }}
      />

      {/* Spectacle silhouette background — desktop only */}
      <div className="hidden md:block relative z-[1] pointer-events-none">
        <SpectacleBackground />
      </div>

      {/* Content — no flex-1, no min-h-screen: height is always content-driven */}
      <div className="relative z-10 flex flex-col items-center pt-24 pb-10 md:pt-32 md:pb-16 px-4 sm:px-6">

        {/* Typography block */}
        <div className="text-center mb-6 md:mb-12">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[9px] font-black uppercase tracking-[0.35em] mb-4 md:mb-8"
            style={{ color: "#00AEEF" }}
          >
            Lenzify.in — Premium Eyewear
          </motion.p>

          <h1
            className="font-serif italic tracking-tight mb-4 md:mb-6"
            style={{
              fontWeight: 900,
              lineHeight: 0.88,
              fontSize: "clamp(38px, 7vw, 100px)",
            }}
          >
            <LetterReveal text="See The"     delay={0.3}  style={{ color: "#FFFFFF" }} />
            <LetterReveal text="World"       delay={0.55} style={{ color: "#00AEEF" }} />
            <LetterReveal text="Differently" delay={0.82} style={{ color: "#FFFFFF" }} />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="text-white/80 text-sm leading-relaxed max-w-xs sm:max-w-md mx-auto mb-6 md:mb-8 font-medium"
          >
            Premium eyewear crafted for vision, style, and everyday comfort.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.65 }}
          >
            <Link
              href="/products"
              className="inline-block px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-full transition-all duration-300 hover:scale-105 text-center whitespace-nowrap"
              style={{
                background: "#FFFFFF",
                color: "#111111",
                boxShadow: "0 8px 24px rgba(255,255,255,0.22)",
              }}
            >
              Shop Collection
            </Link>
          </motion.div>
        </div>

        {/* Solitaire card stack — no extra padding, stack determines its own height */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex flex-col items-center"
        >
          {mounted && <SolitaireStack />}
        </motion.div>

        {/* Floating Offer Cards (conditional on active coupons in DB) */}
        {mounted && <HeroOfferCards />}

        {/* Scroll indicator — always inline, never absolute */}
        <motion.button
          suppressHydrationWarning
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
          className="flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-0 z-20 mt-10 md:mt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.45em]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Scroll
          </span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5" style={{ color: "#00AEEF" }} />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
