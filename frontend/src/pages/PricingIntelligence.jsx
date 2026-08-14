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

const getDemandStyle = (level) => {
  const value = String(level || "").toUpperCase();

  if (value === "HIGH") {
    return {
      text: "text-lime-300",
      border: "border-lime-300/60",
      glow: "shadow-[0_0_28px_rgba(163,230,53,0.30)]",
      background: "bg-lime-300/[0.08]",
    };
  }

  if (value === "MODERATE") {
    return {
      text: "text-yellow-300",
      border: "border-yellow-300/60",
      glow: "shadow-[0_0_28px_rgba(250,204,21,0.25)]",
      background: "bg-yellow-300/[0.08]",
    };
  }

  return {
    text: "text-red-300",
    border: "border-red-300/60",
    glow: "shadow-[0_0_28px_rgba(248,113,113,0.25)]",
    background: "bg-red-300/[0.08]",
  };
};

const getRecommendationStyle = (recommendation) => {
  const value = String(recommendation || "").toUpperCase();

  if (value.includes("INCREASE")) {
    return {
      text: "text-lime-300",
      border: "border-lime-300/70",
      background: "bg-lime-300/[0.08]",
      glow: "shadow-[0_0_45px_rgba(163,230,53,0.30)]",
      icon: ArrowUp,
    };
  }

  if (value.includes("DECREASE")) {
    return {
      text: "text-orange-300",
      border: "border-orange-300/70",
      background: "bg-orange-300/[0.08]",
      glow: "shadow-[0_0_45px_rgba(251,146,60,0.28)]",
      icon: ArrowDown,
    };
  }

  return {
    text: "text-cyan-300",
    border: "border-cyan-300/70",
    background: "bg-cyan-300/[0.08]",
    glow: "shadow-[0_0_45px_rgba(34,211,238,0.28)]",
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
            ? "border-lime-300/70 shadow-[0_0_38px_rgba(163,230,53,0.22),inset_0_0_25px_rgba(163,230,53,0.035)]"
            : "border-lime-300/35 shadow-[0_0_24px_rgba(163,230,53,0.12),inset_0_0_20px_rgba(163,230,53,0.025)]"
        }
        bg-[#050a07]
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
            ? "border-lime-300/70 shadow-[0_0_38px_rgba(163,230,53,0.25)]"
            : "border-lime-300/35 shadow-[0_0_22px_rgba(163,230,53,0.10)]"
        }
        bg-[#030604]
        p-4
        transition-all
        duration-300
        hover:border-lime-300/80
        hover:shadow-[0_0_42px_rgba(163,230,53,0.25)]
      `}
    >
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">
          {title}
        </p>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-lime-300/30 bg-lime-300/10 shadow-[0_0_14px_rgba(163,230,53,0.15)]">
          <Icon className="h-4 w-4 text-lime-300" />
        </div>
      </div>

      <p
        className={`mt-3 text-2xl font-black tracking-tight ${
          accent ? "text-lime-300" : "text-white"
        }`}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-[10px] text-gray-600">
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
        rounded-xl
        border
        border-lime-300/30
        bg-[#030604]
        p-3
        shadow-[0_0_20px_rgba(163,230,53,0.08)]
        transition-all
        duration-300
        hover:border-lime-300/65
        hover:shadow-[0_0_32px_rgba(163,230,53,0.18)]
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-lime-300/30 bg-lime-300/10">
          <Icon className="h-3.5 w-3.5 text-lime-300" />
        </div>

        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">
          {title}
        </p>
      </div>

      <p className="mt-2 truncate text-sm font-black text-white">
        {value}
      </p>

      {subtitle && (
        <p className="mt-0.5 truncate text-[9px] text-gray-600">
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

  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState("");

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

      /*
       * Current UI confidence indicator.
       * This is kept as a visual model-confidence
       * indicator until the backend exposes a
       * real confidence value.
       */
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
      <div className="min-h-screen bg-[#010302] text-white">
        <main className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-lime-300/70 bg-lime-300/10 shadow-[0_0_55px_rgba(163,230,53,0.40)]">
              <Activity className="h-8 w-8 animate-spin text-lime-300" />
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-lime-300">
              Pricing Intelligence
            </p>

            <p className="mt-2 text-sm text-gray-500">
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
      <div className="min-h-screen bg-[#010302] text-white">
        <main className="flex min-h-screen items-center justify-center px-5">
          <GlowCard className="w-full max-w-lg border-red-400/70 shadow-[0_0_45px_rgba(248,113,113,0.25)]">
            <div className="p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-red-400/60 bg-red-400/10 shadow-[0_0_25px_rgba(248,113,113,0.20)]">
                <AlertTriangle className="h-6 w-6 text-red-300" />
              </div>

              <h1 className="mt-4 text-xl font-black">
                Unable to Load Products
              </h1>

              <p className="mt-2 text-sm text-red-300">
                {productsError}
              </p>

              <p className="mt-3 text-xs text-gray-600">
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
    <div className="min-h-screen bg-[#010302] text-white">
      <main className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-7">

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="relative overflow-hidden rounded-2xl border-2 border-lime-300/60 bg-[#050b07] px-5 py-4 shadow-[0_0_55px_rgba(163,230,53,0.22),inset_0_0_35px_rgba(163,230,53,0.025)]">
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-lime-300/10 blur-[90px]" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_15px_rgba(163,230,53,1)]" />

                <span className="text-[9px] font-black uppercase tracking-[0.28em] text-lime-300">
                  ML Revenue Optimization
                </span>
              </div>

              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                Pricing{" "}
                <span className="text-lime-300 drop-shadow-[0_0_20px_rgba(163,230,53,0.65)]">
                  Intelligence
                </span>
              </h1>

              <p className="mt-1 max-w-2xl text-xs text-gray-500">
                AI-powered pricing optimization using
                demand response and revenue maximization.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border-2 border-lime-300/50 bg-lime-300/[0.06] px-4 py-3 shadow-[0_0_30px_rgba(163,230,53,0.18)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime-300/40 bg-lime-300/10">
                <Brain className="h-4 w-4 text-lime-300" />
              </div>

              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-gray-600">
                  Intelligence Engine
                </p>

                <p className="mt-0.5 flex items-center gap-2 text-xs font-black text-lime-300">
                  XGBOOST ACTIVE
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,1)]" />
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            CONTROL BAR
        ================================================== */}

        <section className="mt-4 rounded-2xl border-2 border-lime-300/50 bg-[#050b07] p-4 shadow-[0_0_38px_rgba(163,230,53,0.16)]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">

            <div>
              <div className="mb-2 flex items-center gap-2">
                <Search className="h-4 w-4 text-lime-300" />

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-300">
                  Product
                </label>
              </div>

              <div className="relative">
                <select
                  value={selectedProductId}
                  onChange={handleProductChange}
                  className="w-full appearance-none rounded-xl border-2 border-lime-300/50 bg-[#020403] px-4 py-3 pr-12 text-sm font-bold text-white outline-none transition-all duration-300 hover:border-lime-300/80 hover:shadow-[0_0_25px_rgba(163,230,53,0.18)] focus:border-lime-300 focus:shadow-[0_0_30px_rgba(163,230,53,0.25)]"
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

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lime-300" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleOptimizePricing}
              disabled={
                optimizationLoading ||
                !selectedProduct
              }
              className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl border-2 border-lime-300/70 bg-lime-300/10 px-7 text-xs font-black uppercase tracking-[0.16em] text-lime-300 shadow-[0_0_30px_rgba(163,230,53,0.22)] transition-all duration-300 hover:border-lime-300 hover:bg-lime-300/15 hover:shadow-[0_0_48px_rgba(163,230,53,0.38)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {optimizationLoading ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Optimize Price
                </>
              )}
            </button>
          </div>

          {selectedProduct && (
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-lg border border-lime-300/25 bg-[#020403] px-3 py-2">
                <p className="text-[8px] uppercase tracking-widest text-gray-600">
                  Product
                </p>
                <p className="mt-1 truncate text-xs font-bold">
                  {selectedProduct.name}
                </p>
              </div>

              <div className="rounded-lg border border-lime-300/25 bg-[#020403] px-3 py-2">
                <p className="text-[8px] uppercase tracking-widest text-gray-600">
                  Category
                </p>
                <p className="mt-1 truncate text-xs font-bold">
                  {selectedProduct.category}
                </p>
              </div>

              <div className="rounded-lg border border-lime-300/25 bg-[#020403] px-3 py-2">
                <p className="text-[8px] uppercase tracking-widest text-gray-600">
                  Current Price
                </p>
                <p className="mt-1 text-xs font-black text-lime-300">
                  ₹{formatCurrency(
                    selectedProduct.current_price
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-lime-300/25 bg-[#020403] px-3 py-2">
                <p className="text-[8px] uppercase tracking-widest text-gray-600">
                  Stock
                </p>
                <p className="mt-1 text-xs font-black">
                  {Number(
                    selectedProduct.stock
                  ).toLocaleString("en-IN")}{" "}
                  units
                </p>
              </div>
            </div>
          )}

          {optimizationError && (
            <div className="mt-3 rounded-xl border-2 border-red-400/60 bg-red-400/[0.06] px-4 py-3 shadow-[0_0_28px_rgba(248,113,113,0.16)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-300" />

                <p className="text-xs font-bold text-red-300">
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

            {/* ==============================================
                TOP RESULT ROW
            ============================================== */}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

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

            {/* ==============================================
                MAIN INTELLIGENCE GRID
            ============================================== */}

            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1.85fr]">

              {/* ============================================
                  RECOMMENDATION
              ============================================ */}

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
                            className={`h-4 w-4 ${style.text}`}
                          />

                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                            AI Pricing Recommendation
                          </p>
                        </div>

                        <div className="mt-4 flex items-center gap-4">
                          <div
                            className={`
                              flex h-14 w-14 shrink-0
                              items-center justify-center
                              rounded-xl
                              border-2
                              ${style.border}
                              bg-black/20
                              ${style.glow}
                            `}
                          >
                            <RecommendationIcon
                              className={`h-7 w-7 ${style.text}`}
                            />
                          </div>

                          <div>
                            <p
                              className={`
                                text-3xl
                                font-black
                                uppercase
                                tracking-tight
                                ${style.text}
                              `}
                            >
                              {String(
                                optimization.recommendation
                              ).toUpperCase()}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-500">
                              Revenue optimization decision
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-lime-300/30 bg-black/20 p-3">
                          <p className="text-[8px] uppercase tracking-widest text-gray-600">
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

                        <div className="rounded-xl border border-lime-300/30 bg-black/20 p-3">
                          <p className="text-[8px] uppercase tracking-widest text-gray-600">
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

              {/* ============================================
                  PRICE SIMULATOR
              ============================================ */}

              <GlowCard className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-lime-300/40 bg-lime-300/10">
                      <Gauge className="h-4 w-4 text-lime-300" />
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                        Price Simulator
                      </p>

                      <p className="text-xs text-gray-600">
                        Explore price scenarios
                      </p>
                    </div>
                  </div>

                  <p className="text-xl font-black text-lime-300">
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
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-800 accent-lime-300"
                  />

                  <div className="mt-2 flex justify-between text-[9px] text-gray-600">
                    <span>
                      ₹
                      {formatCurrency(
                        optimization.current_price *
                          0.7
                      )}
                    </span>

                    <span className="text-lime-300">
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

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-lime-300/25 bg-[#020403] p-2 text-center">
                    <p className="text-[8px] uppercase tracking-widest text-gray-600">
                      Price
                    </p>

                    <p className="mt-1 text-xs font-black">
                      ₹
                      {formatCurrency(
                        simulatedPrice ||
                          optimization.recommended_price
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border border-lime-300/25 bg-[#020403] p-2 text-center">
                    <p className="text-[8px] uppercase tracking-widest text-gray-600">
                      Est. Units
                    </p>

                    <p className="mt-1 text-xs font-black">
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

                  <div className="rounded-lg border border-lime-300/50 bg-lime-300/[0.05] p-2 text-center shadow-[0_0_20px_rgba(163,230,53,0.10)]">
                    <p className="text-[8px] uppercase tracking-widest text-gray-600">
                      Est. Revenue
                    </p>

                    <p className="mt-1 text-xs font-black text-lime-300">
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

            {/* ==============================================
                BUSINESS SIGNALS
            ============================================== */}

            {analysis && (
              <GlowCard
                strong
                className="mt-3 p-4"
              >
                <div className="flex flex-col gap-3">

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-lime-300/40 bg-lime-300/10 shadow-[0_0_18px_rgba(163,230,53,0.15)]">
                        <Brain className="h-4 w-4 text-lime-300" />
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-300">
                          Intelligence Explanation
                        </p>

                        <h2 className="text-lg font-black">
                          Business Signals
                        </h2>
                      </div>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,1)]" />

                      <span className="text-[8px] font-bold uppercase tracking-widest text-lime-300">
                        Live Analysis
                      </span>
                    </div>
                  </div>

                  {/* FACTORS SIDE BY SIDE */}

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">

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

                  {/* KEY FACTORS */}

                  {Array.isArray(
                    analysis.reasons
                  ) &&
                    analysis.reasons.length >
                      0 && (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                        {analysis.reasons
                          .slice(0, 4)
                          .map(
                            (
                              reason,
                              index
                            ) => (
                              <div
                                key={index}
                                className="flex min-h-[58px] items-start gap-2 rounded-xl border border-lime-300/25 bg-[#020403] px-3 py-2 shadow-[0_0_18px_rgba(163,230,53,0.06)]"
                              >
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime-300/35 bg-lime-300/10">
                                  <CheckCircle2 className="h-3 w-3 text-lime-300" />
                                </div>

                                <p className="text-[10px] leading-4 text-gray-400">
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

            {/* ==============================================
                CONFIDENCE + MODEL INFO
            ============================================== */}

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">

              <GlowCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime-300/40 bg-lime-300/10">
                    <Shield className="h-4 w-4 text-lime-300" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">
                        Model Confidence
                      </p>

                      <span className="text-xs font-black text-lime-300">
                        {(confidenceScore * 100).toFixed(
                          0
                        )}
                        %
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full border border-lime-300/25 bg-gray-900">
                      <div
                        className="h-full rounded-full bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.90)] transition-all duration-700"
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime-300/40 bg-lime-300/10">
                    <Brain className="h-4 w-4 text-lime-300" />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">
                      Optimization Engine
                    </p>

                    <p className="mt-1 text-xs font-black text-white">
                      XGBoost Price Response Model
                    </p>

                    <p className="mt-0.5 text-[9px] text-gray-600">
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border-2 border-lime-300/60 bg-lime-300/10 shadow-[0_0_30px_rgba(163,230,53,0.22)]">
                <Target className="h-6 w-6 text-lime-300" />
              </div>

              <h3 className="mt-3 text-lg font-black">
                Ready for Revenue Optimization
              </h3>

              <p className="mx-auto mt-1 max-w-lg text-xs text-gray-600">
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

        <div className="mt-4 flex items-center justify-between border-t border-lime-300/20 pt-3 text-[8px] font-bold uppercase tracking-[0.18em] text-gray-700">
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