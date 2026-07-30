import { useEffect, useState } from "react";

import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Boxes,
  AlertTriangle,
  Database,
  Activity,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import { getDatasetProducts } from "../api/dashboard";


function Products() {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 20;


  // =========================
  // LOAD DATASET PRODUCTS
  // =========================

  const loadProducts = async () => {

    try {

      setLoading(true);

      const response = await getDatasetProducts(
        page,
        limit,
        category
      );

      setProducts(response.items || []);
      setTotal(response.total || 0);

    } catch (error) {

      console.error(
        "Error loading dataset products:",
        error
      );

      setProducts([]);

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadProducts();

  }, [page, category]);


  // =========================
  // SEARCH
  // =========================

  const filteredProducts = products.filter((product) => {

    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      product.product_id
        ?.toLowerCase()
        .includes(searchText) ||

      product.category
        ?.toLowerCase()
        .includes(searchText)
    );

  });


  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.ceil(total / limit);


  const handlePrevious = () => {

    if (page > 1) {
      setPage(page - 1);
    }

  };


  const handleNext = () => {

    if (page < totalPages) {
      setPage(page + 1);
    }

  };


  return (

    <div className="min-h-screen bg-[#050807] text-white">

      {/* =========================
          SIDEBAR
      ========================= */}

      <Sidebar />


      {/* =========================
          MAIN APPLICATION AREA
      ========================= */}

      <div className="lg:ml-64 min-h-screen">

        {/* Navbar remains in normal flow */}

        <Navbar />


        <main className="p-6 lg:p-8">


          {/* =========================
              PAGE HEADER
          ========================= */}

          <section className="relative overflow-hidden rounded-3xl border border-lime-400/20 bg-[#09100c] p-7 lg:p-8">

            {/* Background glow */}

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime-400/10 blur-[100px]" />

            <div className="absolute -bottom-32 left-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-[100px]" />


            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <div className="mb-4 flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.8)]" />

                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">

                    Dataset Intelligence

                  </span>

                </div>


                <div className="flex items-center gap-3">

                  <Package className="h-8 w-8 text-lime-300" />

                  <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">

                    Product Intelligence

                  </h1>

                </div>


                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">

                  Explore pricing, demand, inventory and sales signals
                  extracted from the connected retail intelligence dataset.

                </p>

              </div>


              {/* Dataset status */}

              <div className="flex items-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 px-5 py-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                  <Database className="h-5 w-5 text-lime-300" />

                </div>


                <div>

                  <p className="text-xs uppercase tracking-wider text-gray-500">

                    Data Source

                  </p>

                  <p className="mt-1 font-semibold text-lime-300">

                    Dataset Connected

                  </p>

                </div>

              </div>

            </div>

          </section>



          {/* =========================
              SUMMARY SIGNALS
          ========================= */}

          <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">


            {/* Product Coverage */}

            <div className="rounded-2xl border border-lime-400/15 bg-[#0b110e] p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10">

                  <Package className="h-5 w-5 text-lime-300" />

                </div>

                <span className="text-xs uppercase tracking-wider text-gray-600">

                  Coverage

                </span>

              </div>


              <p className="mt-5 text-sm text-gray-500">

                Dataset Products

              </p>


              <p className="mt-1 text-3xl font-bold">

                {total.toLocaleString("en-US")}

              </p>

            </div>



            {/* Dataset Status */}

            <div className="rounded-2xl border border-lime-400/15 bg-[#0b110e] p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">

                  <Activity className="h-5 w-5 text-emerald-300" />

                </div>

                <span className="text-xs uppercase tracking-wider text-gray-600">

                  Status

                </span>

              </div>


              <p className="mt-5 text-sm text-gray-500">

                Intelligence Layer

              </p>


              <p className="mt-1 text-xl font-bold text-emerald-300">

                Connected

              </p>

            </div>



            {/* Current Page */}

            <div className="rounded-2xl border border-lime-400/15 bg-[#0b110e] p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10">

                  <TrendingUp className="h-5 w-5 text-yellow-300" />

                </div>

                <span className="text-xs uppercase tracking-wider text-gray-600">

                  View

                </span>

              </div>


              <p className="mt-5 text-sm text-gray-500">

                Current Dataset Page

              </p>


              <p className="mt-1 text-3xl font-bold">

                {page}

                <span className="ml-2 text-base font-normal text-gray-500">

                  / {totalPages || 1}

                </span>

              </p>

            </div>

          </section>



          {/* =========================
              FILTER BAR
          ========================= */}

          <section className="mt-6 rounded-2xl border border-lime-400/15 bg-[#0b110e] p-5">


            <div className="mb-4 flex items-center gap-2">

              <Search className="h-5 w-5 text-lime-300" />

              <h2 className="font-semibold">

                Explore Dataset

              </h2>

            </div>


            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">


              {/* Search */}

              <div className="relative">

                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                />


                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product or category..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 outline-none transition focus:border-lime-400/40 focus:ring-1 focus:ring-lime-400/20"
                />

              </div>



              {/* Category */}

              <select
                value={category}
                onChange={(e) => {

                  setCategory(e.target.value);

                  setPage(1);

                }}
                className="rounded-xl border border-white/10 bg-[#080d0a] px-4 py-3 text-sm text-gray-300 outline-none transition focus:border-lime-400/40 focus:ring-1 focus:ring-lime-400/20"
              >

                <option value="" className="bg-[#080d0a]">

                  All Categories

                </option>

                <option value="Electronics" className="bg-[#080d0a]">
                  Electronics
                </option>

                <option value="Apparel" className="bg-[#080d0a]">
                  Apparel
                </option>

                <option value="Shoes" className="bg-[#080d0a]">
                  Shoes
                </option>

                <option value="Accessories" className="bg-[#080d0a]">
                  Accessories
                </option>

                <option value="Beauty" className="bg-[#080d0a]">
                  Beauty
                </option>

                <option value="Groceries" className="bg-[#080d0a]">
                  Groceries
                </option>

                <option value="Home" className="bg-[#080d0a]">
                  Home
                </option>

              </select>

            </div>

          </section>



          {/* =========================
              PRODUCT INTELLIGENCE TABLE
          ========================= */}

          <section className="mt-6 overflow-hidden rounded-3xl border border-lime-400/15 bg-[#0b110e]">


            {/* Table Header */}

            <div className="flex flex-col gap-3 border-b border-white/5 px-6 py-5 md:flex-row md:items-center md:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <Package className="h-5 w-5 text-lime-300" />

                  <h2 className="text-lg font-semibold">

                    Product Intelligence Table

                  </h2>

                </div>


                <p className="mt-1 text-sm text-gray-500">

                  Historical pricing, demand and inventory signals.

                </p>

              </div>


              <div className="flex items-center gap-2 text-xs text-gray-500">

                <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.7)]" />

                Live Dataset

              </div>

            </div>



            {/* Table */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">


                <thead className="bg-[#080d0a]">

                  <tr className="border-b border-white/5">

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                      Product

                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                      Category

                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">

                      Avg. Price

                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">

                      Units Sold

                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">

                      Revenue

                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">

                      Demand

                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">

                      Inventory

                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">

                      Stockouts

                    </th>

                  </tr>

                </thead>



                <tbody>


                  {/* Loading */}

                  {loading && (

                    <tr>

                      <td
                        colSpan="8"
                        className="py-20 text-center"
                      >

                        <div className="flex flex-col items-center gap-3">

                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-300/20 border-t-lime-300" />

                          <p className="text-sm text-gray-500">

                            Loading product intelligence...

                          </p>

                        </div>

                      </td>

                    </tr>

                  )}



                  {/* Empty */}

                  {!loading && filteredProducts.length === 0 && (

                    <tr>

                      <td
                        colSpan="8"
                        className="py-20 text-center"
                      >

                        <div className="flex flex-col items-center gap-3">

                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/5">

                            <Package className="h-7 w-7 text-gray-600" />

                          </div>


                          <p className="font-semibold text-gray-300">

                            No products found

                          </p>


                          <p className="text-sm text-gray-600">

                            Try changing your search or category filter.

                          </p>

                        </div>

                      </td>

                    </tr>

                  )}



                  {/* Products */}

                  {!loading &&
                    filteredProducts.map((product) => (

                      <tr
                        key={product.product_id}
                        className="border-b border-white/5 transition hover:bg-lime-400/[0.025]"
                      >


                        {/* Product */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/10">

                              <Package
                                size={18}
                                className="text-lime-300"
                              />

                            </div>


                            <span className="font-semibold text-gray-200">

                              {product.product_id}

                            </span>

                          </div>

                        </td>



                        {/* Category */}

                        <td className="px-5 py-4">

                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-400">

                            {product.category}

                          </span>

                        </td>



                        {/* Price */}

                        <td className="px-5 py-4 text-right font-semibold text-gray-200">

                          $
                          {Number(
                            product.average_price
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}

                        </td>



                        {/* Units Sold */}

                        <td className="px-5 py-4 text-right text-gray-400">

                          {Number(
                            product.total_units_sold
                          ).toLocaleString("en-US")}

                        </td>



                        {/* Revenue */}

                        <td className="px-5 py-4 text-right font-semibold text-emerald-300">

                          $
                          {Number(
                            product.total_revenue
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}

                        </td>



                        {/* Demand */}

                        <td className="px-5 py-4 text-right">

                          <div className="flex items-center justify-end gap-2">

                            <TrendingUp
                              size={15}
                              className="text-lime-300"
                            />

                            <span className="font-semibold text-gray-300">

                              {product.average_demand_index}

                            </span>

                          </div>

                        </td>



                        {/* Inventory */}

                        <td className="px-5 py-4 text-right">

                          <div className="flex items-center justify-end gap-2">

                            <Boxes
                              size={15}
                              className="text-blue-300"
                            />

                            <span className="text-gray-400">

                              {product.average_inventory}

                            </span>

                          </div>

                        </td>



                        {/* Stockouts */}

                        <td className="px-5 py-4 text-center">

                          {product.stockout_count > 0 ? (

                            <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-300">

                              <AlertTriangle size={13} />

                              {product.stockout_count}

                            </span>

                          ) : (

                            <span className="font-semibold text-emerald-300">

                              0

                            </span>

                          )}

                        </td>


                      </tr>

                    ))}

                </tbody>

              </table>

            </div>



            {/* =========================
                PAGINATION
            ========================= */}

            <div className="flex flex-col gap-4 border-t border-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">


              <p className="text-sm text-gray-500">

                Page{" "}

                <span className="font-semibold text-gray-300">

                  {page}

                </span>{" "}

                of{" "}

                <span className="font-semibold text-gray-300">

                  {totalPages || 1}

                </span>

              </p>


              <div className="flex gap-2">


                <button
                  onClick={handlePrevious}
                  disabled={page === 1}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-gray-400 transition hover:border-lime-400/20 hover:bg-lime-400/5 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-30"
                >

                  <ChevronLeft size={17} />

                  Previous

                </button>



                <button
                  onClick={handleNext}
                  disabled={page >= totalPages}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-gray-400 transition hover:border-lime-400/20 hover:bg-lime-400/5 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-30"
                >

                  Next

                  <ChevronRight size={17} />

                </button>

              </div>

            </div>

          </section>



          {/* =========================
              INTELLIGENCE INFORMATION
          ========================= */}

          <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">


            {/* Pricing */}

            <div className="rounded-2xl border border-lime-400/10 bg-[#0b110e] p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">

                  <DollarSign className="h-5 w-5 text-emerald-300" />

                </div>


                <div>

                  <p className="text-xs uppercase tracking-wider text-gray-600">

                    Pricing Data

                  </p>

                  <p className="mt-1 font-semibold text-gray-300">

                    Dataset-backed

                  </p>

                </div>

              </div>

            </div>



            {/* Demand */}

            <div className="rounded-2xl border border-lime-400/10 bg-[#0b110e] p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10">

                  <TrendingUp className="h-5 w-5 text-lime-300" />

                </div>


                <div>

                  <p className="text-xs uppercase tracking-wider text-gray-600">

                    Demand Intelligence

                  </p>

                  <p className="mt-1 font-semibold text-gray-300">

                    Historical demand

                  </p>

                </div>

              </div>

            </div>



            {/* Inventory */}

            <div className="rounded-2xl border border-lime-400/10 bg-[#0b110e] p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10">

                  <Boxes className="h-5 w-5 text-blue-300" />

                </div>


                <div>

                  <p className="text-xs uppercase tracking-wider text-gray-600">

                    Product Coverage

                  </p>

                  <p className="mt-1 font-semibold text-gray-300">

                    {total.toLocaleString("en-US")} products

                  </p>

                </div>

              </div>

            </div>

          </section>


        </main>

      </div>

    </div>

  );

}


export default Products;