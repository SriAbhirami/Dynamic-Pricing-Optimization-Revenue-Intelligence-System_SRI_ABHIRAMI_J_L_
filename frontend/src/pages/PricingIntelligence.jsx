import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  CheckCircle2,
  ChevronDown,
  Gauge,
  IndianRupee,
  Package,
  Percent,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  getProducts,
  analyzeProductPricing,
} from "../api/pricingDemand";


// ============================================================
// HELPER: FORMAT INDIAN CURRENCY
// ============================================================

const formatCurrency = (value) => {
  const number = Number(value) || 0;

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


// ============================================================
// HELPER: DEMAND COLOR
// ============================================================

const getDemandStyle = (level) => {
  if (level === "HIGH") {
    return {
      text: "text-lime-300",
      border: "border-lime-300/40",
      background: "bg-lime-300/10",
      glow: "shadow-[0_0_25px_rgba(163,230,53,0.12)]",
    };
  }

  if (level === "MODERATE") {
    return {
      text: "text-yellow-300",
      border: "border-yellow-300/40",
      background: "bg-yellow-300/10",
      glow: "shadow-[0_0_25px_rgba(250,204,21,0.10)]",
    };
  }

  return {
    text: "text-red-300",
    border: "border-red-300/40",
    background: "bg-red-300/10",
    glow: "shadow-[0_0_25px_rgba(248,113,113,0.10)]",
  };
};


// ============================================================
// HELPER: RECOMMENDATION STYLE
// ============================================================

const getRecommendationStyle = (recommendation) => {
  const value = String(
    recommendation || ""
  ).toUpperCase();

  if (value.includes("INCREASE")) {
    return {
      text: "text-lime-300",
      border: "border-lime-300/40",
      background: "bg-lime-300/10",
      icon: ArrowUp,
    };
  }

  if (value.includes("DECREASE")) {
    return {
      text: "text-orange-300",
      border: "border-orange-300/40",
      background: "bg-orange-300/10",
      icon: ArrowDown,
    };
  }

  return {
    text: "text-cyan-300",
    border: "border-cyan-300/40",
    background: "bg-cyan-300/10",
    icon: CheckCircle2,
  };
};


// ============================================================
// MAIN COMPONENT
// ============================================================

function PricingIntelligence() {

  // ==========================================================
  // PRODUCT STATE
  // ==========================================================

  const [products, setProducts] = useState([]);

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [productsError, setProductsError] =
    useState("");


  // ==========================================================
  // ANALYSIS STATE
  // ==========================================================

  const [analysis, setAnalysis] =
    useState(null);

  const [analysisLoading, setAnalysisLoading] =
    useState(false);

  const [analysisError, setAnalysisError] =
    useState("");


  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  useEffect(() => {

    const loadProducts = async () => {

      try {

        setProductsLoading(true);
        setProductsError("");

        const data = await getProducts();

        const productList =
          Array.isArray(data)
            ? data
            : data?.items || [];

        setProducts(productList);

        if (productList.length > 0) {

          setSelectedProductId(
            String(productList[0].id)
          );

        }

      } catch (error) {

        console.error(
          "Failed to load products:",
          error
        );

        setProductsError(
          error.response?.data?.detail ||
          "Unable to load products."
        );

      } finally {

        setProductsLoading(false);

      }

    };

    loadProducts();

  }, []);


  // ==========================================================
  // SELECTED PRODUCT
  // ==========================================================

  const selectedProduct =
    products.find(
      (product) =>
        String(product.id) ===
        String(selectedProductId)
    ) || null;


  // ==========================================================
  // HANDLE PRODUCT CHANGE
  // ==========================================================

  const handleProductChange = (event) => {

    setSelectedProductId(
      event.target.value
    );

    setAnalysis(null);
    setAnalysisError("");

  };


  // ==========================================================
  // ANALYZE PRICING
  // ==========================================================

  const handleAnalyzePricing = async () => {

    if (!selectedProduct) {

      setAnalysisError(
        "Please select a product first."
      );

      return;

    }

    try {

      setAnalysisLoading(true);
      setAnalysisError("");
      setAnalysis(null);

      const result =
        await analyzeProductPricing(
          selectedProduct.id
        );

      setAnalysis(result);

    } catch (error) {

      console.error(
        "Pricing analysis failed:",
        error
      );

      setAnalysisError(
        error.response?.data?.detail ||
        "Unable to generate pricing analysis."
      );

    } finally {

      setAnalysisLoading(false);

    }

  };


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (productsLoading) {

    return (

      <div className="min-h-screen bg-[#020403] text-white">

        <main className="flex min-h-screen items-center justify-center px-6">

          <div className="text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-lime-300/30 bg-lime-300/10 shadow-[0_0_55px_rgba(163,230,53,0.18)]">

              <Activity className="h-8 w-8 animate-pulse text-lime-300" />

            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.35em] text-lime-300">

              Pricing Intelligence

            </p>

            <p className="mt-3 text-sm text-gray-500">

              Loading your product catalog...

            </p>

          </div>

        </main>

      </div>

    );

  }


  // ==========================================================
  // PRODUCTS ERROR
  // ==========================================================

  if (productsError) {

    return (

      <div className="min-h-screen bg-[#020403] text-white">

        <main className="flex min-h-screen items-center justify-center px-6">

          <div className="w-full max-w-lg rounded-3xl border border-red-400/30 bg-[#080d09] p-8 text-center shadow-[0_0_45px_rgba(248,113,113,0.08)]">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-400/10">

              <AlertTriangle className="h-7 w-7 text-red-300" />

            </div>

            <h1 className="mt-5 text-xl font-bold">

              Unable to Load Products

            </h1>

            <p className="mt-3 text-sm text-red-300">

              {productsError}

            </p>

            <p className="mt-4 text-xs leading-5 text-gray-600">

              Please make sure you are logged in and
              the backend is running.

            </p>

          </div>

        </main>

      </div>

    );

  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#020403] text-white">

      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-10">


        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section className="relative overflow-hidden rounded-[32px] border border-lime-300/15 bg-[#071009] px-7 py-8 shadow-[0_0_70px_rgba(163,230,53,0.04)] md:px-10">

          <div className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-lime-300/10 blur-[120px]" />

          <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-emerald-300/5 blur-[110px]" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-4 flex items-center gap-3">

                <span className="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(163,230,53,1)]" />

                <span className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">

                  ML Decision Layer

                </span>

              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">

                Pricing{" "}

                <span className="text-lime-300 drop-shadow-[0_0_18px_rgba(163,230,53,0.35)]">

                  Intelligence

                </span>

              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-500 sm:text-base">

                Select a product from your actual product catalog
                and analyze its pricing using demand, sales,
                inventory and historical pricing signals.

              </p>

            </div>


            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-lime-300/25 bg-lime-300/5 px-5 py-4 shadow-[0_0_35px_rgba(163,230,53,0.08)]">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10">

                <Brain className="h-5 w-5 text-lime-300" />

              </div>

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">

                  Intelligence Engine

                </p>

                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-lime-300">

                  XGBOOST ACTIVE

                  <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,1)]" />

                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            PRODUCT SELECTOR
        ================================================== */}

        <section className="relative mt-7 overflow-hidden rounded-[32px] border border-lime-300/15 bg-[#071009] shadow-[0_0_60px_rgba(163,230,53,0.035)]">

          <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-lime-300/5 blur-[100px]" />

          <div className="relative z-10 px-6 py-7 sm:px-8 lg:px-10">

            <div className="flex flex-col gap-3">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 shadow-[0_0_25px_rgba(163,230,53,0.12)]">

                  <Search className="h-5 w-5 text-lime-300" />

                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-lime-300">

                    Product Analysis

                  </p>

                  <h2 className="mt-1 text-2xl font-bold">

                    Select Product

                  </h2>

                </div>

              </div>

              <p className="max-w-2xl text-sm leading-6 text-gray-500">

                Products shown here are loaded directly from
                your Product table.

              </p>

            </div>


            {/* Product Dropdown */}

            <div className="relative mt-7">

              <label className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">

                Product

              </label>

              <div className="relative">

                <select
                  value={selectedProductId}
                  onChange={handleProductChange}
                  className="w-full appearance-none rounded-2xl border-2 border-lime-300/25 bg-[#030604] px-5 py-5 pr-14 text-base font-bold text-white outline-none transition duration-300 hover:border-lime-300/45 focus:border-lime-300/70 focus:shadow-[0_0_35px_rgba(163,230,53,0.16)] sm:text-lg"
                >

                  {products.map((product) => (

                    <option
                      key={product.id}
                      value={product.id}
                      className="bg-[#071009] text-white"
                    >

                      ID {product.id} — {product.name}

                    </option>

                  ))}

                </select>

                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-lime-300" />

              </div>

            </div>


            {/* ==================================================
                SELECTED PRODUCT CARD
            ================================================== */}

            {selectedProduct && (

              <div className="relative mt-7 overflow-hidden rounded-[28px] border-2 border-lime-300/20 bg-[#030604] shadow-[0_0_60px_rgba(163,230,53,0.07)]">

                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime-300/10 blur-[90px]" />

                <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-emerald-300/5 blur-[90px]" />

                <div className="relative z-10 p-6 sm:p-8 lg:p-10">


                  {/* Product Identity */}

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_2fr]">

                    {/* Product ID */}

                    <div className="rounded-2xl border border-lime-300/20 bg-lime-300/[0.035] p-6 shadow-[0_0_30px_rgba(163,230,53,0.06)]">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10">

                          <Package className="h-5 w-5 text-lime-300" />

                        </div>

                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">

                          Product ID

                        </p>

                      </div>

                      <p className="mt-5 text-5xl font-black tracking-tight text-lime-300 drop-shadow-[0_0_20px_rgba(163,230,53,0.55)]">

                        #{selectedProduct.id}

                      </p>

                    </div>


                    {/* Product Name */}

                    <div className="rounded-2xl border border-lime-300/20 bg-lime-300/[0.035] p-6 shadow-[0_0_30px_rgba(163,230,53,0.06)]">

                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">

                        Product Name

                      </p>

                      <h3 className="mt-4 break-words text-3xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] sm:text-4xl">

                        {selectedProduct.name}

                      </h3>

                    </div>

                  </div>


                  {/* Product Details */}

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">


                    {/* Category */}

                    <div className="rounded-2xl border border-white/10 bg-[#071009] p-5 transition hover:border-lime-300/25">

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">

                        Category

                      </p>

                      <p className="mt-3 text-xl font-black text-white">

                        {selectedProduct.category}

                      </p>

                    </div>


                    {/* Current Price */}

                    <div className="rounded-2xl border border-lime-300/20 bg-[#071009] p-5 shadow-[0_0_30px_rgba(163,230,53,0.05)]">

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">

                        Current Price

                      </p>

                      <p className="mt-3 flex items-center text-2xl font-black text-lime-300 drop-shadow-[0_0_14px_rgba(163,230,53,0.35)]">

                        <IndianRupee className="mr-1 h-5 w-5" />

                        {formatCurrency(
                          selectedProduct.current_price
                        )}

                      </p>

                    </div>


                    {/* Stock */}

                    <div className="rounded-2xl border border-white/10 bg-[#071009] p-5">

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">

                        Available Stock

                      </p>

                      <p className="mt-3 text-2xl font-black text-white">

                        {Number(
                          selectedProduct.stock
                        ).toLocaleString("en-IN")}

                        <span className="ml-2 text-sm font-semibold text-gray-500">

                          units

                        </span>

                      </p>

                    </div>


                    {/* Created At */}

                    <div className="rounded-2xl border border-white/10 bg-[#071009] p-5">

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">

                        Catalog Status

                      </p>

                      <p className="mt-3 flex items-center gap-2 text-lg font-black text-lime-300">

                        <span className="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(163,230,53,1)]" />

                        ACTIVE

                      </p>

                    </div>

                  </div>

                </div>

              </div>

            )}


            {/* ==================================================
                ANALYZE BUTTON
            ================================================== */}

            <div className="mt-8 flex justify-center">

              <button
                type="button"
                onClick={handleAnalyzePricing}
                disabled={
                  analysisLoading ||
                  !selectedProduct
                }
                className="group flex min-w-[260px] items-center justify-center gap-3 rounded-2xl border-2 border-lime-300/40 bg-lime-300/10 px-8 py-5 text-sm font-black uppercase tracking-[0.2em] text-lime-300 shadow-[0_0_35px_rgba(163,230,53,0.10)] transition duration-300 hover:border-lime-300/80 hover:bg-lime-300/15 hover:shadow-[0_0_55px_rgba(163,230,53,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {analysisLoading ? (

                  <>

                    <Activity className="h-5 w-5 animate-spin" />

                    Analyzing Pricing...

                  </>

                ) : (

                  <>

                    <Zap className="h-5 w-5 transition group-hover:scale-125" />

                    Analyze Pricing

                  </>

                )}

              </button>

            </div>


            {/* Analysis Error */}

            {analysisError && (

              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/5 px-5 py-4">

                <div className="flex items-start gap-3">

                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

                  <div>

                    <p className="text-sm font-bold text-red-300">

                      Pricing Analysis Failed

                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-200/70">

                      {analysisError}

                    </p>

                  </div>

                </div>

              </div>

            )}

          </div>

        </section>


        {/* ==================================================
            ANALYSIS RESULT
        ================================================== */}

        {analysis && (

          <section className="relative mt-7 overflow-hidden rounded-[32px] border-2 border-lime-300/20 bg-[#071009] shadow-[0_0_80px_rgba(163,230,53,0.06)]">

            <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-lime-300/10 blur-[120px]" />

            <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-emerald-300/5 blur-[110px]" />

            <div className="relative z-10">


              {/* ==================================================
                  RESULT HEADER
              ================================================== */}

              <div className="border-b border-white/5 px-6 py-7 sm:px-8 lg:px-10">

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                  <div>

                    <div className="flex items-center gap-3">

                      <Sparkles className="h-6 w-6 text-lime-300 drop-shadow-[0_0_12px_rgba(163,230,53,0.7)]" />

                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-300">

                        Pricing Analysis Result

                      </p>

                    </div>

                    <h2 className="mt-3 text-3xl font-black">

                      {analysis.product_name}

                    </h2>

                    <p className="mt-2 text-sm text-gray-500">

                      Product ID #{analysis.product_id}
                      {" · "}
                      {analysis.category}

                    </p>

                  </div>


                  <div className="flex items-center gap-3 rounded-2xl border border-lime-300/20 bg-lime-300/5 px-5 py-4">

                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,1)]" />

                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-lime-300">

                      Analysis Complete

                    </span>

                  </div>

                </div>

              </div>


              <div className="px-6 py-8 sm:px-8 lg:px-10">


                {/* ==================================================
                    CURRENT → PREDICTED PRICE
                ================================================== */}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">


                  {/* Current Price */}

                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#030604] p-7 text-center shadow-[0_0_40px_rgba(0,0,0,0.25)]">

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

                    <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-gray-500">

                      Current Price

                    </p>

                    <div className="relative mt-5 flex items-center justify-center">

                      <IndianRupee className="h-8 w-8 text-gray-400" />

                      <span className="text-4xl font-black text-white sm:text-5xl">

                        {formatCurrency(
                          analysis.current_price
                        )}

                      </span>

                    </div>

                    <p className="relative mt-4 text-xs text-gray-600">

                      Current catalog price

                    </p>

                  </div>


                  {/* Arrow */}

                  <div className="flex items-center justify-center">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-300/25 bg-lime-300/10 shadow-[0_0_30px_rgba(163,230,53,0.12)]">

                      {Number(
                        analysis.price_difference
                      ) >= 0 ? (

                        <ArrowUp className="h-6 w-6 text-lime-300" />

                      ) : (

                        <ArrowDown className="h-6 w-6 text-orange-300" />

                      )}

                    </div>

                  </div>


                  {/* Predicted Price */}

                  <div className="relative overflow-hidden rounded-[28px] border-2 border-lime-300/30 bg-lime-300/[0.035] p-7 text-center shadow-[0_0_55px_rgba(163,230,53,0.10)]">

                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/10 blur-[70px]" />

                    <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-lime-300">

                      Predicted Price

                    </p>

                    <div className="relative mt-5 flex items-center justify-center">

                      <IndianRupee className="h-9 w-9 text-lime-300 drop-shadow-[0_0_12px_rgba(163,230,53,0.7)]" />

                      <span className="text-5xl font-black text-lime-300 drop-shadow-[0_0_22px_rgba(163,230,53,0.45)] sm:text-6xl">

                        {formatCurrency(
                          analysis.predicted_price
                        )}

                      </span>

                    </div>

                    <p className="relative mt-4 text-xs text-gray-500">

                      XGBoost recommended price

                    </p>

                  </div>

                </div>


                {/* ==================================================
                    PRICE CHANGE
                ================================================== */}

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">


                  {/* Rupee Difference */}

                  <div className="rounded-[26px] border border-lime-300/20 bg-lime-300/[0.035] p-7 shadow-[0_0_35px_rgba(163,230,53,0.06)]">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">

                          Price Difference

                        </p>

                        <p className="mt-4 text-4xl font-black text-white">

                          {Number(
                            analysis.price_difference
                          ) >= 0
                            ? "+"
                            : "-"}₹

                          {formatCurrency(
                            Math.abs(
                              Number(
                                analysis.price_difference
                              )
                            )
                          )}

                        </p>

                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300/10">

                        {Number(
                          analysis.price_difference
                        ) >= 0 ? (

                          <ArrowUp className="h-7 w-7 text-lime-300" />

                        ) : (

                          <ArrowDown className="h-7 w-7 text-orange-300" />

                        )}

                      </div>

                    </div>

                  </div>


                  {/* Percentage */}

                  <div className="rounded-[26px] border border-lime-300/20 bg-lime-300/[0.035] p-7 shadow-[0_0_35px_rgba(163,230,53,0.06)]">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">

                          Price Change

                        </p>

                        <p className="mt-4 text-4xl font-black text-lime-300 drop-shadow-[0_0_15px_rgba(163,230,53,0.35)]">

                          {Number(
                            analysis.price_change_percentage
                          ) >= 0
                            ? "+"
                            : ""}

                          {Number(
                            analysis.price_change_percentage
                          ).toFixed(2)}
                          %

                        </p>

                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300/10">

                        <Percent className="h-7 w-7 text-lime-300" />

                      </div>

                    </div>

                  </div>

                </div>


                {/* ==================================================
                    RECOMMENDATION
                ================================================== */}

                {(() => {

                  const recommendationStyle =
                    getRecommendationStyle(
                      analysis.recommendation
                    );

                  const RecommendationIcon =
                    recommendationStyle.icon;

                  return (

                    <div
                      className={`mt-6 rounded-[28px] border-2 ${recommendationStyle.border} ${recommendationStyle.background} p-7 ${recommendationStyle.glow}`}
                    >

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-5">

                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black/20">

                            <RecommendationIcon
                              className={`h-8 w-8 ${recommendationStyle.text}`}
                            />

                          </div>

                          <div>

                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">

                              Recommendation

                            </p>

                            <h3
                              className={`mt-2 text-3xl font-black ${recommendationStyle.text} drop-shadow-[0_0_16px_rgba(163,230,53,0.25)]`}
                            >

                              {String(
                                analysis.recommendation
                              ).toUpperCase()}

                            </h3>

                          </div>

                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-3">

                          <p className="text-xs text-gray-500">

                            AI pricing decision

                          </p>

                          <p className={`mt-1 text-sm font-bold ${recommendationStyle.text}`}>

                            Based on current signals

                          </p>

                        </div>

                      </div>

                    </div>

                  );

                })()}


                {/* ==================================================
                    WHY THIS PRICE
                ================================================== */}

                <div className="mt-7">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10">

                      <Brain className="h-5 w-5 text-lime-300" />

                    </div>

                    <div>

                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-300">

                        Intelligence Explanation

                      </p>

                      <h3 className="mt-1 text-2xl font-black">

                        Why This Price?

                      </h3>

                    </div>

                  </div>


                  {/* Signal Cards */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">


                    {/* Demand */}

                    <div className="rounded-2xl border border-white/10 bg-[#030604] p-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                          <TrendingUp className="h-5 w-5 text-lime-300" />

                        </div>

                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">

                          Demand Level

                        </p>

                      </div>

                      <p className={`mt-5 text-2xl font-black ${getDemandStyle(analysis.demand_level).text}`}>

                        {analysis.demand_level}

                      </p>

                      <p className="mt-2 text-xs text-gray-600">

                        Index:{" "}

                        {Number(
                          analysis.demand_index
                        ).toFixed(2)}

                      </p>

                    </div>


                    {/* Sales */}

                    <div className="rounded-2xl border border-white/10 bg-[#030604] p-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                          <ShoppingCart className="h-5 w-5 text-lime-300" />

                        </div>

                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">

                          Sales Velocity

                        </p>

                      </div>

                      <p className="mt-5 text-2xl font-black text-white">

                        {analysis.sales_velocity}

                      </p>

                      <p className="mt-2 text-xs text-gray-600">

                        {Number(
                          analysis.units_sold
                        ).toLocaleString("en-IN")}{" "}
                        units sold

                      </p>

                    </div>


                    {/* Inventory */}

                    <div className="rounded-2xl border border-white/10 bg-[#030604] p-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                          <Package className="h-5 w-5 text-lime-300" />

                        </div>

                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">

                          Inventory

                        </p>

                      </div>

                      <p className="mt-5 text-2xl font-black text-white">

                        {analysis.inventory_status}

                      </p>

                      <p className="mt-2 text-xs text-gray-600">

                        {Number(
                          analysis.stock
                        ).toLocaleString("en-IN")}{" "}
                        units available

                      </p>

                    </div>


                    {/* Discount */}

                    <div className="rounded-2xl border border-white/10 bg-[#030604] p-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                          <Percent className="h-5 w-5 text-lime-300" />

                        </div>

                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">

                          Discount

                        </p>

                      </div>

                      <p className="mt-5 text-2xl font-black text-white">

                        {Number(
                          analysis.discount_pct
                        ).toFixed(2)}%

                      </p>

                      <p className="mt-2 text-xs text-gray-600">

                        Historical discount signal

                      </p>

                    </div>

                  </div>


                  {/* ==================================================
                      BASE PRICE / CURRENT PRICE
                  ================================================== */}

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">


                    <div className="rounded-2xl border border-white/10 bg-[#030604] p-5">

                      <div className="flex items-center gap-3">

                        <IndianRupee className="h-5 w-5 text-lime-300" />

                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">

                          Historical Base Price

                        </p>

                      </div>

                      <p className="mt-4 text-3xl font-black text-white">

                        ₹{formatCurrency(
                          analysis.base_price
                        )}

                      </p>

                    </div>


                    <div className="rounded-2xl border border-lime-300/20 bg-lime-300/[0.035] p-5 shadow-[0_0_30px_rgba(163,230,53,0.05)]">

                      <div className="flex items-center gap-3">

                        <Gauge className="h-5 w-5 text-lime-300" />

                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">

                          Current Product Price

                        </p>

                      </div>

                      <p className="mt-4 text-3xl font-black text-lime-300 drop-shadow-[0_0_13px_rgba(163,230,53,0.30)]">

                        ₹{formatCurrency(
                          analysis.current_price
                        )}

                      </p>

                    </div>

                  </div>


                  {/* ==================================================
                      REASONS
                  ================================================== */}

                  <div className="mt-5 rounded-[26px] border border-lime-300/15 bg-lime-300/[0.025] p-6 sm:p-7">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                        <Sparkles className="h-5 w-5 text-lime-300" />

                      </div>

                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-300">

                        Key Pricing Factors

                      </p>

                    </div>


                    <div className="mt-6 space-y-4">

                      {Array.isArray(
                        analysis.reasons
                      ) && analysis.reasons.map(
                        (reason, index) => (

                          <div
                            key={index}
                            className="flex items-start gap-4 rounded-xl border border-white/5 bg-[#030604]/70 px-5 py-4"
                          >

                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime-300/10">

                              <CheckCircle2 className="h-4 w-4 text-lime-300" />

                            </div>

                            <p className="text-sm leading-6 text-gray-400">

                              {reason}

                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

        )}


        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {!analysis &&
          !analysisLoading &&
          selectedProduct && (

            <section className="mt-7 rounded-[28px] border border-dashed border-lime-300/20 bg-[#071009] px-7 py-10 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-300/10">

                <Zap className="h-7 w-7 text-lime-300" />

              </div>

              <h3 className="mt-5 text-xl font-bold">

                Ready to Analyze

              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">

                Select a product above and click
                <span className="font-semibold text-lime-300">
                  {" "}Analyze Pricing
                </span>
                {" "}to generate an ML-powered pricing recommendation.

              </p>

            </section>

          )}


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/5 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-700 sm:flex-row">

          <span>

            PricePilot AI · Pricing Intelligence

          </span>

          <span className="flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.8)]" />

            Product Pricing Engine Active

          </span>

        </div>

      </main>

    </div>

  );
}


export default PricingIntelligence;

