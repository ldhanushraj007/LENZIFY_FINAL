"use client";

import { usePathname } from "next/navigation";
import WhatsAppButton from "./WhatsAppButton";

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
      aria-label="WhatsApp Support"
      data-lenis-prevent
      className="fixed z-40 right-4 sm:right-6 bottom-[calc(74px+env(safe-area-inset-bottom,0px))] sm:bottom-6 pointer-events-auto"
    >
      <WhatsAppButton />
    </aside>
  );
}
