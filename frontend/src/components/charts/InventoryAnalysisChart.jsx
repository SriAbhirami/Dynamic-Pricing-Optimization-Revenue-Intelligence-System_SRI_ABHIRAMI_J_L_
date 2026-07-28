import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getPricingDemandInventory } from "../../api/dashboard";


function InventoryAnalysisChart() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const loadInventoryAnalysis = async () => {

      try {

        const response = await getPricingDemandInventory();

        setData(response);

      } catch (error) {

        console.error("Error loading inventory analysis:", error);

      } finally {

        setLoading(false);

      }

    };


    loadInventoryAnalysis();

  }, []);


  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {

    if (!active || !payload || !payload.length) {
      return null;
    }


    const item = payload[0].payload;


    return (

      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4">

        <p className="font-bold text-slate-800 mb-3">
          {item.category}
        </p>


        <div className="space-y-2 text-sm">

          <p>
            <span className="font-semibold text-slate-600">
              Average Inventory:
            </span>{" "}
            {Number(item.average_inventory).toFixed(2)}
          </p>


          <p>
            <span className="font-semibold text-slate-600">
              Units Sold:
            </span>{" "}
            {Number(item.units_sold).toLocaleString("en-IN")}
          </p>


          <p>
            <span className="font-semibold text-slate-600">
              Stockouts:
            </span>{" "}
            {Number(item.stockout_count).toLocaleString("en-IN")}
          </p>


          <p>
            <span className="font-semibold text-slate-600">
              Demand Index:
            </span>{" "}
            {Number(item.demand_index).toFixed(2)}
          </p>

        </div>

      </div>

    );

  };


  return (

    <div className="bg-white rounded-2xl shadow-md p-6">

      {/* Header */}

      <div className="mb-5">

        <h2 className="text-xl font-bold text-slate-800">
          Inventory Intelligence
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Monitor stockouts across product categories.
        </p>

      </div>


      {/* Chart */}

      {loading ? (

        <div className="h-[350px] flex items-center justify-center text-slate-500">

          Loading inventory data...

        </div>

      ) : data.length === 0 ? (

        <div className="h-[350px] flex items-center justify-center text-slate-500">

          No inventory data available.

        </div>

      ) : (

        <ResponsiveContainer width="100%" height={350}>

          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >

            <CartesianGrid strokeDasharray="3 3" />


            <XAxis
              dataKey="category"
              tick={{ fontSize: 12 }}
            />


            <YAxis
              allowDecimals={false}
              label={{
                value: "Stockouts",
                angle: -90,
                position: "insideLeft",
              }}
            />


            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
            />


            <Bar
              dataKey="stockout_count"
              name="Stockouts"
              fill="#2563eb"
              radius={[6, 6, 0, 0]}
            />

          </BarChart>

        </ResponsiveContainer>

      )}

    </div>

  );

}


export default InventoryAnalysisChart;