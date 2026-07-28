import { useEffect, useState } from "react";

import {
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";

import { getPricingDemandData } from "../../api/dashboard";


function PricingDataExplorer() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const limit = 20;


  useEffect(() => {

    const loadData = async () => {

      setLoading(true);

      try {

        const skip = (page - 1) * limit;

        const response = await getPricingDemandData(skip, limit);

        setData(response);

      } catch (error) {

        console.error("Error loading pricing data:", error);

      } finally {

        setLoading(false);

      }

    };


    loadData();

  }, [page]);


  const filteredData = data.filter((item) => {

    const searchText = search.toLowerCase();

    return (
      item.product_id?.toLowerCase().includes(searchText) ||
      item.category?.toLowerCase().includes(searchText) ||
      item.brand?.toLowerCase().includes(searchText) ||
      item.region?.toLowerCase().includes(searchText) ||
      item.channel?.toLowerCase().includes(searchText)
    );

  });


  return (

    <div className="bg-white rounded-2xl shadow-md p-6">

      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>

          <div className="flex items-center gap-3">

            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">

              <Database size={24} />

            </div>

            <h2 className="text-xl font-bold text-slate-800">
              Pricing Data Explorer
            </h2>

          </div>

          <p className="text-sm text-slate-500 mt-2">
            Explore real-time pricing, demand, sales, and inventory data.
          </p>

        </div>


        {/* Search */}

        <div className="relative w-full lg:w-80">

          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search product, category, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full
              pl-10
              pr-4
              py-3
              border
              border-slate-200
              rounded-xl
              outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
            "
          />

        </div>

      </div>


      {/* Table */}

      {loading ? (

        <div className="h-64 flex items-center justify-center text-slate-500">

          Loading pricing data...

        </div>

      ) : filteredData.length === 0 ? (

        <div className="h-64 flex items-center justify-center text-slate-500">

          No pricing data found.

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
                  Brand
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Region
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Channel
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Price
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Discount
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Units Sold
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Revenue
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Inventory
                </th>

                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Demand
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredData.map((item) => (

                <tr
                  key={item.id}
                  className="border-b border-slate-100 hover:bg-blue-50 transition"
                >

                  <td className="px-4 py-4 whitespace-nowrap">
                    {item.date}
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {item.product_id}
                  </td>

                  <td className="px-4 py-4">
                    {item.category}
                  </td>

                  <td className="px-4 py-4">
                    {item.brand}
                  </td>

                  <td className="px-4 py-4 uppercase">
                    {item.region}
                  </td>

                  <td className="px-4 py-4 capitalize">
                    {item.channel}
                  </td>

                  <td className="px-4 py-4 text-right">
                    ₹{Number(item.current_price).toFixed(2)}
                  </td>

                  <td className="px-4 py-4 text-right">
                    {Number(item.discount_pct).toFixed(2)}%
                  </td>

                  <td className="px-4 py-4 text-right">
                    {Number(item.units_sold).toLocaleString("en-IN")}
                  </td>

                  <td className="px-4 py-4 text-right font-medium">
                    ₹{Number(item.revenue).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="px-4 py-4 text-right">
                    {Number(item.inventory_level).toLocaleString("en-IN")}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold">
                    {Number(item.demand_index).toFixed(2)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}


      {/* Pagination */}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">

        <p className="text-sm text-slate-500">
          Page {page}
        </p>


        <div className="flex gap-2">

          <button
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page === 1}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              bg-slate-100
              text-slate-600
              font-semibold
              hover:bg-slate-200
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >

            <ChevronLeft size={18} />

            Previous

          </button>


          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={data.length < limit}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              bg-blue-600
              text-white
              font-semibold
              hover:bg-blue-700
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >

            Next

            <ChevronRight size={18} />

          </button>

        </div>

      </div>

    </div>

  );

}


export default PricingDataExplorer;