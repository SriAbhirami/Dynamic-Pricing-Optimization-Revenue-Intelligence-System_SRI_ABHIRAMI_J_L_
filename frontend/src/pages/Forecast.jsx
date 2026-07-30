import { useEffect, useState } from "react";
import {
  Activity,
  Brain,
  CalendarDays,
  ChevronDown,
  Database,
  Package,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import API from "../api/axios";


function Forecast() {

  // ============================================================
  // Products
  // ============================================================

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);


  // ============================================================
  // Prediction
  // ============================================================

  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");


  // ============================================================
  // Form Data
  // ============================================================

  const [formData, setFormData] = useState({
    product_id: "",
    category: "Electronics",
    brand: "BrandA",
    region: "South",
    channel: "web",
    season: "Summer",
    promotion_type: "Discount",

    base_price: 200,
    current_price: 180,
    price_change_pct: -10,
    discount_pct: 10,

    inventory_level: 100,
    stockout_flag: 0,

    sales_rolling_3: 100,
    sales_rolling_7: 105,
    sales_rolling_14: 110,

    year: 2026,
    month: 7,
    day: 30,
    day_of_week: 3,
  });


  // ============================================================
  // Load Products
  // ============================================================

  useEffect(() => {
    loadProducts();
  }, []);


  const loadProducts = async () => {

    try {

      setLoadingProducts(true);

      const response = await API.get("/products/", {
        params: {
          skip: 0,
          limit: 100,
          order: "asc",
        },
      });

      let productList = [];

      if (
        response.data?.items &&
        Array.isArray(response.data.items)
      ) {
        productList = response.data.items;
      } else if (Array.isArray(response.data)) {
        productList = response.data;
      }

      setProducts(productList);

      // Automatically use the first product
      if (productList.length > 0) {

        const firstProduct = productList[0];

        setFormData((previous) => ({
          ...previous,
          product_id: String(firstProduct.id),
          category: firstProduct.category || previous.category,
          current_price:
            Number(firstProduct.current_price) ||
            previous.current_price,
          inventory_level:
            Number(firstProduct.stock) ||
            previous.inventory_level,
        }));

      }

    } catch (error) {

      console.error(
        "Error loading products:",
        error.response?.data || error.message
      );

    } finally {

      setLoadingProducts(false);

    }

  };


  // ============================================================
  // Handle Input Changes
  // ============================================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // ============================================================
  // Product Selection
  // ============================================================

  const handleProductChange = (event) => {

    const selectedId = event.target.value;

    const selectedProduct = products.find(
      (product) => String(product.id) === String(selectedId)
    );

    if (!selectedProduct) {

      setFormData((previous) => ({
        ...previous,
        product_id: selectedId,
      }));

      return;

    }

    setFormData((previous) => ({
      ...previous,
      product_id: selectedId,
      category:
        selectedProduct.category ||
        previous.category,
      current_price:
        Number(selectedProduct.current_price) ||
        previous.current_price,
      inventory_level:
        Number(selectedProduct.stock) ||
        previous.inventory_level,
    }));

  };


  // ============================================================
  // Predict Demand
  // ============================================================

  const handlePredict = async () => {

    try {

      setPredicting(true);
      setPrediction(null);
      setError("");

      const payload = {
        base_price: Number(formData.base_price),
        current_price: Number(formData.current_price),
        price_change_pct: Number(formData.price_change_pct),
        discount_pct: Number(formData.discount_pct),

        inventory_level: Number(formData.inventory_level),

        year: Number(formData.year),
        month: Number(formData.month),
        day: Number(formData.day),
        day_of_week: Number(formData.day_of_week),

        sales_rolling_3: Number(formData.sales_rolling_3),
        sales_rolling_7: Number(formData.sales_rolling_7),
        sales_rolling_14: Number(formData.sales_rolling_14),

        product_id: String(formData.product_id),
        category: String(formData.category),
        brand: String(formData.brand),
        region: String(formData.region),
        channel: String(formData.channel),
        season: String(formData.season),
        promotion_type: String(formData.promotion_type),

        stockout_flag: Number(formData.stockout_flag),
      };


      console.log("DEMAND FORECAST REQUEST:", payload);


      const response = await API.post(
        "/demand-forecast/predict",
        payload
      );


      console.log(
        "DEMAND FORECAST RESPONSE:",
        response.data
      );


      setPrediction(
        Number(response.data.predicted_demand_index)
      );

    } catch (error) {

      console.error(
        "Demand prediction error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.detail ||
          "Unable to generate demand prediction. Please try again."
      );

    } finally {

      setPredicting(false);

    }

  };


  // ============================================================
  // Demand Interpretation
  // ============================================================

  const getDemandLevel = () => {

    if (prediction === null) {
      return null;
    }

    // HIGH DEMAND
    // Demand index 150 or above is considered high.
    if (prediction >= 150) {

      return {
        label: "HIGH DEMAND",
        description:
          "Strong demand pressure detected. Consider maintaining sufficient inventory and reviewing pricing opportunities carefully.",
        className:
          "border-red-400/20 bg-red-400/10 text-red-300",
        dot:
          "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]",
      };

    }


    // MODERATE DEMAND
    // Demand index between 100 and 149.9.
    if (prediction >= 100) {

      return {
        label: "MODERATE DEMAND",
        description:
          "Demand is currently healthy. Pricing and inventory appear to be operating within a balanced range.",
        className:
          "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
        dot:
          "bg-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.8)]",
      };

    }


    // LOW DEMAND
    return {
      label: "LOW DEMAND",
      description:
        "Demand pressure is relatively low. Consider reviewing pricing, promotions and inventory strategy.",
      className:
        "border-blue-400/20 bg-blue-400/10 text-blue-300",
      dot:
        "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]",
    };

  };


  const demandLevel = getDemandLevel();


  // ============================================================
  // Reusable Input
  // ============================================================

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b150e] px-4 py-3 text-sm text-gray-300 outline-none transition focus:border-lime-300/40 focus:ring-1 focus:ring-lime-300/10";


  const labelClass =
    "mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500";


  return (
    <div className="min-h-screen bg-[#030604] text-white">

      <Sidebar />


      <div className="ml-72 min-h-screen">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <main className="px-6 py-6 lg:px-8">

          <section className="relative mb-6 overflow-hidden rounded-[28px] border border-lime-400/10 bg-[#071009] px-7 py-7">

            <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-lime-400/10 blur-[110px]" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-400/5 blur-[100px]" />


            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

              <div>

                <div className="mb-3 flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.9)]" />

                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">
                    Machine Learning Layer
                  </span>

                </div>


                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">

                  Demand
                  <span className="text-lime-300"> Forecast</span>

                </h1>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">

                  Predict future demand using pricing, inventory,
                  sales history and market signals powered by the
                  PricePilot AI demand intelligence engine.

                </p>

              </div>


              <div className="flex items-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 px-5 py-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                  <Brain className="h-5 w-5 text-lime-300" />

                </div>


                <div>

                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                    Model
                  </p>

                  <p className="mt-1 font-semibold text-lime-300">
                    XGBoost Engine
                  </p>

                </div>

              </div>

            </div>

          </section>


          {/* =====================================================
              MAIN GRID
          ====================================================== */}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">


            {/* =================================================
                INPUT PANEL
            ================================================== */}

            <div className="xl:col-span-2">

              <div className="overflow-hidden rounded-[28px] border border-lime-400/10 bg-[#071009]">

                {/* Panel Header */}

                <div className="border-b border-white/5 px-7 py-6">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10">

                      <Activity className="h-5 w-5 text-lime-300" />

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                        Prediction Parameters
                      </p>

                      <h2 className="mt-1 text-xl font-semibold">
                        Demand Signal Configuration
                      </h2>

                    </div>

                  </div>

                </div>


                <div className="space-y-8 p-7">


                  {/* =================================================
                      PRODUCT
                  ================================================== */}

                  <div>

                    <div className="mb-5 flex items-center gap-2">

                      <Package className="h-4 w-4 text-lime-300" />

                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                        Product Information
                      </h3>

                    </div>


                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                      {/* Product */}

                      <div>

                        <label className={labelClass}>
                          Product
                        </label>

                        <div className="relative">

                          <select
                            name="product_id"
                            value={formData.product_id}
                            onChange={handleProductChange}
                            disabled={loadingProducts}
                            className={`${inputClass} appearance-none pr-10`}
                          >

                            {loadingProducts ? (

                              <option value="">
                                Loading products...
                              </option>

                            ) : products.length === 0 ? (

                              <option value="">
                                No products available
                              </option>

                            ) : (

                              products.map((product) => (

                                <option
                                  key={product.id}
                                  value={product.id}
                                >

                                  {product.name} — ID #{product.id}

                                </option>

                              ))

                            )}

                          </select>

                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />

                        </div>

                      </div>


                      {/* Category */}

                      <div>

                        <label className={labelClass}>
                          Category
                        </label>

                        <input
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      {/* Brand */}

                      <div>

                        <label className={labelClass}>
                          Brand
                        </label>

                        <input
                          name="brand"
                          value={formData.brand}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      {/* Region */}

                      <div>

                        <label className={labelClass}>
                          Region
                        </label>

                        <select
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          className={inputClass}
                        >

                          <option value="South">
                            South
                          </option>

                          <option value="North">
                            North
                          </option>

                          <option value="East">
                            East
                          </option>

                          <option value="West">
                            West
                          </option>

                        </select>

                      </div>


                      {/* Channel */}

                      <div>

                        <label className={labelClass}>
                          Channel
                        </label>

                        <select
                          name="channel"
                          value={formData.channel}
                          onChange={handleChange}
                          className={inputClass}
                        >

                          <option value="web">
                            Web
                          </option>

                          <option value="app">
                            App
                          </option>

                          <option value="store">
                            Store
                          </option>

                        </select>

                      </div>


                      {/* Season */}

                      <div>

                        <label className={labelClass}>
                          Season
                        </label>

                        <select
                          name="season"
                          value={formData.season}
                          onChange={handleChange}
                          className={inputClass}
                        >

                          <option value="Summer">
                            Summer
                          </option>

                          <option value="Winter">
                            Winter
                          </option>

                          <option value="Spring">
                            Spring
                          </option>

                          <option value="Fall">
                            Fall
                          </option>

                        </select>

                      </div>


                      {/* Promotion */}

                      <div>

                        <label className={labelClass}>
                          Promotion Type
                        </label>

                        <select
                          name="promotion_type"
                          value={formData.promotion_type}
                          onChange={handleChange}
                          className={inputClass}
                        >

                          <option value="Discount">
                            Discount
                          </option>

                          <option value="BOGO">
                            BOGO
                          </option>

                          <option value="Flash Sale">
                            Flash Sale
                          </option>

                          <option value="None">
                            None
                          </option>

                        </select>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      PRICING
                  ================================================== */}

                  <div className="border-t border-white/5 pt-7">

                    <div className="mb-5 flex items-center gap-2">

                      <TrendingUp className="h-4 w-4 text-lime-300" />

                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                        Pricing Signals
                      </h3>

                    </div>


                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                      <div>

                        <label className={labelClass}>
                          Base Price (₹)
                        </label>

                        <input
                          type="number"
                          name="base_price"
                          value={formData.base_price}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          Current Price (₹)
                        </label>

                        <input
                          type="number"
                          name="current_price"
                          value={formData.current_price}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          Price Change (%)
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          name="price_change_pct"
                          value={formData.price_change_pct}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          Discount (%)
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          name="discount_pct"
                          value={formData.discount_pct}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      INVENTORY & SALES
                  ================================================== */}

                  <div className="border-t border-white/5 pt-7">

                    <div className="mb-5 flex items-center gap-2">

                      <Database className="h-4 w-4 text-lime-300" />

                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                        Inventory & Sales History
                      </h3>

                    </div>


                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                      <div>

                        <label className={labelClass}>
                          Inventory Level
                        </label>

                        <input
                          type="number"
                          name="inventory_level"
                          value={formData.inventory_level}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          Stockout Flag
                        </label>

                        <select
                          name="stockout_flag"
                          value={formData.stockout_flag}
                          onChange={handleChange}
                          className={inputClass}
                        >

                          <option value="0">
                            No Stockout
                          </option>

                          <option value="1">
                            Stockout
                          </option>

                        </select>

                      </div>


                      <div>

                        <label className={labelClass}>
                          3-Day Rolling Sales
                        </label>

                        <input
                          type="number"
                          name="sales_rolling_3"
                          value={formData.sales_rolling_3}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          7-Day Rolling Sales
                        </label>

                        <input
                          type="number"
                          name="sales_rolling_7"
                          value={formData.sales_rolling_7}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          14-Day Rolling Sales
                        </label>

                        <input
                          type="number"
                          name="sales_rolling_14"
                          value={formData.sales_rolling_14}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      DATE
                  ================================================== */}

                  <div className="border-t border-white/5 pt-7">

                    <div className="mb-5 flex items-center gap-2">

                      <CalendarDays className="h-4 w-4 text-lime-300" />

                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                        Forecast Date
                      </h3>

                    </div>


                    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">


                      <div>

                        <label className={labelClass}>
                          Year
                        </label>

                        <input
                          type="number"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          Month
                        </label>

                        <input
                          type="number"
                          min="1"
                          max="12"
                          name="month"
                          value={formData.month}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          Day
                        </label>

                        <input
                          type="number"
                          min="1"
                          max="31"
                          name="day"
                          value={formData.day}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>


                      <div>

                        <label className={labelClass}>
                          Day of Week
                        </label>

                        <input
                          type="number"
                          min="0"
                          max="6"
                          name="day_of_week"
                          value={formData.day_of_week}
                          onChange={handleChange}
                          className={inputClass}
                        />

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      ERROR
                  ================================================== */}

                  {error && (

                    <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">

                      <p className="text-sm text-red-300">
                        {error}
                      </p>

                    </div>

                  )}


                  {/* =================================================
                      PREDICT BUTTON
                  ================================================== */}

                  <button
                    type="button"
                    onClick={handlePredict}
                    disabled={predicting || loadingProducts}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-lime-300 px-6 py-4 font-bold text-black transition-all duration-300 hover:bg-lime-200 hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(163,230,53,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {predicting ? (

                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />

                        Running XGBoost Prediction...
                      </>

                    ) : (

                      <>
                        <Zap className="h-5 w-5" />

                        Predict Demand
                      </>

                    )}

                  </button>

                </div>

              </div>

            </div>


            {/* =================================================
                RESULT PANEL
            ================================================== */}

            <div className="xl:col-span-1">

              <div className="sticky top-6 overflow-hidden rounded-[28px] border border-lime-400/10 bg-[#071009]">

                <div className="relative overflow-hidden border-b border-white/5 px-7 py-6">

                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime-400/10 blur-[80px]" />

                  <div className="relative flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10">

                      <Sparkles className="h-5 w-5 text-lime-300" />

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                        AI Output
                      </p>

                      <h2 className="mt-1 text-xl font-semibold">
                        Demand Intelligence
                      </h2>

                    </div>

                  </div>

                </div>


                <div className="p-7">


                  {prediction === null ? (

                    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">

                      <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-lime-400/20 bg-lime-400/5">

                        <div className="absolute inset-3 rounded-full border border-lime-400/10" />

                        <Brain className="h-9 w-9 text-lime-300/60" />

                      </div>


                      <h3 className="mt-7 text-lg font-semibold text-gray-300">
                        Awaiting Prediction
                      </h3>


                      <p className="mt-2 max-w-xs text-sm leading-6 text-gray-600">

                        Configure the business signals and run the
                        XGBoost engine to generate a demand forecast.

                      </p>

                    </div>

                  ) : (

                    <div>


                      {/* Prediction Number */}

                      <div className="text-center">

                        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600">
                          Predicted Demand Index
                        </p>


                        <div className="mt-5">

                          <span className="text-7xl font-bold tracking-tight text-lime-300">

                            {prediction.toFixed(1)}

                          </span>

                        </div>

                      </div>


                      {/* Demand Level */}

                      {demandLevel && (

                        <div className="mt-8">

                          <div
                            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 ${demandLevel.className}`}
                          >

                            <span
                              className={`h-2 w-2 rounded-full ${demandLevel.dot}`}
                            />

                            <span className="text-xs font-bold tracking-wider">
                              {demandLevel.label}
                            </span>

                          </div>


                          <p className="mt-5 text-center text-sm leading-6 text-gray-500">
                            {demandLevel.description}
                          </p>

                        </div>

                      )}


                      {/* Signal Meter */}

                      <div className="mt-8">

                        <div className="flex items-center justify-between">

                          <span className="text-xs uppercase tracking-wider text-gray-600">
                            Demand Pressure
                          </span>

                          <span className="text-xs font-semibold text-lime-300">

                            {Math.min(
                              (prediction / 365) * 100,
                              100
                            ).toFixed(0)}%

                          </span>

                        </div>


                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">

                          <div
                            className="h-full rounded-full bg-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.7)] transition-all duration-700"
                            style={{
                              width: `${Math.min(
                                (prediction / 365) * 100,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>


                      {/* Model Info */}

                      <div className="mt-8 space-y-3 border-t border-white/5 pt-6">

                        <div className="flex items-center justify-between">

                          <span className="text-xs text-gray-600">
                            Model
                          </span>

                          <span className="text-xs font-semibold text-gray-400">
                            Improved XGBoost
                          </span>

                        </div>


                        <div className="flex items-center justify-between">

                          <span className="text-xs text-gray-600">
                            Prediction Target
                          </span>

                          <span className="text-xs font-semibold text-gray-400">
                            Demand Index
                          </span>

                        </div>


                        <div className="flex items-center justify-between">

                          <span className="text-xs text-gray-600">
                            Engine Status
                          </span>

                          <span className="flex items-center gap-2 text-xs font-semibold text-lime-300">

                            <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

                            ONLINE

                          </span>

                        </div>

                      </div>


                      {/* AI Note */}

                      <div className="mt-6 rounded-2xl border border-lime-400/10 bg-lime-400/5 p-4">

                        <div className="flex gap-3">

                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />

                          <p className="text-xs leading-5 text-gray-500">

                            This forecast is generated from pricing,
                            inventory, sales history and market signals
                            processed by the trained demand model.

                          </p>

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              </div>

            </div>

          </section>


          {/* =====================================================
              FOOTER
          ====================================================== */}

          <div className="mt-6 flex flex-col justify-between gap-3 border-t border-white/5 pt-5 text-[10px] uppercase tracking-widest text-gray-700 md:flex-row">

            <span>
              PricePilot AI · Demand Intelligence
            </span>

            <span className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />

              XGBoost Model Connected

            </span>

          </div>

        </main>

      </div>

    </div>
  );
}


export default Forecast;