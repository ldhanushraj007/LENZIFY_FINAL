import { createAdminClient } from "@/lib/supabase/server";
import CouponManager from "./CouponManager";
import { seedStandardOffers } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  // Ensure CL200 and category-isolated standard offers exist
  await seedStandardOffers();

  const supabase = await createAdminClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("id", { ascending: false });

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-brand-navy/10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary italic mb-2">
            Commerce Promotions
          </p>
          <h1 className="text-4xl font-serif italic text-brand-navy tracking-tight uppercase">
            Coupons <span className="text-secondary">&amp; Discounts</span>
          </h1>
          <p className="text-xs text-brand-navy/60 mt-2">
            Create and manage category-specific discount codes, validity limits, and visibility on the customer offers page.
          </p>
        </div>
      </header>

      <CouponManager initialCoupons={coupons || []} />
    </div>
  );
}
