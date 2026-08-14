import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarDays,
  ChevronDown,
  Gauge,
  Package,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import API from "../api/axios";


function Forecast() {

  // ============================================================
  // PRODUCTS
  // ============================================================

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ============================================================
  // FORECAST
  // ============================================================

  const [forecast, setForecast] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [loadingProductionForecast, setLoadingProductionForecast] =
    useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // SEASONAL DATA
  // ============================================================

  const [seasonalData, setSeasonalData] = useState(null);
  const [loadingSeasonal, setLoadingSeasonal] = useState(false);

  // ============================================================
  // ACTIVE HORIZON
  // ============================================================

  const [activeHorizon, setActiveHorizon] = useState("short");

  // ============================================================
  // FORM DATA
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
    month: 8,
    day: 14,
    day_of_week: 4,
  });


  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  useEffect(() => {
    loadProducts();
  }, []);


  const loadProducts = async () => {

    try {

      setLoadingProducts(true);
      setError("");

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


      if (productList.length > 0) {

        const firstProduct = productList[0];

        setFormData((previous) => ({
          ...previous,

          product_id: String(firstProduct.id),

          category:
            firstProduct.category ||
            previous.category,

          brand:
            firstProduct.brand ||
            previous.brand,

          current_price:
            firstProduct.current_price !== undefined
              ? Number(firstProduct.current_price)
              : previous.current_price,

          base_price:
            firstProduct.base_price !== undefined
              ? Number(firstProduct.base_price)
              : previous.base_price,

          inventory_level:
            firstProduct.stock !== undefined
              ? Number(firstProduct.stock)
              : previous.inventory_level,
        }));

      }

    } catch (err) {

      console.error(
        "Error loading products:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.detail ||
        "Unable to load products."
      );

    } finally {

      setLoadingProducts(false);

    }

  };


  // ============================================================
  // PRODUCT CHANGE
  // ============================================================

  const handleProductChange = async (event) => {

    const selectedId = event.target.value;

    const selectedProduct = products.find(
      (product) =>
        String(product.id) === String(selectedId)
    );

    setForecast(null);
    setSeasonalData(null);
    setError("");

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

      brand:
        selectedProduct.brand ||
        previous.brand,

      current_price:
        selectedProduct.current_price !== undefined
          ? Number(selectedProduct.current_price)
          : previous.current_price,

      base_price:
        selectedProduct.base_price !== undefined
          ? Number(selectedProduct.base_price)
          : previous.base_price,

      inventory_level:
        selectedProduct.stock !== undefined
          ? Number(selectedProduct.stock)
          : previous.inventory_level,
    }));


    // ========================================================
    // LOAD PRODUCT SEASONAL DATA
    // ========================================================

    try {

      setLoadingSeasonal(true);

      const response = await API.get(
        `/demand-forecast/seasonal/${selectedId}`
      );

      setSeasonalData(response.data);

    } catch (err) {

      console.error(
        "Seasonal trend error:",
        err.response?.data || err.message
      );

      setSeasonalData(null);

    } finally {

      setLoadingSeasonal(false);

    }

  };


  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // ============================================================
  // GENERATE FORECAST
  // ============================================================

  const handlePredict = async () => {

    if (!formData.product_id) {

      setError("Please select a product first.");

      return;

    }


    try {

      setPredicting(true);
      setLoadingProductionForecast(true);
      setError("");
      setForecast(null);


      // ========================================================
      // SINGLE PRODUCT PREDICTION
      // POST /demand-forecast/predict
      // ========================================================

      const payload = {

        base_price:
          Number(formData.base_price),

        current_price:
          Number(formData.current_price),

        price_change_pct:
          Number(formData.price_change_pct),

        discount_pct:
          Number(formData.discount_pct),

        inventory_level:
          Number(formData.inventory_level),

        year:
          Number(formData.year),

        month:
          Number(formData.month),

        day:
          Number(formData.day),

        day_of_week:
          Number(formData.day_of_week),

        sales_rolling_3:
          Number(formData.sales_rolling_3),

        sales_rolling_7:
          Number(formData.sales_rolling_7),

        sales_rolling_14:
          Number(formData.sales_rolling_14),

        product_id:
          String(formData.product_id),

        category:
          String(formData.category),

        brand:
          String(formData.brand),

        region:
          String(formData.region),

        channel:
          String(formData.channel),

        season:
          String(formData.season),

        promotion_type:
          String(formData.promotion_type),

        stockout_flag:
          Number(formData.stockout_flag),
      };


      const predictionResponse = await API.post(
        "/demand-forecast/predict",
        payload
      );


      // ========================================================
      // PRODUCTION FORECAST
      // GET /demand-forecast/forecast
      // ========================================================

      const productionResponse = await API.get(
        "/demand-forecast/forecast"
      );


      const predictionData =
        predictionResponse.data;

      const productionData =
        productionResponse.data;


      // ========================================================
      // VALIDATE SINGLE PREDICTION
      // ========================================================

      if (
        !predictionData ||
        typeof predictionData.predicted_demand_index ===
          "undefined"
      ) {

        throw new Error(
          "The prediction API returned an unexpected response."
        );

      }


      // ========================================================
      // VALIDATE PRODUCTION FORECAST
      // ========================================================

      if (
        !productionData ||
        !productionData.seven_days ||
        !productionData.fourteen_days ||
        !productionData.thirty_days ||
        !productionData.three_months ||
        !productionData.six_months ||
        !productionData.twelve_months
      ) {

        throw new Error(
          "The production forecast response is incomplete."
        );

      }


      // ========================================================
      // NORMALIZE FORECAST
      // ========================================================

      setForecast({

        current_demand:
          Number(
            predictionData.predicted_demand_index
          ) || 0,


        seven_days:
          productionData.seven_days,

        fourteen_days:
          productionData.fourteen_days,

        thirty_days:
          productionData.thirty_days,

        three_months:
          productionData.three_months,

        six_months:
          productionData.six_months,

        twelve_months:
          productionData.twelve_months,

      });


      // ========================================================
      // LOAD SEASONAL DATA IF NOT ALREADY AVAILABLE
      // ========================================================

      if (!seasonalData) {

        try {

          setLoadingSeasonal(true);

          const seasonalResponse =
            await API.get(
              `/demand-forecast/seasonal/${formData.product_id}`
            );

          setSeasonalData(
            seasonalResponse.data
          );

        } catch (seasonalError) {

          console.error(
            "Seasonal data error:",
            seasonalError.response?.data ||
            seasonalError.message
          );

        } finally {

          setLoadingSeasonal(false);

        }

      }

    } catch (err) {

      console.error(
        "Demand forecast error:",
        err.response?.data ||
        err.message
      );

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to generate demand forecast."
      );

    } finally {

      setPredicting(false);
      setLoadingProductionForecast(false);

    }

  };


  // ============================================================
  // FORMAT NUMBER
  // ============================================================

  const formatNumber = (value) => {

    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
    ) {

      return "0.00";

    }

    return Number(value).toFixed(2);

  };


  // ============================================================
  // FORMAT PERCENTAGE
  // ============================================================

  const formatPercent = (value) => {

    const number = Number(value) || 0;

    return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;

  };


  // ============================================================
  // GET HORIZON TREND
  // ============================================================

  const getHorizonTrend = (horizon) => {

    const trend =
      String(
        horizon?.demand_trend || "STABLE"
      ).toUpperCase();


    if (
      trend === "INCREASING" ||
      trend === "INCREASE" ||
      trend === "UP"
    ) {

      return {
        label: "Increasing",
        icon: TrendingUp,
        className: "text-lime-300",
        bgClass: "bg-lime-300/10",
      };

    }


    if (
      trend === "DECREASING" ||
      trend === "DECREASE" ||
      trend === "DOWN"
    ) {

      return {
        label: "Decreasing",
        icon: TrendingDown,
        className: "text-red-300",
        bgClass: "bg-red-300/10",
      };

    }


    return {
      label: "Stable",
      icon: Activity,
      className: "text-yellow-300",
      bgClass: "bg-yellow-300/10",
    };

  };


  // ============================================================
  // HORIZON DATA
  // ============================================================

  const horizonData = useMemo(() => {

    if (!forecast) {

      return {

        short: {
          title: "Next 30 Days",
          planning: "Operational planning",
          explanation:
            "Understand immediate demand movement for inventory and pricing decisions.",
          values: [],
          final: 0,
          horizon: null,
        },

        medium: {
          title: "Next 6 Months",
          planning: "Business planning",
          explanation:
            "Understand broader demand movement for stock and campaign planning.",
          values: [],
          final: 0,
          horizon: null,
        },

        long: {
          title: "Next 12 Months",
          planning: "Strategic planning",
          explanation:
            "Understand long-range demand direction for strategic decisions.",
          values: [],
          final: 0,
          horizon: null,
        },

      };

    }


    return {

      short: {

        title: "Next 30 Days",

        planning:
          "Operational planning",

        explanation:
          "Useful for inventory, promotions and near-term pricing decisions.",

        values: [
          {
            label: "Today",
            value:
              forecast.current_demand,
          },

          {
            label: "7 Days",
            value:
              forecast.seven_days.average_daily_demand,
          },

          {
            label: "14 Days",
            value:
              forecast.fourteen_days.average_daily_demand,
          },

          {
            label: "30 Days",
            value:
              forecast.thirty_days.average_daily_demand,
          },
        ],

        final:
          forecast.thirty_days.average_daily_demand,

        horizon:
          forecast.thirty_days,

      },


      medium: {

        title: "Next 6 Months",

        planning:
          "Business planning",

        explanation:
          "Useful for stock planning, campaigns and medium-term strategy.",

        values: [
          {
            label: "Today",
            value:
              forecast.current_demand,
          },

          {
            label: "3 Months",
            value:
              forecast.three_months.average_daily_demand,
          },

          {
            label: "6 Months",
            value:
              forecast.six_months.average_daily_demand,
          },
        ],

        final:
          forecast.six_months.average_daily_demand,

        horizon:
          forecast.six_months,

      },


      long: {

        title: "Next 12 Months",

        planning:
          "Strategic planning",

        explanation:
          "Useful for long-range planning, capacity and business strategy.",

        values: [
          {
            label: "Today",
            value:
              forecast.current_demand,
          },

          {
            label: "12 Months",
            value:
              forecast.twelve_months.average_daily_demand,
          },
        ],

        final:
          forecast.twelve_months.average_daily_demand,

        horizon:
          forecast.twelve_months,

      },

    };

  }, [forecast]);


  const activeData =
    horizonData[activeHorizon];


  // ============================================================
  // ACTIVE CHANGE
  // ============================================================

  const activeChange = useMemo(() => {

    if (!forecast) {
      return 0;
    }


    const current =
      Number(forecast.current_demand) || 0;

    const final =
      Number(activeData.final) || 0;


    if (current === 0) {
      return 0;
    }


    return (
      ((final - current) / current) *
      100
    );

  }, [forecast, activeData]);


  // ============================================================
  // TREND INFO
  // ============================================================

  const trendInfo = useMemo(() => {

    if (!forecast || !activeData.horizon) {

      return {
        label:
          "Waiting for forecast",

        shortLabel:
          "Waiting",

        icon:
          Activity,

        className:
          "text-gray-400",

        bgClass:
          "bg-gray-400/10",
      };

    }


    const trend =
      getHorizonTrend(
        activeData.horizon
      );


    return {

      label:
        trend.label === "Increasing"
          ? "Demand is expected to increase"
          : trend.label === "Decreasing"
            ? "Demand is expected to decrease"
            : "Demand is expected to remain stable",

      shortLabel:
        trend.label,

      icon:
        trend.icon,

      className:
        trend.className,

      bgClass:
        trend.bgClass,

    };

  }, [forecast, activeData]);


  const TrendIcon =
    trendInfo.icon;


  // ============================================================
  // MAX VALUE
  // ============================================================

  const maxValue = useMemo(() => {

    if (!activeData.values.length) {
      return 100;
    }


    return Math.max(

      ...activeData.values.map(
        (item) =>
          Number(item.value) || 0
      ),

      100

    );

  }, [activeData]);


  // ============================================================
  // DEMAND LEVEL
  // ============================================================

  const demandLevel = useMemo(() => {

    if (!forecast) {

      return {
        label: "Waiting",
        description:
          "Generate a forecast first.",
        className:
          "text-gray-400",
        icon:
          CircleHelp,
      };

    }


    const value =
      Number(activeData.final) || 0;


    if (value >= 150) {

      return {
        label: "High demand",
        description:
          "The forecast indicates a strong demand level for this horizon.",
        className:
          "text-lime-300",
        icon:
          TrendingUp,
      };

    }


    if (value >= 100) {

      return {
        label: "Moderate demand",
        description:
          "The forecast indicates a moderate demand level.",
        className:
          "text-yellow-300",
        icon:
          Activity,
      };

    }


    return {
      label: "Low demand",
      description:
        "The forecast indicates relatively low demand for this horizon.",
      className:
        "text-blue-300",
      icon:
        TrendingDown,
    };

  }, [forecast, activeData]);


  const DemandLevelIcon =
    demandLevel.icon;


  // ============================================================
  // INVENTORY STATUS
  // ============================================================

  const inventoryStatus = useMemo(() => {

    const inventory =
      Number(formData.inventory_level) || 0;


    const projectedDemand =
      Number(
        activeData.horizon
          ?.total_predicted_demand
      ) || 0;


    if (inventory <= 0) {

      return {
        label:
          "Stockout risk",

        description:
          "Inventory is currently empty.",

        className:
          "text-red-300",

        bgClass:
          "bg-red-300/10",

        icon:
          AlertTriangle,
      };

    }


    if (
      projectedDemand > 0 &&
      inventory < projectedDemand
    ) {

      return {
        label:
          "Monitor stock",

        description:
          "Projected demand may exceed current inventory.",

        className:
          "text-yellow-300",

        bgClass:
          "bg-yellow-300/10",

        icon:
          AlertTriangle,
      };

    }


    return {
      label:
        "Healthy",

      description:
        "Current inventory is above projected demand.",

      className:
        "text-lime-300",

      bgClass:
        "bg-lime-300/10",

      icon:
        CheckCircle2,
    };

  }, [
    formData.inventory_level,
    activeData,
  ]);


  const InventoryIcon =
    inventoryStatus.icon;


  // ============================================================
  // BUSINESS MESSAGE
  // ============================================================

  const businessMessage = useMemo(() => {

    if (!forecast) {

      return {
        title:
          "Generate a forecast to see the business outlook.",

        text:
          "PricePilot AI will translate the demand prediction into a practical business outlook.",
      };

    }


    if (activeChange > 10) {

      return {
        title:
          "Demand is showing a strong upward trajectory.",

        text:
          `The selected horizon indicates approximately ${formatPercent(activeChange)} movement from the current demand index. Prepare inventory and monitor pricing or promotional activity.`,
      };

    }


    if (activeChange > 3) {

      return {
        title:
          "Demand is expected to grow.",

        text:
          `The selected horizon indicates approximately ${formatPercent(activeChange)} growth. Keep inventory ready and monitor the trend.`,
      };

    }


    if (activeChange < -10) {

      return {
        title:
          "Demand may decline significantly.",

        text:
          `The selected horizon indicates approximately ${formatPercent(activeChange)} movement. Review promotions, pricing and inventory before making additional commitments.`,
      };

    }


    if (activeChange < -3) {

      return {
        title:
          "Demand is showing a downward movement.",

        text:
          "Demand may soften over the selected horizon. Monitor sales closely before increasing inventory.",
      };

    }


    return {
      title:
        "Demand is expected to remain relatively stable.",

      text:
        "The selected forecast horizon does not show a major movement from the current demand level. Maintaining the current strategy while monitoring demand is reasonable.",
    };

  }, [
    forecast,
    activeChange,
  ]);


  // ============================================================
  // RECOMMENDATION
  // ============================================================

  const recommendation = useMemo(() => {

    if (!forecast) {

      return {
        title:
          "Waiting for forecast",

        text:
          "Generate a forecast to receive a business recommendation.",
      };

    }


    if (
      activeChange > 10 &&
      inventoryStatus.label !== "Healthy"
    ) {

      return {
        title:
          "Prepare additional inventory",

        text:
          "Demand is rising while inventory may not be sufficient. Prioritize stock availability for this product.",
      };

    }


    if (activeChange > 10) {

      return {
        title:
          "Prepare for higher demand",

        text:
          "Demand is expected to rise significantly. Keep inventory available and monitor pricing closely.",
      };

    }


    if (activeChange < -10) {

      return {
        title:
          "Review demand-supporting actions",

        text:
          "Demand is expected to fall. Consider promotional or pricing actions before committing to additional inventory.",
      };

    }


    if (
      inventoryStatus.label ===
      "Monitor stock"
    ) {

      return {
        title:
          "Monitor inventory closely",

        text:
          "Projected demand may put pressure on current inventory levels for this planning horizon.",
      };

    }


    return {
      title:
        "Maintain current strategy",

      text:
        "No major demand shock is predicted for the selected horizon. Continue monitoring the forecast as new data becomes available.",
    };

  }, [
    forecast,
    activeChange,
    inventoryStatus,
  ]);


  // ============================================================
  // INPUT STYLE
  // ============================================================

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#080d09] px-4 py-3 text-sm text-gray-300 outline-none transition focus:border-lime-300/40 focus:ring-1 focus:ring-lime-300/10";


  // ============================================================
  // HORIZON CARD
  // ============================================================

  const renderHorizonCard = (
    key,
    Icon,
    title,
    subtitle,
    value,
    change
  ) => {

    const selected =
      activeHorizon === key;


    return (

      <button
        type="button"
        onClick={() =>
          setActiveHorizon(key)
        }
        className={`
          group
          relative
          overflow-hidden
          rounded-[22px]
          border
          p-5
          text-left
          transition-all
          duration-300

          ${
            selected
              ? "border-lime-300/40 bg-lime-300/[0.08] shadow-[0_0_35px_rgba(163,230,53,0.08)]"
              : "border-white/5 bg-[#071009] hover:border-lime-300/20 hover:bg-lime-300/[0.035]"
          }
        `}
      >

        {selected && (

          <div
            className="
              absolute
              left-0
              top-0
              h-full
              w-1
              bg-lime-300
              shadow-[0_0_15px_rgba(163,230,53,0.8)]
            "
          />

        )}


        <div
          className="
            absolute
            -right-10
            -top-10
            h-28
            w-28
            rounded-full
            bg-lime-300/5
            blur-3xl
          "
        />


        <div className="relative">

          <div className="flex items-start justify-between">

            <div
              className={`
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl

                ${
                  selected
                    ? "bg-lime-300/15"
                    : "bg-white/[0.035]"
                }
              `}
            >

              <Icon
                className={`
                  h-5
                  w-5

                  ${
                    selected
                      ? "text-lime-300"
                      : "text-gray-500"
                  }
                `}
              />

            </div>


            {forecast && (

              <span
                className={`
                  rounded-lg
                  px-2.5
                  py-1
                  text-[10px]
                  font-bold

                  ${
                    change >= 0
                      ? "bg-lime-300/10 text-lime-300"
                      : "bg-red-300/10 text-red-300"
                  }
                `}
              >
                {formatPercent(change)}
              </span>

            )}

          </div>


          <p
            className="
              relative
              mt-5
              text-[16px]
              font-bold
              text-white
            "
          >
            {title}
          </p>


          <p
            className="
              relative
              mt-1
              text-xs
              text-gray-500
            "
          >
            {subtitle}
          </p>


          {forecast ? (

            <div className="relative mt-5">

              <p
                className={`
                  text-2xl
                  font-bold
                  tracking-tight

                  ${
                    selected
                      ? "text-lime-300"
                      : "text-gray-300"
                  }
                `}
              >
                {formatNumber(value)}
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-gray-600
                "
              >
                average daily demand
              </p>

            </div>

          ) : (

            <div
              className="
                relative
                mt-5
                text-xs
                text-gray-600
              "
            >
              Generate forecast
            </div>

          )}


          <div
            className={`
              relative
              mt-5
              flex
              items-center
              gap-1.5
              text-[10px]
              font-semibold
              uppercase
              tracking-wider

              ${
                selected
                  ? "text-lime-300"
                  : "text-gray-600"
              }
            `}
          >

            View outlook

            <ArrowRight
              className="
                h-3.5
                w-3.5
                transition-transform
                group-hover:translate-x-1
              "
            />

          </div>

        </div>

      </button>

    );

  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="
        min-h-screen
        bg-[#030604]
        text-white
      "
    >

      <Sidebar />


      <div className="ml-72 min-h-screen">

        <main
          className="
            px-6
            py-6
            lg:px-8
          "
        >

          {/* ==================================================
              HEADER
          ================================================== */}

          <section
            className="
              relative
              mb-5
              overflow-hidden
              rounded-[28px]
              border
              border-lime-300/10
              bg-[#071009]
              px-6
              py-6
            "
          >

            <div
              className="
                pointer-events-none
                absolute
                -right-20
                -top-32
                h-80
                w-80
                rounded-full
                bg-lime-300/10
                blur-[110px]
              "
            />


            <div
              className="
                relative
                flex
                flex-col
                gap-5
                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >

              <div>

                <div
                  className="
                    mb-2
                    flex
                    items-center
                    gap-2
                  "
                >

                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-lime-300
                      shadow-[0_0_12px_rgba(163,230,53,0.9)]
                    "
                  />

                  <span
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.22em]
                      text-lime-300
                    "
                  >
                    PricePilot AI
                  </span>

                </div>


                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                  "
                >
                  Demand Forecast
                </h1>


                <p
                  className="
                    mt-2
                    max-w-xl
                    text-sm
                    leading-6
                    text-gray-500
                  "
                >
                  Understand where product demand is heading
                  and make better inventory and business decisions.
                </p>

              </div>


              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-white/5
                  bg-white/[0.025]
                  px-4
                  py-3
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-lime-300/10
                  "
                >

                  <Brain
                    className="
                      h-5
                      w-5
                      text-lime-300
                    "
                  />

                </div>


                <div>

                  <p
                    className="
                      text-[9px]
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Prediction engine
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-sm
                      font-semibold
                      text-gray-300
                    "
                  >
                    XGBoost Forecast Engine
                  </p>

                </div>

              </div>

            </div>

          </section>


          {/* ==================================================
              PRODUCT SELECTION
          ================================================== */}

          <section
            className="
              mb-5
              rounded-[24px]
              border
              border-white/5
              bg-[#071009]
              p-5
            "
          >

            <div
              className="
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-end
              "
            >

              <div className="flex-1">

                <label
                  className="
                    mb-2
                    block
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-gray-500
                  "
                >
                  Step 1 · Choose a product
                </label>


                <div className="relative">

                  <select
                    value={formData.product_id}
                    onChange={handleProductChange}
                    disabled={loadingProducts}
                    className={`
                      ${inputClass}
                      appearance-none
                      pr-10
                    `}
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


                  <ChevronDown
                    className="
                      pointer-events-none
                      absolute
                      right-4
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-gray-600
                    "
                  />

                </div>

              </div>


              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/5
                  bg-white/[0.025]
                  px-4
                  py-3
                  lg:min-w-[180px]
                "
              >

                <Gauge
                  className="
                    h-5
                    w-5
                    text-lime-300
                  "
                />

                <div>

                  <p
                    className="
                      text-[9px]
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Current demand
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-lg
                      font-bold
                      text-gray-200
                    "
                  >
                    {forecast
                      ? formatNumber(
                          forecast.current_demand
                        )
                      : "--"}
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={handlePredict}
                disabled={
                  predicting ||
                  loadingProducts ||
                  !formData.product_id
                }
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-lime-300
                  px-7
                  py-3.5
                  font-bold
                  text-black
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-lime-200
                  hover:shadow-[0_0_30px_rgba(163,230,53,0.25)]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {predicting ? (

                  <>

                    <div
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-black/20
                        border-t-black
                      "
                    />

                    Analyzing demand...

                  </>

                ) : (

                  <>

                    <Zap className="h-4 w-4" />

                    Generate Forecast

                  </>

                )}

              </button>

            </div>


            {formData.product_id && (

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  gap-2
                  border-t
                  border-white/5
                  pt-4
                "
              >

                <span
                  className="
                    rounded-lg
                    border
                    border-white/5
                    bg-white/[0.025]
                    px-3
                    py-1.5
                    text-[10px]
                    text-gray-500
                  "
                >
                  {formData.category}
                </span>


                <span
                  className="
                    rounded-lg
                    border
                    border-white/5
                    bg-white/[0.025]
                    px-3
                    py-1.5
                    text-[10px]
                    text-gray-500
                  "
                >
                  {formData.brand}
                </span>


                <span
                  className="
                    rounded-lg
                    border
                    border-white/5
                    bg-white/[0.025]
                    px-3
                    py-1.5
                    text-[10px]
                    text-gray-500
                  "
                >
                  ₹{formatNumber(formData.current_price)}
                </span>


                <span
                  className="
                    rounded-lg
                    border
                    border-white/5
                    bg-white/[0.025]
                    px-3
                    py-1.5
                    text-[10px]
                    text-gray-500
                  "
                >
                  Stock {formatNumber(formData.inventory_level)}
                </span>

              </div>

            )}

          </section>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div
              className="
                mb-5
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-red-400/20
                bg-red-400/5
                px-4
                py-3
              "
            >

              <div className="flex items-center gap-2">

                <AlertTriangle
                  className="
                    h-4
                    w-4
                    text-red-300
                  "
                />

                <p className="text-sm text-red-300">
                  {error}
                </p>

              </div>


              <button
                onClick={() => setError("")}
                className="
                  text-xs
                  text-gray-600
                  transition
                  hover:text-gray-300
                "
              >
                Dismiss
              </button>

            </div>

          )}


          {/* ==================================================
              BUSINESS OUTLOOK
          ================================================== */}

          {forecast && (

            <section
              className="
                relative
                mb-6
                overflow-hidden
                rounded-[28px]
                border
                border-lime-300/20
                bg-[#071009]
                p-6
              "
            >

              <div
                className="
                  pointer-events-none
                  absolute
                  -right-24
                  -top-32
                  h-80
                  w-80
                  rounded-full
                  bg-lime-300/10
                  blur-[100px]
                "
              />


              <div className="relative">

                <div
                  className="
                    mb-5
                    flex
                    flex-col
                    gap-3
                    md:flex-row
                    md:items-center
                    md:justify-between
                  "
                >

                  <div>

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <Sparkles
                        className="
                          h-4
                          w-4
                          text-lime-300
                        "
                      />

                      <span
                        className="
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-[0.2em]
                          text-lime-300
                        "
                      >
                        Business Outlook
                      </span>

                    </div>


                    <h2
                      className="
                        mt-2
                        text-xl
                        font-bold
                      "
                    >
                      {trendInfo.label}
                    </h2>


                    <p
                      className="
                        mt-1
                        text-xs
                        text-gray-500
                      "
                    >
                      Based on the selected product prediction
                      and production forecast.
                    </p>

                  </div>


                  <div
                    className={`
                      flex
                      w-fit
                      items-center
                      gap-2
                      rounded-xl
                      px-4
                      py-2.5
                      ${trendInfo.bgClass}
                    `}
                  >

                    <TrendIcon
                      className={`
                        h-4
                        w-4
                        ${trendInfo.className}
                      `}
                    />

                    <span
                      className={`
                        text-xs
                        font-bold
                        ${trendInfo.className}
                      `}
                    >
                      {trendInfo.shortLabel}
                    </span>

                  </div>

                </div>


                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    md:grid-cols-3
                  "
                >

                  <div
                    className="
                      rounded-2xl
                      border
                      border-white/5
                      bg-[#040905]
                      p-5
                    "
                  >

                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-600
                      "
                    >
                      Product demand
                    </p>


                    <p
                      className="
                        mt-2
                        text-3xl
                        font-bold
                        text-white
                      "
                    >
                      {formatNumber(
                        forecast.current_demand
                      )}
                    </p>


                    <p
                      className="
                        mt-1
                        text-[11px]
                        text-gray-600
                      "
                    >
                      Current predicted demand index
                    </p>

                  </div>


                  <div
                    className="
                      rounded-2xl
                      border
                      border-lime-300/15
                      bg-lime-300/[0.045]
                      p-5
                    "
                  >

                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-600
                      "
                    >
                      Expected demand
                    </p>


                    <p
                      className="
                        mt-2
                        text-3xl
                        font-bold
                        text-lime-300
                      "
                    >
                      {formatNumber(
                        activeData.final
                      )}
                    </p>


                    <p
                      className="
                        mt-1
                        text-[11px]
                        text-gray-600
                      "
                    >
                      Average daily demand
                    </p>

                  </div>


                  <div
                    className="
                      rounded-2xl
                      border
                      border-white/5
                      bg-[#040905]
                      p-5
                    "
                  >

                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-600
                      "
                    >
                      Expected change
                    </p>


                    <p
                      className={`
                        mt-2
                        text-3xl
                        font-bold

                        ${
                          activeChange >= 0
                            ? "text-lime-300"
                            : "text-red-300"
                        }
                      `}
                    >
                      {formatPercent(
                        activeChange
                      )}
                    </p>


                    <p
                      className="
                        mt-1
                        text-[11px]
                        text-gray-600
                      "
                    >
                      Compared with today
                    </p>

                  </div>

                </div>


                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-white/5
                    bg-white/[0.02]
                    px-5
                    py-4
                  "
                >

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-200
                    "
                  >
                    {businessMessage.title}
                  </p>


                  <p
                    className="
                      mt-1.5
                      max-w-4xl
                      text-xs
                      leading-5
                      text-gray-500
                    "
                  >
                    {businessMessage.text}
                  </p>

                </div>

              </div>

            </section>

          )}


          {/* ==================================================
              HORIZON SELECTION
          ================================================== */}

          <section className="mb-6">

            <div
              className="
                mb-4
                flex
                flex-col
                gap-1
              "
            >

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-gray-600
                "
              >
                {forecast
                  ? "Step 2 · Choose your planning horizon"
                  : "Choose your planning horizon"}
              </p>


              <p
                className="
                  text-sm
                  text-gray-400
                "
              >
                {forecast
                  ? "Select the timeframe you want to understand."
                  : "Generate a forecast first, then explore short, medium and long-term demand."}
              </p>

            </div>


            <div
              className="
                grid
                grid-cols-1
                gap-3
                md:grid-cols-3
              "
            >

              {renderHorizonCard(
                "short",
                Zap,
                "Next 30 Days",
                "Operational planning",
                forecast
                  ? forecast.thirty_days.average_daily_demand
                  : 0,
                forecast
                  ? (
                      (
                        forecast.thirty_days.average_daily_demand -
                        forecast.current_demand
                      ) /
                      Math.max(
                        forecast.current_demand,
                        1
                      )
                    ) * 100
                  : 0
              )}


              {renderHorizonCard(
                "medium",
                BarChart3,
                "Next 6 Months",
                "Business planning",
                forecast
                  ? forecast.six_months.average_daily_demand
                  : 0,
                forecast
                  ? (
                      (
                        forecast.six_months.average_daily_demand -
                        forecast.current_demand
                      ) /
                      Math.max(
                        forecast.current_demand,
                        1
                      )
                    ) * 100
                  : 0
              )}


              {renderHorizonCard(
                "long",
                Target,
                "Next 12 Months",
                "Strategic planning",
                forecast
                  ? forecast.twelve_months.average_daily_demand
                  : 0,
                forecast
                  ? (
                      (
                        forecast.twelve_months.average_daily_demand -
                        forecast.current_demand
                      ) /
                      Math.max(
                        forecast.current_demand,
                        1
                      )
                    ) * 100
                  : 0
              )}

            </div>

          </section>


          {/* ==================================================
              MAIN FORECAST DETAILS
          ================================================== */}

          {forecast ? (

            <section
              className="
                relative
                mb-6
                overflow-hidden
                rounded-[28px]
                border
                border-white/5
                bg-[#071009]
                p-6
              "
            >

              <div
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-1/2
                  h-96
                  w-96
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  bg-lime-300/5
                  blur-[100px]
                "
              />


              <div className="relative">

                <div
                  className="
                    mb-5
                    flex
                    flex-col
                    gap-3
                    md:flex-row
                    md:items-center
                    md:justify-between
                  "
                >

                  <div>

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <BarChart3
                        className="
                          h-4
                          w-4
                          text-lime-300
                        "
                      />

                      <span
                        className="
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-[0.2em]
                          text-lime-300
                        "
                      >
                        Demand trajectory
                      </span>

                    </div>


                    <h2
                      className="
                        mt-1
                        text-xl
                        font-bold
                      "
                    >
                      {activeData.title}
                    </h2>


                    <p
                      className="
                        mt-1
                        text-xs
                        text-gray-500
                      "
                    >
                      {activeData.explanation}
                    </p>

                  </div>


                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-white/5
                      bg-white/[0.025]
                      px-4
                      py-2.5
                    "
                  >

                    <CalendarDays
                      className="
                        h-4
                        w-4
                        text-gray-500
                      "
                    />

                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-400
                      "
                    >
                      {activeData.planning}
                    </span>

                  </div>

                </div>


                <div
                  className="
                    grid
                    grid-cols-1
                    gap-5
                    xl:grid-cols-[1fr_310px]
                  "
                >

                  {/* CHART */}

                  <div
                    className="
                      rounded-2xl
                      border
                      border-white/5
                      bg-[#040905]
                      p-5
                    "
                  >

                    <div
                      className="
                        mb-4
                        flex
                        items-center
                        justify-between
                      "
                    >

                      <div>

                        <p
                          className="
                            text-[10px]
                            uppercase
                            tracking-wider
                            text-gray-600
                          "
                        >
                          Forecast path
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            text-gray-500
                          "
                        >
                          Average daily demand
                        </p>

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          text-[10px]
                          text-gray-600
                        "
                      >

                        <span
                          className="
                            h-2
                            w-2
                            rounded-full
                            bg-lime-300
                          "
                        />

                        Demand index

                      </div>

                    </div>


                    <div
                      className="
                        relative
                        h-[280px]
                        overflow-hidden
                        rounded-xl
                        border
                        border-white/[0.03]
                        bg-[#030604]
                        px-5
                        pb-9
                        pt-6
                      "
                    >

                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-x-5
                          bottom-10
                          top-6
                          flex
                          flex-col
                          justify-between
                        "
                      >

                        {[0, 1, 2, 3].map(
                          (line) => (

                            <div
                              key={line}
                              className="
                                h-px
                                w-full
                                bg-white/[0.035]
                              "
                            />

                          )
                        )}

                      </div>


                      <div
                        className="
                          relative
                          flex
                          h-full
                          items-end
                          gap-3
                        "
                      >

                        {activeData.values.map(
                          (point, index) => {

                            const value =
                              Number(
                                point.value
                              ) || 0;


                            const height =
                              Math.max(
                                (
                                  value /
                                  maxValue
                                ) * 100,
                                8
                              );


                            const isCurrent =
                              index === 0;


                            return (

                              <div
                                key={`${point.label}-${index}`}
                                className="
                                  group
                                  relative
                                  flex
                                  h-full
                                  flex-1
                                  flex-col
                                  items-center
                                  justify-end
                                "
                              >

                                <div
                                  className="
                                    mb-2
                                    text-[10px]
                                    font-bold
                                    text-lime-300
                                    transition
                                    group-hover:scale-110
                                  "
                                >
                                  {formatNumber(value)}
                                </div>


                                <div
                                  className="
                                    relative
                                    w-full
                                    max-w-[90px]
                                  "
                                  style={{
                                    height:
                                      `${height}%`,
                                  }}
                                >

                                  <div
                                    className={`
                                      absolute
                                      inset-0
                                      rounded-t-xl
                                      transition-all
                                      duration-700

                                      ${
                                        isCurrent
                                          ? "bg-lime-300 shadow-[0_0_30px_rgba(163,230,53,0.22)]"
                                          : "border border-lime-300/10 bg-gradient-to-t from-lime-300/10 to-lime-300/30"
                                      }
                                    `}
                                  />


                                  <div
                                    className="
                                      absolute
                                      -top-1
                                      left-1/2
                                      h-2
                                      w-2
                                      -translate-x-1/2
                                      rounded-full
                                      bg-lime-200
                                      shadow-[0_0_15px_rgba(163,230,53,0.8)]
                                    "
                                  />

                                </div>


                                <span
                                  className="
                                    absolute
                                    bottom-0
                                    whitespace-nowrap
                                    text-[9px]
                                    font-semibold
                                    text-gray-600
                                  "
                                >
                                  {point.label}
                                </span>

                              </div>

                            );

                          }
                        )}

                      </div>

                    </div>


                    {/* FORECAST METRICS */}

                    <div
                      className="
                        mt-4
                        grid
                        grid-cols-2
                        gap-3
                        md:grid-cols-4
                      "
                    >

                      <div
                        className="
                          rounded-xl
                          border
                          border-white/5
                          bg-white/[0.02]
                          p-3
                        "
                      >

                        <p
                          className="
                            text-[9px]
                            uppercase
                            tracking-wider
                            text-gray-600
                          "
                        >
                          Total demand
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            font-bold
                            text-gray-300
                          "
                        >
                          {formatNumber(
                            activeData.horizon
                              ?.total_predicted_demand
                          )}
                        </p>

                      </div>


                      <div
                        className="
                          rounded-xl
                          border
                          border-white/5
                          bg-white/[0.02]
                          p-3
                        "
                      >

                        <p
                          className="
                            text-[9px]
                            uppercase
                            tracking-wider
                            text-gray-600
                          "
                        >
                          Max demand
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            font-bold
                            text-gray-300
                          "
                        >
                          {formatNumber(
                            activeData.horizon
                              ?.maximum_daily_demand
                          )}
                        </p>

                      </div>


                      <div
                        className="
                          rounded-xl
                          border
                          border-white/5
                          bg-white/[0.02]
                          p-3
                        "
                      >

                        <p
                          className="
                            text-[9px]
                            uppercase
                            tracking-wider
                            text-gray-600
                          "
                        >
                          Min demand
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            font-bold
                            text-gray-300
                          "
                        >
                          {formatNumber(
                            activeData.horizon
                              ?.minimum_daily_demand
                          )}
                        </p>

                      </div>


                      <div
                        className="
                          rounded-xl
                          border
                          border-white/5
                          bg-white/[0.02]
                          p-3
                        "
                      >

                        <p
                          className="
                            text-[9px]
                            uppercase
                            tracking-wider
                            text-gray-600
                          "
                        >
                          Revenue
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            font-bold
                            text-lime-300
                          "
                        >
                          ₹{formatNumber(
                            activeData.horizon
                              ?.total_predicted_revenue
                          )}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* INSIGHT PANEL */}

                  <div
                    className="
                      rounded-2xl
                      border
                      border-lime-300/10
                      bg-lime-300/[0.025]
                      p-5
                    "
                  >

                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.18em]
                        text-lime-300
                      "
                    >
                      What this means
                    </p>


                    <div
                      className="
                        mt-4
                        flex
                        items-center
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-11
                          w-11
                          items-center
                          justify-center
                          rounded-xl
                          bg-lime-300/10
                        "
                      >

                        <DemandLevelIcon
                          className={`
                            h-5
                            w-5
                            ${demandLevel.className}
                          `}
                        />

                      </div>


                      <div>

                        <p
                          className="
                            text-xs
                            text-gray-600
                          "
                        >
                          Demand level
                        </p>

                        <p
                          className={`
                            mt-0.5
                            text-sm
                            font-bold
                            ${demandLevel.className}
                          `}
                        >
                          {demandLevel.label}
                        </p>

                      </div>

                    </div>


                    <p
                      className="
                        mt-4
                        text-xs
                        leading-5
                        text-gray-500
                      "
                    >
                      {demandLevel.description}
                    </p>


                    <div
                      className="
                        my-5
                        h-px
                        bg-white/5
                      "
                    />


                    {/* HORIZON TREND */}

                    <div>

                      <p
                        className="
                          text-xs
                          text-gray-600
                        "
                      >
                        Forecast trend
                      </p>


                      <div
                        className="
                          mt-2
                          flex
                          items-center
                          gap-2
                        "
                      >

                        <TrendIcon
                          className={`
                            h-4
                            w-4
                            ${trendInfo.className}
                          `}
                        />

                        <span
                          className={`
                            text-sm
                            font-bold
                            ${trendInfo.className}
                          `}
                        >
                          {trendInfo.shortLabel}
                        </span>

                      </div>


                      <p
                        className="
                          mt-2
                          text-[10px]
                          leading-4
                          text-gray-600
                        "
                      >
                        Model-reported change:
                        {" "}
                        {formatPercent(
                          activeData.horizon
                            ?.trend_change_percent
                        )}
                      </p>

                    </div>


                    {/* CONFIDENCE */}

                    <div className="mt-5">

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                        "
                      >

                        <span
                          className="
                            text-xs
                            text-gray-600
                          "
                        >
                          Forecast confidence
                        </span>


                        <span
                          className="
                            text-sm
                            font-bold
                            text-gray-300
                          "
                        >
                          {formatNumber(
                            activeData.horizon
                              ?.confidence_score
                          )}%
                        </span>

                      </div>


                      <div
                        className="
                          mt-2
                          h-2
                          overflow-hidden
                          rounded-full
                          bg-white/5
                        "
                      >

                        <div
                          className="
                            h-full
                            rounded-full
                            bg-lime-300
                            shadow-[0_0_10px_rgba(163,230,53,0.7)]
                            transition-all
                            duration-700
                          "
                          style={{
                            width:
                              `${Math.min(
                                Math.max(
                                  Number(
                                    activeData.horizon
                                      ?.confidence_score
                                  ) || 0,
                                  0
                                ),
                                100
                              )}%`,
                          }}
                        />

                      </div>

                    </div>


                    {/* INVENTORY */}

                    <div
                      className="
                        mt-5
                        rounded-xl
                        border
                        border-white/5
                        bg-white/[0.02]
                        p-4
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >

                        <InventoryIcon
                          className={`
                            h-4
                            w-4
                            ${inventoryStatus.className}
                          `}
                        />

                        <span
                          className="
                            text-[10px]
                            uppercase
                            tracking-wider
                            text-gray-600
                          "
                        >
                          Inventory
                        </span>

                      </div>


                      <p
                        className={`
                          mt-2
                          text-sm
                          font-bold
                          ${inventoryStatus.className}
                        `}
                      >
                        {inventoryStatus.label}
                      </p>


                      <p
                        className="
                          mt-1
                          text-[10px]
                          leading-4
                          text-gray-600
                        "
                      >
                        {inventoryStatus.description}
                      </p>

                    </div>

                  </div>

                </div>


                {/* ==================================================
                    RECOMMENDATION
                ================================================== */}

                <div
                  className="
                    mt-5
                    rounded-2xl
                    border
                    border-lime-300/15
                    bg-lime-300/[0.045]
                    p-5
                  "
                >

                  <div
                    className="
                      flex
                      flex-col
                      gap-4
                      md:flex-row
                      md:items-start
                    "
                  >

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-lime-300/15
                      "
                    >

                      <Sparkles
                        className="
                          h-5
                          w-5
                          text-lime-300
                        "
                      />

                    </div>


                    <div>

                      <p
                        className="
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-[0.18em]
                          text-lime-300
                        "
                      >
                        AI Recommendation
                      </p>


                      <h3
                        className="
                          mt-1
                          text-base
                          font-bold
                          text-white
                        "
                      >
                        {recommendation.title}
                      </h3>


                      <p
                        className="
                          mt-1.5
                          max-w-4xl
                          text-xs
                          leading-5
                          text-gray-500
                        "
                      >
                        {recommendation.text}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>

          ) : (

            /* ==================================================
               EMPTY STATE
            ================================================== */

            <section
              className="
                mb-6
                rounded-[28px]
                border
                border-white/5
                bg-[#071009]
                p-10
              "
            >

              <div
                className="
                  mx-auto
                  max-w-xl
                  text-center
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
                    border-lime-300/10
                    bg-lime-300/5
                  "
                >

                  <Brain
                    className="
                      h-7
                      w-7
                      text-lime-300/50
                    "
                  />

                </div>


                <h2
                  className="
                    mt-5
                    text-xl
                    font-bold
                    text-gray-300
                  "
                >
                  Your demand outlook is ready to generate
                </h2>


                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-lg
                    text-sm
                    leading-6
                    text-gray-600
                  "
                >
                  Choose a product above and click
                  <span className="text-gray-400">
                    {" "}Generate Forecast
                  </span>
                  . PricePilot AI will combine the
                  product demand prediction with the
                  production forecast horizons.
                </p>


                <div
                  className="
                    mt-6
                    grid
                    grid-cols-1
                    gap-2
                    text-left
                    sm:grid-cols-3
                  "
                >

                  <div
                    className="
                      rounded-xl
                      border
                      border-white/5
                      bg-white/[0.02]
                      p-3
                    "
                  >

                    <Zap
                      className="
                        h-4
                        w-4
                        text-lime-300
                      "
                    />

                    <p
                      className="
                        mt-2
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      30 Days
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-gray-600
                      "
                    >
                      Immediate planning
                    </p>

                  </div>


                  <div
                    className="
                      rounded-xl
                      border
                      border-white/5
                      bg-white/[0.02]
                      p-3
                    "
                  >

                    <BarChart3
                      className="
                        h-4
                        w-4
                        text-lime-300
                      "
                    />

                    <p
                      className="
                        mt-2
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      6 Months
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-gray-600
                      "
                    >
                      Business planning
                    </p>

                  </div>


                  <div
                    className="
                      rounded-xl
                      border
                      border-white/5
                      bg-white/[0.02]
                      p-3
                    "
                  >

                    <Target
                      className="
                        h-4
                        w-4
                        text-lime-300
                      "
                    />

                    <p
                      className="
                        mt-2
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      12 Months
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-gray-600
                      "
                    >
                      Strategic planning
                    </p>

                  </div>

                </div>

              </div>

            </section>

          )}


          {/* ==================================================
              SEASONAL TREND
          ================================================== */}

          {formData.product_id && (

            <section
              className="
                mb-6
                rounded-[28px]
                border
                border-white/5
                bg-[#071009]
                p-6
              "
            >

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  md:flex-row
                  md:items-center
                  md:justify-between
                "
              >

                <div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <CalendarDays
                      className="
                        h-4
                        w-4
                        text-lime-300
                      "
                    />

                    <span
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.2em]
                        text-lime-300
                      "
                    >
                      Seasonal Demand
                    </span>

                  </div>


                  <h2
                    className="
                      mt-1
                      text-xl
                      font-bold
                    "
                  >
                    Historical seasonal pattern
                  </h2>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-500
                    "
                  >
                    Historical monthly demand behavior for
                    the selected product.
                  </p>

                </div>


                {seasonalData && (

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-lime-300/10
                      bg-lime-300/[0.04]
                      px-4
                      py-2.5
                    "
                  >

                    <Activity
                      className="
                        h-4
                        w-4
                        text-lime-300
                      "
                    />

                    <span
                      className="
                        text-xs
                        font-semibold
                        text-lime-300
                      "
                    >
                      {seasonalData.seasonality_strength}
                      {" "}seasonality
                    </span>

                  </div>

                )}

              </div>


              {loadingSeasonal ? (

                <div
                  className="
                    mt-6
                    flex
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-white/5
                    bg-white/[0.02]
                    py-12
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      text-sm
                      text-gray-500
                    "
                  >

                    <div
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/10
                        border-t-lime-300
                      "
                    />

                    Loading seasonal analysis...

                  </div>

                </div>

              ) : seasonalData ? (

                <>

                  <div
                    className="
                      mt-6
                      grid
                      grid-cols-1
                      gap-3
                      md:grid-cols-3
                    "
                  >

                    <div
                      className="
                        rounded-2xl
                        border
                        border-white/5
                        bg-white/[0.02]
                        p-4
                      "
                    >

                      <p
                        className="
                          text-[9px]
                          uppercase
                          tracking-wider
                          text-gray-600
                        "
                      >
                        Peak month
                      </p>

                      <p
                        className="
                          mt-2
                          text-lg
                          font-bold
                          text-lime-300
                        "
                      >
                        {seasonalData.peak_month}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[10px]
                          text-gray-600
                        "
                      >
                        Demand:
                        {" "}
                        {formatNumber(
                          seasonalData.peak_demand
                        )}
                      </p>

                    </div>


                    <div
                      className="
                        rounded-2xl
                        border
                        border-white/5
                        bg-white/[0.02]
                        p-4
                      "
                    >

                      <p
                        className="
                          text-[9px]
                          uppercase
                          tracking-wider
                          text-gray-600
                        "
                      >
                        Lowest month
                      </p>

                      <p
                        className="
                          mt-2
                          text-lg
                          font-bold
                          text-gray-300
                        "
                      >
                        {seasonalData.lowest_month}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[10px]
                          text-gray-600
                        "
                      >
                        Demand:
                        {" "}
                        {formatNumber(
                          seasonalData.lowest_demand
                        )}
                      </p>

                    </div>


                    <div
                      className="
                        rounded-2xl
                        border
                        border-white/5
                        bg-white/[0.02]
                        p-4
                      "
                    >

                      <p
                        className="
                          text-[9px]
                          uppercase
                          tracking-wider
                          text-gray-600
                        "
                      >
                        Seasonal variation
                      </p>

                      <p
                        className="
                          mt-2
                          text-lg
                          font-bold
                          text-yellow-300
                        "
                      >
                        {formatPercent(
                          seasonalData.seasonality_change_pct
                        )}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[10px]
                          text-gray-600
                        "
                      >
                        Peak versus lowest month
                      </p>

                    </div>

                  </div>


                  <div
                    className="
                      mt-4
                      rounded-2xl
                      border
                      border-white/5
                      bg-[#040905]
                      p-5
                    "
                  >

                    <div
                      className="
                        flex
                        h-[220px]
                        items-end
                        gap-2
                      "
                    >

                      {seasonalData.seasonal_data.map(
                        (item) => {

                          const values =
                            seasonalData.seasonal_data.map(
                              (point) =>
                                Number(point.demand) || 0
                            );


                          const maximum =
                            Math.max(
                              ...values,
                              1
                            );


                          const height =
                            Math.max(
                              (
                                Number(item.demand) /
                                maximum
                              ) * 100,
                              5
                            );


                          return (

                            <div
                              key={
                                item.month_number
                              }
                              className="
                                group
                                relative
                                flex
                                h-full
                                flex-1
                                flex-col
                                items-center
                                justify-end
                              "
                            >

                              <div
                                className="
                                  mb-2
                                  text-[9px]
                                  font-bold
                                  text-gray-500
                                  opacity-0
                                  transition
                                  group-hover:opacity-100
                                "
                              >
                                {formatNumber(
                                  item.demand
                                )}
                              </div>


                              <div
                                className="
                                  w-full
                                  max-w-[55px]
                                  rounded-t-lg
                                  bg-lime-300/20
                                  transition-all
                                  group-hover:bg-lime-300/40
                                "
                                style={{
                                  height:
                                    `${height}%`,
                                }}
                              />


                              <span
                                className="
                                  mt-2
                                  text-[8px]
                                  font-semibold
                                  text-gray-600
                                "
                              >
                                {item.month.slice(
                                  0,
                                  3
                                )}
                              </span>

                            </div>

                          );

                        }
                      )}

                    </div>

                  </div>

                </>

              ) : (

                <div
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-white/5
                    bg-white/[0.02]
                    p-6
                    text-center
                  "
                >

                  <Package
                    className="
                      mx-auto
                      h-6
                      w-6
                      text-gray-700
                    "
                  />

                  <p
                    className="
                      mt-3
                      text-xs
                      text-gray-600
                    "
                  >
                    No seasonal data available for
                    this product.
                  </p>

                </div>

              )}

            </section>

          )}


          {/* ==================================================
              ADVANCED INPUTS
          ================================================== */}

          <details
            className="
              mb-6
              overflow-hidden
              rounded-2xl
              border
              border-white/5
              bg-[#071009]
            "
          >

            <summary
              className="
                flex
                cursor-pointer
                list-none
                items-center
                justify-between
                px-5
                py-4
                transition
                hover:bg-white/[0.015]
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    bg-white/[0.03]
                  "
                >

                  <CalendarDays
                    className="
                      h-4
                      w-4
                      text-gray-500
                    "
                  />

                </div>


                <div>

                  <p
                    className="
                      text-xs
                      font-semibold
                      text-gray-400
                    "
                  >
                    Adjust forecast inputs
                  </p>


                  <p
                    className="
                      mt-0.5
                      text-[10px]
                      text-gray-600
                    "
                  >
                    Advanced pricing, sales, market and date signals
                  </p>

                </div>

              </div>


              <ChevronDown
                className="
                  h-4
                  w-4
                  text-gray-600
                "
              />

            </summary>


            <div
              className="
                border-t
                border-white/5
                p-5
              "
            >

              <div
                className="
                  mb-5
                  rounded-xl
                  border
                  border-yellow-300/10
                  bg-yellow-300/[0.025]
                  px-4
                  py-3
                "
              >

                <div
                  className="
                    flex
                    items-start
                    gap-2
                  "
                >

                  <CircleHelp
                    className="
                      mt-0.5
                      h-4
                      w-4
                      shrink-0
                      text-yellow-300
                    "
                  />

                  <p
                    className="
                      text-[11px]
                      leading-5
                      text-gray-600
                    "
                  >
                    These fields control the signals sent
                    to the XGBoost demand prediction model.
                    Most users can leave the default values
                    unchanged.
                  </p>

                </div>

              </div>


              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-2
                  lg:grid-cols-4
                "
              >

                {/* BASE PRICE */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Base Price
                  </label>

                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleChange}
                    className={inputClass}
                  />

                </div>


                {/* CURRENT PRICE */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Current Price
                  </label>

                  <input
                    type="number"
                    name="current_price"
                    value={formData.current_price}
                    onChange={handleChange}
                    className={inputClass}
                  />

                </div>


                {/* PRICE CHANGE */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Price Change %
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


                {/* DISCOUNT */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Discount %
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


                {/* INVENTORY */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Inventory
                  </label>

                  <input
                    type="number"
                    name="inventory_level"
                    value={formData.inventory_level}
                    onChange={handleChange}
                    className={inputClass}
                  />

                </div>


                {/* 3 DAY SALES */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    3-Day Sales
                  </label>

                  <input
                    type="number"
                    name="sales_rolling_3"
                    value={formData.sales_rolling_3}
                    onChange={handleChange}
                    className={inputClass}
                  />

                </div>


                {/* 7 DAY SALES */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    7-Day Sales
                  </label>

                  <input
                    type="number"
                    name="sales_rolling_7"
                    value={formData.sales_rolling_7}
                    onChange={handleChange}
                    className={inputClass}
                  />

                </div>


                {/* 14 DAY SALES */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    14-Day Sales
                  </label>

                  <input
                    type="number"
                    name="sales_rolling_14"
                    value={formData.sales_rolling_14}
                    onChange={handleChange}
                    className={inputClass}
                  />

                </div>


                {/* REGION */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
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


                {/* CHANNEL */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
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


                {/* SEASON */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
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


                {/* PROMOTION */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Promotion
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


                {/* YEAR */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
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


                {/* MONTH */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
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


                {/* DAY */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
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


                {/* DAY OF WEEK */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
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


                {/* STOCKOUT */}

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                    "
                  >
                    Stockout
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

              </div>

            </div>

          </details>


          {/* ==================================================
              FOOTER
          ================================================== */}

          <div
            className="
              flex
              flex-col
              justify-between
              gap-2
              border-t
              border-white/5
              pt-4
              text-[9px]
              uppercase
              tracking-[0.16em]
              text-gray-700
              md:flex-row
            "
          >

            <span>
              PricePilot AI · Demand Intelligence
            </span>


            <span
              className="
                flex
                items-center
                gap-2
              "
            >

              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-lime-300
                  shadow-[0_0_8px_rgba(163,230,53,0.7)]
                "
              />

              XGBoost Forecast Engine Connected

            </span>

          </div>

        </main>

      </div>

    </div>

  );

}


export default Forecast;