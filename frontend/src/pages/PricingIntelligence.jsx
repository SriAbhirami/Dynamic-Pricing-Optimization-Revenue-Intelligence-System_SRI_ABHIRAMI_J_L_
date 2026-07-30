import { useEffect, useState } from "react";

import {
  Activity,
  Brain,
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Percent,
  AlertTriangle,
  Zap,
  Target,
  ArrowUpRight,
  Radar,
  CircleDot,
  Sparkles,
  Calculator,
  Package,
  Gauge,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
} from "lucide-react";

import { getPricingDemandSummary } from "../api/dashboard";
import API from "../api/axios";


// ============================================================
// RADAR CATEGORY POSITIONS
// ============================================================

const radarPositions = [
  {
    top: "7%",
    left: "50%",
    transform: "translateX(-50%)",
  },
  {
    top: "25%",
    right: "7%",
  },
  {
    bottom: "11%",
    right: "15%",
  },
  {
    bottom: "5%",
    left: "50%",
    transform: "translateX(-50%)",
  },
  {
    bottom: "11%",
    left: "15%",
  },
  {
    top: "25%",
    left: "7%",
  },
  {
    top: "45%",
    right: "2%",
  },
  {
    top: "45%",
    left: "2%",
  },
];


function PricingIntelligence() {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);


  // ============================================================
  // PRICE PREDICTION STATE
  // ============================================================

  const today = new Date();

  const [predictionForm, setPredictionForm] = useState({
    base_price: 173.55,
    inventory_level: 153,
    stockout_flag: 0,
  });

  const [predictedPrice, setPredictedPrice] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");


  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const summaryData = await getPricingDemandSummary();

        setSummary(summaryData);

        const categoryResponse = await API.get(
          "/pricing-demand/category-performance"
        );

        const categories = Array.isArray(categoryResponse.data)
          ? categoryResponse.data
          : categoryResponse.data?.items || [];

        setCategoryData(categories);

        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
      } catch (err) {
        console.error(
          "Failed to load pricing intelligence:",
          err
        );

        setError(
          "Unable to load pricing intelligence data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030604] text-white flex items-center justify-center">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-lime-300/20 bg-lime-300/5">

            <Radar className="h-7 w-7 animate-pulse text-lime-300" />

          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-lime-300">
            Pricing Intelligence
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Mapping pricing and demand signals...
          </p>

        </div>

      </div>
    );
  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#030604] text-white flex items-center justify-center">

        <div className="rounded-3xl border border-red-400/20 bg-[#071009] px-8 py-7 text-center">

          <AlertTriangle className="mx-auto h-8 w-8 text-red-300" />

          <h1 className="mt-4 text-xl font-semibold">
            Pricing Intelligence
          </h1>

          <p className="mt-2 text-sm text-red-300">
            {error || "Unable to load intelligence data."}
          </p>

        </div>

      </div>
    );
  }


  // ============================================================
  // OVERALL SIGNALS
  // ============================================================

  const demandValue =
    Number(summary.average_demand_index) || 0;

  const revenueValue =
    Number(summary.total_revenue) || 0;

  const unitsSoldValue =
    Number(summary.total_units_sold) || 0;

  const discountValue =
    Number(summary.average_discount_pct) || 0;


  // ============================================================
  // FIELD HELPERS
  // ============================================================

  const getCategoryName = (item) => {
    return (
      item.category ||
      item.name ||
      item.product_category ||
      "Unknown"
    );
  };


  const getDemand = (item) => {
    return Number(
      item.average_demand_index ??
      item.average_demand ??
      item.demand_index ??
      0
    );
  };


  const getRevenue = (item) => {
    return Number(
      item.total_revenue ??
      item.revenue ??
      0
    );
  };


  const getUnits = (item) => {
    return Number(
      item.total_units_sold ??
      item.units_sold ??
      0
    );
  };


  const getDiscount = (item) => {
    return Number(
      item.average_discount_pct ??
      item.average_discount ??
      item.discount_pct ??
      0
    );
  };


  // ============================================================
  // CURRENT / AVERAGE PRICE HELPER
  // ============================================================

  const getCategoryPrice = (item) => {
    return Number(
      item.average_current_price ??
      item.avg_current_price ??
      item.current_price ??
      item.average_price ??
      item.avg_price ??
      0
    );
  };


  // ============================================================
  // CATEGORY SIGNAL LEVEL
  // ============================================================

  const getDemandLevel = (value) => {
    if (value >= 200) {
      return {
        label: "HIGH",
        text: "text-lime-300",
        border: "border-lime-300/30",
        bg: "bg-lime-300/10",
      };
    }

    if (value >= 100) {
      return {
        label: "MODERATE",
        text: "text-yellow-300",
        border: "border-yellow-300/30",
        bg: "bg-yellow-300/10",
      };
    }

    return {
      label: "LOW",
      text: "text-red-300",
      border: "border-red-300/30",
      bg: "bg-red-300/10",
    };
  };


  // ============================================================
  // SELECTED CATEGORY SIGNALS
  // ============================================================

  const selectedDemand = selectedCategory
    ? getDemand(selectedCategory)
    : demandValue;

  const selectedRevenue = selectedCategory
    ? getRevenue(selectedCategory)
    : revenueValue;

  const selectedUnits = selectedCategory
    ? getUnits(selectedCategory)
    : unitsSoldValue;

  const selectedDiscount = selectedCategory
    ? getDiscount(selectedCategory)
    : discountValue;

  const categoryPrice = selectedCategory
    ? getCategoryPrice(selectedCategory)
    : 0;

  const selectedDemandLevel =
    getDemandLevel(selectedDemand);


  // ============================================================
  // HANDLE CATEGORY SELECTION
  // ============================================================

  const handleCategorySelection = (category) => {
    setSelectedCategory(category);

    setPredictedPrice(null);
    setPredictionError("");

    const categoryAveragePrice =
      getCategoryPrice(category);

    if (categoryAveragePrice > 0) {
      setPredictionForm((previous) => ({
        ...previous,
        base_price: categoryAveragePrice,
      }));
    }
  };


  // ============================================================
  // HANDLE FORM CHANGES
  // ============================================================

  const handlePredictionChange = (event) => {
    const { name, value } = event.target;

    setPredictionForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPredictedPrice(null);
    setPredictionError("");
  };


  // ============================================================
  // PREDICT PRICE
  // ============================================================

  const handlePricePrediction = async () => {
    if (!selectedCategory) {
      setPredictionError(
        "Please select a category from the Pricing Intelligence Radar."
      );

      return;
    }

    try {
      setPredictionLoading(true);
      setPredictionError("");
      setPredictedPrice(null);

      const categoryName =
        getCategoryName(selectedCategory);

      const payload = {
        base_price: Number(
          predictionForm.base_price
        ),

        units_sold: Number(
          selectedUnits
        ),

        inventory_level: Number(
          predictionForm.inventory_level
        ),

        stockout_flag: Number(
          predictionForm.stockout_flag
        ),

        demand_index: Number(
          selectedDemand
        ),

        year: today.getFullYear(),

        month: today.getMonth() + 1,

        day: today.getDate(),

        day_of_week:
          today.getDay() === 0
            ? 6
            : today.getDay() - 1,

        /*
         * These fields are required by the
         * currently trained model.
         *
         * The business-facing interface does
         * not ask the user to enter them.
         */

        product_id:
          selectedCategory.product_id ||
          "P1001",

        category:
          categoryName,

        brand:
          selectedCategory.brand ||
          "Nike",

        region:
          selectedCategory.region ||
          "AU",

        channel:
          selectedCategory.channel ||
          "mobile",

        season:
          selectedCategory.season ||
          "Winter",

        promotion_type:
          selectedCategory.promotion_type ||
          "Buy One Get One",
      };


      const response = await API.post(
        "/price-prediction/predict",
        payload
      );


      setPredictedPrice(
        Number(
          response.data.predicted_price
        )
      );

    } catch (err) {
      console.error(
        "Price prediction failed:",
        err
      );

      setPredictionError(
        err.response?.data?.detail ||
        "Unable to generate price recommendation."
      );
    } finally {
      setPredictionLoading(false);
    }
  };


  // ============================================================
  // PRICE ANALYSIS
  // ============================================================

  const currentPrice =
    Number(predictionForm.base_price) || 0;

  const priceDifference =
    predictedPrice !== null
      ? predictedPrice - currentPrice
      : 0;

  const priceChangePercentage =
    currentPrice > 0 && predictedPrice !== null
      ? (priceDifference / currentPrice) * 100
      : 0;


  const isPriceIncrease =
    priceDifference > 0.5;

  const isPriceDecrease =
    priceDifference < -0.5;


  let pricingRecommendation =
    "Maintain Current Price";

  let pricingDescription =
    "The model recommends keeping the current price approximately unchanged.";

  if (isPriceIncrease) {
    pricingRecommendation =
      "Consider Increasing Price";

    pricingDescription =
      "The model estimates that a higher price point may be appropriate under the current demand and inventory conditions.";
  }

  if (isPriceDecrease) {
    pricingRecommendation =
      "Consider Reducing Price";

    pricingDescription =
      "The model estimates that a lower price point may improve price competitiveness under the current conditions.";
  }


  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="min-h-screen bg-[#030604] text-white">

      <main className="px-6 py-7 lg:px-8">


        {/* ======================================================
            PAGE HEADER
        ======================================================= */}

        <section className="relative mb-7 overflow-hidden rounded-[30px] border border-lime-400/10 bg-[#071009] px-7 py-7">

          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-lime-400/10 blur-[110px]" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-400/5 blur-[100px]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.9)]" />

                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">
                  Revenue Intelligence Layer
                </span>

              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">

                Pricing
                <span className="text-lime-300">
                  {" "}Intelligence
                </span>

              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">

                A visual intelligence layer that connects pricing,
                demand and revenue signals across your product categories.

              </p>

            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 px-5 py-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                <Activity className="h-5 w-5 text-lime-300" />

              </div>

              <div>

                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                  Intelligence State
                </p>

                <p className="mt-1 flex items-center gap-2 font-semibold text-lime-300">

                  ACTIVE

                  <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            PRICING INTELLIGENCE RADAR
        ======================================================= */}

        <section className="relative overflow-hidden rounded-[32px] border border-lime-400/10 bg-[#071009]">

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-400/[0.025] blur-[100px]" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime-300/[0.04]" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime-300/[0.035]" />


          {/* Header */}

          <div className="relative z-30 flex flex-col gap-3 border-b border-white/5 px-7 py-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Radar className="h-5 w-5 text-lime-300" />

                <h2 className="text-xl font-semibold">
                  Pricing Intelligence Radar
                </h2>

              </div>

              <p className="mt-2 text-sm text-gray-600">

                Categories are connected to the pricing core through
                their demand and revenue signals.

              </p>

            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-600">

              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_9px_rgba(163,230,53,0.8)]" />

              Live Signal Network

            </div>

          </div>


          {/* ==================================================
              RADAR AREA
          =================================================== */}

          <div className="relative min-h-[650px] overflow-hidden px-4 py-8 sm:min-h-[720px] md:min-h-[760px]">

            {/* Connection lines */}

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[1px] w-[78%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-lime-300/20 to-transparent" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[1px] w-[78%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-r from-transparent via-lime-300/10 to-transparent" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[1px] w-[78%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-gradient-to-r from-transparent via-lime-300/10 to-transparent" />


            {/* Radar rings */}

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime-300/[0.06]" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime-300/[0.07]" />

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime-300/[0.09]" />


            {/* Category signal nodes */}

            {categoryData.map((category, index) => {

              const name = getCategoryName(category);
              const demand = getDemand(category);
              const revenue = getRevenue(category);
              const units = getUnits(category);
              const discount = getDiscount(category);

              const demandLevel =
                getDemandLevel(demand);

              const isSelected =
                selectedCategory === category;

              const position =
                radarPositions[
                  index % radarPositions.length
                ];

              return (

                <button
                  key={`${name}-${index}`}
                  onClick={() =>
                    handleCategorySelection(category)
                  }
                  style={position}
                  className={`absolute z-20 w-[155px] rounded-2xl border p-4 text-left transition-all duration-300 sm:w-[185px] ${
                    isSelected
                      ? "border-lime-300/50 bg-[#0d1b10] shadow-[0_0_35px_rgba(163,230,53,0.12)]"
                      : "border-white/[0.07] bg-[#0a130d]/95 hover:border-lime-300/25 hover:bg-[#0d180f]"
                  }`}
                >

                  {isSelected && (
                    <div className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl bg-lime-300/5 blur-md" />
                  )}

                  <div className="flex items-center justify-between">

                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-lime-300/10"
                          : "bg-white/[0.03]"
                      }`}
                    >

                      <CircleDot
                        className={`h-4 w-4 ${
                          isSelected
                            ? "text-lime-300"
                            : "text-gray-600"
                        }`}
                      />

                    </div>

                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                    )}

                  </div>

                  <p className="mt-3 truncate text-xs font-semibold text-white">
                    {name}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3">

                    <div>

                      <p className="text-[8px] uppercase tracking-widest text-gray-600">
                        Demand
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {demand.toFixed(1)}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-[8px] uppercase tracking-widest text-gray-600">
                        Revenue
                      </p>

                      <p className="mt-1 text-xs font-semibold text-lime-300">
                        ₹{(revenue / 1000000).toFixed(1)}M
                      </p>

                    </div>

                  </div>

                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">

                    <div
                      className="h-full rounded-full bg-lime-300 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (demand / 365) * 100,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="mt-2 flex items-center justify-between">

                    <span
                      className={`text-[8px] font-semibold tracking-widest ${demandLevel.text}`}
                    >
                      {demandLevel.label}
                    </span>

                    <span className="text-[8px] text-gray-700">
                      {units.toLocaleString("en-IN")} sold
                    </span>

                    <ArrowUpRight
                      className={`h-3 w-3 ${
                        isSelected
                          ? "text-lime-300"
                          : "text-gray-700"
                      }`}
                    />

                  </div>

                  <div className="mt-2 text-[8px] uppercase tracking-widest text-gray-700">

                    {discount.toFixed(1)}% avg discount

                  </div>

                </button>

              );
            })}


            {/* Central pricing core */}

            <div className="absolute left-1/2 top-1/2 z-20 flex h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-lime-300/25 bg-[#09140c] shadow-[0_0_80px_rgba(163,230,53,0.09)]">

              <div className="absolute inset-[-14px] rounded-full border border-lime-300/[0.06]" />

              <div className="absolute inset-[-28px] rounded-full border border-lime-300/[0.035]" />

              <div className="absolute inset-10 rounded-full bg-lime-300/[0.06] shadow-[0_0_55px_rgba(163,230,53,0.16)]" />

              <div className="relative z-10 text-center">

                <Brain className="mx-auto h-7 w-7 text-lime-300" />

                <p className="mt-3 text-[9px] uppercase tracking-[0.25em] text-gray-600">
                  Pricing Core
                </p>

                <p className="mt-1 text-2xl font-bold text-lime-300">
                  {demandValue.toFixed(1)}
                </p>

                <p className="mt-1 text-[8px] uppercase tracking-widest text-gray-700">
                  Demand Signal
                </p>

              </div>

            </div>


            {/* Radar legend */}

            <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-5 rounded-full border border-white/5 bg-[#071009]/90 px-5 py-2.5 backdrop-blur-md">

              <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />

                <span className="text-[8px] uppercase tracking-widest text-gray-600">
                  Demand
                </span>

              </div>

              <div className="h-3 w-px bg-white/10" />

              <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />

                <span className="text-[8px] uppercase tracking-widest text-gray-600">
                  Revenue
                </span>

              </div>

              <div className="h-3 w-px bg-white/10" />

              <span className="text-[8px] uppercase tracking-widest text-gray-600">
                Click a category
              </span>

            </div>

          </div>

        </section>


        {/* ======================================================
            SELECTED CATEGORY INTELLIGENCE
        ======================================================= */}

        <section className="mt-7 overflow-hidden rounded-[28px] border border-lime-400/10 bg-[#071009]">

          <div className="flex flex-col gap-5 border-b border-white/5 px-7 py-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10">

                <Target className="h-5 w-5 text-lime-300" />

              </div>

              <div>

                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600">
                  Active Intelligence Signal
                </p>

                <h2 className="mt-1 text-xl font-semibold">

                  {selectedCategory
                    ? getCategoryName(selectedCategory)
                    : "Overall Market"}

                </h2>

              </div>

            </div>

            <div
              className={`w-fit rounded-full border px-3 py-1.5 text-[9px] font-semibold tracking-widest ${selectedDemandLevel.bg} ${selectedDemandLevel.border} ${selectedDemandLevel.text}`}
            >

              {selectedDemandLevel.label} DEMAND

            </div>

          </div>


          <div className="px-7 py-7">

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

              {/* Demand */}

              <div className="relative">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                    <TrendingUp className="h-4 w-4 text-lime-300" />

                  </div>

                  <div>

                    <p className="text-[9px] uppercase tracking-widest text-gray-600">
                      Demand
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {selectedDemand.toFixed(2)}
                    </p>

                  </div>

                </div>

                <p className="mt-3 text-[10px] leading-5 text-gray-600">
                  Current category demand signal
                </p>

              </div>


              {/* Revenue */}

              <div className="relative">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                    <IndianRupee className="h-4 w-4 text-lime-300" />

                  </div>

                  <div>

                    <p className="text-[9px] uppercase tracking-widest text-gray-600">
                      Revenue
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      ₹{(selectedRevenue / 1000000).toFixed(2)}M
                    </p>

                  </div>

                </div>

                <p className="mt-3 text-[10px] leading-5 text-gray-600">
                  Revenue generated by category
                </p>

              </div>


              {/* Units Sold */}

              <div className="relative">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                    <ShoppingCart className="h-4 w-4 text-lime-300" />

                  </div>

                  <div>

                    <p className="text-[9px] uppercase tracking-widest text-gray-600">
                      Units Sold
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {selectedUnits.toLocaleString("en-IN")}
                    </p>

                  </div>

                </div>

                <p className="mt-3 text-[10px] leading-5 text-gray-600">
                  Total units sold by category
                </p>

              </div>


              {/* Discount */}

              <div className="relative">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                    <Percent className="h-4 w-4 text-lime-300" />

                  </div>

                  <div>

                    <p className="text-[9px] uppercase tracking-widest text-gray-600">
                      Discount
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {selectedDiscount.toFixed(1)}%
                    </p>

                  </div>

                </div>

                <p className="mt-3 text-[10px] leading-5 text-gray-600">
                  Average pricing pressure
                </p>

              </div>

            </div>


            {/* Intelligence interpretation */}

            <div className="mt-7 rounded-2xl border border-lime-300/10 bg-lime-300/[0.025] px-5 py-4">

              <div className="flex items-start gap-3">

                <Brain className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />

                <div>

                  <p className="text-xs font-semibold text-lime-300">
                    Intelligence Interpretation
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">

                    {selectedDemand >= 200

                      ? `${selectedCategory ? getCategoryName(selectedCategory) : "This category"} is experiencing strong demand pressure. The pricing signal should be evaluated carefully before applying additional discounts.`

                      : selectedDemand >= 100

                      ? `${selectedCategory ? getCategoryName(selectedCategory) : "This category"} is operating at a moderate demand level. Demand, revenue, units sold and discount signals should be evaluated together before making a pricing decision.`

                      : `${selectedCategory ? getCategoryName(selectedCategory) : "This category"} is showing relatively low demand. The ML layer can evaluate whether price adjustment could stimulate demand.`

                    }

                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            AI PRICE RECOMMENDATION
        ======================================================= */}

        <section className="relative mt-7 overflow-hidden rounded-[30px] border border-lime-400/10 bg-[#071009]">

          {/* Background glow */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-lime-400/10 blur-[100px]" />

          <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-emerald-400/5 blur-[100px]" />


          {/* Header */}

          <div className="relative z-10 flex flex-col gap-4 border-b border-white/5 px-7 py-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Sparkles className="h-5 w-5 text-lime-300" />

                <h2 className="text-xl font-semibold">
                  AI Price Recommendation
                </h2>

              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">

                Use the selected category's demand and sales signals
                to estimate an optimized price using the trained XGBoost engine.

              </p>

            </div>


            <div className="flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/5 px-4 py-2">

              <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

              <span className="text-[9px] font-semibold uppercase tracking-widest text-lime-300">
                XGBoost Engine
              </span>

            </div>

          </div>


          <div className="relative z-10 px-7 py-7">


            {/* Selected category context */}

            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-lime-300/10 bg-lime-300/[0.025] px-5 py-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10">

                  <Target className="h-5 w-5 text-lime-300" />

                </div>

                <div>

                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600">
                    Selected Pricing Segment
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {selectedCategory
                      ? getCategoryName(selectedCategory)
                      : "Select a category"}
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-2 rounded-full border border-lime-300/10 bg-lime-300/5 px-4 py-2">

                <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />

                <span className="text-[9px] uppercase tracking-widest text-lime-300">
                  Radar Signal Connected
                </span>

              </div>

            </div>


            {/* ==================================================
                PREDICTION INPUTS
            =================================================== */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">


              {/* Current Price */}

              <div className="rounded-2xl border border-white/5 bg-[#030604] p-5">

                <div className="flex items-center gap-2">

                  <IndianRupee className="h-4 w-4 text-lime-300" />

                  <label className="text-[9px] uppercase tracking-widest text-gray-600">
                    Current Price
                  </label>

                </div>

                <div className="relative mt-3">

                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="base_price"
                    value={predictionForm.base_price}
                    onChange={handlePredictionChange}
                    className="w-full rounded-xl border border-white/10 bg-[#071009] py-3 pl-9 pr-3 text-sm text-white outline-none transition focus:border-lime-300/40"
                  />

                </div>

                <p className="mt-2 text-[9px] text-gray-700">
                  Current selling/base price
                </p>

              </div>


              {/* Demand */}

              <div className="rounded-2xl border border-white/5 bg-[#030604] p-5">

                <div className="flex items-center gap-2">

                  <Gauge className="h-4 w-4 text-lime-300" />

                  <p className="text-[9px] uppercase tracking-widest text-gray-600">
                    Demand Signal
                  </p>

                </div>

                <div className="mt-3 flex items-end gap-2">

                  <span className="text-2xl font-bold">
                    {selectedDemand.toFixed(2)}
                  </span>

                  <span
                    className={`mb-1 text-[8px] font-semibold tracking-widest ${selectedDemandLevel.text}`}
                  >
                    {selectedDemandLevel.label}
                  </span>

                </div>

                <p className="mt-2 text-[9px] text-gray-700">
                  Automatically from selected category
                </p>

              </div>


              {/* Units Sold */}

              <div className="rounded-2xl border border-white/5 bg-[#030604] p-5">

                <div className="flex items-center gap-2">

                  <ShoppingCart className="h-4 w-4 text-lime-300" />

                  <p className="text-[9px] uppercase tracking-widest text-gray-600">
                    Units Sold
                  </p>

                </div>

                <p className="mt-3 text-2xl font-bold">
                  {selectedUnits.toLocaleString("en-IN")}
                </p>

                <p className="mt-2 text-[9px] text-gray-700">
                  Automatically from selected category
                </p>

              </div>


              {/* Inventory */}

              <div className="rounded-2xl border border-white/5 bg-[#030604] p-5">

                <div className="flex items-center gap-2">

                  <Package className="h-4 w-4 text-lime-300" />

                  <label className="text-[9px] uppercase tracking-widest text-gray-600">
                    Inventory Level
                  </label>

                </div>

                <input
                  type="number"
                  min="0"
                  name="inventory_level"
                  value={predictionForm.inventory_level}
                  onChange={handlePredictionChange}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-[#071009] px-3 py-3 text-sm text-white outline-none transition focus:border-lime-300/40"
                />

                <p className="mt-2 text-[9px] text-gray-700">
                  Current available stock
                </p>

              </div>

            </div>


            {/* Stockout selector */}

            <div className="mt-5 rounded-2xl border border-white/5 bg-[#030604] p-5">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <AlertTriangle className="h-4 w-4 text-lime-300" />

                    <p className="text-[9px] uppercase tracking-widest text-gray-600">
                      Inventory Availability
                    </p>

                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Tell the model whether this category is currently experiencing a stockout.
                  </p>

                </div>


                <select
                  name="stockout_flag"
                  value={predictionForm.stockout_flag}
                  onChange={handlePredictionChange}
                  className="w-full rounded-xl border border-white/10 bg-[#071009] px-4 py-3 text-sm text-white outline-none transition focus:border-lime-300/40 md:w-[220px]"
                >

                  <option value="0">
                    No Stockout
                  </option>

                  <option value="1">
                    Stockout
                  </option>

                </select>

              </div>

            </div>


            {/* Model information */}

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-lime-300/10 bg-lime-300/[0.025] px-5 py-4">

              <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />

              <div>

                <p className="text-xs font-semibold text-lime-300">
                  Prediction Context
                </p>

                <p className="mt-1 text-[10px] leading-5 text-gray-600">

                  The model combines the selected category's demand
                  and sales signals with the current price, inventory
                  and stockout condition to estimate a recommended price.

                </p>

              </div>

            </div>


            {/* Prediction Button */}

            <div className="mt-7 flex justify-center">

              <button
                onClick={handlePricePrediction}
                disabled={
                  predictionLoading ||
                  !selectedCategory
                }
                className="group flex items-center gap-3 rounded-2xl border border-lime-300/30 bg-lime-300/10 px-8 py-4 text-xs font-semibold uppercase tracking-widest text-lime-300 transition hover:border-lime-300/50 hover:bg-lime-300/15 hover:shadow-[0_0_30px_rgba(163,230,53,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {predictionLoading ? (

                  <>

                    <Activity className="h-4 w-4 animate-spin" />

                    Analyzing Pricing Signals...

                  </>

                ) : (

                  <>

                    <Zap className="h-4 w-4 transition group-hover:scale-110" />

                    Predict Recommended Price

                  </>

                )}

              </button>

            </div>


            {/* Error */}

            {predictionError && (

              <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4">

                <div className="flex items-center gap-3">

                  <AlertTriangle className="h-4 w-4 text-red-300" />

                  <p className="text-xs text-red-300">
                    {predictionError}
                  </p>

                </div>

              </div>

            )}


            {/* ==================================================
                PREDICTION RESULT
            =================================================== */}

            {predictedPrice !== null &&
              !predictionLoading && (

                <div className="relative mt-7 overflow-hidden rounded-3xl border border-lime-300/20 bg-lime-300/[0.025] px-6 py-8">

                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/10 blur-[90px]" />

                  <div className="relative z-10">


                    {/* Result header */}

                    <div className="text-center">

                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10">

                        <Sparkles className="h-5 w-5 text-lime-300" />

                      </div>

                      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-600">
                        AI Recommended Price
                      </p>

                      <div className="mt-2 flex items-center justify-center gap-1">

                        <IndianRupee className="h-7 w-7 text-lime-300" />

                        <span className="text-5xl font-bold tracking-tight text-lime-300">
                          {predictedPrice.toFixed(2)}
                        </span>

                      </div>

                      <p className="mt-3 text-xs text-gray-600">
                        XGBoost-powered pricing recommendation
                      </p>

                    </div>


                    {/* Price comparison */}

                    <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">


                      {/* Current */}

                      <div className="rounded-2xl border border-white/5 bg-[#030604]/80 px-5 py-5 text-center">

                        <p className="text-[9px] uppercase tracking-widest text-gray-600">
                          Current Price
                        </p>

                        <p className="mt-2 text-xl font-bold text-white">
                          ₹{currentPrice.toFixed(2)}
                        </p>

                      </div>


                      {/* Change */}

                      <div className="rounded-2xl border border-lime-300/10 bg-lime-300/5 px-5 py-5 text-center">

                        <p className="text-[9px] uppercase tracking-widest text-gray-600">
                          Price Adjustment
                        </p>

                        <div className="mt-2 flex items-center justify-center gap-2">

                          {isPriceDecrease && (
                            <ArrowDown className="h-4 w-4 text-lime-300" />
                          )}

                          {isPriceIncrease && (
                            <ArrowUp className="h-4 w-4 text-lime-300" />
                          )}

                          {!isPriceIncrease &&
                            !isPriceDecrease && (
                              <CheckCircle2 className="h-4 w-4 text-lime-300" />
                            )}

                          <span className="text-xl font-bold text-lime-300">

                            {priceChangePercentage > 0
                              ? "+"
                              : ""}

                            {priceChangePercentage.toFixed(2)}%

                          </span>

                        </div>

                      </div>


                      {/* Difference */}

                      <div className="rounded-2xl border border-white/5 bg-[#030604]/80 px-5 py-5 text-center">

                        <p className="text-[9px] uppercase tracking-widest text-gray-600">
                          Difference
                        </p>

                        <p className="mt-2 text-xl font-bold text-white">

                          {priceDifference >= 0
                            ? "+"
                            : ""}

                          ₹{priceDifference.toFixed(2)}

                        </p>

                      </div>

                    </div>


                    {/* Recommendation */}

                    <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-lime-300/10 bg-[#030604]/70 px-5 py-5">

                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-300/10">

                          {isPriceDecrease ? (
                            <ArrowDown className="h-4 w-4 text-lime-300" />
                          ) : isPriceIncrease ? (
                            <ArrowUp className="h-4 w-4 text-lime-300" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-lime-300" />
                          )}

                        </div>

                        <div>

                          <p className="text-xs font-semibold text-lime-300">
                            {pricingRecommendation}
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-gray-500">
                            {pricingDescription}
                          </p>

                        </div>

                      </div>

                    </div>


                    {/* ML status */}

                    <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-lime-300/10 bg-lime-300/5 px-4 py-2">

                      <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

                      <span className="text-[9px] uppercase tracking-widest text-lime-300">
                        ML Recommendation Generated
                      </span>

                    </div>

                  </div>

                </div>

              )}

          </div>

        </section>


        {/* ======================================================
            PROJECT SIGNAL FOOTER
        ======================================================= */}

        <section className="relative mt-7 overflow-hidden rounded-[28px] border border-dashed border-lime-400/20 bg-[#071009] p-7">

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime-400/5 blur-[90px]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Brain className="h-5 w-5 text-lime-300" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-lime-300">
                  ML Decision Layer
                </span>

              </div>

              <h2 className="mt-3 text-2xl font-bold">
                Signals → Prediction → Pricing Decision
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">

                Pricing Intelligence provides the business signals
                that the machine learning model uses to estimate
                an appropriate price and support optimized pricing decisions.

              </p>

            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 px-5 py-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                <Activity className="h-5 w-5 text-lime-300" />

              </div>

              <div>

                <p className="text-[10px] uppercase tracking-widest text-gray-600">
                  Intelligence Engine
                </p>

                <p className="mt-1 text-sm font-semibold text-lime-300">
                  XGBoost Active
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            FOOTER
        ======================================================= */}

        <div className="mt-7 flex flex-col justify-between gap-3 border-t border-white/5 pt-5 text-[10px] uppercase tracking-widest text-gray-700 md:flex-row">

          <span>
            PricePilot AI · Pricing Intelligence
          </span>

          <span className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />

            Pricing & Demand Signal Network Active

          </span>

        </div>

      </main>

    </div>
  );
}


export default PricingIntelligence;

