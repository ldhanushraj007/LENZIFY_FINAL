"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface ChartItem {
  date: string;
  revenue: number;
  orders: number;
}

interface ChartsProps {
  data?: ChartItem[];
  data7Days?: ChartItem[];
  data30Days?: ChartItem[];
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#ffffff",
    border: "1px solid #ECEFF5",
    borderRadius: "10px",
    fontSize: "12px",
    color: "#111111",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  itemStyle: { color: "#333333" },
  labelStyle: { color: "#888888", fontWeight: 600, fontSize: 11 },
};

const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 10, fill: "#AAAAAA" },
};

export default function DashboardCharts({ data, data7Days, data30Days }: ChartsProps) {
  const [range, setRange] = useState<"7d" | "30d">("7d");

  const activeData = range === "30d" 
    ? (data30Days || data || []) 
    : (data7Days || data || []);

  const totalRevenue = activeData.reduce((acc, d) => acc + d.revenue, 0);
  const totalOrders = activeData.reduce((acc, d) => acc + d.orders, 0);

  return (
    <div className="space-y-4">
      {/* Range Filter Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#AAAAAA]">
          Performance Telemetry
        </h2>
        <div className="flex items-center gap-1 bg-[#F4F6F8] p-1 rounded-xl border border-[#ECEFF5]">
          <button
            onClick={() => setRange("7d")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              range === "7d"
                ? "bg-white text-[#004AAD] shadow-xs"
                : "text-[#888888] hover:text-[#111111]"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setRange("30d")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              range === "30d"
                ? "bg-white text-[#004AAD] shadow-xs"
                : "text-[#888888] hover:text-[#111111]"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white border border-[#ECEFF5] rounded-2xl p-6">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs text-[#AAAAAA] font-medium mb-1">
                Revenue — {range === "7d" ? "last 7 days" : "last 30 days"}
              </p>
              <p className="text-2xl font-bold text-[#111111]">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-[#004AAD] bg-[#004AAD]/10 px-2.5 py-1 rounded-full">
              Real-time DB Sync
            </span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004AAD" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#004AAD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="date" {...axisProps} interval={range === "30d" ? 4 : 0} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipStyle} formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#004AAD"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#004AAD" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white border border-[#ECEFF5] rounded-2xl p-6">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs text-[#AAAAAA] font-medium mb-1">
                Orders — {range === "7d" ? "last 7 days" : "last 30 days"}
              </p>
              <p className="text-2xl font-bold text-[#111111]">{totalOrders}</p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              {totalOrders} Verified
            </span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="date" {...axisProps} interval={range === "30d" ? 4 : 0} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(val: any) => [`${val} orders`, 'Orders']} />
                <Bar
                  dataKey="orders"
                  name="Orders"
                  fill="#004AAD"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
