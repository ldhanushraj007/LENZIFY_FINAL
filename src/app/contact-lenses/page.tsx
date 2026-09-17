import ProductGrid from "@/components/shop/ProductGrid";
import { Suspense } from "react";

export const metadata = {
  title: "Contact Lenses | LENZIFY",
  description: "Oxygen-rich daily disposables with moisture-lock technology. Engineered for peak performance and sensitive eyes.",
};

export default function ContactLensesPage() {
  return (
    <div className="bg-white min-h-screen">
      <Suspense
        fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#004AAD] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ProductGrid initialCategory="contact-lenses" />
      </Suspense>
    </div>
  );
}
