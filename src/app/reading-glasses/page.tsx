import ProductGrid from "@/components/shop/ProductGrid";
import { Suspense } from "react";

export const metadata = {
  title: "Reading Glasses | LENZIFY",
  description: "High-clarity reading glasses crafted for precision, comfort, and effortless focus across all magnification powers.",
};

export default function ReadingGlassesPage() {
  return (
    <div className="bg-white min-h-screen">
      <Suspense
        fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#004AAD] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ProductGrid initialCategory="reading-glasses" />
      </Suspense>
    </div>
  );
}
