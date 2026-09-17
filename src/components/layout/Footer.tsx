"use client";

import Link from "next/link";
import { Instagram, Facebook, Mail } from "lucide-react";
import { useState } from "react";
import { subscribeNewsletter } from "@/lib/db/newsletter_actions";
import toast from "react-hot-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { toast.error("Please enter a valid email."); return; }
    setSubscribing(true);
    const result = await subscribeNewsletter(email);
    setSubscribing(false);
    if (result.error) { toast.error(result.error); } else { toast.success("Welcome to our circle!"); setEmail(""); }
  };

  const cols = [
    {
      title: "Shop",
      links: [
        { name: "Frames", href: "/products?type=Eyeglasses" },
        { name: "Sunglasses", href: "/products?type=Sunglasses" },
        { name: "Contact Lens", href: "/contact-lenses" },
        { name: "Smart Glasses", href: "/products?type=Smart Glasses" },
      ],
    },
    {
      title: "Brands",
      links: [
        { name: "ZEISS", href: "/products?brand=zeiss" },
        { name: "Ray-Ban", href: "/products?brand=rayban" },
        { name: "Essilor", href: "/products?brand=essilor" },
        { name: "Kodak", href: "/products?brand=kodak" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "FAQ", href: "/faq" },
        { name: "Try at Home", href: "/try-at-home" },
      ],
    },
  ];

  return (
    <footer className="bg-[#03173D]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="text-2xl font-black uppercase tracking-widest text-white mb-3">LENZIFY</div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-6 text-[#00AEEF]">
              The Future of Vision
            </p>
            <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs">
              Premium eyewear crafted for vision, style, and everyday comfort. India&apos;s most trusted optical brand.
            </p>

            {/* Newsletter inline */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                suppressHydrationWarning
                className="flex-1 rounded-full px-4 py-3 bg-white/10 border border-white/20 text-white text-xs font-medium placeholder:text-white/30 focus:outline-none focus:border-[#00AEEF] transition-colors"
              />
              <button
                type="submit"
                disabled={subscribing}
                suppressHydrationWarning
                className="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-[#03173D] bg-[#00AEEF] hover:bg-white transition-all hover:scale-105 disabled:opacity-50 whitespace-nowrap"
              >
                {subscribing ? "..." : "Join"}
              </button>
            </form>

            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/lenzify.in"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:lenzify.in@gmail.com"
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-white/60 text-sm font-medium hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06] px-6 lg:px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/20">
          © 2026 Lenzify.in — All Rights Reserved
        </p>
        <div className="flex gap-8">
          {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]].map(([name, href]) => (
            <Link
              key={name}
              href={href}
              className="text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
