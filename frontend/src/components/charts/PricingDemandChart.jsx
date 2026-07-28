import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { getPricingDemandTrends } from "../../api/dashboard";

function PricingDemandChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const response = await getPricingDemandTrends();
        setData(response);
      } catch (error) {
        console.error("Error loading pricing demand trends:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrends();
  }, []);

  const filteredData = data.slice(-range);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Revenue & Demand Trend
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Monitor revenue, units sold, and demand index over time.
          </p>
        </div>

        {/* Time Range Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setRange(7)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              range === 7
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            7 Days
          </button>

          <button
            onClick={() => setRange(30)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              range === 30
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            30 Days
          </button>

          <button
            onClick={() => setRange(90)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              range === 90
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[350px] flex items-center justify-center text-slate-500">
          Loading pricing and demand data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={filteredData}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                const parts = date.split("-");
                return `${parts[1]}/${parts[2]}`;
              }}
              interval={range === 7 ? 0 : "preserveStartEnd"}
            />

            <YAxis
              yAxisId="revenue"
              tickFormatter={(value) =>
                `₹${(value / 1000000).toFixed(1)}M`
              }
            />

            <YAxis
              yAxisId="index"
              orientation="right"
              tickFormatter={(value) => value.toFixed(0)}
            />

            <Tooltip
              labelFormatter={(date) => `Date: ${date}`}
              formatter={(value, name) => {
                if (name === "Revenue") {
                  return [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "Revenue",
                  ];
                }

                if (name === "Units Sold") {
                  return [
                    Number(value).toLocaleString("en-IN"),
                    "Units Sold",
                  ];
                }

                return [
                  Number(value).toFixed(2),
                  "Demand Index",
                ];
              }}
            />

            <Legend />

            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#2563eb"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />

            <Line
              yAxisId="index"
              type="monotone"
              dataKey="demand_index"
              name="Demand Index"
              stroke="#9333ea"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />

            <Line
              yAxisId="index"
              type="monotone"
              dataKey="units_sold"
              name="Units Sold"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default PricingDemandChart;