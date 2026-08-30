import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Activity,
  AlertCircle,
  BarChart3,
  CircleDollarSign,
  Loader2,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Target,
  Sparkles,
} from "lucide-react";


// ============================================================
// COMPONENT
// ============================================================

function ProfitabilityAnalytics() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [products, setProducts] = useState([]);

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [analysis, setAnalysis] =
    useState(null);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [loadingAnalysis, setLoadingAnalysis] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // API BASE URL
  // ==========================================================

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";


  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  const loadProducts = async () => {

    try {

      setLoadingProducts(true);
      setError("");

      const token =
        localStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/products/`,
        {
          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},
        }
      );

      const data = response.data;

      const productList =
        Array.isArray(data)
          ? data
          : data?.items || [];

      setProducts(productList);

      if (
        productList.length > 0 &&
        !selectedProductId
      ) {

        setSelectedProductId(
          String(productList[0].id)
        );

      }

    } catch (err) {

      console.error(
        "Product loading error:",
        err
      );

      setError(
        "Unable to load products from the Products table."
      );

    } finally {

      setLoadingProducts(false);

    }

  };


  useEffect(() => {

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

  }, [
    products,
    selectedProductId,
  ]);


  // ==========================================================
  // RUN PROFITABILITY ANALYSIS
  // ==========================================================

  const runAnalysis = async () => {

    if (!selectedProduct) {

      setError(
        "Please select a product."
      );

      return;
    }

    const storePrice =
      Number(
        selectedProduct.current_price
      );

    if (
      !Number.isFinite(storePrice) ||
      storePrice <= 0
    ) {

      setError(
        "The selected product does not have a valid store price."
      );

      return;
    }

    try {

      setLoadingAnalysis(true);
      setError("");
      setAnalysis(null);

      const token =
        localStorage.getItem("token");

      const response = await axios.post(
        `${API_BASE_URL}/profitability/analyze`,
        {
          product_name:
            selectedProduct.name,

          store_price:
            storePrice,
        },
        {
          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},
        }
      );

      setAnalysis(
        response.data
      );

    } catch (err) {

      console.error(
        "Profitability analysis error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to perform profitability analysis."
      );

    } finally {

      setLoadingAnalysis(false);

    }

  };


  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const money = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      Number.isNaN(Number(value))
    ) {

      return "N/A";

    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value)
    );

  };


  // ==========================================================
  // FORMAT DIFFERENCE
  // ==========================================================

  const difference = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      Number.isNaN(Number(value))
    ) {

      return "N/A";

    }

    const number =
      Number(value);

    if (number > 0) {

      return `+${money(number)}`;

    }

    return money(number);

  };


  // ==========================================================
  // PRODUCT CHANGE
  // ==========================================================

  const handleProductChange = (event) => {

    setSelectedProductId(
      event.target.value
    );

    setAnalysis(null);
    setError("");

  };


  // ==========================================================
  // LOADING PRODUCTS
  // ==========================================================

  if (loadingProducts) {

    return (

      <div className="
        min-h-screen
        w-full
        bg-[#0B1220]
        text-white
        flex
        items-center
        justify-center
      ">

        <div className="
          rounded-2xl
          border
          border-lime-300/30
          bg-[#111C2E]
          px-8
          py-6
          shadow-[0_0_12px_rgba(163,230,53,0.22),0_0_30px_rgba(163,230,53,0.10)]
        ">

          <div className="
            flex
            items-center
            gap-3
            text-lime-300
          ">

            <Loader2
              size={22}
              className="animate-spin"
            />

            <span className="text-sm font-medium">
              Loading products...
            </span>

          </div>

        </div>

      </div>

    );

  }


  // ==========================================================
  // MAIN
  // ==========================================================

  return (

    <div className="
      min-h-screen
      w-full
      bg-[#0B1220]
      text-white
    ">

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <main className="
        w-full
        px-6
        py-7
        lg:px-8
      ">

        {/* ====================================================
            PAGE TITLE
        ===================================================== */}

        <div className="
          mb-7
          flex
          items-center
          justify-between
          gap-4
        ">

          <div className="
            flex
            items-center
            gap-4
          ">

            {/* =================================================
                NEON CIRCLE DOLLAR ICON
            ================================================== */}

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

              <CircleDollarSign
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
                "
              >
                Profitability Analytics
              </h1>


              <p
                className="
                  mt-1
                  text-sm
                  font-medium
                  text-white/70
                "
              >
                Evaluate pricing opportunities and profitability potential
              </p>

            </div>

          </div>


          {/* =================================================
              REFRESH BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={loadProducts}
            disabled={loadingProducts}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-lime-300/30
              bg-[#111C2E]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white/80
              shadow-[0_0_8px_rgba(163,230,53,0.14),0_0_20px_rgba(163,230,53,0.06)]
              transition-all
              duration-300
              hover:border-lime-300/55
              hover:bg-[#142238]
              hover:text-lime-300
              hover:shadow-[0_0_12px_rgba(163,230,53,0.28),0_0_28px_rgba(163,230,53,0.12)]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >

            <RefreshCw
              size={16}
              className={
                loadingProducts
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh Products

          </button>

        </div>


        {/* ====================================================
            ERROR
        ===================================================== */}

        {error && (

          <div className="
            mb-6
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-red-400/30
            bg-[#151B2A]
            p-4
            text-sm
            text-red-200
            shadow-[0_0_10px_rgba(248,113,113,0.12),0_0_24px_rgba(248,113,113,0.05)]
          ">

            <AlertCircle
              size={18}
              className="
                mt-0.5
                shrink-0
                text-red-300
                drop-shadow-[0_0_6px_rgba(248,113,113,0.65)]
              "
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* ====================================================
            PRODUCT ANALYSIS CONTAINER
        ===================================================== */}

        <section
          className="
            mb-7
            w-full
            overflow-hidden
            rounded-2xl
            border
            border-lime-300/45
            bg-[#111C2E]
            shadow-[0_0_10px_rgba(163,230,53,0.28),0_0_28px_rgba(163,230,53,0.14),0_0_60px_rgba(163,230,53,0.06)]
            transition-all
            duration-300
            hover:border-lime-300/60
            hover:shadow-[0_0_14px_rgba(163,230,53,0.38),0_0_36px_rgba(163,230,53,0.18),0_0_70px_rgba(163,230,53,0.08)]
          "
        >

          {/* =================================================
              SECTION HEADER
          ================================================== */}

          <div className="
            flex
            items-center
            gap-3
            border-b
            border-lime-300/20
            bg-[#0F192A]
            px-6
            py-5
            shadow-[0_4px_20px_rgba(163,230,53,0.06)]
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-lime-300/35
              bg-lime-300/10
              shadow-[0_0_8px_rgba(163,230,53,0.25),0_0_18px_rgba(163,230,53,0.08)]
            ">

              <ShoppingBag
                size={18}
                className="
                  text-lime-300
                  drop-shadow-[0_0_6px_rgba(163,230,53,0.75)]
                "
              />

            </div>


            <div>

              <h2 className="
                text-lg
                font-bold
                text-white
              ">
                Product Analysis
              </h2>


              <p className="
                mt-1
                text-sm
                font-medium
                text-white/60
              ">
                Choose a product from your catalogue
              </p>

            </div>

          </div>


          {/* =================================================
              PRODUCT SELECTION
          ================================================== */}

          <div className="
            grid
            gap-5
            bg-[#111C2E]
            px-6
            py-6
            lg:grid-cols-[minmax(0,1fr)_220px_auto]
            lg:items-end
          ">


            {/* PRODUCT */}

            <div>

              <label className="
                mb-2
                block
                text-[11px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-white/50
              ">
                Select Product
              </label>


              <select
                value={selectedProductId}
                onChange={handleProductChange}
                className="
                  w-full
                  rounded-xl
                  border
                  border-lime-300/20
                  bg-[#0B1627]
                  px-4
                  py-3
                  text-sm
                  font-medium
                  text-white
                  outline-none
                  shadow-[0_0_8px_rgba(163,230,53,0.05)]
                  transition-all
                  duration-300
                  hover:border-lime-300/35
                  focus:border-lime-300/50
                  focus:shadow-[0_0_10px_rgba(163,230,53,0.18),0_0_24px_rgba(163,230,53,0.06)]
                "
              >

                {products.length === 0 && (

                  <option value="">
                    No products available
                  </option>

                )}


                {products.map(
                  (product) => (

                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* STORE PRICE */}

            <div>

              <p className="
                mb-2
                text-[11px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-white/50
              ">
                Your Store Price
              </p>


              <div className="
                rounded-xl
                border
                border-lime-300/40
                bg-lime-300/[0.06]
                px-4
                py-3
                text-lg
                font-bold
                text-lime-300
                shadow-[0_0_9px_rgba(163,230,53,0.18),0_0_22px_rgba(163,230,53,0.07)]
              ">

                {selectedProduct
                  ? money(
                      selectedProduct.current_price
                    )
                  : "N/A"}

              </div>

            </div>


            {/* ANALYZE BUTTON */}

            <button
              type="button"
              onClick={runAnalysis}
              disabled={
                loadingAnalysis ||
                !selectedProduct
              }
              className="
                inline-flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-lime-200/70
                bg-lime-300
                px-6
                text-sm
                font-bold
                text-[#07111f]
                shadow-[0_0_12px_rgba(163,230,53,0.40),0_0_28px_rgba(163,230,53,0.16)]
                transition-all
                duration-300
                hover:bg-lime-200
                hover:shadow-[0_0_16px_rgba(163,230,53,0.55),0_0_35px_rgba(163,230,53,0.20)]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >

              {loadingAnalysis ? (

                <>

                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Analyzing...

                </>

              ) : (

                <>

                  <BarChart3
                    size={17}
                  />

                  Analyze Profitability

                </>

              )}

            </button>

          </div>


          {/* =================================================
              PRODUCT INFORMATION
          ================================================== */}

          {selectedProduct && (

            <div className="
              flex
              flex-wrap
              gap-2
              border-t
              border-lime-300/10
              bg-[#0F192A]
              px-6
              py-4
            ">

              <InfoBadge
                label="Category"
                value={
                  selectedProduct.category ||
                  "N/A"
                }
              />

              <InfoBadge
                label="Stock"
                value={
                  selectedProduct.stock ??
                  "N/A"
                }
              />

              <InfoBadge
                label="Product ID"
                value={
                  selectedProduct.id
                }
              />

            </div>

          )}

        </section>


        {/* ====================================================
            EMPTY STATE
        ===================================================== */}

        {!analysis &&
          !loadingAnalysis && (

            <section className="
              w-full
              rounded-2xl
              border
              border-lime-300/25
              bg-[#111C2E]
              px-6
              py-20
              text-center
              shadow-[0_0_10px_rgba(163,230,53,0.14),0_0_30px_rgba(163,230,53,0.05)]
            ">

              <div className="
                mx-auto
                mb-5
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                border
                border-lime-300/45
                bg-lime-300/10
                shadow-[0_0_12px_rgba(163,230,53,0.28),0_0_28px_rgba(163,230,53,0.10)]
              ">

                <Target
                  size={27}
                  className="
                    text-lime-300
                    drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]
                  "
                />

              </div>


              <h2 className="
                text-lg
                font-bold
                text-white
              ">
                Ready for Profitability Analysis
              </h2>


              <p className="
                mx-auto
                mt-2
                max-w-lg
                text-sm
                leading-6
                text-white/55
              ">
                Select a product and run the analysis
                to generate pricing and profitability
                intelligence from the available market data.
              </p>

            </section>

          )}


        {/* ====================================================
            LOADING STATE
        ===================================================== */}

        {loadingAnalysis && (

          <section className="
            w-full
            rounded-2xl
            border
            border-lime-300/30
            bg-[#111C2E]
            px-6
            py-20
            text-center
            shadow-[0_0_10px_rgba(163,230,53,0.20),0_0_30px_rgba(163,230,53,0.08)]
          ">

            <div className="
              mx-auto
              mb-5
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              border
              border-lime-300/40
              bg-lime-300/10
              shadow-[0_0_12px_rgba(163,230,53,0.25),0_0_28px_rgba(163,230,53,0.08)]
            ">

              <Loader2
                size={27}
                className="
                  animate-spin
                  text-lime-300
                  drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]
                "
              />

            </div>


            <h2 className="
              text-lg
              font-bold
              text-white
            ">
              Generating Profitability Intelligence
            </h2>


            <p className="
              mx-auto
              mt-2
              max-w-lg
              text-sm
              leading-6
              text-white/55
            ">
              Market pricing data is being processed.
              Please wait while the analysis is completed.
            </p>

          </section>

        )}


        {/* ====================================================
            PROFITABILITY INTELLIGENCE
        ===================================================== */}

        {analysis && !loadingAnalysis && (

          <div className="space-y-6">


            {/* ==================================================
                ANALYSIS HEADER
            =================================================== */}

            <section className="
              w-full
              overflow-hidden
              rounded-2xl
              border
              border-lime-300/40
              bg-[#111C2E]
              shadow-[0_0_10px_rgba(163,230,53,0.24),0_0_28px_rgba(163,230,53,0.11),0_0_55px_rgba(163,230,53,0.05)]
              transition-all
              duration-300
              hover:border-lime-300/55
              hover:shadow-[0_0_14px_rgba(163,230,53,0.32),0_0_35px_rgba(163,230,53,0.15)]
            ">

              <div className="
                border-b
                border-lime-300/20
                bg-[#0F192A]
                px-6
                py-5
                shadow-[0_4px_20px_rgba(163,230,53,0.06)]
              ">

                <div className="
                  flex
                  items-start
                  gap-4
                ">

                  <div className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-lime-300/45
                    bg-lime-300/10
                    shadow-[0_0_10px_rgba(163,230,53,0.30),0_0_22px_rgba(163,230,53,0.10)]
                  ">

                    <Sparkles
                      size={22}
                      className="
                        text-lime-300
                        drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]
                      "
                    />

                  </div>


                  <div>

                    <p className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.2em]
                      text-lime-300
                    ">
                      Revenue Intelligence
                    </p>


                    <h2 className="
                      mt-1
                      text-2xl
                      font-bold
                      text-white
                    ">
                      Profitability Intelligence
                    </h2>


                    <p className="
                      mt-2
                      text-sm
                      leading-6
                      text-white/55
                    ">
                      Pricing opportunity generated from
                      the current market environment for{" "}

                      <span className="
                        font-semibold
                        text-white/80
                      ">
                        {selectedProduct?.name}
                      </span>
                      .
                    </p>

                  </div>

                </div>

              </div>


              <div className="
                bg-[#0F192A]
                px-6
                py-3
              ">

                <div className="
                  flex
                  flex-wrap
                  items-center
                  gap-x-6
                  gap-y-2
                  text-xs
                ">

                  <span className="text-white/45">

                    Analysis Status

                    <span className="
                      ml-2
                      font-bold
                      text-lime-300
                    ">
                      Completed
                    </span>

                  </span>


                  <span className="text-white/45">

                    Product

                    <span className="
                      ml-2
                      font-semibold
                      text-white/75
                    ">
                      {selectedProduct?.name}
                    </span>

                  </span>

                </div>

              </div>

            </section>


            {/* ==================================================
                KEY METRICS
            =================================================== */}

            <div className="
              grid
              gap-4
              sm:grid-cols-2
              xl:grid-cols-4
            ">

              <MetricCard
                icon={ShoppingBag}
                label="Your Store Price"
                value={money(
                  analysis.store?.price
                )}
                subtitle="Current selling price"
              />


              <MetricCard
                icon={TrendingDown}
                label="Lowest Market Price"
                value={money(
                  analysis.market?.lowest_competitor
                )}
                subtitle="Lowest observed price"
              />


              <MetricCard
                icon={BarChart3}
                label="Market Average"
                value={money(
                  analysis.market?.competitor_average
                )}
                subtitle="Average observed price"
                highlight
              />


              <MetricCard
                icon={TrendingUp}
                label="Highest Market Price"
                value={money(
                  analysis.market?.highest_competitor
                )}
                subtitle="Highest observed price"
              />

            </div>


            {/* ==================================================
                PRICING OPPORTUNITY
            =================================================== */}

            <section className="
              rounded-2xl
              border
              border-lime-300/35
              bg-[#111C2E]
              p-6
              shadow-[0_0_10px_rgba(163,230,53,0.18),0_0_28px_rgba(163,230,53,0.07)]
              transition-all
              duration-300
              hover:border-lime-300/50
              hover:shadow-[0_0_14px_rgba(163,230,53,0.28),0_0_34px_rgba(163,230,53,0.10)]
            ">

              <div className="
                mb-6
                flex
                flex-col
                gap-4
                md:flex-row
                md:items-center
                md:justify-between
              ">

                <div>

                  <div className="
                    flex
                    items-center
                    gap-3
                  ">

                    <div className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-lime-300/25
                      bg-lime-300/10
                      shadow-[0_0_8px_rgba(163,230,53,0.18)]
                    ">

                      <Activity
                        size={16}
                        className="
                          text-lime-300
                          drop-shadow-[0_0_6px_rgba(163,230,53,0.7)]
                        "
                      />

                    </div>


                    <h2 className="
                      text-lg
                      font-bold
                    ">
                      Pricing Opportunity
                    </h2>

                  </div>


                  <p className="
                    mt-2
                    text-xs
                    text-white/45
                  ">
                    Difference between your current
                    price and the observed market.
                  </p>

                </div>


                <div className="
                  rounded-xl
                  border
                  border-lime-300/25
                  bg-[#0B1627]
                  px-4
                  py-2.5
                  text-sm
                  shadow-[0_0_8px_rgba(163,230,53,0.08)]
                ">

                  <span className="text-white/45">
                    Current Price:
                  </span>{" "}

                  <span className="
                    font-bold
                    text-lime-300
                  ">
                    {money(
                      analysis.store?.price
                    )}
                  </span>

                </div>

              </div>


              <div className="
                grid
                gap-4
                md:grid-cols-2
              ">

                <OpportunityCard
                  title="Opportunity vs Lowest Market"
                  value={difference(
                    analysis.profitability
                      ?.potential_gain_vs_lowest
                  )}
                  positive={
                    Number(
                      analysis.profitability
                        ?.potential_gain_vs_lowest
                    ) >= 0
                  }
                  description="
                    Potential pricing difference relative
                    to the lowest observed market price.
                  "
                />


                <OpportunityCard
                  title="Opportunity vs Market Average"
                  value={difference(
                    analysis.profitability
                      ?.potential_gain_vs_average
                  )}
                  positive={
                    Number(
                      analysis.profitability
                        ?.potential_gain_vs_average
                    ) >= 0
                  }
                  description="
                    Potential pricing difference relative
                    to the average observed market price.
                  "
                />

              </div>

            </section>


            {/* ==================================================
                RECOMMENDATION
            =================================================== */}

            <section className="
              overflow-hidden
              rounded-2xl
              border
              border-lime-300/45
              bg-[#111C2E]
              shadow-[0_0_12px_rgba(163,230,53,0.24),0_0_30px_rgba(163,230,53,0.10)]
              transition-all
              duration-300
              hover:border-lime-300/60
              hover:shadow-[0_0_16px_rgba(163,230,53,0.32),0_0_38px_rgba(163,230,53,0.13)]
            ">

              <div className="
                h-1
                bg-lime-300
                shadow-[0_0_8px_rgba(163,230,53,0.85),0_0_20px_rgba(163,230,53,0.35)]
              " />


              <div className="
                bg-[#0F192A]
                p-6
              ">

                <div className="
                  grid
                  gap-7
                  lg:grid-cols-[1fr_auto]
                  lg:items-center
                ">

                  <div>

                    <div className="
                      flex
                      items-center
                      gap-2
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-lime-300
                    ">

                      <Activity
                        size={15}
                        className="drop-shadow-[0_0_6px_rgba(163,230,53,0.75)]"
                      />

                      PricePilot Recommendation

                    </div>


                    <h2 className="
                      mt-3
                      text-xl
                      font-bold
                      text-white
                    ">
                      {
                        analysis.market
                          ?.competitiveness ||
                        "Pricing recommendation available"
                      }
                    </h2>


                    <p className="
                      mt-2
                      max-w-2xl
                      text-sm
                      leading-6
                      text-white/50
                    ">
                      The recommendation is based on
                      the current market pricing observed
                      during this analysis.
                    </p>

                  </div>


                  {/* RECOMMENDED PRICE */}

                  <div className="
                    min-w-[240px]
                    rounded-2xl
                    border
                    border-lime-300/45
                    bg-[#0B1627]
                    px-7
                    py-5
                    text-center
                    shadow-[0_0_12px_rgba(163,230,53,0.24),0_0_28px_rgba(163,230,53,0.08)]
                  ">

                    <div className="
                      mx-auto
                      mb-2
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-lime-300/20
                      bg-lime-300/10
                    ">

                      <Target
                        size={16}
                        className="
                          text-lime-300
                          drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]
                        "
                      />

                    </div>


                    <p className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-white/45
                    ">
                      Recommended Price
                    </p>


                    <p className="
                      mt-2
                      text-3xl
                      font-bold
                      text-lime-300
                      drop-shadow-[0_0_8px_rgba(163,230,53,0.55)]
                    ">
                      {money(
                        analysis.recommendation
                          ?.recommended_price
                      )}
                    </p>

                  </div>

                </div>

              </div>

            </section>


            {/* ==================================================
                PROFITABILITY SUMMARY
            =================================================== */}

            <section className="
              rounded-2xl
              border
              border-lime-300/35
              bg-[#111C2E]
              p-6
              shadow-[0_0_10px_rgba(163,230,53,0.17),0_0_26px_rgba(163,230,53,0.06)]
              transition-all
              duration-300
              hover:border-lime-300/50
            ">

              <div>

                <h2 className="
                  text-lg
                  font-bold
                ">
                  Profitability Summary
                </h2>


                <p className="
                  mt-1
                  text-xs
                  text-white/45
                ">
                  Overall interpretation of the current
                  pricing opportunity.
                </p>

              </div>


              {/* SUMMARY CARDS */}

              <div className="
                mt-5
                grid
                gap-4
                md:grid-cols-3
              ">

                <SummaryCard
                  label="Current Price"
                  value={money(
                    analysis.store?.price
                  )}
                />


                <SummaryCard
                  label="Recommended Price"
                  value={money(
                    analysis.recommendation
                      ?.recommended_price
                  )}
                  highlight
                />


                <SummaryCard
                  label="Price Difference"
                  value={difference(
                    Number(
                      analysis.recommendation
                        ?.recommended_price
                    ) -
                    Number(
                      analysis.store?.price
                    )
                  )}
                />

              </div>


              {/* TEXT INTERPRETATION */}

              <div className="
                mt-5
                rounded-xl
                border
                border-lime-300/20
                bg-[#0B1627]
                p-5
                shadow-[0_0_8px_rgba(163,230,53,0.06)]
              ">

                <div className="
                  flex
                  items-start
                  gap-3
                ">

                  <div className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-lime-300/20
                    bg-lime-300/10
                  ">

                    <Activity
                      size={16}
                      className="
                        text-lime-300
                        drop-shadow-[0_0_6px_rgba(163,230,53,0.75)]
                      "
                    />

                  </div>


                  <div>

                    <p className="
                      text-sm
                      font-bold
                      text-white/85
                    ">
                      Pricing Insight
                    </p>


                    <p className="
                      mt-2
                      text-sm
                      leading-6
                      text-white/50
                    ">
                      {
                        generateInsight(
                          analysis,
                          selectedProduct
                        )
                      }
                    </p>

                  </div>

                </div>

              </div>

            </section>


            {/* ==================================================
                MARKET POSITION FOOTER
            =================================================== */}

            <section className="
              rounded-2xl
              border
              border-lime-300/30
              bg-[#0F192A]
              px-6
              py-5
              shadow-[0_0_8px_rgba(163,230,53,0.12),0_0_24px_rgba(163,230,53,0.05)]
            ">

              <div className="
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              ">

                <div className="
                  flex
                  items-center
                  gap-3
                ">

                  <div className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-lime-300/20
                    bg-lime-300/10
                    shadow-[0_0_7px_rgba(163,230,53,0.15)]
                  ">

                    <BarChart3
                      size={17}
                      className="
                        text-lime-300
                        drop-shadow-[0_0_6px_rgba(163,230,53,0.7)]
                      "
                    />

                  </div>


                  <div>

                    <p className="
                      text-xs
                      font-bold
                      text-white/75
                    ">
                      Market Competitiveness
                    </p>

                    <p className="
                      mt-0.5
                      text-xs
                      text-white/40
                    ">
                      Based on currently observed pricing
                    </p>

                  </div>

                </div>


                <div className="
                  rounded-xl
                  border
                  border-lime-300/35
                  bg-lime-300/[0.06]
                  px-4
                  py-2
                  text-sm
                  font-bold
                  text-lime-300
                  shadow-[0_0_8px_rgba(163,230,53,0.15),0_0_18px_rgba(163,230,53,0.05)]
                ">

                  {
                    analysis.market
                      ?.competitiveness ||
                    "Analysis Available"
                  }

                </div>

              </div>

            </section>


          </div>

        )}


        {/* ====================================================
            STATUS
        ===================================================== */}

        <div
          className="
            mt-5
            flex
            items-center
            gap-2
            text-xs
            font-semibold
            text-white/55
          "
        >

          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-lime-300
              shadow-[0_0_6px_rgba(163,230,53,1),0_0_12px_rgba(163,230,53,0.7)]
            "
          />

          <span>
            Profitability analysis connected
          </span>

        </div>


      </main>

    </div>

  );

}


// ============================================================
// INFO BADGE
// ============================================================

function InfoBadge({
  label,
  value,
}) {

  return (

    <div className="
      inline-flex
      items-center
      rounded-lg
      border
      border-lime-300/20
      bg-[#0B1627]
      px-3
      py-1.5
      text-xs
      shadow-[0_0_6px_rgba(163,230,53,0.05)]
    ">

      <span className="text-white/40">
        {label}:
      </span>

      <span className="
        ml-1.5
        font-semibold
        text-white/70
      ">
        {value}
      </span>

    </div>

  );

}


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  highlight = false,
}) {

  return (

    <div className={`
      rounded-2xl
      border
      p-5
      shadow-[0_0_9px_rgba(163,230,53,0.14),0_0_24px_rgba(163,230,53,0.05)]
      transition-all
      duration-300
      hover:-translate-y-[1px]
      hover:border-lime-300/50
      hover:shadow-[0_0_13px_rgba(163,230,53,0.24),0_0_30px_rgba(163,230,53,0.08)]
      ${
        highlight
          ? "border-lime-300/40 bg-[#111C2E]"
          : "border-lime-300/25 bg-[#111C2E]"
      }
    `}>

      <div className="
        mb-5
        flex
        items-center
        justify-between
      ">

        <div className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-lime-300/25
          bg-lime-300/[0.08]
          shadow-[0_0_7px_rgba(163,230,53,0.16)]
        ">

          <Icon
            size={19}
            className="
              text-lime-300
              drop-shadow-[0_0_6px_rgba(163,230,53,0.75)]
            "
          />

        </div>


        {highlight && (

          <span className="
            rounded-full
            border
            border-lime-300/25
            bg-lime-300/[0.07]
            px-2
            py-1
            text-[9px]
            font-bold
            uppercase
            tracking-wider
            text-lime-300
            shadow-[0_0_7px_rgba(163,230,53,0.10)]
          ">
            Benchmark
          </span>

        )}

      </div>


      <p className="
        text-[11px]
        font-bold
        uppercase
        tracking-[0.12em]
        text-white/45
      ">
        {label}
      </p>


      <p className="
        mt-2
        text-2xl
        font-bold
        tracking-tight
        text-white
      ">
        {value}
      </p>


      <p className="
        mt-1
        text-xs
        text-white/35
      ">
        {subtitle}
      </p>

    </div>

  );

}


// ============================================================
// OPPORTUNITY CARD
// ============================================================

function OpportunityCard({
  title,
  value,
  positive,
  description,
}) {

  return (

    <div className="
      rounded-xl
      border
      border-lime-300/20
      bg-[#0B1627]
      p-5
      shadow-[0_0_7px_rgba(163,230,53,0.05)]
      transition-all
      duration-300
      hover:border-lime-300/35
      hover:shadow-[0_0_10px_rgba(163,230,53,0.10)]
    ">

      <div className="
        flex
        items-start
        justify-between
        gap-3
      ">

        <p className="
          text-sm
          font-semibold
          text-white/75
        ">
          {title}
        </p>


        <div className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          ${
            positive
              ? "border border-lime-300/20 bg-lime-300/[0.07]"
              : "border border-red-300/20 bg-red-400/[0.07]"
          }
        `}>

          {positive ? (

            <TrendingUp
              size={16}
              className="
                text-lime-300
                drop-shadow-[0_0_6px_rgba(163,230,53,0.7)]
              "
            />

          ) : (

            <TrendingDown
              size={16}
              className="
                text-red-300
                drop-shadow-[0_0_6px_rgba(248,113,113,0.65)]
              "
            />

          )}

        </div>

      </div>


      <p className={`
        mt-5
        text-2xl
        font-bold
        ${
          positive
            ? "text-lime-300 drop-shadow-[0_0_7px_rgba(163,230,53,0.35)]"
            : "text-red-300 drop-shadow-[0_0_7px_rgba(248,113,113,0.30)]"
        }
      `}>
        {value}
      </p>


      <p className="
        mt-2
        text-xs
        leading-5
        text-white/35
      ">
        {description}
      </p>

    </div>

  );

}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
  highlight = false,
}) {

  return (

    <div className={`
      rounded-xl
      border
      p-5
      shadow-[0_0_7px_rgba(163,230,53,0.05)]
      ${
        highlight
          ? "border-lime-300/35 bg-lime-300/[0.06] shadow-[0_0_10px_rgba(163,230,53,0.12)]"
          : "border-lime-300/20 bg-[#0B1627]"
      }
    `}>

      <p className="
        text-[10px]
        font-bold
        uppercase
        tracking-[0.15em]
        text-white/40
      ">
        {label}
      </p>


      <p className={`
        mt-2
        text-xl
        font-bold
        ${
          highlight
            ? "text-lime-300 drop-shadow-[0_0_7px_rgba(163,230,53,0.35)]"
            : "text-white"
        }
      `}>
        {value}
      </p>

    </div>

  );

}


// ============================================================
// GENERATE INSIGHT
// ============================================================

function generateInsight(
  analysis,
  selectedProduct
) {

  const storePrice =
    Number(
      analysis?.store?.price
    );

  const recommendedPrice =
    Number(
      analysis?.recommendation
        ?.recommended_price
    );

  const average =
    Number(
      analysis?.market
        ?.competitor_average
    );


  if (
    !Number.isFinite(storePrice) ||
    !Number.isFinite(recommendedPrice)
  ) {

    return (
      "There is not enough pricing information " +
      "to generate a detailed recommendation."
    );

  }


  const difference =
    recommendedPrice -
    storePrice;


  if (difference > 0) {

    return (
      `The current price of ${
        moneyStatic(storePrice)
      } is below the recommended market-aligned ` +
      `price of ${
        moneyStatic(recommendedPrice)
      }. ` +
      `There may be an opportunity to increase ` +
      `the selling price while remaining aligned ` +
      `with the observed market.`
    );

  }


  if (difference < 0) {

    return (
      `The current price of ${
        moneyStatic(storePrice)
      } is above the recommended price of ${
        moneyStatic(recommendedPrice)
      }. ` +
      `A lower price may improve competitiveness ` +
      `and help protect the product's market position.`
    );

  }


  if (
    Number.isFinite(average) &&
    Math.abs(
      storePrice - average
    ) < 1
  ) {

    return (
      "Your current price is closely aligned with " +
      "the observed market average. The product " +
      "appears to be competitively positioned."
    );

  }


  return (
    `The current price for ${
      selectedProduct?.name ||
      "this product"
    } is already close to the recommended ` +
    "pricing level based on the available market data."
  );

}


// ============================================================
// STATIC MONEY HELPER
// ============================================================

function moneyStatic(value) {

  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      Number(value)
    )
  ) {

    return "N/A";

  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value)
  );

}


// ============================================================
// EXPORT
// ============================================================

export default ProfitabilityAnalytics;