import { useEffect, useState } from "react";

import {
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Percent,
  Package,
  AlertTriangle,
} from "lucide-react";

import InventoryAnalysisChart from "../components/charts/InventoryAnalysisChart";
import StatCard from "../components/cards/StatCard";
import PricingDemandChart from "../components/charts/PricingDemandChart";
import CategoryPerformance from "../components/tables/CategoryPerformance";
import PriceAnalysisChart from "../components/charts/PriceAnalysisChart";

import { getPricingDemandSummary } from "../api/dashboard";

import API from "../api/axios";


function PricingIntelligence() {
  const [summary, setSummary] = useState(null);

  const [pricingData, setPricingData] = useState([]);

  const [loading, setLoading] = useState(true);

  const [explorerLoading, setExplorerLoading] = useState(true);

  const [error, setError] = useState("");

  const [explorerError, setExplorerError] = useState("");


  useEffect(() => {
    const fetchData = async () => {
      try {
        const summaryData = await getPricingDemandSummary();

        setSummary(summaryData);


        const pricingResponse = await API.get(
          "/pricing-demand/?skip=0&limit=10"
        );

        setPricingData(pricingResponse.data);
      } catch (err) {
        console.error("Failed to fetch pricing intelligence data:", err);

        setError("Unable to load pricing intelligence data.");

        setExplorerError("Unable to load pricing data.");
      } finally {
        setLoading(false);

        setExplorerLoading(false);
      }
    };


    fetchData();
  }, []);


  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Pricing Intelligence
        </h1>

        <p className="mt-4 text-slate-500">
          Loading pricing analytics...
        </p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Pricing Intelligence
        </h1>

        <p className="mt-4 text-red-600 font-semibold">
          {error}
        </p>
      </div>
    );
  }


  return (
    <div className="p-8">

      {/* Page Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">
          Pricing Intelligence
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor pricing, demand, revenue, discounts, and stockout performance.
        </p>
      </div>


      {/* KPI Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <StatCard
          title="Total Revenue"
          value={`₹${(summary.total_revenue / 1000000).toFixed(2)} M`}
          change="Overall revenue generated"
          icon={IndianRupee}
          iconColor="text-green-600"
        />


        <StatCard
          title="Units Sold"
          value={summary.total_units_sold.toLocaleString("en-IN")}
          change="Total units sold"
          icon={ShoppingCart}
          iconColor="text-blue-600"
        />


        <StatCard
          title="Avg Demand Index"
          value={summary.average_demand_index.toFixed(2)}
          change="Average demand level"
          icon={TrendingUp}
          iconColor="text-purple-600"
        />


        <StatCard
          title="Avg Discount"
          value={`${summary.average_discount_pct.toFixed(2)}%`}
          change="Average discount offered"
          icon={Percent}
          iconColor="text-orange-600"
        />


        <StatCard
          title="Avg Current Price"
          value={`₹${summary.average_current_price.toFixed(2)}`}
          change="Average product price"
          icon={IndianRupee}
          iconColor="text-cyan-600"
        />


        <StatCard
          title="Products"
          value={summary.number_of_products.toLocaleString("en-IN")}
          change="Products analyzed"
          icon={Package}
          iconColor="text-indigo-600"
        />


        <StatCard
          title="Stockouts"
          value={summary.stockout_count.toLocaleString("en-IN")}
          change="Detected stockout events"
          icon={AlertTriangle}
          iconColor="text-red-600"
        />

      </div>


      {/* Pricing & Demand Trend */}

      <div className="mt-8">
        <PricingDemandChart />
      </div>


      {/* Price Analysis */}

      <div className="mt-8">
        <PriceAnalysisChart />
      </div>


      {/* Category Performance */}

      <div className="mt-8">
        <CategoryPerformance />
      </div>


      {/* Inventory Analysis */}

      <div className="mt-8">
        <InventoryAnalysisChart />
      </div>


      {/* Pricing Data Explorer */}

      <div className="mt-8 bg-white rounded-2xl shadow-md p-6">

        <div className="mb-6">

          <h2 className="text-xl font-bold text-slate-800">
            Pricing Data Explorer
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Explore recent pricing, demand, sales, revenue, and inventory records.
          </p>

        </div>


        {explorerLoading ? (

          <div className="py-12 text-center text-slate-500">
            Loading pricing data...
          </div>

        ) : explorerError ? (

          <div className="py-12 text-center text-red-600 font-semibold">
            {explorerError}
          </div>

        ) : pricingData.length === 0 ? (

          <div className="py-12 text-center text-slate-500">
            No pricing data available.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Product
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Category
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Current Price
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Discount
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Units Sold
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Revenue
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Inventory
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Demand
                  </th>

                </tr>

              </thead>


              <tbody>

                {pricingData.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-blue-50 transition"
                  >

                    <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                      {item.date}
                    </td>


                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {item.product_id}
                    </td>


                    <td className="px-4 py-4 text-slate-600">
                      {item.category}
                    </td>


                    <td className="px-4 py-4 font-semibold text-slate-700">
                      ₹{Number(item.current_price).toFixed(2)}
                    </td>


                    <td className="px-4 py-4">

                      <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">
                        {Number(item.discount_pct).toFixed(2)}%
                      </span>

                    </td>


                    <td className="px-4 py-4 text-slate-700">
                      {Number(item.units_sold).toLocaleString("en-IN")}
                    </td>


                    <td className="px-4 py-4 font-semibold text-green-700">
                      ₹{Number(item.revenue).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>


                    <td className="px-4 py-4 text-slate-700">
                      {Number(item.inventory_level).toLocaleString("en-IN")}
                    </td>


                    <td className="px-4 py-4">

                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {Number(item.demand_index).toFixed(2)}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


export default PricingIntelligence;
