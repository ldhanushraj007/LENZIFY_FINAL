import { createClient } from "@/lib/supabase/server";
import {
  User,
  Shield,
  Key,
  History,
  Mail,
  UserCircle,
  Package,
  Heart,
  FileText,
  MapPin,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { cn, getIndianGreeting } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = await createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (err) {
    console.error("Profile Auth Error:", err);
  }

  if (!user) {
    return (
      <div className="bg-[#F8F9FC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666666] mb-4">Please log in to view your profile.</p>
          <Link href="/auth/login" className="bg-[#03173D] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#004AAD] transition-all">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const metadata = user.user_metadata || {};
  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const greeting = getIndianGreeting();
  const firstName = metadata.name ? metadata.name.split(" ")[0] : "there";

  const navItems = [
    { href: "/profile", label: "Profile", icon: User, active: true },
    { href: "/orders", label: "Orders", icon: Package },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    { href: "/addresses", label: "Addresses", icon: MapPin },
    { href: "/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="bg-[#F8F9FC] min-h-screen pt-20 md:pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Page header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1">
              {greeting}, {firstName}!
            </p>
            <h1 className="text-4xl font-[var(--font-hero)] italic text-[#111111]">My Profile</h1>
            <p className="text-sm text-[#666666] mt-1">Manage your account details, security, and preferences.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#ECECEC] text-xs font-medium text-[#666666] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            IST (India)
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Nav */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-3xl border border-[#ECECEC] p-6 sticky top-24">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-[#ECECEC]">
                <div className="w-20 h-20 rounded-full border-2 border-[#ECECEC] bg-[#F8F9FC] flex items-center justify-center overflow-hidden mb-3">
                  {metadata.avatar_url ? (
                    <img src={metadata.avatar_url} alt={metadata.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={48} className="text-[#ECECEC]" />
                  )}
                </div>
                <span className="inline-block text-[11px] font-semibold text-[#004AAD] bg-[#004AAD]/5 px-2.5 py-0.5 rounded-full mb-1.5">
                  {greeting}!
                </span>
                <p className="font-semibold text-[#111111]">{metadata.name || "Your Account"}</p>
                <p className="text-xs text-[#666666] mt-0.5 truncate max-w-[180px]">{user.email}</p>
                <p className="text-xs text-[#666666] mt-1">Member since {joinDate}</p>
              </div>

              {/* Nav items */}
              <nav className="space-y-1">
                {navItems.map(({ href, label, icon: Icon, active }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-[#F0F4FF] text-[#03173D] font-semibold"
                        : "text-[#666666] hover:bg-[#F8F9FC] hover:text-[#111111]"
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Info Card */}
            <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-6">Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-2">Display Name</label>
                  <div className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111]">
                    {metadata.name || <span className="text-[#666666]">Not set</span>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-2">Email Address</label>
                  <div className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] flex items-center gap-2">
                    <Mail size={14} className="text-[#666666] flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                    <div className="ml-auto flex items-center gap-1 text-emerald-600 text-xs font-semibold flex-shrink-0">
                      <Shield size={12} />
                      Verified
                    </div>
                  </div>
                </div>

                {/* User ID */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-2">Account ID</label>
                  <div className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#666666] text-xs font-mono truncate">
                    {user.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-6">Security</h2>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#F8F9FC] border border-[#ECECEC] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Key size={18} className="text-[#004AAD]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111111]">Password</p>
                    <p className="text-[#666666] text-sm mt-0.5">
                      Update your password to keep your account secure.
                    </p>
                  </div>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="border border-[#03173D] text-[#03173D] rounded-full px-6 py-3 font-semibold hover:bg-[#03173D] hover:text-white transition-all text-sm whitespace-nowrap"
                >
                  Change Password
                </Link>
              </div>
            </div>

            {/* Activity Card */}
            <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-6">Account Activity</h2>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F8F9FC] border border-[#ECECEC] rounded-xl flex items-center justify-center">
                  <History size={18} className="text-[#004AAD]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#111111] text-sm">Last Sign In</p>
                  <p className="text-[#666666] text-xs mt-0.5">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
