"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuth } from "@/components/providers/AuthProvider";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const rawTotalItems = useCartStore((s) => s.items.reduce((a, i) => a + Number(i.quantity || 0), 0));
  const rawWishlistCount = useWishlistStore((s) => s.items.length);
  const totalItems = user ? rawTotalItems : 0;
  const wishlistCount = user ? rawWishlistCount : 0;

  const isAdmin = pathname?.startsWith("/admin") || pathname === "/secure-admin-login";
  if (isAdmin) return null;

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/products", icon: Search, label: "Shop" },
    { href: "/cart", icon: ShoppingBag, label: "Cart", badge: user ? totalItems : undefined },
    { href: "/wishlist", icon: Heart, label: "Wishlist", badge: user ? wishlistCount : undefined },
    { href: "/dashboard", icon: User, label: "Account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-[#E8EAF2] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ maxWidth: "100vw", width: "100vw" }}>
      <div className="flex items-center justify-around px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)]">
        {tabs.map(({ href, icon: Icon, label, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all min-w-[52px]"
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    active ? "text-[#03173D]" : "text-[#999999]"
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#004AAD] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-[#03173D] font-semibold" : "text-[#999999]"
                )}
              >
                {label}
              </span>
              {active && (
                <div className="w-1 h-1 bg-[#03173D] rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
