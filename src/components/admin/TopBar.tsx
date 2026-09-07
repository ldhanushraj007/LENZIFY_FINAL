"use client";

import { Search, Bell, Settings, Command, Plus, ChevronDown, Menu, LogOut } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminLayout } from "@/components/providers/AdminLayoutProvider";
import { logout } from "@/app/auth/actions";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleSidebar } = useAdminLayout();

  useEffect(() => {
    const supabase = createClient();

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("user_id", null)
        .eq("read", false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel("admin_notifs_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/admin/products?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <header className="h-14 bg-white border-b border-[#ECEFF5] flex items-center gap-4 px-6 sticky top-0 z-40 flex-shrink-0">
      {/* Mobile Menu Toggle */}
      <button
        onClick={toggleSidebar}
        className="p-1 rounded-lg text-[#888888] hover:bg-[#F4F6F8] hover:text-[#111111] lg:hidden mr-1 flex-shrink-0"
        suppressHydrationWarning
      >
        <Menu size={20} />
      </button>
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div
          className={cn(
            "flex items-center gap-2.5 bg-[#F4F6F8] border rounded-lg px-3 py-2 transition-all duration-200",
            focused
              ? "border-[#004AAD] ring-2 ring-[#004AAD]/10 bg-white"
              : "border-[#ECEFF5]"
          )}
        >
          <Search size={14} className="text-[#BBBBBB] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, customers..."
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="bg-transparent text-sm text-[#111111] placeholder:text-[#CCCCCC] focus:outline-none w-full"
            suppressHydrationWarning
          />
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-50">
            <Command size={10} className="text-[#999999]" />
            <span className="text-[10px] text-[#999999] font-semibold">K</span>
          </div>
        </div>
      </form>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1.5 bg-[#004AAD] text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-[#003d99] transition-colors mr-2"
        >
          <Plus size={13} strokeWidth={2.5} />
          Add Product
        </Link>

        <Link
          href="/admin/notifications"
          className="relative p-2 rounded-lg text-[#888888] hover:bg-[#F4F6F8] hover:text-[#111111] transition-colors"
          title="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 flex items-center justify-center rounded-full bg-red-500 border-2 border-white text-[7px] font-bold text-white px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount > 1 ? unreadCount : ""}
            </span>
          )}
        </Link>

        <Link
          href="/admin/settings"
          className="p-2 rounded-lg text-[#888888] hover:bg-[#F4F6F8] hover:text-[#111111] transition-colors"
          title="Settings"
        >
          <Settings size={17} />
        </Link>

        {/* Profile Dropdown */}
        <div className="relative pl-3 ml-1 border-l border-[#ECEFF5]">
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div className="w-7 h-7 rounded-full bg-[#004AAD] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">
                {(user?.user_metadata?.name || user?.email || "A")[0].toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-[#111111] group-hover:text-[#004AAD] transition-colors hidden md:block">
              {user?.user_metadata?.name || "Admin"}
            </span>
            <ChevronDown size={13} className={cn("text-[#AAAAAA] transition-transform hidden md:block", menuOpen && "rotate-180")} />
          </div>

          {menuOpen && (
            <>
              {/* Invisible backdrop to close the menu on click outside */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              
              <div className="absolute right-0 mt-2.5 w-60 bg-white border border-[#ECEFF5] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-[#ECEFF5]">
                  <p className="text-xs font-semibold text-[#111111] truncate">
                    {user?.user_metadata?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-[#AAAAAA] truncate mt-0.5">
                    {user?.email || ""}
                  </p>
                </div>
                
                <div className="p-1.5">
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[#EF4444] hover:bg-red-50 transition-colors text-xs font-medium text-left"
                    >
                      <LogOut size={13} />
                      Log out
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
