"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  returnUrl?: string;
}

export default function LoginPromptModal({
  isOpen,
  onClose,
  title = "Sign in to continue",
  message = "Create a free account or log in to save items and complete your purchase.",
  returnUrl,
}: LoginPromptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
  const redirectTarget = returnUrl || currentPath;
  const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectTarget)}&returnUrl=${encodeURIComponent(redirectTarget)}`;
  const signupHref = `/auth/signup?redirect=${encodeURIComponent(redirectTarget)}&returnUrl=${encodeURIComponent(redirectTarget)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#03173D]/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#ECECEC] z-10 text-center"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F8F9FC] hover:bg-[#E8EAF2] text-[#666666] hover:text-[#111111] flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#004AAD]/10 text-[#004AAD] flex items-center justify-center">
              <Lock size={26} className="text-[#004AAD]" />
            </div>

            {/* Content */}
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-[#666666] mt-2.5 leading-relaxed">
              {message}
            </p>

            {/* Actions */}
            <div className="mt-7 flex flex-col gap-3">
              <Link
                href={loginHref}
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-full bg-[#03173D] text-white font-semibold text-sm hover:bg-[#004AAD] transition-colors shadow-md flex items-center justify-center"
              >
                Log In
              </Link>
              <Link
                href={signupHref}
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-full border border-[#03173D] text-[#03173D] font-semibold text-sm hover:bg-[#03173D] hover:text-white transition-colors flex items-center justify-center"
              >
                Sign Up
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
