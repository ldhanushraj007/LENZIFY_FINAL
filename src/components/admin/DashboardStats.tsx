"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  Package,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface StatsProps {
  initialStats: {
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    lowStockCount: number;
    abandonedCarts: number;
    replacementsCount?: number;
    todayRevenue?: number;
    todayOrders?: number;
    pendingOrders?: number;
    codOrders?: number;
    onlineOrders?: number;
    revenueTrend?: string;
    ordersTrend?: string;
    customersTrend?: string;
  };
}

export default function DashboardStats({ initialStats }: StatsProps) {
  const [stats, setStats] = useState(initialStats);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("dashboard_realtime_v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchStats)
      .subscribe();

    async function fetchStats() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        { data: salesData },
        { count: totalOrders },
        { count: totalCustomers },
        { count: lowStockCount },
        { data: todayOrders },
        { count: pendingOrders },
        { count: codOrders },
        { count: replacementsCount },
      ] = await Promise.all([
        supabase.from("orders").select("total_price").eq("payment_status", "paid"),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("products").select("*", { count: "exact", head: true }).lte("stock", 5).gt("stock", 0),
        supabase.from("orders").select("total_price, payment_method").gte("created_at", todayISO),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("payment_method", "cod"),
        supabase.from("lens_replacement_orders").select("*", { count: "exact", head: true }),
      ]);

      const todayRevenue = (todayOrders || []).reduce((acc: number, o: any) => acc + Number(o.total_price || 0), 0);
      const todayOrdersCount = (todayOrders || []).length;

      setStats({
        totalSales: salesData?.reduce((acc: number, o: any) => acc + Number(o.total_price || 0), 0) || 0,
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        lowStockCount: lowStockCount || 0,
        abandonedCarts: stats.abandonedCarts,
        replacementsCount: replacementsCount || 0,
        todayRevenue,
        todayOrders: todayOrdersCount,
        pendingOrders: pendingOrders || 0,
        codOrders: codOrders || 0,
      });
    }

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const cards = [
    {
      label: "Total Revenue",
      value: `₹${(stats.totalSales || 0).toLocaleString("en-IN")}`,
      subtext: stats.todayRevenue ? `₹${stats.todayRevenue.toLocaleString("en-IN")} today` : "All valid orders",
      icon: TrendingUp,
      trend: stats.revenueTrend || "+0%",
      positive: !stats.revenueTrend?.startsWith("-"),
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Orders",
      value: (stats.totalOrders || 0).toString(),
      subtext: stats.todayOrders ? `${stats.todayOrders} orders today` : "Lifetime orders",
      icon: ShoppingCart,
      trend: stats.ordersTrend || "Active",
      positive: true,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Customers",
      value: (stats.totalCustomers || 0).toString(),
      subtext: "Registered accounts",
      icon: Users,
      trend: stats.customersTrend || "Verified",
      positive: true,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Pending Orders",
      value: (stats.pendingOrders || 0).toString(),
      subtext: "Awaiting fulfillment",
      icon: Package,
      trend: (stats.pendingOrders || 0) > 0 ? "Action needed" : "All clear",
      positive: !stats.pendingOrders || stats.pendingOrders === 0,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "COD Orders",
      value: (stats.codOrders || 0).toString(),
      subtext: "Cash on delivery",
      icon: CreditCard,
      trend: (stats.codOrders || 0) > 0 ? `${stats.codOrders} active` : "0 orders",
      positive: true,
      color: "bg-sky-50 text-sky-600",
    },
    {
      label: "Low Stock",
      value: (stats.lowStockCount || 0).toString(),
      subtext: "Products ≤ 5 units",
      icon: AlertTriangle,
      trend: stats.lowStockCount > 0 ? "Restock needed" : "Healthy",
      positive: stats.lowStockCount === 0,
      color: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-[#ECEFF5] p-5 hover:shadow-sm transition-shadow"
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-4", card.color)}>
              <Icon size={17} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold text-[#111111] leading-none mb-1">
              {card.value}
            </p>
            <p className="text-xs text-[#888888] mb-3 leading-tight">{card.label}</p>
            <div className="flex items-center gap-1">
              {card.positive ? (
                <ArrowUpRight size={12} className="text-emerald-500" />
              ) : (
                <ArrowDownRight size={12} className="text-red-400" />
              )}
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  card.positive ? "text-emerald-600" : "text-red-500"
                )}
              >
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
