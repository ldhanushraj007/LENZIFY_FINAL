"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Warehouse,
  BarChart3,
  Settings,
  LogOut,
  Search,
  PlusCircle,
  FolderTree,
  Tag,
  Star,
  Home,
  RefreshCw,
  Eye,
  FileText,
  Image,
  Megaphone,
  MessageSquare,
  Bell,
  TrendingUp,
  MapPin,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth/actions";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { name: "Products", icon: Package, href: "/admin/products" },
      { name: "Add Product", icon: PlusCircle, href: "/admin/products/new" },
      { name: "Optical Lenses", icon: Eye, href: "/admin/lenses" },
      { name: "Lens Coatings", icon: Layers, href: "/admin/coatings" },
      { name: "Categories", icon: FolderTree, href: "/admin/categories" },
      { name: "Brands", icon: Tag, href: "/admin/brands" },
      { name: "Collections", icon: Star, href: "/admin/collections" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { name: "Orders", icon: ShoppingCart, href: "/admin/orders" },
      { name: "Try at Home", icon: Home, href: "/admin/try-at-home" },
      { name: "Replacements", icon: RefreshCw, href: "/admin/replacements" },
      { name: "Customers", icon: Users, href: "/admin/customers" },
      { name: "Inventory", icon: Warehouse, href: "/admin/inventory" },
      { name: "Coupons & Offers", icon: Megaphone, href: "/admin/offers" },
    ],
  },
  {
    label: "Logistics",
    items: [
      { name: "Shipping", icon: Truck, href: "/admin/shipping" },
      { name: "Stores", icon: MapPin, href: "/admin/stores" },
    ],
  },
  {
    label: "Store",
    items: [
      { name: "Homepage", icon: Image, href: "/admin/homepage" },
      { name: "Reviews", icon: MessageSquare, href: "/admin/reviews" },
      { name: "Analytics", icon: TrendingUp, href: "/admin/analytics" },
      { name: "Reports", icon: BarChart3, href: "/admin/reports" },
      { name: "Notifications", icon: Bell, href: "/admin/notifications" },
      { name: "Settings", icon: Settings, href: "/admin/settings" },
    ],
  },
];

function NavItem({
  item,
  pathname,
  onClick,
}: {
  item: { name: string; icon: any; href: string };
  pathname: string;
  onClick?: () => void;
}) {
  const isActive =
    pathname === item.href ||
    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 group",
        isActive
          ? "bg-[#EEF2FF] text-[#004AAD] font-semibold"
          : "text-[#555555] hover:bg-[#F4F6F8] hover:text-[#111111] font-medium"
      )}
    >
      <Icon
        size={15}
        strokeWidth={isActive ? 2.5 : 2}
        className={cn(
          "flex-shrink-0 transition-colors",
          isActive ? "text-[#004AAD]" : "text-[#999999] group-hover:text-[#555555]"
        )}
      />
      <span className="flex-1 truncate">{item.name}</span>
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-[#004AAD] flex-shrink-0" />
      )}
    </Link>
  );
}

import { useAdminLayout } from "@/components/providers/AdminLayoutProvider";
import { X } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { sidebarOpen, setSidebarOpen } = useAdminLayout();

  const allItems = NAV_GROUPS.flatMap((g) => g.items);
  const filtered = search.trim()
    ? allItems.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-[90] lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "w-60 h-screen fixed left-0 top-0 bg-white border-r border-[#ECEFF5] flex flex-col z-[100] transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#ECEFF5] flex-shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-7 h-7 rounded-lg bg-[#004AAD] flex items-center justify-center flex-shrink-0">
              <Eye size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <p className="font-serif italic font-bold text-[15px] text-[#111111] tracking-tight">
                LENZIFY
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#AAAAAA] mt-0.5">
                Admin
              </p>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-[#888888] hover:bg-[#F4F6F8] hover:text-[#111111] lg:hidden"
            suppressHydrationWarning
          >
            <X size={18} />
          </button>
        </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-[#ECEFF5] flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#F4F6F8] rounded-lg px-3 py-2">
          <Search size={13} className="text-[#BBBBBB] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search nav..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-[#111111] placeholder:text-[#CCCCCC] focus:outline-none w-full"
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {filtered ? (
          <div className="space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-[#AAAAAA] px-3 py-6 text-center">
                No results
              </p>
            ) : (
              filtered.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onClick={() => setSidebarOpen(false)} />
              ))
            )}
          </div>
        ) : (
          NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#CCCCCC] px-3 mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.href} item={item} pathname={pathname} onClick={() => setSidebarOpen(false)} />
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#ECEFF5] p-2 flex-shrink-0 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F4F6F8] transition-colors cursor-default">
          <div className="w-7 h-7 rounded-full bg-[#004AAD] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">
              {(user?.user_metadata?.name || user?.email || "A")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#111111] truncate">
              {user?.user_metadata?.name || "Admin"}
            </p>
            <p className="text-[10px] text-[#AAAAAA] truncate leading-tight">
              {user?.email || ""}
            </p>
          </div>
        </div>

        <form action={logout}>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#EF4444] hover:bg-red-50 transition-colors text-xs font-medium"
            suppressHydrationWarning
          >
            <LogOut size={13} />
            Log out
          </button>
        </form>
      </div>
    </aside>
    </>
  );
}
