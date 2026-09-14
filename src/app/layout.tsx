import type { Metadata } from "next";
import { Inter, Noto_Serif, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SmoothScroll from "@/components/lenis/SmoothScroll";
import { cn } from "@/lib/utils";
import ConditionalWrapper from "@/components/layout/ConditionalWrapper";
import DynamicThemeProvider from "@/components/layout/DynamicThemeProvider";

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-body',
  weight: ['300', '400', '500', '600']
});

const interLabel = Inter({ 
  subsets: ['latin'], 
  variable: '--font-label',
  weight: ['300', '400', '500', '600']
});

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '700'],
  style: ['normal', 'italic']
});

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-hero',
  weight: ['400', '700', '900'],
  style: ['italic'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lenzify.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LENZIFY | Premium Eyewear Store — Spectacles, Sunglasses, Contact Lenses",
    template: "%s | LENZIFY",
  },
  description: "Shop premium eyeglasses, sunglasses, contact lenses & accessories online. Free shipping and lens replacement services. India's visionary eyewear destination.",
  keywords: ["eyeglasses", "sunglasses", "contact lenses", "eyewear online", "spectacles", "optical store", "buy glasses online India", "prescription glasses", "reading glasses", "computer glasses", "lenzify"],
  authors: [{ name: "Lenzify" }],
  creator: "Lenzify",
  publisher: "Lenzify",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'LENZIFY',
    title: 'LENZIFY — Premium Eyewear Store',
    description: 'Shop premium eyeglasses, sunglasses & contact lenses online. Free shipping & lens replacement.',
    images: [
      {
        url: `${siteUrl}/images/og-banner.png`,
        width: 1200,
        height: 630,
        alt: 'LENZIFY — The Visionary Editorial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LENZIFY — Premium Eyewear Store',
    description: 'Shop premium eyeglasses, sunglasses & contact lenses online.',
    images: [`${siteUrl}/images/og-banner.png`],
  },
  alternates: {
    canonical: siteUrl,
  },
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import GoogleAnalytics from "@/components/seo/GoogleAnalytics";
import CookieConsent from "@/components/layout/CookieConsent";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { createClient } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    // If Supabase auth network drops or transient socket fails, gracefully fallback to guest session
    user = null;
  }

  return (
    <html lang="en" className={cn(inter.variable, interLabel.variable, notoSerif.variable, bodoniModa.variable)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <OrganizationJsonLd />
        <GoogleAnalytics />
      </head>
      <body className="bg-surface text-on-surface font-serif italic tracking-tighter selection:bg-secondary-fixed selection:text-on-secondary-fixed antialiased">
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1c1b1b',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }
        }} />
        <AuthProvider initialUser={user}>
          <ConditionalWrapper>
            <DynamicThemeProvider>
               {children}
            </DynamicThemeProvider>
          </ConditionalWrapper>
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
