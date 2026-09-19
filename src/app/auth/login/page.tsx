"use client";

import { Suspense } from "react";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "../actions";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC] text-[#004AAD] font-semibold tracking-widest text-xs uppercase">
        Loading...
      </div>
    }>
      <LoginForm fallbackError={error} initialLoading={loading} />
    </Suspense>
  )
}

function LoginForm({ fallbackError, initialLoading }: { fallbackError: string | null, initialLoading: boolean }) {
  const [error, setError] = useState<string | null>(fallbackError);
  const [loading, setLoading] = useState(initialLoading);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("returnUrl") || searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(result.redirectTo ?? redirectTo);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12">
      {/* Left Brand Panel — hidden on mobile */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-[#03173D] via-[#004AAD] to-[#009DFF] flex-col items-center justify-center overflow-hidden p-16">
        {/* Floating white blur shapes */}
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/3 blur-3xl pointer-events-none" />

        {/* Brand content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center space-y-8 max-w-md"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00AEEF]">Est. 2024</p>
            <h1 className="text-7xl xl:text-8xl font-[var(--font-hero)] italic text-white leading-none">
              LENZIFY
            </h1>
            <p className="text-[#00AEEF] text-sm font-semibold uppercase tracking-widest mt-2">
              The Future of Vision
            </p>
          </div>

          <div className="h-px w-24 bg-white/20 mx-auto" />

          <p className="text-white/70 text-sm leading-relaxed italic max-w-xs mx-auto">
            Where precision meets elegance. Curated eyewear for those who see the world differently.
          </p>

          {/* Decorative frame silhouette */}
          <div className="mt-12 flex items-center justify-center gap-4 opacity-20">
            <div className="w-16 h-8 border-2 border-white/60 rounded-full" />
            <div className="w-2 h-1 bg-white/60" />
            <div className="w-16 h-8 border-2 border-white/60 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="lg:col-span-7 bg-white min-h-screen flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full mx-auto"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-4xl font-[var(--font-hero)] italic text-[#03173D]">LENZIFY</h1>
            <p className="text-[#004AAD] text-xs font-semibold uppercase tracking-widest mt-1">The Future of Vision</p>
          </div>

          <div className="space-y-8">
            <header className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD]">
                Welcome back
              </p>
              <h2 className="text-3xl font-[var(--font-hero)] italic text-[#111111]">
                Sign in to your account
              </h2>
              <p className="text-[#666666] text-sm leading-relaxed">
                Enter your credentials to access your account.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="redirectTo" value={redirectTo} />

              <div className="space-y-2">
                <label className="text-[#111111] text-sm font-medium block">
                  Email address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full transition-all placeholder:text-[#999999]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[#111111] text-sm font-medium block">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[#004AAD] text-xs hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="bg-[#F8F9FC] border border-[#E8EAF2] rounded-xl px-4 py-3 text-[#111111] focus:border-[#004AAD] focus:ring-2 focus:ring-[#004AAD]/10 outline-none w-full transition-all placeholder:text-[#999999]"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                disabled={loading}
                className={cn(
                  "w-full bg-[#03173D] text-white rounded-full py-4 font-semibold hover:bg-gradient-to-r hover:from-[#03173D] hover:to-[#004AAD] transition-all duration-300 active:scale-[0.98] mt-2",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

            </form>

            <footer className="text-center pt-6 border-t border-[#E8EAF2]">
              <p className="text-[#666666] text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
                  className="text-[#004AAD] hover:underline font-medium transition-colors"
                >
                  Create one
                </Link>
              </p>
            </footer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
