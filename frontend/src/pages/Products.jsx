import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

import API from "../api/axios";

function PricingAnalytics() {
  const [summary, setSummary] = useState(null);

  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // =========================================================
  // FETCH ANALYTICS DATA
  // =========================================================

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        API.get("/pricing-demand/summary"),
        API.get("/pricing-demand/trends"),
        API.get("/pricing-demand/category-performance"),
      ]);

      // -------------------------------------------------------
      // SUMMARY
      // -------------------------------------------------------

      const summaryResult = results[0];

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value.data);
      }

      // -------------------------------------------------------
      // TRENDS
      // -------------------------------------------------------

      const trendsResult = results[1];

      if (trendsResult.status === "fulfilled") {
        const responseData = trendsResult.value.data;

        const trends = Array.isArray(responseData)
          ? responseData
          : responseData?.data ||
            responseData?.trends ||
            responseData?.items ||
            [];

        setTrendData(Array.isArray(trends) ? trends : []);
      }

      // -------------------------------------------------------
      // CATEGORY PERFORMANCE
      // -------------------------------------------------------

      const categoryResult = results[2];

      if (categoryResult.status === "fulfilled") {
        const responseData = categoryResult.value.data;

        const categories = Array.isArray(responseData)
          ? responseData
          : responseData?.data ||
            responseData?.categories ||
            responseData?.items ||
            [];

        setCategoryData(
          Array.isArray(categories) ? categories : []
        );
      }

      // -------------------------------------------------------
      // ERROR HANDLING
      // -------------------------------------------------------

      const failedRequests = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedRequests.length === results.length) {
        const firstError = failedRequests[0]?.reason;

        if (firstError?.response?.status === 401) {
          setError(
            "Your session has expired. Please login again."
          );
        } else {
          setError(
            "Unable to load analytics data. Please check your backend and login session."
          );
        }
      } else if (failedRequests.length > 0) {
        console.warn(
          "Some analytics endpoints failed:",
          failedRequests
        );
      }
    } catch (err) {
      console.error("Analytics loading error:", err);

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          "Unable to load analytics data. Please check your backend connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORMAT TREND DATA
  // =========================================================

  const formattedTrendData = useMemo(() => {
    return trendData
      .map((item) => ({
        date:
          item.date ||
          item.day ||
          item.created_at ||
          item.month ||
          "Unknown",

        revenue: Number(
          item.revenue ||
            item.total_revenue ||
            0
        ),

        units_sold: Number(
          item.units_sold ||
            item.total_units_sold ||
            item.unitsSold ||
            0
        ),

        demand_index: Number(
          item.demand_index ||
            item.average_demand_index ||
            item.avg_demand_index ||
            item.demandIndex ||
            0
        ),
      }))
      .filter(
        (item) =>
          item.revenue > 0 ||
          item.units_sold > 0 ||
          item.demand_index > 0
      );
  }, [trendData]);

  // =========================================================
  // FORMAT CATEGORY DATA
  // =========================================================

  const formattedCategoryData = useMemo(() => {
    return categoryData
      .map((item) => ({
        category:
          item.category ||
          item.name ||
          "Unknown",

        revenue: Number(
          item.revenue ||
            item.total_revenue ||
            0
        ),

        units_sold: Number(
          item.units_sold ||
            item.total_units_sold ||
            0
        ),

        demand_index: Number(
          item.demand_index ||
            item.average_demand_index ||
            item.avg_demand_index ||
            0
        ),
      }))
      .filter(
        (item) =>
          item.revenue > 0 ||
          item.units_sold > 0 ||
          item.demand_index > 0
      );
  }, [categoryData]);

  // =========================================================
  // CURRENCY FORMATTER
  // =========================================================

  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  // =========================================================
  // NUMBER FORMATTER
  // =========================================================

  const formatNumber = (value) => {
    return Number(
      value || 0
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  };

  // =========================================================
  // REVENUE TOOLTIP
  // =========================================================

  const RevenueTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      !payload.length
    ) {
      return null;
    }

    return (
      <div style={tooltipStyle}>
        <p style={tooltipLabelStyle}>
          {label}
        </p>

        {payload.map(
          (entry, index) => (
            <p
              key={index}
              style={{
                margin: "4px 0",
                color: "#86efac",
              }}
            >
              {entry.name}:{" "}
              {entry.name === "Revenue"
                ? formatCurrency(
                    entry.value
                  )
                : formatNumber(
                    entry.value
                  )}
            </p>
          )
        )}
      </div>
    );
  };

  // =========================================================
  // DEMAND TOOLTIP
  // =========================================================

  const DemandTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      !payload.length
    ) {
      return null;
    }

    return (
      <div style={tooltipStyle}>
        <p style={tooltipLabelStyle}>
          {label}
        </p>

        <p
          style={{
            margin: "4px 0",
            color: "#60a5fa",
          }}
        >
          Demand Index:{" "}
          {Number(
            payload[0]?.value || 0
          ).toFixed(2)}
        </p>
      </div>
    );
  };

  // =========================================================
  // CATEGORY TOOLTIP
  // =========================================================

  const CategoryTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      !payload.length
    ) {
      return null;
    }

    return (
      <div style={tooltipStyle}>
        <p style={tooltipLabelStyle}>
          {label}
        </p>

        {payload.map(
          (entry, index) => (
            <p
              key={index}
              style={{
                margin: "4px 0",
                color:
                  entry.dataKey ===
                  "revenue"
                    ? "#86efac"
                    : "#60a5fa",
              }}
            >
              {entry.name}:{" "}
              {entry.dataKey ===
              "revenue"
                ? formatCurrency(
                    entry.value
                  )
                : formatNumber(
                    entry.value
                  )}
            </p>
          )
        )}
      </div>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #10251c 0%, #0b1120 38%, #060b14 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontFamily:
            "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            color: "#86efac",
            textShadow:
              "0 0 10px rgba(134,239,172,0.8), 0 0 25px rgba(34,197,94,0.5)",
          }}
        >
          Loading pricing analytics...
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",

        background:
          "radial-gradient(circle at 50% -10%, #123523 0%, #0b1120 32%, #060b14 75%, #03070d 100%)",

        color: "#fff",

        padding: "28px",

        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

        boxSizing: "border-box",

        position: "relative",

        overflow: "hidden",
      }}
    >
      {/* =====================================================
          BACKGROUND GLOW
      ====================================================== */}

      <div
        style={{
          position: "fixed",
          top: "-180px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(34,197,94,0.16) 0%, rgba(34,197,94,0.06) 35%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* =====================================================
          CONTENT WRAPPER
      ====================================================== */}

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ===================================================
            HEADER
        ==================================================== */}

        <div
          style={{
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#86efac",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.2em",

                  textShadow:
                    "0 0 8px rgba(134,239,172,0.85), 0 0 18px rgba(34,197,94,0.55)",
                }}
              >
                PricePilot AI
              </p>

              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  fontWeight: "700",
                  letterSpacing:
                    "-0.5px",

                  color: "#f8fafc",

                  textShadow:
                    "0 0 10px rgba(255,255,255,0.08), 0 0 25px rgba(34,197,94,0.18)",
                }}
              >
                Pricing Analytics
              </h1>

              <p
                style={{
                  marginTop: "8px",
                  marginBottom: 0,
                  color: "#94a3b8",
                  fontSize: "15px",
                }}
              >
                Revenue intelligence,
                demand signals and
                pricing performance
                insights
              </p>
            </div>

            {/* REFRESH BUTTON */}

            <button
              onClick={fetchAnalytics}
              style={{
                background:
                  "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#03150a",
                border:
                  "1px solid rgba(134,239,172,0.8)",
                borderRadius: "9px",
                padding:
                  "10px 18px",
                fontWeight: "800",
                cursor: "pointer",
                fontSize: "14px",

                boxShadow:
                  "0 0 8px rgba(34,197,94,0.8), 0 0 20px rgba(34,197,94,0.55), 0 0 35px rgba(34,197,94,0.28), inset 0 0 8px rgba(255,255,255,0.18)",

                textShadow:
                  "0 0 8px rgba(255,255,255,0.35)",

                transition:
                  "all 0.3s ease",
              }}
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (
          <div
            style={{
              background:
                "rgba(69,26,3,0.85)",

              border:
                "1px solid rgba(251,146,60,0.65)",

              color: "#fed7aa",

              borderRadius: "10px",

              padding:
                "14px 16px",

              marginBottom: "24px",

              boxShadow:
                "0 0 15px rgba(251,146,60,0.15)",
            }}
          >
            {error}
          </div>
        )}

        {/* ===================================================
            KPI CARDS
        ==================================================== */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",

            gap: "18px",

            marginBottom: "28px",
          }}
        >
          {/* TOTAL REVENUE */}

          <div style={cardStyle}>
            <div style={kpiGlowDotStyle} />

            <p style={cardLabelStyle}>
              Total Revenue
            </p>

            <h2 style={cardValueStyle}>
              {formatCurrency(
                summary?.total_revenue
              )}
            </h2>

            <p style={cardSubStyle}>
              Overall revenue
            </p>
          </div>

          {/* UNITS SOLD */}

          <div style={cardStyle}>
            <div style={kpiGlowDotStyle} />

            <p style={cardLabelStyle}>
              Units Sold
            </p>

            <h2 style={cardValueStyle}>
              {formatNumber(
                summary?.total_units_sold
              )}
            </h2>

            <p style={cardSubStyle}>
              Total units sold
            </p>
          </div>

          {/* DEMAND INDEX */}

          <div style={cardStyle}>
            <div style={kpiGlowDotStyle} />

            <p style={cardLabelStyle}>
              Avg. Demand Index
            </p>

            <h2 style={cardValueStyle}>
              {Number(
                summary?.average_demand_index ||
                  0
              ).toFixed(2)}
            </h2>

            <p style={cardSubStyle}>
              Average demand strength
            </p>
          </div>

          {/* DISCOUNT */}

          <div style={cardStyle}>
            <div style={kpiGlowDotStyle} />

            <p style={cardLabelStyle}>
              Avg. Discount
            </p>

            <h2 style={cardValueStyle}>
              {Number(
                summary?.average_discount_pct ||
                  0
              ).toFixed(2)}
              %
            </h2>

            <p style={cardSubStyle}>
              Average discount
              applied
            </p>
          </div>
        </div>

        {/* ===================================================
            FOUR CHART GRID
        ==================================================== */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",

            gap: "22px",
          }}
        >
          {/* =================================================
              CHART 1
              REVENUE TREND
          ================================================== */}

          <div style={chartCardStyle}>
            <ChartHeader
              title="Revenue Trend"
              subtitle="Daily revenue performance"
            />

            <div
              style={{
                width: "100%",
                height: 300,
              }}
            >
              {formattedTrendData.length >
              0 ? (
                <ResponsiveContainer>
                  <AreaChart
                    data={
                      formattedTrendData
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#22c55e"
                          stopOpacity={0.5}
                        />

                        <stop
                          offset="100%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 10,
                      }}
                      tickFormatter={(value) =>
                        String(
                          value
                        ).slice(0, 10)
                      }
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 10,
                      }}
                      tickFormatter={(
                        value
                      ) =>
                        `₹${(
                          value /
                          1000000
                        ).toFixed(1)}M`
                      }
                    />

                    <Tooltip
                      content={
                        <RevenueTooltip />
                      }
                    />

                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#22c55e"
                      fill="url(#revenueGradient)"
                      strokeWidth={3}
                      style={{
                        filter:
                          "drop-shadow(0 0 6px rgba(34,197,94,0.8))",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          {/* =================================================
              CHART 2
              DEMAND TREND
          ================================================== */}

          <div style={chartCardStyle}>
            <ChartHeader
              title="Demand Trend"
              subtitle="Daily demand index movement"
            />

            <div
              style={{
                width: "100%",
                height: 300,
              }}
            >
              {formattedTrendData.length >
              0 ? (
                <ResponsiveContainer>
                  <LineChart
                    data={
                      formattedTrendData
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 10,
                      }}
                      tickFormatter={(value) =>
                        String(
                          value
                        ).slice(0, 10)
                      }
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 10,
                      }}
                    />

                    <Tooltip
                      content={
                        <DemandTooltip />
                      }
                    />

                    <ReferenceLine
                      y={100}
                      stroke="#64748b"
                      strokeDasharray="5 5"
                    />

                    <Line
                      type="monotone"
                      dataKey="demand_index"
                      name="Demand Index"
                      stroke="#60a5fa"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 6,
                        stroke:
                          "#bfdbfe",
                        strokeWidth: 2,
                        fill: "#60a5fa",
                      }}
                      style={{
                        filter:
                          "drop-shadow(0 0 6px rgba(96,165,250,0.8))",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          {/* =================================================
              CHART 3
              REVENUE BY CATEGORY
          ================================================== */}

          <div style={chartCardStyle}>
            <ChartHeader
              title="Revenue by Category"
              subtitle="Category revenue contribution"
            />

            <div
              style={{
                width: "100%",
                height: 300,
              }}
            >
              {formattedCategoryData.length >
              0 ? (
                <ResponsiveContainer>
                  <BarChart
                    data={
                      formattedCategoryData
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="category"
                      stroke="#64748b"
                      tick={{
                        fill: "#cbd5e1",
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 10,
                      }}
                      tickFormatter={(
                        value
                      ) =>
                        `₹${(
                          value /
                          1000000
                        ).toFixed(1)}M`
                      }
                    />

                    <Tooltip
                      content={
                        <CategoryTooltip />
                      }
                    />

                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#22c55e"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                      style={{
                        filter:
                          "drop-shadow(0 0 6px rgba(34,197,94,0.65))",
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          {/* =================================================
              CHART 4
              UNITS SOLD BY CATEGORY
          ================================================== */}

          <div style={chartCardStyle}>
            <ChartHeader
              title="Units Sold by Category"
              subtitle="Sales volume across categories"
            />

            <div
              style={{
                width: "100%",
                height: 300,
              }}
            >
              {formattedCategoryData.length >
              0 ? (
                <ResponsiveContainer>
                  <BarChart
                    data={
                      formattedCategoryData
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="category"
                      stroke="#64748b"
                      tick={{
                        fill: "#cbd5e1",
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 10,
                      }}
                      tickFormatter={(value) =>
                        `${(
                          value / 1000
                        ).toFixed(0)}K`
                      }
                    />

                    <Tooltip
                      content={
                        <CategoryTooltip />
                      }
                    />

                    <Bar
                      dataKey="units_sold"
                      name="Units Sold"
                      fill="#60a5fa"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                      style={{
                        filter:
                          "drop-shadow(0 0 6px rgba(96,165,250,0.7))",
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        </div>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        <div
          style={{
            marginTop: "24px",

            background:
              "linear-gradient(135deg, rgba(17,24,39,0.95), rgba(9,18,29,0.95))",

            border:
              "1px solid rgba(34,197,94,0.5)",

            borderRadius: "12px",

            padding:
              "16px 20px",

            color: "#94a3b8",

            fontSize: "13px",

            boxShadow:
              "0 0 8px rgba(34,197,94,0.35), 0 0 20px rgba(34,197,94,0.18), inset 0 0 15px rgba(34,197,94,0.04)",
          }}
        >
          <strong
            style={{
              color: "#86efac",

              textShadow:
                "0 0 8px rgba(134,239,172,0.75), 0 0 18px rgba(34,197,94,0.45)",
            }}
          >
            PricePilot AI
          </strong>{" "}
          — Analytics are generated
          from pricing, sales,
          revenue, discount,
          inventory and demand
          signals.
        </div>
      </div>
    </div>
  );
}

// =========================================================
// CHART HEADER
// =========================================================

function ChartHeader({
  title,
  subtitle,
}) {
  return (
    <div
      style={{
        marginBottom: "12px",
      }}
    >
      <h2
        style={{
          margin: 0,
          color: "#f8fafc",
          fontSize: "16px",
          fontWeight: "650",

          textShadow:
            "0 0 8px rgba(255,255,255,0.08), 0 0 18px rgba(34,197,94,0.25)",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin:
            "5px 0 0",
          color: "#64748b",
          fontSize: "11px",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// =========================================================
// EMPTY CHART
// =========================================================

function EmptyChart({
  message = "No data available",
}) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      {message}
    </div>
  );
}

// =========================================================
// KPI CARD STYLE
// =========================================================

const cardStyle = {
  background:
    "linear-gradient(145deg, rgba(17,24,39,0.98), rgba(8,18,28,0.98))",

  border:
    "1px solid rgba(34,197,94,0.9)",

  borderRadius: "12px",

  padding: "20px",

  minHeight: "125px",

  boxSizing: "border-box",

  position: "relative",

  overflow: "hidden",

  boxShadow:
    "0 0 8px rgba(34,197,94,0.85), 0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.4), 0 0 65px rgba(34,197,94,0.18), inset 0 0 20px rgba(34,197,94,0.09)",

  transition:
    "all 0.3s ease",
};

// =========================================================
// KPI GLOW DOT
// =========================================================

const kpiGlowDotStyle = {
  position: "absolute",

  top: "-25px",

  right: "-25px",

  width: "80px",

  height: "80px",

  borderRadius: "50%",

  background:
    "radial-gradient(circle, rgba(34,197,94,0.28) 0%, rgba(34,197,94,0.08) 45%, transparent 70%)",

  pointerEvents: "none",
};

// =========================================================
// KPI TEXT STYLES
// =========================================================

const cardLabelStyle = {
  margin: 0,

  color: "#94a3b8",

  fontSize: "13px",

  fontWeight: "500",
};

const cardValueStyle = {
  margin:
    "10px 0 4px",

  color: "#f8fafc",

  fontSize: "25px",

  fontWeight: "700",

  textShadow:
    "0 0 8px rgba(255,255,255,0.1), 0 0 18px rgba(34,197,94,0.3)",
};

const cardSubStyle = {
  margin: 0,

  color: "#64748b",

  fontSize: "12px",
};

// =========================================================
// CHART CARD STYLE
// =========================================================

const chartCardStyle = {
  background:
    "linear-gradient(145deg, rgba(17,24,39,0.98), rgba(8,18,28,0.98))",

  border:
    "1px solid rgba(34,197,94,0.75)",

  borderRadius: "14px",

  padding: "18px",

  boxSizing: "border-box",

  minWidth: 0,

  boxShadow:
    "0 0 8px rgba(34,197,94,0.7), 0 0 20px rgba(34,197,94,0.42), 0 0 40px rgba(34,197,94,0.24), 0 0 65px rgba(34,197,94,0.12), inset 0 0 18px rgba(34,197,94,0.055)",

  transition:
    "all 0.3s ease",
};

// =========================================================
// TOOLTIP
// =========================================================

const tooltipStyle = {
  background:
    "rgba(9,15,25,0.97)",

  border:
    "1px solid rgba(34,197,94,0.55)",

  borderRadius: "10px",

  padding: "12px 14px",

  color: "#fff",

  boxShadow:
    "0 0 12px rgba(34,197,94,0.35), 0 8px 25px rgba(0,0,0,0.45)",
};

const tooltipLabelStyle = {
  margin:
    "0 0 8px",

  fontWeight: "600",

  color: "#d1d5db",
};

export default PricingAnalytics;