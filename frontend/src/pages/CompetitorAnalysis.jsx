import { useEffect, useMemo, useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ShoppingBag,
  Store,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import api from "../api/axios";
import { compareCompetitorPrices } from "../api/competitorAnalysis";

// ============================================================
// HELPERS
// ============================================================

const parsePrice = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const cleaned = String(value).replace(/[₹,\s]/g, "");
  const number = parseFloat(cleaned);

  return Number.isFinite(number) ? number : null;
};

const formatPrice = (value) => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "N/A";
  }

  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
};

const getMarketPosition = (percentage) => {
  if (percentage === null) {
    return {
      label: "Unknown",
      description: "Unable to determine market position.",
      type: "neutral",
    };
  }

  if (percentage <= -5) {
    return {
      label: "Below Market",
      description:
        "Your price is significantly below competitors.",
      type: "positive",
    };
  }

  if (percentage < -2) {
    return {
      label: "Competitive",
      description:
        "Your price is slightly below the market.",
      type: "positive",
    };
  }

  if (percentage <= 2) {
    return {
      label: "Market Aligned",
      description:
        "Your price is closely aligned with competitors.",
      type: "neutral",
    };
  }

  if (percentage <= 5) {
    return {
      label: "Slightly Above Market",
      description:
        "Your price is slightly higher than competitors.",
      type: "warning",
    };
  }

  return {
    label: "Above Market",
    description:
      "Your price is significantly higher than competitors.",
    type: "negative",
  };
};

// ============================================================
// REUSABLE CARD
// ============================================================

const InsightCard = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-lime-300/30
        bg-[#0b182b]/85
        shadow-[0_0_16px_rgba(163,230,53,0.12),0_0_35px_rgba(163,230,53,0.07),0_18px_55px_rgba(0,0,0,0.22),inset_0_0_22px_rgba(163,230,53,0.035)]
        backdrop-blur-sm
        transition-all
        duration-300
        hover:border-lime-300/55
        hover:shadow-[0_0_22px_rgba(163,230,53,0.20),0_0_48px_rgba(163,230,53,0.10),0_20px_60px_rgba(0,0,0,0.25),inset_0_0_28px_rgba(163,230,53,0.05)]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================================
// COMPONENT
// ============================================================

function CompetitorAnalysis() {
  // ----------------------------------------------------------
  // PRODUCTS
  // ----------------------------------------------------------

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  // ----------------------------------------------------------
  // COMPETITOR ANALYSIS
  // ----------------------------------------------------------

  const [competitorData, setCompetitorData] =
    useState(null);

  const [loadingAnalysis, setLoadingAnalysis] =
    useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError("");

        const response = await api.get(
          "/products/?skip=0&limit=100"
        );

        const productList =
          response.data?.items || [];

        setProducts(productList);

        if (productList.length > 0) {
          setSelectedProductId(
            String(productList[0].id)
          );
        }
      } catch (err) {
        console.error(
          "Failed to load products:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to load products."
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // ==========================================================
  // SELECTED PRODUCT
  // ==========================================================

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        String(product.id) ===
        String(selectedProductId)
    );
  }, [products, selectedProductId]);

  // ==========================================================
  // RUN COMPETITOR ANALYSIS
  // ==========================================================

  const handleAnalyze = async () => {
    if (!selectedProduct) {
      setError("Please select a product first.");
      return;
    }

    try {
      setLoadingAnalysis(true);
      setError("");

      const result =
        await compareCompetitorPrices(
          selectedProduct.name
        );

      setCompetitorData(result);
    } catch (err) {
      console.error(
        "Competitor analysis failed:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to retrieve competitor prices."
      );
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // ==========================================================
  // COMPETITOR DATA
  // ==========================================================

  const competitors =
    competitorData?.competitors || [];

  const amazonCompetitor =
    competitors.find(
      (item) =>
        item.platform?.toLowerCase() ===
        "amazon"
    );

  const flipkartCompetitor =
    competitors.find(
      (item) =>
        item.platform?.toLowerCase() ===
        "flipkart"
    );

  const competitorPrices = competitors
    .map((item) => parsePrice(item.price))
    .filter((price) => price !== null);

  const marketAverage =
    competitorPrices.length > 0
      ? competitorPrices.reduce(
          (sum, price) => sum + price,
          0
        ) / competitorPrices.length
      : null;

  const lowestCompetitor =
    competitorPrices.length > 0
      ? Math.min(...competitorPrices)
      : null;

  const highestCompetitor =
    competitorPrices.length > 0
      ? Math.max(...competitorPrices)
      : null;

  const yourPrice = selectedProduct
    ? Number(selectedProduct.current_price)
    : null;

  // ==========================================================
  // MARKET DIFFERENCE
  // ==========================================================

  const priceDifference =
    yourPrice !== null &&
    marketAverage !== null
      ? yourPrice - marketAverage
      : null;

  const marketPercentage =
    yourPrice !== null &&
    marketAverage !== null &&
    marketAverage !== 0
      ? ((yourPrice - marketAverage) /
          marketAverage) *
        100
      : null;

  const marketPosition =
    getMarketPosition(marketPercentage);

  // ==========================================================
  // PRICE COMPARISON DATA
  // ==========================================================

  const chartValues = [
    {
      label: "Your Price",
      platform: "Your Store",
      price: yourPrice,
      highlight: true,
    },
    {
      label: "Amazon",
      platform: "Amazon",
      price: parsePrice(
        amazonCompetitor?.price
      ),
      highlight: false,
    },
    {
      label: "Flipkart",
      platform: "Flipkart",
      price: parsePrice(
        flipkartCompetitor?.price
      ),
      highlight: false,
    },
  ];

  const validChartValues =
    chartValues.filter(
      (item) => item.price !== null
    );

  const chartMaximum =
    validChartValues.length > 0
      ? Math.max(
          ...validChartValues.map(
            (item) => item.price
          )
        )
      : 0;

  // ==========================================================
  // MARKET POSITION COLOR
  // ==========================================================

  const marketPositionClass =
    marketPosition.type === "positive"
      ? "text-lime-300"
      : marketPosition.type === "negative"
      ? "text-red-300"
      : marketPosition.type === "warning"
      ? "text-yellow-300"
      : "text-slate-200";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#07111f] text-white">

      {/* ======================================================
          PAGE CONTENT
          Navbar and Sidebar are handled by DashboardLayout.
      ====================================================== */}

      <div className="min-w-0 w-full">

        <div className="px-5 py-7 md:px-8 md:py-8 lg:px-10">

          {/* ==================================================
              PAGE HEADING
          ================================================== */}

          <section className="mb-8">

            <div className="flex items-start gap-4">

              {/* ==================================================
                  ENHANCED STORE ICON
              ================================================== */}

              <div
                className="
                  mt-0.5
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-lime-300/50
                  bg-lime-300/[0.08]
                  shadow-[0_0_20px_rgba(163,230,53,0.22),0_0_42px_rgba(163,230,53,0.13),inset_0_0_20px_rgba(163,230,53,0.07)]
                  transition-all
                  duration-300
                  hover:border-lime-300/80
                  hover:bg-lime-300/[0.12]
                  hover:shadow-[0_0_28px_rgba(163,230,53,0.32),0_0_58px_rgba(163,230,53,0.18),inset_0_0_24px_rgba(163,230,53,0.10)]
                "
              >
                <Store
                  className="
                    h-7
                    w-7
                    text-lime-300
                    drop-shadow-[0_0_8px_rgba(163,230,53,0.65)]
                  "
                />
              </div>

              <div className="min-w-0">

                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    text-white
                    md:text-4xl
                  "
                >
                  Competitor Analysis
                </h1>

                <p
                  className="
                    mt-1
                    max-w-2xl
                    text-xs
                    leading-5
                    text-slate-300/50
                    sm:text-sm
                  "
                >
                  Monitor competitor pricing across
                  major marketplaces and understand
                  your current market position.
                </p>

              </div>

            </div>

          </section>

          {/* ==================================================
              PRODUCT SELECTOR
          ================================================== */}

          <InsightCard className="mb-8 p-5 md:p-6">

            <div className="mb-4 flex items-center gap-2">

              <Search className="h-5 w-5 text-lime-300 drop-shadow-[0_0_7px_rgba(163,230,53,0.65)]" />

              <div>

                <h2 className="text-base font-bold">
                  Select Product
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-300/40">
                  Choose a product from your catalog
                  to compare marketplace prices.
                </p>

              </div>

            </div>

            <div className="flex flex-col gap-4 lg:flex-row">

              <div className="min-w-0 flex-1">

                <select
                  value={selectedProductId}
                  onChange={(event) => {
                    setSelectedProductId(
                      event.target.value
                    );

                    setCompetitorData(null);
                    setError("");
                  }}
                  disabled={loadingProducts}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-lime-300/30
                    bg-[#091525]
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-white
                    outline-none
                    transition-all
                    duration-300
                    shadow-[0_0_12px_rgba(163,230,53,0.08),0_0_22px_rgba(163,230,53,0.04),inset_0_0_14px_rgba(163,230,53,0.025)]
                    hover:border-lime-300/50
                    hover:shadow-[0_0_16px_rgba(163,230,53,0.13),0_0_30px_rgba(163,230,53,0.06)]
                    focus:border-lime-300/65
                    focus:ring-2
                    focus:ring-lime-300/10
                    focus:shadow-[0_0_20px_rgba(163,230,53,0.16),0_0_36px_rgba(163,230,53,0.07)]
                  "
                >

                  <option value="">
                    {loadingProducts
                      ? "Loading products..."
                      : "Select a product from your catalog"}
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                      {" — "}
                      {formatPrice(
                        product.current_price
                      )}
                    </option>
                  ))}

                </select>

              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={
                  !selectedProduct ||
                  loadingAnalysis
                }
                className="
                  flex
                  min-h-[48px]
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-lime-300/60
                  bg-lime-300/10
                  px-6
                  py-3
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-lime-300
                  shadow-[0_0_14px_rgba(163,230,53,0.13),0_0_28px_rgba(163,230,53,0.07),inset_0_0_12px_rgba(163,230,53,0.04)]
                  transition-all
                  duration-300
                  hover:border-lime-300
                  hover:bg-lime-300/15
                  hover:shadow-[0_0_22px_rgba(163,230,53,0.22),0_0_42px_rgba(163,230,53,0.11),inset_0_0_16px_rgba(163,230,53,0.06)]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >

                {loadingAnalysis ? (
                  <>
                    <RefreshCw
                      className="h-4 w-4 animate-spin"
                    />

                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />

                    Analyze Competitors
                  </>
                )}

              </button>

            </div>

            {selectedProduct && (

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  gap-x-6
                  gap-y-2
                  rounded-xl
                  border
                  border-lime-300/25
                  bg-[#07111f]/60
                  px-4
                  py-3
                  shadow-[0_0_14px_rgba(163,230,53,0.08),0_0_28px_rgba(163,230,53,0.035),inset_0_0_14px_rgba(163,230,53,0.025)]
                "
              >

                <span className="text-xs text-slate-300/45">

                  Category:

                  <strong className="ml-1 text-slate-100/85">
                    {selectedProduct.category}
                  </strong>

                </span>

                <span className="text-xs text-slate-300/45">

                  Current Price:

                  <strong className="ml-1 text-lime-300">
                    {formatPrice(
                      selectedProduct.current_price
                    )}
                  </strong>

                </span>

                <span className="text-xs text-slate-300/45">

                  Stock:

                  <strong className="ml-1 text-slate-100/85">
                    {Number(
                      selectedProduct.stock || 0
                    ).toLocaleString("en-IN")}
                  </strong>

                </span>

              </div>

            )}

          </InsightCard>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div
              className="
                mb-8
                flex
                items-start
                gap-3
                rounded-xl
                border
                border-red-400/30
                bg-red-400/[0.06]
                px-5
                py-4
                text-sm
                text-red-300
                shadow-[0_0_18px_rgba(248,113,113,0.10),0_0_32px_rgba(248,113,113,0.05),inset_0_0_16px_rgba(248,113,113,0.025)]
              "
            >

              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 drop-shadow-[0_0_6px_rgba(248,113,113,0.60)]"
              />

              <span>{error}</span>

            </div>

          )}

          {/* ==================================================
              RESULTS
          ================================================== */}

          {competitorData && (

            <>

              {/* ==============================================
                  SUMMARY CARDS
              ============================================== */}

              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* YOUR PRICE */}

                <InsightCard className="p-5">

                  <div className="flex items-center justify-between">

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-slate-300/45
                      "
                    >
                      Your Price
                    </p>

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-lime-300/30
                        bg-lime-300/[0.07]
                        shadow-[0_0_10px_rgba(163,230,53,0.10),0_0_18px_rgba(163,230,53,0.05)]
                      "
                    >
                      <Store className="h-4 w-4 text-lime-300 drop-shadow-[0_0_6px_rgba(163,230,53,0.6)]" />
                    </div>

                  </div>

                  <p className="mt-4 text-2xl font-black text-white">
                    {formatPrice(yourPrice)}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-300/35">
                    PricePilot catalog price
                  </p>

                </InsightCard>

                {/* MARKET AVERAGE */}

                <InsightCard className="p-5">

                  <div className="flex items-center justify-between">

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-slate-300/45
                      "
                    >
                      Market Average
                    </p>

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-lime-300/30
                        bg-lime-300/[0.07]
                        shadow-[0_0_10px_rgba(163,230,53,0.10),0_0_18px_rgba(163,230,53,0.05)]
                      "
                    >
                      <BarChart3 className="h-4 w-4 text-lime-300 drop-shadow-[0_0_6px_rgba(163,230,53,0.6)]" />
                    </div>

                  </div>

                  <p className="mt-4 text-2xl font-black text-white">
                    {formatPrice(marketAverage)}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-300/35">
                    Based on available competitors
                  </p>

                </InsightCard>

                {/* LOWEST */}

                <InsightCard className="p-5">

                  <div className="flex items-center justify-between">

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-slate-300/45
                      "
                    >
                      Lowest Competitor
                    </p>

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-lime-300/30
                        bg-lime-300/[0.07]
                        shadow-[0_0_10px_rgba(163,230,53,0.10),0_0_18px_rgba(163,230,53,0.05)]
                      "
                    >
                      <TrendingDown className="h-4 w-4 text-lime-300 drop-shadow-[0_0_6px_rgba(163,230,53,0.6)]" />
                    </div>

                  </div>

                  <p className="mt-4 text-2xl font-black text-white">
                    {formatPrice(lowestCompetitor)}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-300/35">
                    Lowest observed marketplace price
                  </p>

                </InsightCard>

                {/* POSITION */}

                <InsightCard className="p-5">

                  <div className="flex items-center justify-between">

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-slate-300/45
                      "
                    >
                      Market Position
                    </p>

                    {marketPosition.type ===
                      "positive" && (
                      <CheckCircle2 className="h-4 w-4 text-lime-300 drop-shadow-[0_0_6px_rgba(163,230,53,0.60)]" />
                    )}

                    {marketPosition.type ===
                      "negative" && (
                      <TrendingUp className="h-4 w-4 text-red-300 drop-shadow-[0_0_6px_rgba(248,113,113,0.50)]" />
                    )}

                    {marketPosition.type ===
                      "warning" && (
                      <AlertTriangle className="h-4 w-4 text-yellow-300 drop-shadow-[0_0_6px_rgba(253,224,71,0.50)]" />
                    )}

                    {marketPosition.type ===
                      "neutral" && (
                      <Minus className="h-4 w-4 text-slate-400" />
                    )}

                  </div>

                  <p
                    className={`
                      mt-4
                      text-xl
                      font-black
                      ${marketPositionClass}
                    `}
                  >
                    {marketPosition.label}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-300/35">

                    {marketPercentage !== null
                      ? `${
                          marketPercentage >= 0
                            ? "+"
                            : ""
                        }${marketPercentage.toFixed(
                          1
                        )}% vs market`
                      : "Insufficient data"}

                  </p>

                </InsightCard>

              </div>

              {/* ==============================================
                  MAIN GRID
              ============================================== */}

              <div className="grid gap-6 xl:grid-cols-3">

                {/* ============================================
                    COMPARISON TABLE
                ============================================ */}

                <InsightCard className="overflow-hidden xl:col-span-2">

                  <div
                    className="
                      border-b
                      border-lime-300/[0.15]
                      px-5
                      py-5
                      md:px-6
                      shadow-[0_1px_12px_rgba(163,230,53,0.06)]
                    "
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-lg
                          border
                          border-lime-300/30
                          bg-lime-300/[0.07]
                          shadow-[0_0_10px_rgba(163,230,53,0.10),0_0_18px_rgba(163,230,53,0.05)]
                        "
                      >
                        <ShoppingBag className="h-4 w-4 text-lime-300 drop-shadow-[0_0_6px_rgba(163,230,53,0.6)]" />
                      </div>

                      <div>

                        <h2 className="font-bold">
                          Competitor Comparison
                        </h2>

                        <p className="mt-0.5 text-[10px] text-slate-300/35">
                          Live marketplace prices
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[650px] text-left">

                      <thead>

                        <tr
                          className="
                            border-b
                            border-lime-300/[0.10]
                            text-[9px]
                            uppercase
                            tracking-[0.16em]
                            text-slate-300/35
                          "
                        >

                          <th className="px-6 py-4">
                            Platform
                          </th>

                          <th className="px-6 py-4">
                            Product
                          </th>

                          <th className="px-6 py-4">
                            Price
                          </th>

                          <th className="px-6 py-4">
                            Difference
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {/* YOUR STORE */}

                        <tr
                          className="
                            border-b
                            border-white/[0.04]
                            bg-lime-300/[0.025]
                          "
                        >

                          <td className="px-6 py-4">

                            <span className="font-bold text-lime-300">
                              Your Store
                            </span>

                          </td>

                          <td className="px-6 py-4 text-sm text-slate-100/80">
                            {selectedProduct?.name}
                          </td>

                          <td className="px-6 py-4 font-bold text-white">
                            {formatPrice(yourPrice)}
                          </td>

                          <td className="px-6 py-4 text-slate-300/35">
                            —
                          </td>

                        </tr>

                        {/* COMPETITORS */}

                        {competitors.map(
                          (competitor, index) => {

                            const competitorPrice =
                              parsePrice(
                                competitor.price
                              );

                            const difference =
                              yourPrice !== null &&
                              competitorPrice !== null
                                ? yourPrice -
                                  competitorPrice
                                : null;

                            return (
                              <tr
                                key={`${competitor.platform}-${index}`}
                                className="
                                  border-b
                                  border-white/[0.04]
                                  transition
                                  hover:bg-lime-300/[0.025]
                                "
                              >

                                <td className="px-6 py-4">

                                  <span className="font-medium text-slate-100/80">
                                    {competitor.platform}
                                  </span>

                                </td>

                                <td className="max-w-xs px-6 py-4 text-sm text-slate-100/60">

                                  <div className="line-clamp-2">
                                    {competitor.product}
                                  </div>

                                </td>

                                <td className="px-6 py-4 font-bold text-white">
                                  {formatPrice(
                                    competitorPrice
                                  )}
                                </td>

                                <td className="px-6 py-4">

                                  {difference === null ? (

                                    <span className="text-slate-300/35">
                                      N/A
                                    </span>

                                  ) : (

                                    <span
                                      className={
                                        difference > 0
                                          ? "font-semibold text-red-300"
                                          : difference < 0
                                          ? "font-semibold text-lime-300"
                                          : "text-slate-300/50"
                                      }
                                    >

                                      {difference > 0
                                        ? "+"
                                        : ""}

                                      {formatPrice(
                                        difference
                                      )}

                                    </span>

                                  )}

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                </InsightCard>

                {/* ============================================
                    MARKET INSIGHT
                ============================================ */}

                <InsightCard
                  className="
                    bg-gradient-to-br
                    from-lime-300/[0.06]
                    via-[#0b182b]/90
                    to-[#091525]
                    p-6
                    shadow-[0_0_20px_rgba(163,230,53,0.13),0_0_40px_rgba(163,230,53,0.06),0_18px_55px_rgba(0,0,0,0.22),inset_0_0_24px_rgba(163,230,53,0.04)]
                  "
                >

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-lime-300/30
                        bg-lime-300/[0.07]
                        shadow-[0_0_12px_rgba(163,230,53,0.13),0_0_24px_rgba(163,230,53,0.06)]
                      "
                    >

                      <TrendingUp className="h-5 w-5 text-lime-300 drop-shadow-[0_0_7px_rgba(163,230,53,0.60)]" />

                    </div>

                    <div>

                      <p
                        className="
                          text-[9px]
                          font-bold
                          uppercase
                          tracking-[0.16em]
                          text-lime-300/70
                        "
                      >
                        Market Insight
                      </p>

                      <h3 className="mt-1 font-bold">
                        {marketPosition.label}
                      </h3>

                    </div>

                  </div>

                  <p className="mt-6 text-sm leading-6 text-slate-100/65">
                    {marketPosition.description}
                  </p>

                  {priceDifference !== null && (

                    <div
                      className="
                        mt-6
                        rounded-xl
                        border
                        border-lime-300/25
                        bg-[#07111f]/70
                        p-4
                        shadow-[0_0_14px_rgba(163,230,53,0.08),0_0_26px_rgba(163,230,53,0.035),inset_0_0_14px_rgba(163,230,53,0.025)]
                      "
                    >

                      <p className="text-[10px] uppercase tracking-wider text-slate-300/35">
                        Difference from market average
                      </p>

                      <p
                        className={`
                          mt-2
                          text-2xl
                          font-black
                          ${
                            priceDifference > 0
                              ? "text-red-300"
                              : priceDifference < 0
                              ? "text-lime-300"
                              : "text-white"
                          }
                        `}
                      >

                        {priceDifference > 0
                          ? "+"
                          : ""}

                        {formatPrice(
                          priceDifference
                        )}

                      </p>

                    </div>

                  )}

                  <div className="mt-6 space-y-3">

                    <div className="flex justify-between gap-4 text-sm">

                      <span className="text-slate-300/45">
                        Highest Competitor
                      </span>

                      <span className="font-bold text-white">
                        {formatPrice(
                          highestCompetitor
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between gap-4 text-sm">

                      <span className="text-slate-300/45">
                        Lowest Competitor
                      </span>

                      <span className="font-bold text-white">
                        {formatPrice(
                          lowestCompetitor
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between gap-4 text-sm">

                      <span className="text-slate-300/45">
                        Market Average
                      </span>

                      <span className="font-bold text-lime-300">
                        {formatPrice(
                          marketAverage
                        )}
                      </span>

                    </div>

                  </div>

                </InsightCard>

              </div>

              {/* ==============================================
                  PRICE COMPARISON
              ============================================== */}

              <InsightCard className="mt-6 p-5 md:p-6">

                <div className="mb-6">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-lime-300/30
                        bg-lime-300/[0.07]
                        shadow-[0_0_10px_rgba(163,230,53,0.10),0_0_18px_rgba(163,230,53,0.05)]
                      "
                    >
                      <BarChart3 className="h-4 w-4 text-lime-300 drop-shadow-[0_0_6px_rgba(163,230,53,0.6)]" />
                    </div>

                    <div>

                      <h2 className="font-bold">
                        Price Comparison
                      </h2>

                      <p className="mt-0.5 text-[10px] text-slate-300/35">
                        Current observed prices across
                        platforms
                      </p>

                    </div>

                  </div>

                </div>

                <div className="space-y-5">

                  {chartValues.map((item) => {

                    if (item.price === null) {
                      return null;
                    }

                    const width =
                      chartMaximum > 0
                        ? (item.price /
                            chartMaximum) *
                          100
                        : 0;

                    return (
                      <div key={item.label}>

                        <div className="mb-2 flex items-center justify-between gap-4">

                          <div className="flex items-center gap-2">

                            <span
                              className={`
                                h-1.5
                                w-1.5
                                rounded-full
                                ${
                                  item.highlight
                                    ? "bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.9)]"
                                    : "bg-slate-500"
                                }
                              `}
                            />

                            <span
                              className={`
                                text-sm
                                ${
                                  item.highlight
                                    ? "font-semibold text-lime-300"
                                    : "text-slate-100/65"
                                }
                              `}
                            >
                              {item.label}
                            </span>

                          </div>

                          <span className="text-sm font-bold text-white">
                            {formatPrice(item.price)}
                          </span>

                        </div>

                        <div
                          className="
                            h-3
                            overflow-hidden
                            rounded-full
                            border
                            border-lime-300/[0.12]
                            bg-slate-900/80
                            shadow-[0_0_10px_rgba(163,230,53,0.05),inset_0_0_10px_rgba(163,230,53,0.025)]
                          "
                        >

                          <div
                            className="
                              h-full
                              rounded-full
                              bg-gradient-to-r
                              from-lime-400
                              to-lime-200
                              shadow-[0_0_16px_rgba(163,230,53,0.42)]
                              transition-all
                              duration-700
                            "
                            style={{
                              width: `${width}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  })}

                </div>

              </InsightCard>

            </>

          )}

          {/* ==================================================
              EMPTY STATE
          ================================================== */}

          {!competitorData &&
            !loadingAnalysis && (

              <div
                className="
                  rounded-2xl
                  border
                  border-dashed
                  border-lime-300/30
                  bg-[#0b182b]/50
                  px-6
                  py-20
                  text-center
                  shadow-[0_0_18px_rgba(163,230,53,0.08),0_0_35px_rgba(163,230,53,0.04),inset_0_0_24px_rgba(163,230,53,0.025)]
                  transition-all
                  duration-300
                  hover:border-lime-300/45
                  hover:shadow-[0_0_24px_rgba(163,230,53,0.13),0_0_46px_rgba(163,230,53,0.06),inset_0_0_28px_rgba(163,230,53,0.035)]
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-lime-300/30
                    bg-lime-300/[0.07]
                    shadow-[0_0_18px_rgba(163,230,53,0.13),0_0_34px_rgba(163,230,53,0.06),inset_0_0_16px_rgba(163,230,53,0.04)]
                  "
                >

                  <BarChart3
                    className="
                      h-8
                      w-8
                      text-lime-300
                      drop-shadow-[0_0_9px_rgba(163,230,53,0.70)]
                    "
                  />

                </div>

                <h2 className="mt-5 text-lg font-bold text-white">
                  Ready for competitor analysis
                </h2>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-slate-300/40
                  "
                >
                  Select a product from your PricePilot
                  catalog and analyze its current
                  marketplace prices on Amazon and
                  Flipkart.
                </p>

              </div>

            )}

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div
            className="
              mt-8
              flex
              flex-col
              gap-2
              border-t
              border-lime-300/[0.14]
              pt-4
              text-[8px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-slate-500/40
              sm:flex-row
              sm:items-center
              sm:justify-between
              shadow-[0_-1px_12px_rgba(163,230,53,0.04)]
            "
          >

            <span>
              PricePilot AI · Market Intelligence
            </span>

            <span className="flex items-center gap-2">

              <span
                className="
                  h-1.5
                  w-1.5
                  animate-pulse
                  rounded-full
                  bg-lime-300
                  shadow-[0_0_8px_rgba(163,230,53,1)]
                "
              />

              Live Competitor Monitoring

            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CompetitorAnalysis;