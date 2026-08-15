import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Gauge,
  Package,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import API from "../api/axios";


function Forecast() {

  // ============================================================
  // PRODUCTS
  // ============================================================

  const [products, setProducts] = useState([]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [selectedProductId, setSelectedProductId] =
    useState("");


  // ============================================================
  // FORECAST
  // ============================================================

  const [forecast, setForecast] =
    useState(null);

  const [predicting, setPredicting] =
    useState(false);

  const [error, setError] =
    useState("");


  // ============================================================
  // SEASONAL DATA
  // ============================================================

  const [seasonalData, setSeasonalData] =
    useState(null);

  const [loadingSeasonal, setLoadingSeasonal] =
    useState(false);


  // ============================================================
  // ACTIVE HORIZON
  // ============================================================

  const [activeHorizon, setActiveHorizon] =
    useState("thirty_days");


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

    day: 15,

    day_of_week: 6,

  });


  // ============================================================
  // FORMAT NUMBER
  // ============================================================

  const formatNumber = value => {

    const number = Number(value);

    if (Number.isNaN(number)) {

      return "0";

    }

    return number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    );

  };


  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatCurrency = value => {

    const number =
      Number(value) || 0;

    return `₹${number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    )}`;

  };


  // ============================================================
  // FORMAT PERCENT
  // ============================================================

  const formatPercent = value => {

    const number =
      Number(value) || 0;

    return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;

  };


  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  useEffect(() => {

    loadProducts();

  }, []);


  // ============================================================
  // LOAD PRODUCT LIST
  // ============================================================

  const loadProducts = async () => {

    try {

      setLoadingProducts(true);

      setError("");


      const response =
        await API.get(
          "/products/",
          {
            params: {
              skip: 0,
              limit: 100,
              order: "asc",
            },
          }
        );


      let productList = [];


      if (
        response.data?.items &&
        Array.isArray(
          response.data.items
        )
      ) {

        productList =
          response.data.items;

      } else if (
        Array.isArray(
          response.data
        )
      ) {

        productList =
          response.data;

      }


      setProducts(productList);


      if (
        productList.length > 0
      ) {

        applyProduct(
          productList[0]
        );

      }

    } catch (err) {

      console.error(
        "Product loading error:",
        err.response?.data ||
        err.message
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
  // LOAD SEASONAL DATA
  // ============================================================

  const loadSeasonalData =
    async productId => {

      try {

        setLoadingSeasonal(true);

        setSeasonalData(null);


        const response =
          await API.get(
            `/demand-forecast/seasonal/${encodeURIComponent(
              productId
            )}`
          );


        setSeasonalData(
          response.data
        );

      } catch (err) {

        console.error(
          "Seasonal trend error:",
          err.response?.data ||
          err.message
        );


        setSeasonalData(null);

      } finally {

        setLoadingSeasonal(false);

      }

    };


  // ============================================================
  // APPLY PRODUCT
  // ============================================================

  const applyProduct =
    async product => {

      if (!product) {

        return;

      }


      const productId =
        String(product.id);


      setSelectedProductId(
        productId
      );


      setFormData(
        previous => ({
          ...previous,

          product_id:
            productId,

          category:
            product.category ||
            previous.category,

          brand:
            product.brand ||
            previous.brand,

          current_price:
            product.current_price !==
            undefined
              ? Number(
                  product.current_price
                )
              : previous.current_price,

          base_price:
            product.base_price !==
            undefined
              ? Number(
                  product.base_price
                )
              : product.current_price !==
                undefined
                ? Number(
                    product.current_price
                  )
                : previous.base_price,

          inventory_level:
            product.stock !==
            undefined
              ? Number(
                  product.stock
                )
              : previous.inventory_level,

        })
      );


      setForecast(null);

      setError("");


      await loadSeasonalData(
        productId
      );

    };


  // ============================================================
  // PRODUCT CHANGE
  // ============================================================

  const handleProductChange =
    async event => {

      const productId =
        event.target.value;


      const product =
        products.find(
          item =>
            String(item.id) ===
            String(productId)
        );


      if (product) {

        await applyProduct(
          product
        );

      }

    };


  // ============================================================
  // SELECTED PRODUCT
  // ============================================================

  const selectedProduct =
    useMemo(
      () => {

        return products.find(
          product =>
            String(product.id) ===
            String(
              selectedProductId
            )
        );

      },
      [
        products,
        selectedProductId,
      ]
    );


  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange =
    event => {

      const {
        name,
        value,
      } = event.target;


      setFormData(
        previous => ({
          ...previous,

          [name]: value,

        })
      );

    };


  // ============================================================
  // GENERATE FORECAST
  // ============================================================

  const handlePredict =
    async () => {

      if (!selectedProduct) {

        setError(
          "Please select a product first."
        );

        return;

      }


      try {

        setPredicting(true);

        setError("");

        setForecast(null);


        // ======================================================
        // PREDICTION PAYLOAD
        // ======================================================

        const payload = {

          base_price:
            Number(
              formData.base_price
            ),

          current_price:
            Number(
              formData.current_price
            ),

          price_change_pct:
            Number(
              formData.price_change_pct
            ),

          discount_pct:
            Number(
              formData.discount_pct
            ),

          inventory_level:
            Number(
              formData.inventory_level
            ),

          year:
            Number(
              formData.year
            ),

          month:
            Number(
              formData.month
            ),

          day:
            Number(
              formData.day
            ),

          day_of_week:
            Number(
              formData.day_of_week
            ),

          sales_rolling_3:
            Number(
              formData.sales_rolling_3
            ),

          sales_rolling_7:
            Number(
              formData.sales_rolling_7
            ),

          sales_rolling_14:
            Number(
              formData.sales_rolling_14
            ),

          product_id:
            String(
              selectedProduct.id
            ),

          category:
            String(
              selectedProduct.category ||
              formData.category
            ),

          brand:
            String(
              selectedProduct.brand ||
              formData.brand ||
              "BrandA"
            ),

          region:
            String(
              formData.region
            ),

          channel:
            String(
              formData.channel
            ),

          season:
            String(
              formData.season
            ),

          promotion_type:
            String(
              formData.promotion_type
            ),

          stockout_flag:
            Number(
              formData.stockout_flag
            ),

        };


        // ======================================================
        // SINGLE DEMAND PREDICTION
        // ======================================================

        const predictionResponse =
          await API.post(
            "/demand-forecast/predict",
            payload
          );


        // ======================================================
        // PRODUCTION FORECAST
        // ======================================================

        const productionResponse =
          await API.get(
            "/demand-forecast/forecast"
          );


        const predictionData =
          predictionResponse.data;


        const productionData =
          productionResponse.data;


        // ======================================================
        // VALIDATE PREDICTION
        // ======================================================

        if (
          !predictionData ||
          typeof
            predictionData.predicted_demand_index
            === "undefined"
        ) {

          throw new Error(
            "The prediction API returned an unexpected response."
          );

        }


        // ======================================================
        // VALIDATE PRODUCTION FORECAST
        // ======================================================

        if (
          !productionData?.seven_days ||
          !productionData?.fourteen_days ||
          !productionData?.thirty_days ||
          !productionData?.three_months ||
          !productionData?.six_months ||
          !productionData?.twelve_months
        ) {

          throw new Error(
            "The production forecast response is incomplete."
          );

        }


        // ======================================================
        // SAVE FORECAST
        // ======================================================

        setForecast({

          current_demand:
            Number(
              predictionData
                .predicted_demand_index
            ) || 0,

          seven_days:
            productionData
              .seven_days,

          fourteen_days:
            productionData
              .fourteen_days,

          thirty_days:
            productionData
              .thirty_days,

          three_months:
            productionData
              .three_months,

          six_months:
            productionData
              .six_months,

          twelve_months:
            productionData
              .twelve_months,

        });


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

      }

    };


  // ============================================================
  // HORIZONS
  // ============================================================

  const horizons =
    useMemo(
      () => {

        if (!forecast) {

          return [];

        }


        return [

          {
            key:
              "seven_days",

            title:
              "7 Days",

            subtitle:
              "Short-term",

            data:
              forecast.seven_days,

          },

          {
            key:
              "fourteen_days",

            title:
              "14 Days",

            subtitle:
              "Short-term",

            data:
              forecast.fourteen_days,

          },

          {
            key:
              "thirty_days",

            title:
              "30 Days",

            subtitle:
              "Short-term",

            data:
              forecast.thirty_days,

          },

          {
            key:
              "three_months",

            title:
              "3 Months",

            subtitle:
              "Medium-term",

            data:
              forecast.three_months,

          },

          {
            key:
              "six_months",

            title:
              "6 Months",

            subtitle:
              "Medium-term",

            data:
              forecast.six_months,

          },

          {
            key:
              "twelve_months",

            title:
              "12 Months",

            subtitle:
              "Long-term",

            data:
              forecast.twelve_months,

          },

        ];

      },
      [forecast]
    );


  // ============================================================
  // ACTIVE HORIZON DATA
  // ============================================================

  const activeData =
    useMemo(
      () => {

        if (!forecast) {

          return null;

        }


        return {

          short:
            forecast.thirty_days,

          medium:
            forecast.six_months,

          long:
            forecast.twelve_months,

        }[activeHorizon];

      },
      [
        forecast,
        activeHorizon,
      ]
    );


  // ============================================================
  // TREND INFORMATION
  // ============================================================

  const trendInfo =
    useMemo(
      () => {

        const trend =
          String(
            activeData?.demand_trend ||
            ""
          ).toUpperCase();


        if (
          trend.includes(
            "INCREAS"
          )
        ) {

          return {

            label:
              "Increasing",

            icon:
              TrendingUp,

            className:
              "text-lime-300",

            bgClass:
              "bg-lime-300/10",

          };

        }


        if (
          trend.includes(
            "DECREAS"
          )
        ) {

          return {

            label:
              "Decreasing",

            icon:
              TrendingDown,

            className:
              "text-red-300",

            bgClass:
              "bg-red-300/10",

          };

        }


        return {

          label:
            "Stable",

          icon:
            Activity,

          className:
            "text-yellow-300",

          bgClass:
            "bg-yellow-300/10",

        };

      },
      [activeData]
    );


  const TrendIcon =
    trendInfo.icon;


  // ============================================================
  // ACTIVE CHANGE
  // ============================================================

  const activeChange =
    Number(
      activeData?.trend_change_percent
    ) || 0;


  // ============================================================
  // INVENTORY STATUS
  // ============================================================

  const inventoryStatus =
    useMemo(
      () => {

        const inventory =
          Number(
            formData.inventory_level
          ) || 0;


        const projectedDemand =
          Number(
            activeData
              ?.total_predicted_demand
          ) || 0;


        if (inventory <= 0) {

          return {

            label:
              "Stockout Risk",

            description:
              "The selected product currently has no available stock.",

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
              "Monitor Stock",

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

      },
      [
        formData.inventory_level,
        activeData,
      ]
    );


  const InventoryIcon =
    inventoryStatus.icon;


  // ============================================================
  // DEMAND LEVEL
  // ============================================================

  const demandLevel =
    useMemo(
      () => {

        const demand =
          Number(
            forecast?.current_demand
          ) || 0;


        if (demand >= 150) {

          return {

            label:
              "Very High",

            className:
              "text-lime-300",

            bgClass:
              "bg-lime-300/10",

          };

        }


        if (demand >= 110) {

          return {

            label:
              "High",

            className:
              "text-emerald-300",

            bgClass:
              "bg-emerald-300/10",

          };

        }


        if (demand >= 80) {

          return {

            label:
              "Moderate",

            className:
              "text-yellow-300",

            bgClass:
              "bg-yellow-300/10",

          };

        }


        return {

          label:
            "Low",

          className:
            "text-blue-300",

          bgClass:
            "bg-blue-300/10",

        };

      },
      [
        forecast,
      ]
    );


  // ============================================================
  // SEASONAL VALUES
  // ============================================================

  const seasonalPoints =
    useMemo(
      () => {

        if (
          !seasonalData
            ?.seasonal_data
            ?.length
        ) {

          return [];

        }


        return seasonalData
          .seasonal_data
          .map(
            item => ({
              ...item,

              demand:
                Number(
                  item.demand
                ) || 0,

            })
          );

      },
      [seasonalData]
    );


  // ============================================================
  // SEASONAL MAX / MIN
  // ============================================================

  const seasonalStats =
    useMemo(
      () => {

        if (
          seasonalPoints.length === 0
        ) {

          return {

            max:
              1,

            min:
              0,

          };

        }


        const values =
          seasonalPoints.map(
            item =>
              item.demand
          );


        return {

          max:
            Math.max(
              ...values,
              1
            ),

          min:
            Math.min(
              ...values
            ),

        };

      },
      [seasonalPoints]
    );


  // ============================================================
  // SEASONAL SVG PATH
  // ============================================================

  const seasonalChart =
    useMemo(
      () => {

        if (
          seasonalPoints.length < 2
        ) {

          return null;

        }


        const width = 1000;

        const height = 330;

        const paddingX = 45;

        const paddingTop = 30;

        const paddingBottom = 45;


        const chartWidth =
          width -
          paddingX * 2;


        const chartHeight =
          height -
          paddingTop -
          paddingBottom;


        const maxValue =
          Math.max(
            seasonalStats.max,
            1
          );


        const points =
          seasonalPoints.map(
            (item, index) => {

              const x =
                paddingX +
                (
                  index /
                  (
                    seasonalPoints.length -
                    1
                  )
                ) *
                chartWidth;


              const y =
                paddingTop +
                chartHeight -
                (
                  item.demand /
                  maxValue
                ) *
                chartHeight;


              return {

                ...item,

                x,

                y,

              };

            }
          );


        const linePath =
          points
            .map(
              (point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");


        const areaPath = `

          ${linePath}

          L ${points[points.length - 1].x}
            ${paddingTop + chartHeight}

          L ${points[0].x}
            ${paddingTop + chartHeight}

          Z

        `;


        return {

          width,

          height,

          points,

          linePath,

          areaPath,

          chartHeight,

          paddingTop,

          paddingBottom,

          paddingX,

        };

      },
      [
        seasonalPoints,
        seasonalStats,
      ]
    );


  // ============================================================
  // DEMAND TREND CHART
  // ============================================================

  const trendChart =
    useMemo(
      () => {

        if (
          horizons.length === 0
        ) {

          return null;

        }


        const values =
          horizons.map(
            item =>
              Number(
                item.data
                  ?.average_daily_demand
              ) || 0
          );


        const maxValue =
          Math.max(
            ...values,
            1
          );


        const minValue =
          Math.min(
            ...values,
            0
          );


        const width = 1000;

        const height = 300;

        const paddingX = 50;

        const paddingTop = 30;

        const paddingBottom = 55;


        const chartWidth =
          width -
          paddingX * 2;


        const chartHeight =
          height -
          paddingTop -
          paddingBottom;


        const range =
          Math.max(
            maxValue - minValue,
            1
          );


        const points =
          horizons.map(
            (item, index) => {

              const value =
                Number(
                  item.data
                    ?.average_daily_demand
                ) || 0;


              const x =
                paddingX +
                (
                  index /
                  (
                    horizons.length -
                    1
                  )
                ) *
                chartWidth;


              const y =
                paddingTop +
                chartHeight -
                (
                  (
                    value -
                    minValue
                  ) /
                  range
                ) *
                chartHeight;


              return {

                ...item,

                value,

                x,

                y,

              };

            }
          );


        const linePath =
          points
            .map(
              (point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");


        const areaPath = `

          ${linePath}

          L ${points[points.length - 1].x}
            ${paddingTop + chartHeight}

          L ${points[0].x}
            ${paddingTop + chartHeight}

          Z

        `;


        return {

          width,

          height,

          points,

          linePath,

          areaPath,

          chartHeight,

          paddingTop,

          paddingBottom,

          paddingX,

        };

      },
      [horizons]
    );


  // ============================================================
  // LOADING
  // ============================================================

  if (loadingProducts) {

    return (

      <div className="min-h-screen bg-slate-950 text-white">

        <Sidebar />

        <main className="lg:ml-64 p-6">

          <div className="flex min-h-[75vh] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-lime-300" />

              <p className="mt-5 text-sm text-slate-400">
                Loading PricePilot AI products...
              </p>

            </div>

          </div>

        </main>

      </div>

    );

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="min-h-screen bg-slate-950 text-white">

      <Sidebar />


      <main className="lg:ml-64">

        <div className="mx-auto max-w-[1500px] p-5 sm:p-7 lg:p-9">


          {/* ==================================================
              HEADER
          ================================================== */}

          <header className="mb-8">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_16px_rgba(163,230,53,0.9)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-lime-300">
                PricePilot AI
              </span>

            </div>


            <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

              <div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Demand Forecast
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Predict future demand, identify seasonal patterns,
                  and understand how your managed products may behave
                  across short, medium and long-term planning horizons.
                </p>

              </div>


              {selectedProduct && (

                <div className="flex items-center gap-3 rounded-2xl border border-lime-300/10 bg-lime-300/[0.04] px-4 py-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10">

                    <Package className="h-5 w-5 text-lime-300" />

                  </div>

                  <div>

                    <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                      Selected Product
                    </p>

                    <p className="mt-1 max-w-[220px] truncate text-sm font-bold text-white">
                      {selectedProduct.name}
                    </p>

                  </div>

                </div>

              )}

            </div>

          </header>


          {/* ==================================================
              PRODUCT CONTROL
          ================================================== */}

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl">

            <div className="h-1 bg-gradient-to-r from-transparent via-lime-300 to-transparent opacity-70" />


            <div className="p-5 sm:p-7">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-end">

                <div className="flex-1">

                  <div className="mb-2 flex items-center gap-2">

                    <Target className="h-4 w-4 text-lime-300" />

                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Product from PricePilot Catalog
                    </label>

                  </div>


                  <select
                    value={selectedProductId}
                    onChange={handleProductChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-sm font-semibold text-white outline-none transition focus:border-lime-300/50 focus:ring-4 focus:ring-lime-300/5"
                  >

                    {products.length === 0 ? (

                      <option value="">
                        No products available
                      </option>

                    ) : (

                      products.map(
                        product => (

                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.name}
                          </option>

                        )
                      )

                    )}

                  </select>

                </div>


                <button
                  type="button"
                  onClick={handlePredict}
                  disabled={
                    predicting ||
                    !selectedProduct
                  }
                  className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-lime-300 px-8 font-black text-black transition hover:bg-lime-200 hover:shadow-[0_0_35px_rgba(163,230,53,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {predicting ? (

                    <>

                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />

                      Generating...

                    </>

                  ) : (

                    <>

                      <Zap className="h-4 w-4" />

                      Generate Forecast

                    </>

                  )}

                </button>

              </div>


              {/* ==================================================
                  PRODUCT SUMMARY
              ================================================== */}

              {selectedProduct && (

                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">

                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                      Product
                    </p>

                    <p className="mt-2 truncate font-bold text-white">
                      {selectedProduct.name}
                    </p>

                  </div>


                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">

                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                      Category
                    </p>

                    <p className="mt-2 font-bold text-lime-300">
                      {selectedProduct.category}
                    </p>

                  </div>


                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">

                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                      Current Price
                    </p>

                    <p className="mt-2 font-bold text-white">
                      {formatCurrency(
                        selectedProduct.current_price
                      )}
                    </p>

                  </div>


                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">

                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                      Available Stock
                    </p>

                    <p className="mt-2 font-bold text-white">
                      {formatNumber(
                        selectedProduct.stock
                      )}
                    </p>

                  </div>

                </div>

              )}

            </div>

          </section>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">

              {error}

            </div>

          )}


          {/* ==================================================
              FORECAST
          ================================================== */}

          {forecast && (

            <>

              {/* ==================================================
                  HERO METRICS
              ================================================== */}

              <section className="mt-7 grid gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">

                {/* CURRENT DEMAND */}

                <div className="relative overflow-hidden rounded-3xl border border-lime-300/15 bg-gradient-to-br from-lime-300/[0.10] via-slate-900/80 to-slate-900/70 p-6">

                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-lime-300/10 blur-3xl" />


                  <div className="relative">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Current Predicted Demand
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Model demand index
                        </p>

                      </div>


                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300/10">

                        <Gauge className="h-5 w-5 text-lime-300" />

                      </div>

                    </div>


                    <div className="mt-6 flex items-end gap-4">

                      <p className="text-5xl font-black tracking-tight text-white">
                        {formatNumber(
                          forecast.current_demand
                        )}
                      </p>


                      <span
                        className={`mb-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${demandLevel.bgClass} ${demandLevel.className}`}
                      >
                        {demandLevel.label}
                      </span>

                    </div>


                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.5)]"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              5,
                              Number(
                                forecast.current_demand
                              )
                            )
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>


                {/* TREND */}

                <div className={`rounded-3xl border border-white/10 bg-slate-900/70 p-6 ${trendInfo.bgClass}`}>

                  <div className="flex items-center justify-between">

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      30-Day Movement
                    </p>


                    <TrendIcon
                      className={`h-6 w-6 ${trendInfo.className}`}
                    />

                  </div>


                  <p
                    className={`mt-5 text-4xl font-black ${trendInfo.className}`}
                  >
                    {formatPercent(
                      forecast.thirty_days
                        ?.trend_change_percent
                    )}
                  </p>


                  <p className={`mt-2 text-sm font-bold ${trendInfo.className}`}>
                    {trendInfo.label} demand
                  </p>


                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Expected movement over the 30-day forecast horizon.
                  </p>

                </div>


                {/* INVENTORY */}

                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">

                  <div className="flex items-center justify-between">

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Inventory Intelligence
                    </p>


                    <InventoryIcon
                      className={`h-6 w-6 ${inventoryStatus.className}`}
                    />

                  </div>


                  <p
                    className={`mt-5 text-2xl font-black ${inventoryStatus.className}`}
                  >
                    {inventoryStatus.label}
                  </p>


                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {inventoryStatus.description}
                  </p>


                  <div className="mt-5 flex items-center justify-between text-xs">

                    <span className="text-slate-600">
                      Current stock
                    </span>

                    <span className="font-bold text-white">
                      {formatNumber(
                        formData.inventory_level
                      )}
                    </span>

                  </div>

                </div>

              </section>


              {/* ==================================================
                  HORIZON SELECTOR
              ================================================== */}

              <section className="mt-8">

                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

                  <div>

                    <div className="flex items-center gap-2">

                      <CalendarDays className="h-5 w-5 text-lime-300" />

                      <h2 className="text-xl font-black">
                        Forecast Horizons
                      </h2>

                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Switch between planning horizons to inspect the business outlook.
                    </p>

                  </div>

                </div>


                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-2">

                  {[
                    {
                      key: "short",
                      label: "Short Term",
                      sub: "30 Days",
                    },
                    {
                      key: "medium",
                      label: "Medium Term",
                      sub: "6 Months",
                    },
                    {
                      key: "long",
                      label: "Long Term",
                      sub: "12 Months",
                    },
                  ].map(
                    option => (

                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          setActiveHorizon(
                            option.key
                          )
                        }
                        className={`rounded-xl px-4 py-3 text-left transition ${
                          activeHorizon ===
                          option.key
                            ? "bg-lime-300 text-black shadow-[0_0_25px_rgba(163,230,53,0.12)]"
                            : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                        }`}
                      >

                        <p className="text-xs font-black">
                          {option.label}
                        </p>

                        <p
                          className={`mt-1 text-[10px] ${
                            activeHorizon ===
                            option.key
                              ? "text-black/60"
                              : "text-slate-600"
                          }`}
                        >
                          {option.sub}
                        </p>

                      </button>

                    )
                  )}

                </div>

              </section>


              {/* ==================================================
                  ACTIVE HORIZON HERO
              ================================================== */}

              {activeData && (

                <section className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">

                  <div className="grid lg:grid-cols-[1fr_1fr_1fr_1fr]">

                    <div className="border-b border-white/5 p-5 lg:border-b-0 lg:border-r">

                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-slate-600">
                        Average Daily Demand
                      </p>

                      <p className="mt-3 text-3xl font-black text-white">
                        {formatNumber(
                          activeData.average_daily_demand
                        )}
                      </p>

                    </div>


                    <div className="border-b border-white/5 p-5 lg:border-b-0 lg:border-r">

                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-slate-600">
                        Total Predicted Demand
                      </p>

                      <p className="mt-3 text-3xl font-black text-lime-300">
                        {formatNumber(
                          activeData.total_predicted_demand
                        )}
                      </p>

                    </div>


                    <div className="border-b border-white/5 p-5 lg:border-b-0 lg:border-r">

                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-slate-600">
                        Forecast Revenue
                      </p>

                      <p className="mt-3 text-2xl font-black text-white">
                        {formatCurrency(
                          activeData.total_predicted_revenue
                        )}
                      </p>

                    </div>


                    <div className="p-5">

                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-slate-600">
                        Confidence
                      </p>

                      <p className="mt-3 text-3xl font-black text-white">
                        {formatNumber(
                          activeData.confidence_score
                        )}%
                      </p>

                    </div>

                  </div>

                </section>

              )}


              {/* ==================================================
                  ALL HORIZONS
              ================================================== */}

              <section className="mt-8">

                <div className="mb-4 flex items-center gap-2">

                  <BarChart3 className="h-5 w-5 text-lime-300" />

                  <h2 className="text-xl font-black">
                    Planning Overview
                  </h2>

                </div>


                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                  {horizons.map(
                    item => {

                      const data =
                        item.data || {};


                      const trend =
                        String(
                          data.demand_trend ||
                          "Stable"
                        ).toUpperCase();


                      const trendClass =
                        trend.includes(
                          "INCREAS"
                        )
                          ? "text-lime-300"
                          : trend.includes(
                              "DECREAS"
                            )
                            ? "text-red-300"
                            : "text-yellow-300";


                      const isActive =
                        (
                          activeHorizon ===
                          "short" &&
                          item.key ===
                          "thirty_days"
                        ) ||
                        (
                          activeHorizon ===
                          "medium" &&
                          item.key ===
                          "six_months"
                        ) ||
                        (
                          activeHorizon ===
                          "long" &&
                          item.key ===
                          "twelve_months"
                        );


                      return (

                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {

                            if (
                              item.key ===
                              "thirty_days"
                            ) {

                              setActiveHorizon(
                                "short"
                              );

                            } else if (
                              item.key ===
                              "six_months"
                            ) {

                              setActiveHorizon(
                                "medium"
                              );

                            } else if (
                              item.key ===
                              "twelve_months"
                            ) {

                              setActiveHorizon(
                                "long"
                              );

                            }

                          }}
                          className={`text-left rounded-3xl border p-5 transition ${
                            isActive
                              ? "border-lime-300/30 bg-lime-300/[0.05] shadow-[0_0_30px_rgba(163,230,53,0.05)]"
                              : "border-white/10 bg-slate-900/70 hover:border-white/20"
                          }`}
                        >

                          <div className="flex items-start justify-between">

                            <div>

                              <p className="text-xl font-black">
                                {item.title}
                              </p>

                              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.17em] text-slate-600">
                                {item.subtitle}
                              </p>

                            </div>


                            <span className="rounded-xl bg-white/[0.03] p-2">

                              <CalendarDays className="h-4 w-4 text-slate-500" />

                            </span>

                          </div>


                          <div className="mt-6 grid grid-cols-2 gap-5">

                            <div>

                              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                Avg Daily
                              </p>

                              <p className="mt-1 text-xl font-black text-white">
                                {formatNumber(
                                  data.average_daily_demand
                                )}
                              </p>

                            </div>


                            <div>

                              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                Total Demand
                              </p>

                              <p className="mt-1 text-xl font-black text-white">
                                {formatNumber(
                                  data.total_predicted_demand
                                )}
                              </p>

                            </div>


                            <div>

                              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                Revenue
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-300">
                                {formatCurrency(
                                  data.total_predicted_revenue
                                )}
                              </p>

                            </div>


                            <div>

                              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                                Confidence
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-300">
                                {formatNumber(
                                  data.confidence_score
                                )}%
                              </p>

                            </div>

                          </div>


                          <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">

                            <span
                              className={`text-xs font-black ${trendClass}`}
                            >
                              {trend}
                            </span>


                            <span className="text-xs text-slate-600">

                              Change{" "}

                              <span className="font-bold text-slate-400">
                                {formatPercent(
                                  data.trend_change_percent
                                )}
                              </span>

                            </span>

                          </div>

                        </button>

                      );

                    }
                  )}

                </div>

              </section>


              {/* ==================================================
                  DEMAND TREND
              ================================================== */}

              <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">

                <div className="border-b border-white/5 p-6 sm:p-7">

                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <div>

                      <div className="flex items-center gap-2">

                        <Sparkles className="h-5 w-5 text-lime-300" />

                        <h2 className="text-xl font-black">
                          Demand Trajectory
                        </h2>

                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        How average daily demand evolves as the forecast horizon expands.
                      </p>

                    </div>


                    <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 ${trendInfo.bgClass}`}>

                      <TrendIcon
                        className={`h-5 w-5 ${trendInfo.className}`}
                      />

                      <div>

                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Current Direction
                        </p>

                        <p className={`text-sm font-black ${trendInfo.className}`}>
                          {trendInfo.label}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>


                {trendChart && (

                  <div className="overflow-x-auto p-4 sm:p-6">

                    <div className="min-w-[760px]">

                      <svg
                        viewBox={`0 0 ${trendChart.width} ${trendChart.height}`}
                        className="h-[320px] w-full"
                        preserveAspectRatio="none"
                      >

                        <defs>

                          <linearGradient
                            id="demandAreaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >

                            <stop
                              offset="0%"
                              stopColor="#bef264"
                              stopOpacity="0.30"
                            />

                            <stop
                              offset="100%"
                              stopColor="#bef264"
                              stopOpacity="0"
                            />

                          </linearGradient>

                        </defs>


                        {/* GRID */}

                        {[0, 1, 2, 3].map(
                          index => {

                            const y =
                              trendChart.paddingTop +
                              (
                                index / 3
                              ) *
                              trendChart.chartHeight;


                            return (

                              <line
                                key={index}
                                x1={
                                  trendChart.paddingX
                                }
                                x2={
                                  trendChart.width -
                                  trendChart.paddingX
                                }
                                y1={y}
                                y2={y}
                                stroke="rgba(255,255,255,0.06)"
                                strokeDasharray="5 7"
                              />

                            );

                          }
                        )}


                        {/* AREA */}

                        <path
                          d={
                            trendChart.areaPath
                          }
                          fill="url(#demandAreaGradient)"
                        />


                        {/* LINE */}

                        <path
                          d={
                            trendChart.linePath
                          }
                          fill="none"
                          stroke="#bef264"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />


                        {/* POINTS */}

                        {trendChart.points.map(
                          point => (

                            <g
                              key={
                                point.key
                              }
                            >

                              <circle
                                cx={
                                  point.x
                                }
                                cy={
                                  point.y
                                }
                                r="9"
                                fill="#bef264"
                                opacity="0.12"
                              />

                              <circle
                                cx={
                                  point.x
                                }
                                cy={
                                  point.y
                                }
                                r="4"
                                fill="#bef264"
                              />

                              <text
                                x={
                                  point.x
                                }
                                y={
                                  point.y - 16
                                }
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.7)"
                                fontSize="12"
                                fontWeight="700"
                              >
                                {formatNumber(
                                  point.value
                                )}
                              </text>

                              <text
                                x={
                                  point.x
                                }
                                y={
                                  trendChart.height -
                                  18
                                }
                                textAnchor="middle"
                                fill="rgba(148,163,184,0.7)"
                                fontSize="11"
                              >
                                {point.title}
                              </text>

                            </g>

                          )
                        )}

                      </svg>

                    </div>

                  </div>

                )}

              </section>


            </>

          )}


          {/* ==================================================
              SEASONAL ANALYSIS
          ================================================== */}

          <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">

            <div className="border-b border-white/5 p-6 sm:p-7">

              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">

                <div>

                  <div className="flex items-center gap-2">

                    <Activity className="h-5 w-5 text-lime-300" />

                    <h2 className="text-xl font-black">
                      Seasonal Demand Intelligence
                    </h2>

                  </div>


                  <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">

                    Historical seasonal behavior is calculated from the
                    selected application's product category. The application
                    product itself always comes from your PricePilot products
                    table.

                  </p>

                </div>


                {seasonalData && (

                  <div className="flex items-center gap-2 rounded-2xl border border-lime-300/10 bg-lime-300/[0.04] px-4 py-3">

                    <Sparkles className="h-4 w-4 text-lime-300" />

                    <div>

                      <p className="text-[9px] uppercase tracking-wider text-slate-600">
                        Seasonality
                      </p>

                      <p className="text-sm font-black text-lime-300">
                        {seasonalData.seasonality_strength}
                      </p>

                    </div>

                  </div>

                )}

              </div>

            </div>


            {/* ==================================================
                LOADING
            ================================================== */}

            {loadingSeasonal && (

              <div className="flex min-h-[360px] items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-lime-300" />

                  <p className="mt-4 text-sm font-semibold text-slate-400">
                    Building seasonal demand profile...
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Comparing historical category behavior.
                  </p>

                </div>

              </div>

            )}


            {/* ==================================================
                SEASONAL DATA
            ================================================== */}

            {!loadingSeasonal &&
              seasonalData && (

                <div className="p-6 sm:p-7">

                  {/* ==================================================
                      PRODUCT CONTEXT
                  ================================================== */}

                  <div className="rounded-2xl border border-lime-300/10 bg-lime-300/[0.03] p-4">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                          Seasonal Context
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">

                          {seasonalData.product_name}

                          <span className="mx-2 text-slate-700">
                            /
                          </span>

                          <span className="text-lime-300">
                            {seasonalData.category}
                          </span>

                        </p>

                      </div>


                      <div className="text-left sm:text-right">

                        <p className="text-[9px] uppercase tracking-wider text-slate-600">
                          Historical Coverage
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-300">

                          {seasonalData.historical_months_available}
                          {" "}
                          observed months

                          {Number(
                            seasonalData.estimated_months
                          ) > 0 && (

                            <span className="text-slate-600">

                              {" "}
                              +
                              {" "}
                              {seasonalData.estimated_months}
                              {" "}
                              estimated

                            </span>

                          )}

                        </p>

                      </div>

                    </div>

                  </div>


                  {/* ==================================================
                      SEASONAL SUMMARY
                  ================================================== */}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5">

                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        Peak Month
                      </p>

                      <p className="mt-3 text-xl font-black text-lime-300">
                        {seasonalData.peak_month}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Demand {formatNumber(
                          seasonalData.peak_demand
                        )}
                      </p>

                    </div>


                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5">

                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        Lowest Month
                      </p>

                      <p className="mt-3 text-xl font-black text-white">
                        {seasonalData.lowest_month}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Demand {formatNumber(
                          seasonalData.lowest_demand
                        )}
                      </p>

                    </div>


                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5">

                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        Seasonal Swing
                      </p>

                      <p className="mt-3 text-xl font-black text-white">
                        {formatNumber(
                          seasonalData.seasonality_change_pct
                        )}%
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Peak-to-low variation
                      </p>

                    </div>


                    <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5">

                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        Pattern Strength
                      </p>

                      <p className="mt-3 text-xl font-black text-lime-300">
                        {seasonalData.seasonality_strength}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Category seasonality
                      </p>

                    </div>

                  </div>


                  {/* ==================================================
                      SEASONAL CHART
                  ================================================== */}

                  {seasonalChart && (

                    <div className="mt-7 overflow-hidden rounded-3xl border border-white/5 bg-slate-950/60 p-4 sm:p-6">

                      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                        <div>

                          <h3 className="text-sm font-black text-white">
                            12-Month Seasonal Curve
                          </h3>

                          <p className="mt-1 text-xs text-slate-600">
                            Actual historical months are shown with solid points.
                            Estimated months are shown with softer points.
                          </p>

                        </div>


                        <div className="flex items-center gap-4 text-[10px]">

                          <div className="flex items-center gap-2">

                            <span className="h-2 w-2 rounded-full bg-lime-300" />

                            <span className="text-slate-500">
                              Observed
                            </span>

                          </div>


                          <div className="flex items-center gap-2">

                            <span className="h-2 w-2 rounded-full bg-slate-500" />

                            <span className="text-slate-500">
                              Estimated
                            </span>

                          </div>

                        </div>

                      </div>


                      <div className="overflow-x-auto">

                        <div className="min-w-[760px]">

                          <svg
                            viewBox={`0 0 ${seasonalChart.width} ${seasonalChart.height}`}
                            className="h-[350px] w-full"
                            preserveAspectRatio="none"
                          >

                            <defs>

                              <linearGradient
                                id="seasonalAreaGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >

                                <stop
                                  offset="0%"
                                  stopColor="#bef264"
                                  stopOpacity="0.32"
                                />

                                <stop
                                  offset="70%"
                                  stopColor="#bef264"
                                  stopOpacity="0.08"
                                />

                                <stop
                                  offset="100%"
                                  stopColor="#bef264"
                                  stopOpacity="0"
                                />

                              </linearGradient>

                            </defs>


                            {/* GRID */}

                            {[0, 1, 2, 3].map(
                              index => {

                                const y =
                                  seasonalChart.paddingTop +
                                  (
                                    index /
                                    3
                                  ) *
                                  seasonalChart.chartHeight;


                                return (

                                  <line
                                    key={index}
                                    x1={
                                      seasonalChart.paddingX
                                    }
                                    x2={
                                      seasonalChart.width -
                                      seasonalChart.paddingX
                                    }
                                    y1={y}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeDasharray="5 7"
                                  />

                                );

                              }
                            )}


                            {/* AREA */}

                            <path
                              d={
                                seasonalChart.areaPath
                              }
                              fill="url(#seasonalAreaGradient)"
                            />


                            {/* LINE */}

                            <path
                              d={
                                seasonalChart.linePath
                              }
                              fill="none"
                              stroke="#bef264"
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />


                            {/* POINTS */}

                            {seasonalChart.points.map(
                              point => {

                                const isPeak =
                                  point.month ===
                                  seasonalData.peak_month;


                                const isLowest =
                                  point.month ===
                                  seasonalData.lowest_month;


                                const pointColor =
                                  isPeak
                                    ? "#bef264"
                                    : isLowest
                                      ? "#94a3b8"
                                      : point.is_estimated
                                        ? "#64748b"
                                        : "#d9f99d";


                                return (

                                  <g
                                    key={
                                      point.month_number
                                    }
                                  >

                                    <circle
                                      cx={
                                        point.x
                                      }
                                      cy={
                                        point.y
                                      }
                                      r={
                                        isPeak ||
                                        isLowest
                                          ? 10
                                          : 7
                                      }
                                      fill={
                                        pointColor
                                      }
                                      opacity={
                                        point.is_estimated
                                          ? 0.25
                                          : 0.14
                                      }
                                    />


                                    <circle
                                      cx={
                                        point.x
                                      }
                                      cy={
                                        point.y
                                      }
                                      r={
                                        isPeak ||
                                        isLowest
                                          ? 5
                                          : 3.5
                                      }
                                      fill={
                                        pointColor
                                      }
                                    />


                                    <text
                                      x={
                                        point.x
                                      }
                                      y={
                                        point.y -
                                        16
                                      }
                                      textAnchor="middle"
                                      fill={
                                        isPeak
                                          ? "#bef264"
                                          : "rgba(203,213,225,0.7)"
                                      }
                                      fontSize="11"
                                      fontWeight={
                                        isPeak
                                          ? "800"
                                          : "600"
                                      }
                                    >
                                      {formatNumber(
                                        point.demand
                                      )}
                                    </text>


                                    <text
                                      x={
                                        point.x
                                      }
                                      y={
                                        seasonalChart.height -
                                        17
                                      }
                                      textAnchor="middle"
                                      fill={
                                        isPeak
                                          ? "#bef264"
                                          : "rgba(148,163,184,0.7)"
                                      }
                                      fontSize="11"
                                      fontWeight={
                                        isPeak
                                          ? "800"
                                          : "500"
                                      }
                                    >
                                      {point.month.slice(
                                        0,
                                        3
                                      )}
                                    </text>

                                  </g>

                                );

                              }
                            )}

                          </svg>

                        </div>

                      </div>


                      {/* PEAK / LOWEST INDICATORS */}

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">

                        <div className="flex items-center gap-3 rounded-2xl border border-lime-300/10 bg-lime-300/[0.04] p-4">

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300/10">

                            <TrendingUp className="h-4 w-4 text-lime-300" />

                          </div>

                          <div>

                            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                              Seasonal Peak
                            </p>

                            <p className="text-sm font-black text-lime-300">
                              {seasonalData.peak_month}
                            </p>

                          </div>

                        </div>


                        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">

                            <TrendingDown className="h-4 w-4 text-slate-400" />

                          </div>

                          <div>

                            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                              Seasonal Low
                            </p>

                            <p className="text-sm font-black text-slate-300">
                              {seasonalData.lowest_month}
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  )}


                  {/* ==================================================
                      SOURCE
                  ================================================== */}

                  <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.015] p-4">

                    <div className="flex gap-3">

                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lime-300/60" />

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                          Analysis Basis
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-600">

                          {seasonalData.data_source}

                          {" "}for the{" "}

                          <span className="text-slate-400">
                            {seasonalData.category}
                          </span>

                          {" "}category.

                          {Number(
                            seasonalData.estimated_months
                          ) > 0 && (

                            <>

                              {" "}
                              Missing historical months are
                              estimated through interpolation
                              between observed seasonal points
                              so that the chart represents a
                              complete annual pattern instead
                              of misleading zero values.

                            </>

                          )}

                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )}


            {/* ==================================================
                NO SEASONAL DATA
            ================================================== */}

            {!loadingSeasonal &&
              !seasonalData && (

                <div className="flex min-h-[320px] items-center justify-center p-8">

                  <div className="max-w-md text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03]">

                      <Activity className="h-7 w-7 text-slate-700" />

                    </div>

                    <p className="mt-4 text-sm font-bold text-slate-400">
                      Seasonal profile unavailable
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">

                      No historical seasonal pattern was found
                      for the selected product category.

                    </p>

                  </div>

                </div>

              )}

          </section>


          {/* ==================================================
              FOOTER NOTE
          ================================================== */}

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.015] p-4">

            <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />

            <p className="text-[11px] leading-5 text-slate-600">

              PricePilot AI forecasts are generated using the selected
              application product's demand, pricing and inventory inputs.
              Seasonal intelligence uses historical market behavior for
              the selected product category. Application products remain
              separate from the historical dataset identifiers.

            </p>

          </div>


        </div>

      </main>

    </div>

  );

}


export default Forecast;