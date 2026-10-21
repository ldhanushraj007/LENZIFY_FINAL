import { createClient, createAdminClient } from "@/lib/supabase/server";
import CouponManager from "./CouponManager";
import { Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
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
            Create and manage promotional discount codes, validity limits, and visibility on the customer offers page.
          </p>
        </div>
      </header>

      <CouponManager initialCoupons={coupons || []} />
    </div>
  );
}
