"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CONTACT_CONFIG } from "@/config/contact";

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [productTitle, setProductTitle] = useState<string>("");
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    // Read document title and location when mounted on client
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
      // If on product page, extract title
      if (pathname?.startsWith("/product/")) {
        const rawTitle = document.title || "";
        const cleanTitle = rawTitle.replace(/\s*\|\s*LENZIFY.*$/i, "").trim();
        setProductTitle(cleanTitle);
      } else {
        setProductTitle("");
      }
    }
  }, [pathname]);

  // Construct context-aware prefilled message
  const prefilledMessage =
    pathname?.startsWith("/product/") && productTitle
      ? `Hi Lenzify! I'm interested in: ${productTitle} (${currentUrl || ""})`
      : pathname?.startsWith("/product/")
      ? `Hi Lenzify! I'm interested in this product: ${currentUrl || ""}`
      : CONTACT_CONFIG.WHATSAPP_DEFAULT_MESSAGE;

  const whatsappHref = `https://wa.me/${CONTACT_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(
    prefilledMessage
  )}`;

  return (
    <div className="relative group">
      {/* Desktop Tooltip */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-[#03173D] text-white text-[11px] font-medium tracking-wide rounded-lg whitespace-nowrap shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200 hidden md:block z-50"
      >
        Chat with us on WhatsApp
        <span className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-[#03173D]" />
      </span>

      {/* Button link */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_28px_rgba(37,211,102,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
      >
        {/* Subtle breathing pulse ring (respects prefers-reduced-motion) */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping motion-reduce:hidden"
          style={{ animationDuration: "3s" }}
          aria-hidden="true"
        />

        {/* Official WhatsApp Glyph Inline SVG */}
        <svg
          viewBox="0 0 32 32"
          className="w-6 h-6 md:w-7 md:h-7 fill-white relative z-10 drop-shadow-sm"
          aria-hidden="true"
        >
          <path d="M16.01 2.01C8.28 2.01 2 8.29 2 16.01c0 2.58.7 5.09 2.02 7.28L2 30l6.93-1.97a13.93 13.93 0 007.08 1.95h.01c7.72 0 14-6.28 14-14s-6.28-13.97-14.01-13.97zm0 25.59h-.01a11.58 11.58 0 01-5.91-1.62l-.42-.25-4.4 1.25 1.26-4.28-.27-.44a11.59 11.59 0 01-1.85-6.25c0-6.4 5.21-11.61 11.62-11.61 3.1 0 6.02 1.21 8.21 3.41a11.56 11.56 0 013.4 8.2c0 6.4-5.21 11.59-11.63 11.59zm6.37-8.69c-.35-.17-2.07-1.02-2.39-1.14-.32-.12-.55-.17-.79.17-.23.35-.91 1.14-1.11 1.38-.2.23-.4.26-.75.09-.35-.17-1.47-.54-2.8-1.73-1.04-.92-1.74-2.07-1.94-2.42-.2-.35-.02-.54.15-.71.16-.16.35-.4.52-.61.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.61-.09-.17-.79-1.9-1.08-2.61-.28-.68-.57-.59-.79-.6l-.67-.01c-.23 0-.61.09-.93.43-.32.35-1.22 1.19-1.22 2.9 0 1.71 1.25 3.36 1.42 3.59.17.23 2.45 3.74 5.94 5.25.83.36 1.48.57 1.98.73.83.27 1.59.23 2.19.14.67-.1 2.07-.84 2.36-1.66.29-.81.29-1.51.2-1.66-.08-.14-.31-.23-.66-.4z" />
        </svg>
      </a>
    </div>
  );
}
