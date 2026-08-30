import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";

import {
  BarChart3,
  Package,
  IndianRupee,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Layers3,
  Activity,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";


function BusinessIntelligenceReport() {

  // ============================================================
  // STATE
  // ============================================================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);


  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  const loadProducts = async (isRefresh = false) => {

    try {

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await API.get("/products/", {
        params: {
          order: "asc",
        },
      });


      let productData = [];


      if (
        response.data &&
        Array.isArray(response.data.items)
      ) {

        productData = response.data.items;

      } else if (
        Array.isArray(response.data)
      ) {

        productData = response.data;

      } else if (
        response.data &&
        Array.isArray(response.data.products)
      ) {

        productData = response.data.products;

      }


      setProducts(productData);

    } catch (err) {

      console.error(
        "Business Intelligence product loading error:",
        err.response?.data || err.message
      );

      setProducts([]);

      setError(
        err.response?.data?.detail ||
        "Unable to load products from the Products table."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadProducts();

  }, []);


  // ============================================================
  // NORMALIZED PRODUCT DATA
  // ============================================================

  const normalizedProducts = useMemo(() => {

    return products.map((product) => {

      const price =
        Number(product.current_price) || 0;

      const stock =
        Number(product.stock) || 0;

      const inventoryValue =
        price * stock;


      let stockStatus = "In Stock";

      if (stock <= 0) {

        stockStatus = "Out of Stock";

      } else if (stock <= 10) {

        stockStatus = "Low Stock";

      }


      return {

        ...product,

        numericPrice: price,

        numericStock: stock,

        inventoryValue,

        stockStatus,

        productName:
          product.name ||
          `Product #${product.id}`,

        productCategory:
          product.category ||
          "Uncategorized",

      };

    });

  }, [products]);


  // ============================================================
  // EXECUTIVE KPIs
  // ============================================================

  const metrics = useMemo(() => {

    const totalProducts =
      normalizedProducts.length;


    const totalInventory =
      normalizedProducts.reduce(
        (total, product) =>
          total + product.numericStock,
        0
      );


    const totalInventoryValue =
      normalizedProducts.reduce(
        (total, product) =>
          total + product.inventoryValue,
        0
      );


    const productsWithPrice =
      normalizedProducts.filter(
        (product) =>
          product.numericPrice > 0
      );


    const averagePrice =
      productsWithPrice.length > 0
        ?
          productsWithPrice.reduce(
            (total, product) =>
              total + product.numericPrice,
            0
          ) /
          productsWithPrice.length
        :
          0;


    const outOfStock =
      normalizedProducts.filter(
        (product) =>
          product.numericStock <= 0
      ).length;


    const lowStock =
      normalizedProducts.filter(
        (product) =>
          product.numericStock > 0 &&
          product.numericStock <= 10
      ).length;


    const healthyStock =
      normalizedProducts.filter(
        (product) =>
          product.numericStock > 10
      ).length;


    return {

      totalProducts,

      totalInventory,

      totalInventoryValue,

      averagePrice,

      outOfStock,

      lowStock,

      healthyStock,

    };

  }, [normalizedProducts]);


  // ============================================================
  // CATEGORY ANALYSIS
  // ============================================================

  const categoryData = useMemo(() => {

    const categoryMap = {};


    normalizedProducts.forEach((product) => {

      const category =
        product.productCategory;


      if (!categoryMap[category]) {

        categoryMap[category] = {

          category,

          products: 0,

          inventory: 0,

          inventoryValue: 0,

        };

      }


      categoryMap[category].products += 1;

      categoryMap[category].inventory +=
        product.numericStock;

      categoryMap[category].inventoryValue +=
        product.inventoryValue;

    });


    return Object.values(categoryMap)

      .sort(
        (a, b) =>
          b.inventory -
          a.inventory
      )

      .slice(0, 10);

  }, [normalizedProducts]);


  // ============================================================
  // STOCK HEALTH
  // ============================================================

  const stockHealthData = useMemo(() => {

    return [

      {
        name: "In Stock",
        value: metrics.healthyStock,
      },

      {
        name: "Low Stock",
        value: metrics.lowStock,
      },

      {
        name: "Out of Stock",
        value: metrics.outOfStock,
      },

    ].filter(
      (item) =>
        item.value > 0
    );

  }, [metrics]);


  // ============================================================
  // STOCK HEALTH COLORS
  // ============================================================

  const stockHealthColors = [
    "#A3E635",
    "#FDE047",
    "#F87171",
  ];


  // ============================================================
  // BAR CHART COLORS
  // ============================================================

  const chartColors = [
    "#A3E635",
    "#22D3EE",
    "#818CF8",
    "#C084FC",
    "#F472B6",
    "#FB7185",
    "#FBBF24",
    "#34D399",
    "#60A5FA",
    "#2DD4BF",
  ];


  // ============================================================
  // TOP PRODUCTS BY INVENTORY VALUE
  // ============================================================

  const topProducts = useMemo(() => {

    return [...normalizedProducts]

      .sort(
        (a, b) =>
          b.inventoryValue -
          a.inventoryValue
      )

      .slice(0, 8)

      .map((product) => ({

        name:
          product.productName.length > 18
            ?
              `${product.productName.slice(
                0,
                18
              )}...`
            :
              product.productName,

        fullName:
          product.productName,

        value:
          product.inventoryValue,

        stock:
          product.numericStock,

      }));

  }, [normalizedProducts]);


  // ============================================================
  // EXECUTIVE INSIGHTS
  // ============================================================

  const insights = useMemo(() => {

    const result = [];


    if (metrics.outOfStock > 0) {

      result.push({

        type: "danger",

        icon: AlertTriangle,

        title: "Immediate inventory attention",

        message:
          `${metrics.outOfStock} product${
            metrics.outOfStock === 1
              ? ""
              : "s"
          } ${
            metrics.outOfStock === 1
              ? "is"
              : "are"
          } currently out of stock.`,

      });

    }


    if (metrics.lowStock > 0) {

      result.push({

        type: "warning",

        icon: Activity,

        title: "Replenishment required",

        message:
          `${metrics.lowStock} product${
            metrics.lowStock === 1
              ? ""
              : "s"
          } ${
            metrics.lowStock === 1
              ? "has"
              : "have"
          } inventory of 10 units or less.`,

      });

    }


    if (
      metrics.totalInventoryValue > 0 &&
      topProducts.length > 0
    ) {

      const highest =
        normalizedProducts
          .slice()
          .sort(
            (a, b) =>
              b.inventoryValue -
              a.inventoryValue
          )[0];


      if (highest) {

        result.push({

          type: "info",

          icon: TrendingUp,

          title: "Highest inventory exposure",

          message:
            `${highest.productName} has the highest inventory value at ${formatCurrency(
              highest.inventoryValue
            )}.`,

        });

      }

    }


    if (
      metrics.outOfStock === 0 &&
      metrics.lowStock === 0 &&
      metrics.totalProducts > 0
    ) {

      result.push({

        type: "success",

        icon: CheckCircle2,

        title: "Healthy inventory position",

        message:
          "All products currently have more than 10 units in stock.",

      });

    }


    return result.slice(0, 4);

  }, [
    metrics,
    topProducts,
    normalizedProducts,
  ]);


  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  function formatCurrency(value) {

    const number =
      Number(value) || 0;


    if (number >= 10000000) {

      return `₹${(
        number / 10000000
      ).toFixed(2)}Cr`;

    }


    if (number >= 100000) {

      return `₹${(
        number / 100000
      ).toFixed(2)}L`;

    }


    if (number >= 1000) {

      return `₹${(
        number / 1000
      ).toFixed(1)}K`;

    }


    return `₹${number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    )}`;

  }


  // ============================================================
  // FULL CURRENCY FORMAT
  // ============================================================

  function formatFullCurrency(value) {

    return `₹${(
      Number(value) || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    )}`;

  }


  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (
    !loading &&
    !error &&
    products.length === 0
  ) {

    return (

      <div className="min-h-screen bg-[#0B1220] text-white px-6 py-8 lg:px-8">

        <div className="mx-auto max-w-[1600px]">

          {/* HEADER */}

          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div className="flex items-center gap-4">

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

                <BarChart3
                  className="
                    h-6
                    w-6
                    text-lime-300
                    drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]
                  "
                />

              </div>

              <div>

                <h1 className="text-3xl font-bold tracking-tight">
                  Business Intelligence
                </h1>

                <p className="mt-1 text-sm font-medium text-white/60">
                  Live product and inventory intelligence
                </p>

              </div>

            </div>


            <button
              onClick={() => loadProducts(true)}
              className="
                flex
                items-center
                justify-center
                gap-2
                self-start
                rounded-xl
                border
                border-lime-300/50
                bg-lime-300/10
                px-4
                py-2.5
                text-sm
                font-bold
                text-lime-300
                shadow-[0_0_12px_rgba(163,230,53,0.22),0_0_28px_rgba(163,230,53,0.08)]
                transition-all
                duration-300
                hover:border-lime-300/70
                hover:bg-lime-300/15
                hover:shadow-[0_0_18px_rgba(163,230,53,0.35),0_0_35px_rgba(163,230,53,0.12)]
              "
            >

              <RefreshCw className="h-4 w-4" />

              Refresh

            </button>

          </div>


          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-lime-300/45
              bg-[#111C2E]
              px-6
              py-20
              text-center
              shadow-[0_0_10px_rgba(163,230,53,0.28),0_0_28px_rgba(163,230,53,0.14),0_0_60px_rgba(163,230,53,0.06)]
              transition-all
              duration-300
              hover:border-lime-300/60
              hover:shadow-[0_0_14px_rgba(163,230,53,0.38),0_0_36px_rgba(163,230,53,0.18),0_0_70px_rgba(163,230,53,0.08)]
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
                border-lime-300/50
                bg-lime-300/10
                shadow-[0_0_14px_rgba(163,230,53,0.28),0_0_30px_rgba(163,230,53,0.12)]
              "
            >

              <Package className="h-8 w-8 text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

            </div>

            <h2 className="mt-5 text-xl font-bold">
              No Products Available
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/50">
              The Business Intelligence report uses your live Products table.
              Add a product through Product Management and refresh this page
              to see the analytics.
            </p>

            <button
              onClick={() => loadProducts(true)}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-lime-300/50
                bg-lime-300/10
                px-5
                py-3
                text-sm
                font-bold
                text-lime-300
                shadow-[0_0_12px_rgba(163,230,53,0.22)]
                transition-all
                duration-300
                hover:border-lime-300/70
                hover:bg-lime-300/20
                hover:shadow-[0_0_20px_rgba(163,230,53,0.35)]
              "
            >

              <RefreshCw className="h-4 w-4" />

              Refresh Products

            </button>

          </section>

        </div>

      </div>

    );

  }


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (

      <div className="min-h-screen bg-[#0B1220] text-white px-6 py-8 lg:px-8">

        <div className="mx-auto max-w-[1600px]">

          <div className="mb-8">

            <div className="h-3 w-48 animate-pulse rounded bg-white/10" />

            <div className="mt-3 h-9 w-80 animate-pulse rounded bg-white/10" />

            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-white/10" />

          </div>


          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (

                <div
                  key={item}
                  className="
                    h-36
                    animate-pulse
                    rounded-2xl
                    border
                    border-lime-300/10
                    bg-[#111C2E]
                    shadow-[0_0_20px_rgba(163,230,53,0.03)]
                  "
                />

              )
            )}

          </div>


          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            <div
              className="
                h-[380px]
                animate-pulse
                rounded-2xl
                border
                border-lime-300/10
                bg-[#111C2E]
                shadow-[0_0_20px_rgba(163,230,53,0.03)]
              "
            />

            <div
              className="
                h-[380px]
                animate-pulse
                rounded-2xl
                border
                border-lime-300/10
                bg-[#111C2E]
                shadow-[0_0_20px_rgba(163,230,53,0.03)]
              "
            />

          </div>

        </div>

      </div>

    );

  }


  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {

    return (

      <div className="min-h-screen bg-[#0B1220] px-6 py-8 text-white lg:px-8">

        <div className="mx-auto max-w-[1600px]">

          <div
            className="
              rounded-2xl
              border
              border-red-400/25
              bg-red-400/5
              px-6
              py-12
              text-center
              shadow-[0_0_16px_rgba(248,113,113,0.08),0_0_35px_rgba(248,113,113,0.04)]
            "
          >

            <AlertTriangle className="mx-auto h-10 w-10 text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.7)]" />

            <h2 className="mt-4 text-xl font-bold">
              Unable to Load Business Intelligence
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-white/50">
              {error}
            </p>

            <button
              onClick={() => loadProducts(true)}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-lime-300/50
                bg-lime-300/10
                px-5
                py-3
                text-sm
                font-bold
                text-lime-300
                shadow-[0_0_14px_rgba(163,230,53,0.22)]
                transition-all
                duration-300
                hover:border-lime-300/70
                hover:bg-lime-300/20
                hover:shadow-[0_0_22px_rgba(163,230,53,0.35)]
              "
            >

              <RefreshCw className="h-4 w-4" />

              Try Again

            </button>

          </div>

        </div>

      </div>

    );

  }


  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <div className="min-h-screen bg-[#0B1220] text-white px-6 py-8 lg:px-8">

      <div className="mx-auto max-w-[1600px]">

        {/* ======================================================
            HEADER
        ======================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

          <div className="flex items-center gap-4">

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

              <BarChart3
                className="
                  h-6
                  w-6
                  text-lime-300
                  drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]
                "
              />

            </div>


            <div>

              <h1
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  text-white
                  md:text-4xl
                "
              >
                Business Intelligence
              </h1>


              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                  text-white/55
                "
              >
                Live product and inventory intelligence
              </p>

            </div>

          </div>


          {/* REFRESH */}

          <button
            onClick={() => loadProducts(true)}
            disabled={refreshing}
            className="
              flex
              items-center
              justify-center
              gap-2
              self-start
              rounded-xl
              border
              border-lime-300/45
              bg-lime-300/10
              px-4
              py-2.5
              text-sm
              font-bold
              text-lime-300
              shadow-[0_0_12px_rgba(163,230,53,0.22),0_0_26px_rgba(163,230,53,0.08)]
              transition-all
              duration-300
              hover:border-lime-300/70
              hover:bg-lime-300/15
              hover:shadow-[0_0_18px_rgba(163,230,53,0.35),0_0_35px_rgba(163,230,53,0.12)]
              disabled:cursor-not-allowed
              disabled:opacity-60
              lg:self-auto
            "
          >

            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Data"}

          </button>

        </div>


        {/* ======================================================
            LIVE DATA STATUS
        ======================================================= */}

        <div
          className="
            mb-6
            flex
            flex-wrap
            items-center
            gap-x-3
            gap-y-2
            rounded-xl
            border
            border-lime-300/25
            bg-lime-300/[0.035]
            px-4
            py-3
            shadow-[0_0_12px_rgba(163,230,53,0.10),0_0_28px_rgba(163,230,53,0.04)]
          "
        >

          <span
            className="
              h-2
              w-2
              rounded-full
              bg-lime-300
              shadow-[0_0_8px_rgba(163,230,53,1),0_0_16px_rgba(163,230,53,0.65)]
            "
          />

          <span className="text-xs font-bold uppercase tracking-wider text-lime-200">
            Live Product Data
          </span>

          <span className="text-xs text-white/40">
            •
          </span>

          <span className="text-xs font-medium text-white/55">
            Analytics calculated from the Products table
          </span>

        </div>


        {/* ======================================================
            KPI CARDS
        ======================================================= */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">


          {/* PRODUCTS */}

          <div
            className="
              rounded-2xl
              border
              border-lime-300/35
              bg-[#111C2E]
              p-5
              shadow-[0_0_10px_rgba(163,230,53,0.22),0_0_26px_rgba(163,230,53,0.09)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-lime-300/55
              hover:shadow-[0_0_15px_rgba(163,230,53,0.34),0_0_34px_rgba(163,230,53,0.14)]
            "
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                  Total Products
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {metrics.totalProducts.toLocaleString(
                    "en-IN"
                  )}
                </p>

                <p className="mt-2 text-xs font-semibold text-white/40">
                  Active catalogue records
                </p>

              </div>


              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-lime-300/35
                  bg-lime-300/10
                  shadow-[0_0_10px_rgba(163,230,53,0.20)]
                "
              >

                <Package
                  className="
                    h-5
                    w-5
                    text-lime-300
                    drop-shadow-[0_0_7px_rgba(163,230,53,0.8)]
                  "
                />

              </div>

            </div>

          </div>


          {/* INVENTORY */}

          <div
            className="
              rounded-2xl
              border
              border-lime-300/35
              bg-[#111C2E]
              p-5
              shadow-[0_0_10px_rgba(163,230,53,0.22),0_0_26px_rgba(163,230,53,0.09)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-lime-300/55
              hover:shadow-[0_0_15px_rgba(163,230,53,0.34),0_0_34px_rgba(163,230,53,0.14)]
            "
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                  Total Inventory
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {metrics.totalInventory.toLocaleString(
                    "en-IN"
                  )}
                </p>

                <p className="mt-2 text-xs font-semibold text-white/40">
                  Units currently available
                </p>

              </div>


              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-lime-300/35
                  bg-lime-300/10
                  shadow-[0_0_10px_rgba(163,230,53,0.20)]
                "
              >

                <Boxes
                  className="
                    h-5
                    w-5
                    text-lime-300
                    drop-shadow-[0_0_7px_rgba(163,230,53,0.8)]
                  "
                />

              </div>

            </div>

          </div>


          {/* AVERAGE PRICE */}

          <div
            className="
              rounded-2xl
              border
              border-lime-300/35
              bg-[#111C2E]
              p-5
              shadow-[0_0_10px_rgba(163,230,53,0.22),0_0_26px_rgba(163,230,53,0.09)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-lime-300/55
              hover:shadow-[0_0_15px_rgba(163,230,53,0.34),0_0_34px_rgba(163,230,53,0.14)]
            "
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                  Average Price
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {formatCurrency(
                    metrics.averagePrice
                  )}
                </p>

                <p className="mt-2 text-xs font-semibold text-white/40">
                  Across priced products
                </p>

              </div>


              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-lime-300/35
                  bg-lime-300/10
                  shadow-[0_0_10px_rgba(163,230,53,0.20)]
                "
              >

                <IndianRupee
                  className="
                    h-5
                    w-5
                    text-lime-300
                    drop-shadow-[0_0_7px_rgba(163,230,53,0.8)]
                  "
                />

              </div>

            </div>

          </div>


          {/* INVENTORY VALUE */}

          <div
            className="
              rounded-2xl
              border
              border-lime-300/55
              bg-lime-300/[0.055]
              p-5
              shadow-[0_0_12px_rgba(163,230,53,0.30),0_0_32px_rgba(163,230,53,0.12)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-lime-300/70
              hover:shadow-[0_0_18px_rgba(163,230,53,0.42),0_0_40px_rgba(163,230,53,0.16)]
            "
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-lime-300/75">
                  Inventory Value
                </p>

                <p className="mt-3 text-3xl font-bold text-lime-300 drop-shadow-[0_0_7px_rgba(163,230,53,0.45)]">
                  {formatCurrency(
                    metrics.totalInventoryValue
                  )}
                </p>

                <p className="mt-2 text-xs font-semibold text-white/40">
                  Price × available stock
                </p>

              </div>


              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-lime-300/40
                  bg-lime-300/10
                  shadow-[0_0_12px_rgba(163,230,53,0.24)]
                "
              >

                <TrendingUp
                  className="
                    h-5
                    w-5
                    text-lime-300
                    drop-shadow-[0_0_7px_rgba(163,230,53,0.8)]
                  "
                />

              </div>

            </div>

          </div>

        </div>


        {/* ======================================================
            STOCK HEALTH + CATEGORY INVENTORY
        ======================================================= */}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">


          {/* STOCK HEALTH */}

          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-lime-300/35
              bg-[#111C2E]
              shadow-[0_0_10px_rgba(163,230,53,0.22),0_0_28px_rgba(163,230,53,0.08)]
              transition-all
              duration-300
              hover:border-lime-300/55
              hover:shadow-[0_0_15px_rgba(163,230,53,0.32),0_0_36px_rgba(163,230,53,0.12)]
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-lime-300/20
                bg-[#0F192A]
                px-5
                py-5
                shadow-[0_4px_20px_rgba(163,230,53,0.06)]
              "
            >

              <div>

                <h2 className="text-lg font-bold">
                  Stock Health
                </h2>

                <p className="mt-1 text-xs font-medium text-white/45">
                  Current inventory condition
                </p>

              </div>


              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-lime-300/25
                  bg-lime-300/10
                  shadow-[0_0_10px_rgba(163,230,53,0.18)]
                "
              >

                <Layers3
                  className="
                    h-5
                    w-5
                    text-lime-300
                    drop-shadow-[0_0_7px_rgba(163,230,53,0.8)]
                  "
                />

              </div>

            </div>


            <div className="grid min-h-[320px] grid-cols-1 items-center gap-4 p-5 sm:grid-cols-2">


              {/* PIE */}

              <div className="h-[270px]">

                {stockHealthData.length > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={stockHealthData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={100}
                        paddingAngle={4}
                        stroke="none"
                      >

                        {stockHealthData.map(
                          (entry, index) => (

                            <Cell
                              key={`stock-${index}`}
                              fill={
                                stockHealthColors[
                                  index %
                                  stockHealthColors.length
                                ]
                              }
                            />

                          )
                        )}

                      </Pie>


                      <Tooltip
                        contentStyle={{
                          background:
                            "#0D1727",
                          border:
                            "1px solid rgba(163,230,53,0.35)",
                          borderRadius:
                            "12px",
                          color:
                            "#fff",
                          boxShadow:
                            "0 0 18px rgba(163,230,53,0.12)",
                        }}
                      />

                    </PieChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="flex h-full items-center justify-center text-sm text-white/40">
                    No stock data
                  </div>

                )}

              </div>


              {/* LEGEND */}

              <div className="space-y-4">

                <StockLegend
                  label="In Stock"
                  value={
                    metrics.healthyStock
                  }
                  total={
                    metrics.totalProducts
                  }
                  indicator="lime"
                />

                <StockLegend
                  label="Low Stock"
                  value={
                    metrics.lowStock
                  }
                  total={
                    metrics.totalProducts
                  }
                  indicator="yellow"
                />

                <StockLegend
                  label="Out of Stock"
                  value={
                    metrics.outOfStock
                  }
                  total={
                    metrics.totalProducts
                  }
                  indicator="red"
                />

              </div>

            </div>

          </section>


          {/* CATEGORY INVENTORY */}

          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-lime-300/35
              bg-[#111C2E]
              shadow-[0_0_10px_rgba(163,230,53,0.22),0_0_28px_rgba(163,230,53,0.08)]
              transition-all
              duration-300
              hover:border-lime-300/55
              hover:shadow-[0_0_15px_rgba(163,230,53,0.32),0_0_36px_rgba(163,230,53,0.12)]
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-lime-300/20
                bg-[#0F192A]
                px-5
                py-5
                shadow-[0_4px_20px_rgba(163,230,53,0.06)]
              "
            >

              <div>

                <h2 className="text-lg font-bold">
                  Inventory by Category
                </h2>

                <p className="mt-1 text-xs font-medium text-white/45">
                  Units available across product categories
                </p>

              </div>


              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-lime-300/25
                  bg-lime-300/10
                  shadow-[0_0_10px_rgba(163,230,53,0.18)]
                "
              >

                <Boxes
                  className="
                    h-5
                    w-5
                    text-lime-300
                    drop-shadow-[0_0_7px_rgba(163,230,53,0.8)]
                  "
                />

              </div>

            </div>


            <div className="h-[320px] p-5">

              {categoryData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={categoryData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                    />

                    <XAxis
                      dataKey="category"
                      tick={{
                        fill:
                          "rgba(255,255,255,0.55)",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fill:
                          "rgba(255,255,255,0.45)",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0D1727",
                        border:
                          "1px solid rgba(163,230,53,0.35)",
                        borderRadius:
                          "12px",
                        color:
                          "#fff",
                        boxShadow:
                          "0 0 18px rgba(163,230,53,0.12)",
                      }}
                      formatter={(value) =>
                        [
                          Number(value).toLocaleString(
                            "en-IN"
                          ),
                          "Units",
                        ]
                      }
                    />

                    <Bar
                      dataKey="inventory"
                      name="Inventory"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    >

                      {categoryData.map(
                        (entry, index) => (

                          <Cell
                            key={`category-bar-${index}`}
                            fill={
                              chartColors[
                                index %
                                chartColors.length
                              ]
                            }
                          />

                        )
                      )}

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex h-full items-center justify-center text-sm text-white/40">
                  No category data available
                </div>

              )}

            </div>

          </section>

        </div>


        {/* ======================================================
            TOP PRODUCTS
        ======================================================= */}

        <section
          className="
            mt-6
            overflow-hidden
            rounded-2xl
            border
            border-lime-300/35
            bg-[#111C2E]
            shadow-[0_0_10px_rgba(163,230,53,0.22),0_0_28px_rgba(163,230,53,0.08)]
            transition-all
            duration-300
            hover:border-lime-300/55
            hover:shadow-[0_0_15px_rgba(163,230,53,0.32),0_0_36px_rgba(163,230,53,0.12)]
          "
        >

          <div
            className="
              flex
              flex-col
              gap-2
              border-b
              border-lime-300/20
              bg-[#0F192A]
              px-5
              py-5
              shadow-[0_4px_20px_rgba(163,230,53,0.06)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              <h2 className="text-lg font-bold">
                Top Products by Inventory Value
              </h2>

              <p className="mt-1 text-xs font-medium text-white/45">
                Products with the highest current price × stock value
              </p>

            </div>


            <div
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-lg
                border
                border-lime-300/30
                bg-lime-300/[0.04]
                px-3
                py-2
                shadow-[0_0_10px_rgba(163,230,53,0.12)]
              "
            >

              <IndianRupee
                className="
                  h-3.5
                  w-3.5
                  text-lime-300
                  drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]
                "
              />

              <span className="text-[10px] font-bold uppercase tracking-wider text-lime-200">
                Live calculation
              </span>

            </div>

          </div>


          <div className="h-[380px] p-5">

            {topProducts.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 30,
                    left: 10,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />

                  <XAxis
                    type="number"
                    tick={{
                      fill:
                        "rgba(255,255,255,0.45)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{
                      fill:
                        "rgba(255,255,255,0.65)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0D1727",
                      border:
                        "1px solid rgba(163,230,53,0.35)",
                      borderRadius:
                        "12px",
                      color:
                        "#fff",
                      boxShadow:
                        "0 0 18px rgba(163,230,53,0.12)",
                    }}
                    formatter={(value, name, props) => {

                      if (
                        name ===
                        "Inventory Value"
                      ) {

                        return [
                          formatFullCurrency(
                            value
                          ),
                          "Inventory Value",
                        ];

                      }

                      return [
                        value,
                        name,
                      ];

                    }}

                    labelFormatter={(
                      label,
                      payload
                    ) => {

                      const item =
                        payload?.[0]?.payload;

                      return (
                        item?.fullName ||
                        label
                      );

                    }}
                  />

                  <Bar
                    dataKey="value"
                    name="Inventory Value"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                  >

                    {topProducts.map(
                      (entry, index) => (

                        <Cell
                          key={`top-product-bar-${index}`}
                          fill={
                            chartColors[
                              index %
                              chartColors.length
                            ]
                          }
                        />

                      )
                    )}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <div className="flex h-full items-center justify-center text-sm text-white/40">
                No inventory value data available
              </div>

            )}

          </div>

        </section>


        {/* ======================================================
            EXECUTIVE INSIGHTS
        ======================================================= */}

        <section className="mt-6">

          <div className="mb-4 flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-lime-300/40
                bg-lime-300/10
                shadow-[0_0_12px_rgba(163,230,53,0.22)]
              "
            >

              <Activity
                className="
                  h-5
                  w-5
                  text-lime-300
                  drop-shadow-[0_0_7px_rgba(163,230,53,0.8)]
                "
              />

            </div>


            <div>

              <h2 className="text-lg font-bold">
                Executive Insights
              </h2>

              <p className="text-xs font-medium text-white/45">
                Automatically generated from live product data
              </p>

            </div>

          </div>


          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            {insights.map(
              (insight, index) => {

                const Icon =
                  insight.icon;


                const styles = {

                  danger: {
                    wrapper:
                      "border-red-400/30 bg-red-400/[0.04] shadow-[0_0_12px_rgba(248,113,113,0.14),0_0_26px_rgba(248,113,113,0.05)] hover:border-red-400/45 hover:shadow-[0_0_16px_rgba(248,113,113,0.20),0_0_32px_rgba(248,113,113,0.07)]",
                    icon:
                      "border-red-400/30 bg-red-400/10 text-red-300",
                    title:
                      "text-red-200",
                  },

                  warning: {
                    wrapper:
                      "border-yellow-400/30 bg-yellow-400/[0.035] shadow-[0_0_12px_rgba(250,204,21,0.12),0_0_26px_rgba(250,204,21,0.04)] hover:border-yellow-400/45 hover:shadow-[0_0_16px_rgba(250,204,21,0.18),0_0_32px_rgba(250,204,21,0.06)]",
                    icon:
                      "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
                    title:
                      "text-yellow-200",
                  },

                  info: {
                    wrapper:
                      "border-lime-300/30 bg-lime-300/[0.035] shadow-[0_0_12px_rgba(163,230,53,0.16),0_0_28px_rgba(163,230,53,0.06)] hover:border-lime-300/50 hover:shadow-[0_0_17px_rgba(163,230,53,0.24),0_0_34px_rgba(163,230,53,0.09)]",
                    icon:
                      "border-lime-300/30 bg-lime-300/10 text-lime-300",
                    title:
                      "text-lime-200",
                  },

                  success: {
                    wrapper:
                      "border-lime-300/30 bg-lime-300/[0.035] shadow-[0_0_12px_rgba(163,230,53,0.16),0_0_28px_rgba(163,230,53,0.06)] hover:border-lime-300/50 hover:shadow-[0_0_17px_rgba(163,230,53,0.24),0_0_34px_rgba(163,230,53,0.09)]",
                    icon:
                      "border-lime-300/30 bg-lime-300/10 text-lime-300",
                    title:
                      "text-lime-200",
                  },

                };


                const current =
                  styles[
                    insight.type
                  ] ||
                  styles.info;


                return (

                  <div
                    key={index}
                    className={`
                      rounded-2xl
                      border
                      p-5
                      transition-all
                      duration-300
                      ${current.wrapper}
                    `}
                  >

                    <div className="flex items-start gap-3">

                      <div
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          border
                          shadow-[0_0_8px_rgba(163,230,53,0.08)]
                          ${current.icon}
                        `}
                      >

                        <Icon className="h-4 w-4" />

                      </div>


                      <div className="min-w-0">

                        <h3
                          className={`
                            text-sm
                            font-bold
                            ${current.title}
                          `}
                        >
                          {insight.title}
                        </h3>


                        <p className="mt-2 text-xs font-medium leading-5 text-white/50">
                          {insight.message}
                        </p>

                      </div>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </section>


        {/* ======================================================
            INVENTORY SUMMARY
        ======================================================= */}

        <section
          className="
            mt-6
            rounded-2xl
            border
            border-lime-300/30
            bg-[#0F192A]
            px-5
            py-5
            shadow-[0_0_10px_rgba(163,230,53,0.18),0_0_28px_rgba(163,230,53,0.06)]
            transition-all
            duration-300
            hover:border-lime-300/45
            hover:shadow-[0_0_14px_rgba(163,230,53,0.26),0_0_34px_rgba(163,230,53,0.09)]
          "
        >

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">


            <SummaryItem
              label="Healthy Stock"
              value={
                metrics.healthyStock
              }
              description="More than 10 units"
              icon={CheckCircle2}
            />


            <SummaryItem
              label="Low Stock"
              value={
                metrics.lowStock
              }
              description="10 units or less"
              icon={Activity}
            />


            <SummaryItem
              label="Out of Stock"
              value={
                metrics.outOfStock
              }
              description="Zero units available"
              icon={AlertTriangle}
            />


            <SummaryItem
              label="Categories"
              value={
                categoryData.length
              }
              description="Product categories"
              icon={Layers3}
            />

          </div>

        </section>


        {/* ======================================================
            FOOTER
        ======================================================= */}

        <div
          className="
            mt-6
            flex
            flex-col
            gap-2
            border-t
            border-lime-300/15
            pt-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <div className="flex items-center gap-2">

            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-lime-300
                shadow-[0_0_8px_rgba(163,230,53,1),0_0_16px_rgba(163,230,53,0.65)]
              "
            />

            <span className="text-xs font-semibold text-white/50">
              Product data connected
            </span>

          </div>


          <p className="text-xs font-medium text-white/35">
            {metrics.totalProducts} live product records
          </p>

        </div>

      </div>

    </div>

  );

}


// ================================================================
// STOCK LEGEND COMPONENT
// ================================================================

function StockLegend({
  label,
  value,
  total,
  indicator,
}) {

  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;


  const indicatorClass = {

    lime:
      "bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.9),0_0_14px_rgba(163,230,53,0.5)]",

    yellow:
      "bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.9),0_0_14px_rgba(253,224,71,0.5)]",

    red:
      "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9),0_0_14px_rgba(248,113,113,0.5)]",

  }[indicator];


  return (

    <div>

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <span
            className={`
              h-2
              w-2
              rounded-full
              ${indicatorClass}
            `}
          />

          <span className="text-xs font-semibold text-white/70">
            {label}
          </span>

        </div>


        <span className="text-sm font-bold text-white">
          {value}
        </span>

      </div>


      <div
        className="
          mt-2
          h-1.5
          overflow-hidden
          rounded-full
          bg-white/[0.07]
          shadow-[inset_0_0_6px_rgba(0,0,0,0.25)]
        "
      >

        <div
          className={`
            h-full
            rounded-full
            ${indicatorClass}
          `}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>


      <p className="mt-1 text-right text-[10px] font-medium text-white/35">
        {percentage}% of products
      </p>

    </div>

  );

}


// ================================================================
// SUMMARY ITEM
// ================================================================

function SummaryItem({
  label,
  value,
  description,
  icon: Icon,
}) {

  return (

    <div className="flex items-center gap-3">

      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          border-lime-300/30
          bg-lime-300/10
          shadow-[0_0_10px_rgba(163,230,53,0.18)]
        "
      >

        <Icon
          className="
            h-4
            w-4
            text-lime-300
            drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]
          "
        />

      </div>


      <div className="min-w-0">

        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
          {label}
        </p>

        <p className="mt-0.5 text-lg font-bold text-white">
          {Number(value).toLocaleString(
            "en-IN"
          )}
        </p>

        <p className="text-[10px] font-medium text-white/30">
          {description}
        </p>

      </div>

    </div>

  );

}


export default BusinessIntelligenceReport;