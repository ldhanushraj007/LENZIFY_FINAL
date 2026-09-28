"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import WhatsAppButton from "./WhatsAppButton";

// Lazy-load the Chatbot component on client-side to preserve optimal Lighthouse performance
const Chatbot = dynamic(() => import("./chatbot/Chatbot"), {
  ssr: false,
});

export default function FloatingWidgets() {
  const pathname = usePathname();

  // Hide widgets on all admin routes and secure login portal
  const isAdmin =
    pathname?.startsWith("/admin") || pathname === "/secure-admin-login";

  if (isAdmin) {
    return null;
  }

  return (
    <aside
      aria-label="Customer Support Widgets"
      data-lenis-prevent
      className="fixed z-40 right-4 sm:right-6 bottom-[calc(74px+env(safe-area-inset-bottom,0px))] sm:bottom-6 flex flex-col items-end gap-3.5 sm:gap-4 pointer-events-auto"
    >
      {/* Chatbot Launcher (stacked directly above WhatsApp) */}
      <Chatbot />

      {/* WhatsApp Button (anchored at bottom) */}
      <WhatsAppButton />
    </aside>
  );
}
