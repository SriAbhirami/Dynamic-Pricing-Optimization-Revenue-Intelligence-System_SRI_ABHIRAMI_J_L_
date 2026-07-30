import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import RecentProducts from "../components/tables/RecentProducts";

import { getDashboardStats } from "../api/dashboard";

import {
  Activity,
  Brain,
  Package,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Database,
} from "lucide-react";

function Dashboard() {
  const [stats, setStats] = useState({
    total_products: 0,
    total_users: 0,
    total_stock: 0,
    total_revenue: 0,
    total_units_sold: 0,
    average_demand_index: 0,
    average_current_price: 0,
    average_discount_pct: 0,
    stockout_count: 0,
    forecast_accuracy: "0%",
    ai_recommendations: 0,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  const demandValue = Number(stats.average_demand_index) || 0;
  const priceValue = Number(stats.average_current_price) || 0;
  const stockValue = Number(stats.total_stock) || 0;
  const unitsSold = Number(stats.total_units_sold) || 0;
  const discountValue = Number(stats.average_discount_pct) || 0;
  const productsValue = Number(stats.total_products) || 0;
  const stockoutValue = Number(stats.stockout_count) || 0;

  const demandLevel =
    demandValue >= 200
      ? "HIGH"
      : demandValue >= 100
      ? "MODERATE"
      : "LOW";

  const stockLevel =
    stockValue <= 50
      ? "CRITICAL"
      : stockValue <= 200
      ? "WATCH"
      : "HEALTHY";

  return (
    <div className="min-h-screen bg-[#030604] text-white">

      <Sidebar />

      <div className="ml-72 min-h-screen">

        <Navbar />

        <main className="px-6 py-6 lg:px-8">

          {/* =====================================================
              HEADER
          ====================================================== */}

          <section className="relative mb-6 overflow-hidden rounded-[28px] border border-lime-400/10 bg-[#071009] px-7 py-7">

            <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-lime-400/10 blur-[110px]" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-400/5 blur-[100px]" />

            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

              <div>

                <div className="mb-3 flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.9)]" />

                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">
                    Pricing Intelligence System
                  </span>

                </div>

                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">

                  PricePilot
                  <span className="text-lime-300"> AI</span>

                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">

                  A visual command center for understanding how
                  price, demand and inventory interact across your
                  product ecosystem.

                </p>

              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 px-5 py-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                  <Activity className="h-5 w-5 text-lime-300" />

                </div>

                <div>

                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                    System State
                  </p>

                  <p className="mt-1 flex items-center gap-2 font-semibold text-lime-300">

                    LIVE

                    <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />

                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* =====================================================
              MARKET PULSE
          ====================================================== */}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

            {/* Main Pulse Visualization */}

            <div className="relative min-h-[470px] overflow-hidden rounded-[28px] border border-lime-400/10 bg-[#071009] p-7 xl:col-span-2">

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-400/5 blur-[100px]" />

              <div className="relative z-10">

                <div className="flex items-start justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <Sparkles className="h-5 w-5 text-lime-300" />

                      <h2 className="text-xl font-semibold">
                        Market Pulse
                      </h2>

                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      Current relationship between your core business signals.
                    </p>

                  </div>

                  <span className="rounded-full border border-lime-400/20 bg-lime-400/5 px-3 py-1 text-[10px] font-semibold tracking-widest text-lime-300">
                    LIVE DATA
                  </span>

                </div>

                {/* Visualization */}

                <div className="relative mt-12 flex min-h-[310px] items-center justify-center">

                  {/* Connecting Lines */}

                  <div className="absolute h-px w-[65%] rotate-0 bg-gradient-to-r from-transparent via-lime-400/30 to-transparent" />

                  <div className="absolute h-px w-[65%] rotate-45 bg-gradient-to-r from-transparent via-lime-400/20 to-transparent" />

                  <div className="absolute h-px w-[65%] -rotate-45 bg-gradient-to-r from-transparent via-lime-400/20 to-transparent" />

                  {/* Central Core */}

                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-lime-300/30 bg-[#09140c] shadow-[0_0_70px_rgba(163,230,53,0.08)]">

                    <div className="absolute inset-3 rounded-full border border-lime-400/10" />

                    <div className="absolute inset-8 rounded-full border border-lime-400/20" />

                    <div className="absolute inset-14 rounded-full bg-lime-300/10 shadow-[0_0_45px_rgba(163,230,53,0.18)]" />

                    <div className="relative z-10 text-center">

                      <Zap className="mx-auto h-6 w-6 text-lime-300" />

                      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-gray-600">
                        Demand Core
                      </p>

                      <p className="mt-1 text-2xl font-bold text-lime-300">
                        {demandValue.toFixed(1)}
                      </p>

                    </div>

                  </div>

                  {/* Price Node */}

                  <div className="absolute left-[3%] top-[12%] rounded-2xl border border-lime-400/10 bg-[#0b150e] px-5 py-4 shadow-xl">

                    <div className="flex items-center gap-2">

                      <TrendingUp className="h-4 w-4 text-lime-300" />

                      <span className="text-[10px] uppercase tracking-widest text-gray-600">
                        Price
                      </span>

                    </div>

                    <p className="mt-2 text-xl font-bold">
                      ₹{priceValue.toFixed(0)}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      Average current price
                    </p>

                  </div>

                  {/* Inventory Node */}

                  <div className="absolute right-[3%] top-[12%] rounded-2xl border border-lime-400/10 bg-[#0b150e] px-5 py-4 shadow-xl">

                    <div className="flex items-center gap-2">

                      <Package className="h-4 w-4 text-lime-300" />

                      <span className="text-[10px] uppercase tracking-widest text-gray-600">
                        Inventory
                      </span>

                    </div>

                    <p className="mt-2 text-xl font-bold">
                      {stockValue.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      Units available
                    </p>

                  </div>

                  {/* Sales Node */}

                  <div className="absolute bottom-[4%] left-[8%] rounded-2xl border border-lime-400/10 bg-[#0b150e] px-5 py-4 shadow-xl">

                    <div className="flex items-center gap-2">

                      <ShoppingCart className="h-4 w-4 text-lime-300" />

                      <span className="text-[10px] uppercase tracking-widest text-gray-600">
                        Sales
                      </span>

                    </div>

                    <p className="mt-2 text-xl font-bold">
                      {unitsSold.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      Units sold
                    </p>

                  </div>

                  {/* Discount Node */}

                  <div className="absolute bottom-[4%] right-[8%] rounded-2xl border border-lime-400/10 bg-[#0b150e] px-5 py-4 shadow-xl">

                    <div className="flex items-center gap-2">

                      <ArrowDownRight className="h-4 w-4 text-lime-300" />

                      <span className="text-[10px] uppercase tracking-widest text-gray-600">
                        Discount
                      </span>

                    </div>

                    <p className="mt-2 text-xl font-bold">
                      {discountValue.toFixed(1)}%
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      Average discount
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                LIVE SIGNAL PANEL
            ================================================== */}

            <div className="relative overflow-hidden rounded-[28px] border border-lime-400/10 bg-[#071009] p-7">

              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime-400/10 blur-[80px]" />

              <div className="relative z-10">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10">

                    <Brain className="h-5 w-5 text-lime-300" />

                  </div>

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                      Intelligence Layer
                    </p>

                    <h2 className="font-semibold">
                      Signal Monitor
                    </h2>

                  </div>

                </div>

                {/* Demand */}

                <div className="mt-8 border-b border-white/5 pb-6">

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-gray-500">
                      Demand pressure
                    </span>

                    <span className="text-xs font-semibold text-lime-300">
                      {demandLevel}
                    </span>

                  </div>

                  <div className="mt-4 flex items-end justify-between">

                    <p className="text-4xl font-bold">
                      {demandValue.toFixed(1)}
                    </p>

                    <Activity className="mb-1 h-5 w-5 text-lime-300" />

                  </div>

                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">

                    <div
                      className="h-full rounded-full bg-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.8)]"
                      style={{
                        width: `${Math.min(
                          (demandValue / 365) * 100,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                {/* Inventory */}

                <div className="border-b border-white/5 py-6">

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-gray-500">
                      Inventory health
                    </span>

                    <span
                      className={`text-xs font-semibold ${
                        stockLevel === "CRITICAL"
                          ? "text-red-300"
                          : stockLevel === "WATCH"
                          ? "text-yellow-300"
                          : "text-lime-300"
                      }`}
                    >
                      {stockLevel}
                    </span>

                  </div>

                  <p className="mt-3 text-3xl font-bold">
                    {stockValue.toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Across {productsValue} monitored products
                  </p>

                </div>

                {/* Stockouts */}

                <div className="py-6">

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-gray-500">
                      Stockout events
                    </span>

                    <AlertTriangle
                      className={`h-4 w-4 ${
                        stockoutValue > 0
                          ? "text-red-300"
                          : "text-lime-300"
                      }`}
                    />

                  </div>

                  <p className="mt-3 text-3xl font-bold">
                    {stockoutValue.toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Detected inventory pressure events
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* =====================================================
              SIGNAL STRIP
          ====================================================== */}

          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

            <div className="group rounded-2xl border border-white/5 bg-[#071009] p-5 transition hover:border-lime-400/20">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <Database className="h-4 w-4 text-lime-300" />

                  <span className="text-xs uppercase tracking-widest text-gray-600">
                    Product Universe
                  </span>

                </div>

                <ArrowUpRight className="h-4 w-4 text-gray-700 transition group-hover:text-lime-300" />

              </div>

              <p className="mt-4 text-3xl font-bold">
                {productsValue}
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Products connected to intelligence layer
              </p>

            </div>

            <div className="group rounded-2xl border border-white/5 bg-[#071009] p-5 transition hover:border-lime-400/20">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <ShoppingCart className="h-4 w-4 text-lime-300" />

                  <span className="text-xs uppercase tracking-widest text-gray-600">
                    Sales Volume
                  </span>

                </div>

                <ArrowUpRight className="h-4 w-4 text-gray-700 transition group-hover:text-lime-300" />

              </div>

              <p className="mt-4 text-3xl font-bold">
                {unitsSold.toLocaleString("en-IN")}
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Total recorded units sold
              </p>

            </div>

            <div className="group rounded-2xl border border-white/5 bg-[#071009] p-5 transition hover:border-lime-400/20">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <TrendingUp className="h-4 w-4 text-lime-300" />

                  <span className="text-xs uppercase tracking-widest text-gray-600">
                    Pricing Pressure
                  </span>

                </div>

                <ArrowUpRight className="h-4 w-4 text-gray-700 transition group-hover:text-lime-300" />

              </div>

              <p className="mt-4 text-3xl font-bold">
                {discountValue.toFixed(1)}%
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Average discount currently observed
              </p>

            </div>

          </section>

          {/* =====================================================
              PRODUCT SIGNAL MATRIX
          ====================================================== */}

          <section className="mt-8">

            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">

              <div>

                <div className="flex items-center gap-2">

                  <Activity className="h-5 w-5 text-lime-300" />

                  <h2 className="text-xl font-semibold">
                    Product Signal Matrix
                  </h2>

                </div>

                <p className="mt-2 text-sm text-gray-600">
                  Live products currently connected to your pricing intelligence system.
                </p>

              </div>

              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-600">

                <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.7)]" />

                Database Connected

              </div>

            </div>

            <div className="overflow-hidden rounded-[28px] border border-lime-400/10 bg-[#071009]">

              <RecentProducts key={refreshKey} />

            </div>

          </section>

          {/* =====================================================
              FOOTER STATUS
          ====================================================== */}

          <div className="mt-6 flex flex-col justify-between gap-3 border-t border-white/5 pt-5 text-[10px] uppercase tracking-widest text-gray-700 md:flex-row">

            <span>
              PricePilot AI · Revenue Intelligence
            </span>

            <span className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />

              Backend Data Stream Active

            </span>

          </div>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;