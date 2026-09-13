import { Suspense } from "react";
import ProductGrid from "@/components/shop/ProductGrid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Lenses | LENZIFY",
  description: "Premium prescription lenses, anti-glare, blue cut, photochromic and more.",
};

export default function LensesPage() {
  return (
    <div className="bg-white min-h-screen">
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#004AAD] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ProductGrid />
      </Suspense>
    </div>
  );
}
