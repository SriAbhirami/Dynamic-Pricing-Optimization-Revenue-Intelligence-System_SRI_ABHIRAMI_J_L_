import { useEffect, useState } from "react";
import RecentProducts from "../components/tables/RecentProducts";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import StatCard from "../components/cards/StatCard";
import RevenueChart from "../components/charts/RevenueChart";
import AIAssistant from "../components/insights/AIAssistant";

import { getDashboardStats } from "../api/dashboard";

import {
  DollarSign,
  Package,
  TrendingUp,
  Brain,
} from "lucide-react";

function Dashboard() {
  const [stats, setStats] = useState({
    total_products: 0,
    total_users: 0,
    total_stock: 0,
    average_price: 0,
    forecast_accuracy: "0%",
    ai_recommendations: 0,
  });

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

  return (
    <div
      className="
        flex
        min-h-screen
        bg-gradient-to-br
        from-slate-100
        via-blue-50
        to-cyan-50
      "
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        <Navbar />

        <div className="p-6">
          <main
            className="
              bg-white/70
              backdrop-blur-md
              rounded-3xl
              border
              border-slate-200
              shadow-xl
              p-8
              min-h-[calc(100vh-120px)]
            "
          >
            {/* Dashboard Title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">
                Business Overview
              </h2>

              <p className="text-slate-500 mt-1">
                Monitor your pricing intelligence and AI insights in real time.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

              <StatCard
                title="Average Price"
                value={`₹${Number(stats.average_price).toLocaleString("en-IN")}`}
                change="Live from database"
                icon={DollarSign}
                iconColor="text-green-600"
              />

              <StatCard
                title="Products"
                value={stats.total_products}
                change={`${stats.total_stock} items in stock`}
                icon={Package}
                iconColor="text-blue-600"
              />

              <StatCard
                title="Forecast Accuracy"
                value={stats.forecast_accuracy}
                change="Excellent"
                icon={TrendingUp}
                iconColor="text-purple-600"
              />

              <StatCard
                title="AI Recommendations"
                value={stats.ai_recommendations}
                change="Ready to review"
                icon={Brain}
                iconColor="text-cyan-600"
              />

            </div>

            {/* Charts + AI Assistant */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-10">

              <div className="xl:col-span-2">
                <RevenueChart />
              </div>

              <AIAssistant />

            </div>
            <RecentProducts />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;