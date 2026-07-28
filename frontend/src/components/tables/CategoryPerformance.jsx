import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

import API from "../../api/axios";

function CategoryPerformance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategoryPerformance = async () => {
      try {
        const response = await API.get(
          "/pricing-demand/category-performance"
        );

        setData(response.data);
      } catch (err) {
        console.error("Error loading category performance:", err);
        setError("Unable to load category performance data.");
      } finally {
        setLoading(false);
      }
    };

    loadCategoryPerformance();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
          <BarChart3 size={24} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Category Performance
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Compare revenue, sales, demand, and discounts across categories.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="h-48 flex items-center justify-center text-slate-500">
          Loading category performance...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="h-48 flex items-center justify-center text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 px-3 text-sm font-bold text-slate-600">
                  Category
                </th>

                <th className="text-right py-4 px-3 text-sm font-bold text-slate-600">
                  Revenue
                </th>

                <th className="text-right py-4 px-3 text-sm font-bold text-slate-600">
                  Units Sold
                </th>

                <th className="text-right py-4 px-3 text-sm font-bold text-slate-600">
                  Demand Index
                </th>

                <th className="text-right py-4 px-3 text-sm font-bold text-slate-600">
                  Avg Discount
                </th>
              </tr>
            </thead>

            <tbody>
              {data.map((item) => (
                <tr
                  key={item.category}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="py-4 px-3">
                    <span className="font-semibold text-slate-800">
                      {item.category}
                    </span>
                  </td>

                  <td className="py-4 px-3 text-right font-semibold text-slate-700">
                    ₹{item.revenue.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </td>

                  <td className="py-4 px-3 text-right text-slate-700">
                    {item.units_sold.toLocaleString("en-IN")}
                  </td>

                  <td className="py-4 px-3 text-right">
                    <span className="font-semibold text-purple-600">
                      {item.demand_index.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-4 px-3 text-right">
                    <span className="font-semibold text-orange-600">
                      {item.average_discount.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CategoryPerformance;