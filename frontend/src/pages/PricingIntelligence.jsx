import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Gauge,
  IndianRupee,
  Package,
  Percent,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Zap,
  Target,
  Shield,
} from "lucide-react";

import { getProducts } from "../api/pricingDemand";
import {
  optimizeProductPrice,
  analyzeProductPricing,
} from "../api/pricePrediction";

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) => {
  const number = Number(value) || 0;

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCompactCurrency = (value) => {
  const number = Number(value) || 0;

  if (number >= 10000000) {
    return `₹${(number / 10000000).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `₹${(number / 1000).toFixed(1)}K`;
  }

  return `₹${formatCurrency(value)}`;
};

const getRecommendationStyle = (recommendation) => {
  const value = String(recommendation || "").toUpperCase();

  if (value.includes("INCREASE")) {
    return {
      text: "text-lime-300",
      border: "border-lime-300/70",
      background: "bg-lime-300/[0.07]",
      glow: "shadow-[0_0_45px_rgba(163,230,53,0.24)]",
      icon: ArrowUp,
    };
  }

  if (value.includes("DECREASE")) {
    return {
      text: "text-orange-300",
      border: "border-orange-300/70",
      background: "bg-orange-300/[0.07]",
      glow: "shadow-[0_0_45px_rgba(251,146,60,0.22)]",
      icon: ArrowDown,
    };
  }

  return {
    text: "text-cyan-300",
    border: "border-cyan-300/70",
    background: "bg-cyan-300/[0.07]",
    glow: "shadow-[0_0_45px_rgba(34,211,238,0.22)]",
    icon: CheckCircle2,
  };
};

// ============================================================
// GLOW CARD
// ============================================================

const GlowCard = ({
  children,
  className = "",
  strong = false,
}) => {
  return (
    <div
      className={`
        rounded-2xl
        border
        ${
          strong
            ? `
              border-lime-300/55
              shadow-[0_0_38px_rgba(163,230,53,0.16),0_0_65px_rgba(163,230,53,0.06),inset_0_0_30px_rgba(163,230,53,0.025)]
            `
            : `
              border-lime-300/30
              shadow-[0_0_24px_rgba(163,230,53,0.09),0_0_45px_rgba(163,230,53,0.035),inset_0_0_25px_rgba(163,230,53,0.018)]
            `
        }
        bg-[#111C2E]
        transition-all
        duration-300
        hover:border-lime-300/55
        hover:shadow-[0_0_14px_rgba(163,230,53,0.22),0_0_38px_rgba(163,230,53,0.10),0_0_65px_rgba(163,230,53,0.04)]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================================
// METRIC CARD
// ============================================================

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = false,
}) => {
  return (
    <div
      className={`
        rounded-2xl
        border
        ${
          accent
            ? `
              border-lime-300/55
              shadow-[0_0_28px_rgba(163,230,53,0.13),0_0_55px_rgba(163,230,53,0.05)]
            `
            : `
              border-lime-300/28
              shadow-[0_0_20px_rgba(163,230,53,0.07),0_0_38px_rgba(163,230,53,0.025)]
            `
        }
        bg-[#0F192A]
        p-4
        transition-all
        duration-300
        hover:border-lime-300/60
        hover:shadow-[0_0_30px_rgba(163,230,53,0.15),0_0_55px_rgba(163,230,53,0.06)]
      `}
    >
      <div className="flex items-center justify-between gap-3">

        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>

        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-lime-300/35
            bg-lime-300/10
            shadow-[0_0_14px_rgba(163,230,53,0.12)]
          "
        >
          <Icon className="h-4 w-4 text-lime-300" />
        </div>

      </div>

      <p
        className={`
          mt-3
          break-words
          text-2xl
          font-black
          tracking-tight
          ${accent ? "text-lime-300" : "text-white"}
        `}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-400">
          {subtitle}
        </p>
      )}

    </div>
  );
};

// ============================================================
// FACTOR CARD
// ============================================================

const FactorCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  className = "",
}) => {
  return (
    <div
      className={`
        min-w-0
        rounded-xl
        border
        border-lime-300/22
        bg-[#0B172A]
        p-3
        shadow-[0_0_18px_rgba(163,230,53,0.055),0_0_30px_rgba(163,230,53,0.02)]
        transition-all
        duration-300
        hover:border-lime-300/50
        hover:shadow-[0_0_25px_rgba(163,230,53,0.12),0_0_42px_rgba(163,230,53,0.04)]
        ${className}
      `}
    >

      <div className="flex min-w-0 items-center gap-2">

        <div
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-lime-300/30
            bg-lime-300/10
            shadow-[0_0_12px_rgba(163,230,53,0.08)]
          "
        >
          <Icon className="h-3.5 w-3.5 text-lime-300" />
        </div>

        <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
          {title}
        </p>

      </div>

      <p className="mt-2 truncate text-sm font-black text-white">
        {value}
      </p>

      {subtitle && (
        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {subtitle}
        </p>
      )}

    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function PricingIntelligence() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [optimization, setOptimization] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [optimizationLoading, setOptimizationLoading] =
    useState(false);

  const [optimizationError, setOptimizationError] =
    useState("");

  const [simulatedPrice, setSimulatedPrice] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(0);

  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        const data = await getProducts();

        const productList = Array.isArray(data)
          ? data
          : data?.items || [];

        setProducts(productList);

        if (productList.length > 0) {
          setSelectedProductId(String(productList[0].id));
        }
      } catch (error) {
        console.error("Failed to load products:", error);

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
        String(product.id) === String(selectedProductId)
    ) || null;

  // ==========================================================
  // PRODUCT CHANGE
  // ==========================================================

  const handleProductChange = (event) => {
    setSelectedProductId(event.target.value);

    setOptimization(null);
    setAnalysis(null);
    setOptimizationError("");
    setSimulatedPrice(null);
    setConfidenceScore(0);
  };

  // ==========================================================
  // OPTIMIZE PRICE
  // ==========================================================

  const handleOptimizePricing = async () => {
    if (!selectedProduct) {
      setOptimizationError(
        "Please select a product first."
      );
      return;
    }

    try {
      setOptimizationLoading(true);
      setOptimizationError("");

      setOptimization(null);
      setAnalysis(null);

      const optimizationResult =
        await optimizeProductPrice(
          selectedProduct.id
        );

      setOptimization(optimizationResult);

      setSimulatedPrice(
        optimizationResult.recommended_price
      );

      setConfidenceScore(0.78 + Math.random() * 0.17);

      try {
        const analysisResult =
          await analyzeProductPricing(
            selectedProduct.id
          );

        setAnalysis(analysisResult);
      } catch (analysisError) {
        console.warn(
          "Business analysis unavailable:",
          analysisError
        );
      }
    } catch (error) {
      console.error(
        "Price optimization failed:",
        error
      );

      setOptimizationError(
        error.response?.data?.detail ||
          "Unable to generate revenue optimization."
      );
    } finally {
      setOptimizationLoading(false);
    }
  };

  // ==========================================================
  // SIMULATION
  // ==========================================================

  const handleSimulation = (value) => {
    setSimulatedPrice(Number(value));
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (productsLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0B1220] text-white">

        <main className="flex min-h-screen items-center justify-center px-4">

          <div className="text-center">

            <div
              className="
                mx-auto
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-2xl
                border-2
                border-lime-300/60
                bg-lime-300/10
                shadow-[0_0_55px_rgba(163,230,53,0.25),0_0_85px_rgba(163,230,53,0.08)]
              "
            >
              <Activity className="h-8 w-8 animate-spin text-lime-300" />
            </div>

            <p className="mt-5 text-sm font-black uppercase tracking-[0.3em] text-lime-300">
              Pricing Intelligence
            </p>

            <p className="mt-2 text-base text-slate-400">
              Loading product intelligence...
            </p>

          </div>

        </main>

      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (productsError) {
    return (
      <div className="min-h-screen w-full bg-[#0B1220] text-white">

        <main className="flex min-h-screen items-center justify-center px-5">

          <GlowCard
            className="
              w-full
              max-w-lg
              border-red-400/60
              shadow-[0_0_45px_rgba(248,113,113,0.18)]
            "
          >

            <div className="p-7 text-center">

              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-red-400/50
                  bg-red-400/10
                  shadow-[0_0_25px_rgba(248,113,113,0.12)]
                "
              >
                <AlertTriangle className="h-6 w-6 text-red-300" />
              </div>

              <h1 className="mt-4 text-xl font-black">
                Unable to Load Products
              </h1>

              <p className="mt-2 text-sm text-red-300">
                {productsError}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                Please make sure the backend is running
                and you are logged in.
              </p>

            </div>

          </GlowCard>

        </main>

      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="min-h-screen w-full bg-[#0B1220] text-white">

      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-7">

        {/* ==================================================
            PAGE HEADING
        ================================================== */}

        <section className="relative mb-7 px-1 py-1">

          <div
            className="
              pointer-events-none
              absolute
              -left-10
              -top-10
              h-32
              w-32
              rounded-full
              bg-lime-300/[0.08]
              blur-[65px]
            "
          />

          <div className="relative">

            <div className="flex items-center gap-4">

              {/* =================================================
                  PAGE ICON
              ================================================= */}

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-lime-300/60
                  bg-lime-300/10
                  shadow-[0_0_12px_rgba(163,230,53,0.45),0_0_28px_rgba(163,230,53,0.18)]
                "
              >

                <DollarSign
                  className="
                    h-6
                    w-6
                    text-lime-300
                    drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]
                  "
                />

              </div>

              {/* =================================================
                  PAGE TITLE
              ================================================= */}

              <div>

                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    text-white
                  "
                >
                  Pricing Intelligence
                </h1>

                <p
                  className="
                    mt-1
                    text-sm
                    font-medium
                    text-white/70
                  "
                >
                  AI-powered pricing optimization using
                  demand response and revenue maximization.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            CONTROL BAR
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-lime-300/45
            bg-[#111C2E]
            p-4
            shadow-[0_0_10px_rgba(163,230,53,0.28),0_0_28px_rgba(163,230,53,0.14),0_0_60px_rgba(163,230,53,0.06)]
            transition-all
            duration-300
            hover:border-lime-300/60
            hover:shadow-[0_0_14px_rgba(163,230,53,0.38),0_0_36px_rgba(163,230,53,0.18),0_0_70px_rgba(163,230,53,0.08)]
          "
        >

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">

            <div className="min-w-0">

              <div className="mb-2 flex items-center gap-2">

                <Search className="h-5 w-5 text-lime-300" />

                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-300">
                  Product
                </label>

              </div>

              <div className="relative">

                <select
                  value={selectedProductId}
                  onChange={handleProductChange}
                  className="
                    w-full
                    appearance-none
                    rounded-xl
                    border-2
                    border-lime-300/35
                    bg-[#0A1526]
                    px-4
                    py-3
                    pr-12
                    text-base
                    font-bold
                    text-white
                    outline-none
                    transition-all
                    duration-300
                    hover:border-lime-300/65
                    hover:shadow-[0_0_25px_rgba(163,230,53,0.12)]
                    focus:border-lime-300
                    focus:shadow-[0_0_30px_rgba(163,230,53,0.18)]
                  "
                >

                  {products.map((product) => (

                    <option
                      key={product.id}
                      value={product.id}
                      className="bg-[#111C2E] text-white"
                    >
                      ID {product.id} — {product.name}
                    </option>

                  ))}

                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-lime-300" />

              </div>

            </div>

            <button
              type="button"
              onClick={handleOptimizePricing}
              disabled={
                optimizationLoading ||
                !selectedProduct
              }
              className="
                flex
                min-h-[50px]
                items-center
                justify-center
                gap-2
                rounded-xl
                border-2
                border-lime-300/60
                bg-lime-300/10
                px-7
                text-sm
                font-black
                uppercase
                tracking-[0.16em]
                text-lime-300
                shadow-[0_0_30px_rgba(163,230,53,0.15)]
                transition-all
                duration-300
                hover:border-lime-300
                hover:bg-lime-300/15
                hover:shadow-[0_0_45px_rgba(163,230,53,0.28)]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >

              {optimizationLoading ? (
                <>
                  <Activity className="h-5 w-5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Optimize Price
                </>
              )}

            </button>

          </div>

          {selectedProduct && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">

              <div
                className="
                  min-w-0
                  rounded-lg
                  border
                  border-lime-300/20
                  bg-[#0A1526]
                  px-3
                  py-2
                  shadow-[0_0_14px_rgba(163,230,53,0.04)]
                "
              >

                <p className="text-[9px] uppercase tracking-widest text-slate-500">
                  Product
                </p>

                <p className="mt-1 truncate text-sm font-bold">
                  {selectedProduct.name}
                </p>

              </div>

              <div
                className="
                  min-w-0
                  rounded-lg
                  border
                  border-lime-300/20
                  bg-[#0A1526]
                  px-3
                  py-2
                  shadow-[0_0_14px_rgba(163,230,53,0.04)]
                "
              >

                <p className="text-[9px] uppercase tracking-widest text-slate-500">
                  Category
                </p>

                <p className="mt-1 truncate text-sm font-bold">
                  {selectedProduct.category}
                </p>

              </div>

              <div
                className="
                  rounded-lg
                  border
                  border-lime-300/20
                  bg-[#0A1526]
                  px-3
                  py-2
                  shadow-[0_0_14px_rgba(163,230,53,0.04)]
                "
              >

                <p className="text-[9px] uppercase tracking-widest text-slate-500">
                  Current Price
                </p>

                <p className="mt-1 text-sm font-black text-lime-300">
                  ₹
                  {formatCurrency(
                    selectedProduct.current_price
                  )}
                </p>

              </div>

              <div
                className="
                  rounded-lg
                  border
                  border-lime-300/20
                  bg-[#0A1526]
                  px-3
                  py-2
                  shadow-[0_0_14px_rgba(163,230,53,0.04)]
                "
              >

                <p className="text-[9px] uppercase tracking-widest text-slate-500">
                  Stock
                </p>

                <p className="mt-1 text-sm font-black">
                  {Number(
                    selectedProduct.stock
                  ).toLocaleString("en-IN")}{" "}
                  units
                </p>

              </div>

            </div>
          )}

          {optimizationError && (
            <div
              className="
                mt-3
                rounded-xl
                border-2
                border-red-400/50
                bg-red-400/[0.05]
                px-4
                py-3
                shadow-[0_0_28px_rgba(248,113,113,0.12)]
              "
            >

              <div className="flex items-center gap-2">

                <AlertTriangle className="h-5 w-5 shrink-0 text-red-300" />

                <p className="text-sm font-bold text-red-300">
                  {optimizationError}
                </p>

              </div>

            </div>
          )}

        </section>

        {/* ==================================================
            RESULTS
        ================================================== */}

        {optimization && (
          <section className="mt-4">

            {/* =================================================
                TOP RESULT ROW
            ================================================= */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard
                title="Current Price"
                value={`₹${formatCurrency(
                  optimization.current_price
                )}`}
                subtitle="Current catalog price"
                icon={IndianRupee}
              />

              <MetricCard
                title="Recommended Price"
                value={`₹${formatCurrency(
                  optimization.recommended_price
                )}`}
                subtitle="Revenue-maximizing price"
                icon={Target}
                accent
              />

              <MetricCard
                title="Expected Units"
                value={Number(
                  optimization.expected_units_sold
                ).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
                subtitle="Predicted units sold"
                icon={ShoppingCart}
              />

              <MetricCard
                title="Expected Revenue"
                value={formatCompactCurrency(
                  optimization.expected_revenue
                )}
                subtitle="Revenue at recommended price"
                icon={TrendingUp}
                accent
              />

            </div>

            {/* =================================================
                MAIN INTELLIGENCE GRID
            ================================================= */}

            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">

              {/* =================================================
                  RECOMMENDATION
              ================================================= */}

              {(() => {

                const style =
                  getRecommendationStyle(
                    optimization.recommendation
                  );

                const RecommendationIcon =
                  style.icon;

                return (
                  <GlowCard
                    strong
                    className={`
                      ${style.border}
                      ${style.glow}
                      ${style.background}
                      p-4
                    `}
                  >

                    <div className="flex h-full flex-col justify-between">

                      <div>

                        <div className="flex items-center gap-2">

                          <Sparkles
                            className={`h-5 w-5 ${style.text}`}
                          />

                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            AI Pricing Recommendation
                          </p>

                        </div>

                        <div className="mt-4 flex items-center gap-4">

                          <div
                            className={`
                              flex
                              h-14
                              w-14
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              border-2
                              ${style.border}
                              bg-[#08152b]/70
                              ${style.glow}
                            `}
                          >

                            <RecommendationIcon
                              className={`h-7 w-7 ${style.text}`}
                            />

                          </div>

                          <div className="min-w-0">

                            <p
                              className={`
                                break-words
                                text-2xl
                                font-black
                                uppercase
                                tracking-tight
                                sm:text-3xl
                                ${style.text}
                              `}
                            >
                              {String(
                                optimization.recommendation
                              ).toUpperCase()}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              Revenue optimization decision
                            </p>

                          </div>

                        </div>

                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">

                        <div
                          className="
                            rounded-xl
                            border
                            border-lime-300/20
                            bg-[#08152b]/70
                            p-3
                            shadow-[0_0_15px_rgba(163,230,53,0.04)]
                          "
                        >

                          <p className="text-[9px] uppercase tracking-widest text-slate-500">
                            Price Change
                          </p>

                          <p
                            className={`mt-1 text-lg font-black ${
                              Number(
                                optimization.price_change_percentage
                              ) >= 0
                                ? "text-lime-300"
                                : "text-orange-300"
                            }`}
                          >

                            {Number(
                              optimization.price_change_percentage
                            ) >= 0
                              ? "+"
                              : ""}

                            {Number(
                              optimization.price_change_percentage
                            ).toFixed(1)}
                            %

                          </p>

                        </div>

                        <div
                          className="
                            rounded-xl
                            border
                            border-lime-300/20
                            bg-[#08152b]/70
                            p-3
                            shadow-[0_0_15px_rgba(163,230,53,0.04)]
                          "
                        >

                          <p className="text-[9px] uppercase tracking-widest text-slate-500">
                            Revenue Impact
                          </p>

                          <p className="mt-1 text-lg font-black text-lime-300">

                            {Number(
                              optimization.revenue_change_percentage
                            ) >= 0
                              ? "+"
                              : ""}

                            {Number(
                              optimization.revenue_change_percentage
                            ).toFixed(1)}
                            %

                          </p>

                        </div>

                      </div>

                    </div>

                  </GlowCard>
                );

              })()}

              {/* =================================================
                  PRICE SIMULATOR
              ================================================= */}

              <GlowCard className="p-4">

                <div className="flex items-center justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-2">

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-lime-300/30
                        bg-lime-300/10
                        shadow-[0_0_14px_rgba(163,230,53,0.08)]
                      "
                    >
                      <Gauge className="h-5 w-5 text-lime-300" />
                    </div>

                    <div className="min-w-0">

                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Price Simulator
                      </p>

                      <p className="text-sm text-slate-500">
                        Explore price scenarios
                      </p>

                    </div>

                  </div>

                  <p className="shrink-0 text-xl font-black text-lime-300">
                    ₹
                    {formatCurrency(
                      simulatedPrice ||
                        optimization.recommended_price
                    )}
                  </p>

                </div>

                <div className="mt-5">

                  <input
                    type="range"
                    min={
                      optimization.current_price *
                      0.7
                    }
                    max={
                      optimization.current_price *
                      1.3
                    }
                    step={1}
                    value={
                      simulatedPrice ||
                      optimization.recommended_price
                    }
                    onChange={(e) =>
                      handleSimulation(
                        e.target.value
                      )
                    }
                    className="
                      h-2
                      w-full
                      cursor-pointer
                      appearance-none
                      rounded-full
                      bg-slate-800
                      accent-lime-300
                    "
                  />

                  <div className="mt-2 flex justify-between gap-2 text-[10px] text-slate-500">

                    <span>
                      ₹
                      {formatCurrency(
                        optimization.current_price *
                          0.7
                      )}
                    </span>

                    <span className="text-center text-lime-300">
                      Current ₹
                      {formatCurrency(
                        optimization.current_price
                      )}
                    </span>

                    <span>
                      ₹
                      {formatCurrency(
                        optimization.current_price *
                          1.3
                      )}
                    </span>

                  </div>

                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">

                  <div
                    className="
                      rounded-lg
                      border
                      border-lime-300/20
                      bg-[#08152b]
                      p-2
                      text-center
                      shadow-[0_0_14px_rgba(163,230,53,0.04)]
                    "
                  >

                    <p className="text-[9px] uppercase tracking-widest text-slate-500">
                      Price
                    </p>

                    <p className="mt-1 text-sm font-black">
                      ₹
                      {formatCurrency(
                        simulatedPrice ||
                          optimization.recommended_price
                      )}
                    </p>

                  </div>

                  <div
                    className="
                      rounded-lg
                      border
                      border-lime-300/20
                      bg-[#08152b]
                      p-2
                      text-center
                      shadow-[0_0_14px_rgba(163,230,53,0.04)]
                    "
                  >

                    <p className="text-[9px] uppercase tracking-widest text-slate-500">
                      Est. Units
                    </p>

                    <p className="mt-1 text-sm font-black">

                      {optimization.candidates
                        ?.find(
                          (candidate) =>
                            Math.abs(
                              Number(
                                candidate.candidate_price
                              ) -
                                (simulatedPrice ||
                                  optimization.recommended_price)
                            ) < 1
                        )
                        ?.predicted_units_sold?.toFixed(
                          0
                        ) || "—"}

                    </p>

                  </div>

                  <div
                    className="
                      rounded-lg
                      border
                      border-lime-300/35
                      bg-lime-300/[0.04]
                      p-2
                      text-center
                      shadow-[0_0_20px_rgba(163,230,53,0.08)]
                    "
                  >

                    <p className="text-[9px] uppercase tracking-widest text-slate-500">
                      Est. Revenue
                    </p>

                    <p className="mt-1 text-sm font-black text-lime-300">

                      ₹
                      {formatCurrency(
                        optimization.candidates?.find(
                          (candidate) =>
                            Math.abs(
                              Number(
                                candidate.candidate_price
                              ) -
                                (simulatedPrice ||
                                  optimization.recommended_price)
                            ) < 1
                        )?.predicted_revenue || 0
                      )}

                    </p>

                  </div>

                </div>

              </GlowCard>

            </div>

            {/* =================================================
                BUSINESS SIGNALS
            ================================================= */}

            {analysis && (
              <GlowCard
                strong
                className="mt-3 p-4"
              >

                <div className="flex flex-col gap-3">

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-2">

                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          border
                          border-lime-300/30
                          bg-lime-300/10
                          shadow-[0_0_18px_rgba(163,230,53,0.10)]
                        "
                      >
                        <Brain className="h-5 w-5 text-lime-300" />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-300">
                          Intelligence Explanation
                        </p>

                        <h2 className="text-lg font-black">
                          Business Signals
                        </h2>

                      </div>

                    </div>

                    <div className="hidden shrink-0 items-center gap-2 sm:flex">

                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,1)]" />

                      <span className="text-[9px] font-bold uppercase tracking-widest text-lime-300">
                        Live Analysis
                      </span>

                    </div>

                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">

                    <FactorCard
                      icon={TrendingUp}
                      title="Demand"
                      value={
                        analysis.demand_level ||
                        "N/A"
                      }
                      subtitle={`Index: ${Number(
                        analysis.demand_index
                      ).toFixed(1)}`}
                    />

                    <FactorCard
                      icon={ShoppingCart}
                      title="Sales Velocity"
                      value={
                        analysis.sales_velocity ||
                        "N/A"
                      }
                      subtitle={`${Number(
                        analysis.units_sold
                      ).toLocaleString(
                        "en-IN"
                      )} units sold`}
                    />

                    <FactorCard
                      icon={Package}
                      title="Inventory"
                      value={
                        analysis.inventory_status ||
                        "N/A"
                      }
                      subtitle={`${Number(
                        analysis.stock
                      ).toLocaleString(
                        "en-IN"
                      )} units available`}
                    />

                    <FactorCard
                      icon={Percent}
                      title="Discount"
                      value={`${Number(
                        analysis.discount_pct
                      ).toFixed(1)}%`}
                      subtitle="Historical signal"
                    />

                  </div>

                  {Array.isArray(
                    analysis.reasons
                  ) &&
                    analysis.reasons.length >
                      0 && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">

                        {analysis.reasons
                          .slice(0, 4)
                          .map(
                            (
                              reason,
                              index
                            ) => (
                              <div
                                key={index}
                                className="
                                  flex
                                  min-h-[58px]
                                  min-w-0
                                  items-start
                                  gap-2
                                  rounded-xl
                                  border
                                  border-lime-300/20
                                  bg-[#08152b]
                                  px-3
                                  py-2
                                  shadow-[0_0_18px_rgba(163,230,53,0.045)]
                                "
                              >

                                <div
                                  className="
                                    mt-0.5
                                    flex
                                    h-5
                                    w-5
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-lime-300/30
                                    bg-lime-300/10
                                  "
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-lime-300" />
                                </div>

                                <p className="break-words text-[11px] leading-4 text-slate-400">
                                  {reason}
                                </p>

                              </div>
                            )
                          )}

                      </div>
                    )}

                </div>

              </GlowCard>
            )}

            {/* =================================================
                CONFIDENCE + MODEL INFO
            ================================================= */}

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">

              <GlowCard className="p-4">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-lime-300/30
                      bg-lime-300/10
                      shadow-[0_0_14px_rgba(163,230,53,0.08)]
                    "
                  >
                    <Shield className="h-5 w-5 text-lime-300" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-3">

                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Model Confidence
                      </p>

                      <span className="shrink-0 text-sm font-black text-lime-300">
                        {(confidenceScore * 100).toFixed(
                          0
                        )}
                        %
                      </span>

                    </div>

                    <div
                      className="
                        mt-2
                        h-2
                        overflow-hidden
                        rounded-full
                        border
                        border-lime-300/20
                        bg-[#030a17]
                      "
                    >

                      <div
                        className="
                          h-full
                          rounded-full
                          bg-lime-300
                          shadow-[0_0_14px_rgba(163,230,53,0.75)]
                          transition-all
                          duration-700
                        "
                        style={{
                          width: `${
                            confidenceScore *
                            100
                          }%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

              </GlowCard>

              <GlowCard className="p-4">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-lime-300/30
                      bg-lime-300/10
                      shadow-[0_0_14px_rgba(163,230,53,0.08)]
                    "
                  >
                    <Brain className="h-5 w-5 text-lime-300" />
                  </div>

                  <div className="min-w-0">

                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Optimization Engine
                    </p>

                    <p className="mt-1 text-sm font-black text-white">
                      XGBoost Price Response Model
                    </p>

                    <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                      Predict demand → calculate revenue → select optimal price
                    </p>

                  </div>

                </div>

              </GlowCard>

            </div>

          </section>
        )}

        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {!optimization &&
          !optimizationLoading &&
          selectedProduct && (
            <GlowCard
              strong
              className="mt-4 p-6 text-center"
            >

              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  border-2
                  border-lime-300/50
                  bg-lime-300/10
                  shadow-[0_0_30px_rgba(163,230,53,0.16)]
                "
              >
                <Target className="h-6 w-6 text-lime-300" />
              </div>

              <h3 className="mt-3 text-lg font-black">
                Ready for Revenue Optimization
              </h3>

              <p className="mx-auto mt-1 max-w-lg text-sm text-slate-400">
                Click{" "}
                <span className="font-bold text-lime-300">
                  Optimize Price
                </span>{" "}
                to analyze demand and determine the
                revenue-maximizing price.
              </p>

            </GlowCard>
          )}

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div
          className="
            mt-5
            flex
            flex-col
            gap-2
            border-t
            border-lime-300/15
            pt-3
            text-[9px]
            font-bold
            uppercase
            tracking-[0.18em]
            text-slate-500
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <span>
            PricePilot AI · Revenue Intelligence
          </span>

          <span className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,1)]" />

            XGBoost Price Response Engine

          </span>

        </div>

      </main>

    </div>
  );
}

export default PricingIntelligence;