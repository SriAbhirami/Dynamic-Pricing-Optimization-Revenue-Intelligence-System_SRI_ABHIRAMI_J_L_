import { useEffect, useState } from "react";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getPricingDemandPriceAnalysis } from "../../api/dashboard";


function PriceAnalysisChart() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const loadPriceAnalysis = async () => {

      try {

        const response = await getPricingDemandPriceAnalysis();

        setData(response);

      } catch (error) {

        console.error("Error loading price analysis:", error);

      } finally {

        setLoading(false);

      }

    };


    loadPriceAnalysis();

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
          Pricing Observation
        </p>


        <div className="space-y-2 text-sm">

          <p>
            <span className="font-semibold text-slate-600">
              Current Price:
            </span>{" "}
            ₹{Number(item.current_price).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>


          <p>
            <span className="font-semibold text-slate-600">
              Demand Index:
            </span>{" "}
            {Number(item.demand_index).toFixed(2)}
          </p>


          <p>
            <span className="font-semibold text-slate-600">
              Units Sold:
            </span>{" "}
            {Number(item.units_sold).toLocaleString("en-IN")}
          </p>


          <p>
            <span className="font-semibold text-slate-600">
              Revenue:
            </span>{" "}
            ₹{Number(item.revenue).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>


          <p>
            <span className="font-semibold text-slate-600">
              Discount:
            </span>{" "}
            {Number(item.discount_pct).toFixed(2)}%
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
          Price vs Demand Analysis
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Analyze how product prices relate to demand levels.
        </p>

      </div>


      {/* Chart */}

      {loading ? (

        <div className="h-[350px] flex items-center justify-center text-slate-500">

          Loading price analysis...

        </div>

      ) : data.length === 0 ? (

        <div className="h-[350px] flex items-center justify-center text-slate-500">

          No price analysis data available.

        </div>

      ) : (

        <ResponsiveContainer width="100%" height={350}>

          <ScatterChart
            margin={{
              top: 20,
              right: 30,
              bottom: 30,
              left: 20,
            }}
          >

            <CartesianGrid strokeDasharray="3 3" />


            <XAxis
              type="number"
              dataKey="current_price"
              name="Price"
              tickFormatter={(value) =>
                `₹${Number(value).toFixed(0)}`
              }
              label={{
                value: "Current Price",
                position: "insideBottom",
                offset: -15,
              }}
            />


            <YAxis
              type="number"
              dataKey="demand_index"
              name="Demand Index"
              label={{
                value: "Demand Index",
                angle: -90,
                position: "insideLeft",
              }}
            />


            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                strokeDasharray: "3 3",
              }}
            />


            <Scatter
              name="Price vs Demand"
              data={data}
              fill="#2563eb"
            />

          </ScatterChart>

        </ResponsiveContainer>

      )}

    </div>

  );

}


export default PriceAnalysisChart;