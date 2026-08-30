import {
  DollarSign,
  TrendingUp,
  LogOut,
  Activity,
  Sparkles,
  Package,
  Users,
  Store,
  CircleDollarSign,
  BarChart3,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";


function Sidebar() {

  const location = useLocation();
  const navigate = useNavigate();


  // ============================================================
  // ROLE
  // ============================================================

  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";


  // ============================================================
  // NAVIGATION ITEMS
  // ============================================================

  const menuItems = [

    {
      name: "Product Management",
      icon: Package,
      path: "/dashboard",
    },

    {
      name: "Pricing Lab",
      icon: DollarSign,
      path: "/pricing-intelligence",
    },

    {
      name: "Demand Forecast",
      icon: TrendingUp,
      path: "/forecast",
    },

    {
      name: "Competitor Pricing",
      icon: Store,
      path: "/competitor-analysis",
    },

    {
      name: "Profitability Analytics",
      icon: CircleDollarSign,
      path: "/profitability-analytics",
    },

    {
      name: "Business Intelligence Report",
      icon: BarChart3,
      path: "/business-intelligence-report",
    },

  ];


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/");

  };


  return (

    <aside
      className="
        fixed
        left-0
        top-0
        z-50
        flex
        h-screen
        w-72
        flex-col
        overflow-y-auto

        border-r
        border-lime-300/15

        bg-[#07111f]

        text-white

        shadow-[8px_0_30px_rgba(0,0,0,0.22)]

        scrollbar-thin
        scrollbar-track-transparent
        scrollbar-thumb-lime-300/20
        hover:scrollbar-thumb-lime-300/40
      "
    >


      {/* =====================================================
          SUBTLE BACKGROUND GLOW
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          left-[-120px]
          top-[-100px]
          h-80
          w-80
          rounded-full
          bg-lime-300/[0.025]
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-[-120px]
          right-[-100px]
          h-80
          w-80
          rounded-full
          bg-blue-400/[0.035]
          blur-3xl
        "
      />


      {/* =====================================================
          LOGO
      ====================================================== */}

      <div
        className="
          relative
          shrink-0
          border-b
          border-slate-700/50
          bg-[#081526]
          px-7
          py-7
          shadow-[0_4px_20px_rgba(0,0,0,0.15)]
        "
      >

        <div className="flex items-center gap-3">


          {/* LOGO ICON */}

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl

              border
              border-lime-300/45

              bg-lime-300/[0.08]

              shadow-[
                0_0_10px_rgba(163,230,53,0.25),
                0_0_25px_rgba(163,230,53,0.12)
              ]
            "
            style={{
              boxShadow:
                "0 0 10px rgba(163,230,53,0.25), 0 0 25px rgba(163,230,53,0.12)",
            }}
          >

            <Sparkles
              className="
                h-5
                w-5
                text-lime-300
                drop-shadow-[0_0_8px_rgba(163,230,53,0.85)]
              "
            />

          </div>


          {/* BRAND */}

          <div>

            <h1
              className="
                text-xl
                font-bold
                tracking-tight
                text-white
              "
            >

              PricePilot
              <span
                className="
                  text-lime-300
                  drop-shadow-[0_0_7px_rgba(163,230,53,0.55)]
                "
              >
                {" "}AI
              </span>

            </h1>


            <p
              className="
                mt-1
                text-[10px]
                uppercase
                tracking-[0.2em]
                text-slate-400
              "
            >

              Intelligence System

            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          SYSTEM STATUS
      ====================================================== */}

      <div
        className="
          relative
          mx-5
          mt-6
          shrink-0
          rounded-2xl

          border
          border-lime-300/20

          bg-[#0B192C]

          p-4

          shadow-[
            0_0_10px_rgba(163,230,53,0.10),
            0_0_25px_rgba(163,230,53,0.05)
          ]

          transition-all
          duration-300

          hover:border-lime-300/30
        "
        style={{
          boxShadow:
            "0 0 10px rgba(163,230,53,0.10), 0 0 25px rgba(163,230,53,0.05)",
        }}
      >

        <div className="flex items-center gap-3">


          {/* STATUS ICON */}

          <div
            className="
              relative
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg

              border
              border-lime-300/15

              bg-lime-300/[0.07]

              shadow-[0_0_12px_rgba(163,230,53,0.08)]
            "
          >

            <Activity
              className="
                h-4
                w-4
                text-lime-300
                drop-shadow-[0_0_6px_rgba(163,230,53,0.7)]
              "
            />


            {/* LIVE DOT */}

            <span
              className="
                absolute
                right-1
                top-1
                h-1.5
                w-1.5
                rounded-full
                bg-lime-300
                shadow-[
                  0_0_7px_rgba(163,230,53,1),
                  0_0_15px_rgba(163,230,53,0.7)
                ]
              "
              style={{
                boxShadow:
                  "0 0 7px rgba(163,230,53,1), 0 0 15px rgba(163,230,53,0.7)",
              }}
            />

          </div>


          {/* STATUS TEXT */}

          <div>

            <p
              className="
                text-[10px]
                uppercase
                tracking-widest
                text-slate-500
              "
            >
              System
            </p>


            <p
              className="
                mt-0.5
                text-sm
                font-semibold
                text-lime-300
                drop-shadow-[0_0_5px_rgba(163,230,53,0.3)]
              "
            >
              Intelligence Online
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav
        className="
          relative
          shrink-0
          px-4
          py-7
        "
      >

        <p
          className="
            mb-4
            px-3
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.2em]
            text-slate-500
          "
        >

          Navigation

        </p>


        <div className="space-y-2">


          {menuItems.map((item) => {

            const Icon = item.icon;

            const active =
              location.pathname === item.path;


            return (

              <Link
                key={item.name}
                to={item.path}
                className={`
                  group
                  relative
                  flex
                  items-center
                  gap-4
                  rounded-xl

                  border

                  px-4
                  py-3.5

                  transition-all
                  duration-300

                  ${
                    active
                      ? `
                        border-lime-300/30
                        bg-lime-300/[0.09]
                        text-lime-300

                        shadow-[
                          0_0_10px_rgba(163,230,53,0.10),
                          0_0_24px_rgba(163,230,53,0.05)
                        ]
                      `
                      : `
                        border-transparent
                        text-slate-300

                        hover:border-slate-700/70
                        hover:bg-[#0B192C]
                        hover:text-white

                        hover:shadow-[0_0_16px_rgba(163,230,53,0.04)]
                      `
                  }
                `}
                style={
                  active
                    ? {
                        boxShadow:
                          "0 0 10px rgba(163,230,53,0.10), 0 0 24px rgba(163,230,53,0.05)",
                      }
                    : undefined
                }
              >


                {/* =================================================
                    ACTIVE INDICATOR
                ================================================== */}

                {active && (

                  <span
                    className="
                      absolute
                      left-0
                      h-6
                      w-0.5
                      rounded-full
                      bg-lime-300
                      shadow-[
                        0_0_8px_rgba(163,230,53,0.9),
                        0_0_16px_rgba(163,230,53,0.6)
                      ]
                    "
                    style={{
                      boxShadow:
                        "0 0 8px rgba(163,230,53,0.9), 0 0 16px rgba(163,230,53,0.6)",
                    }}
                  />

                )}


                {/* =================================================
                    ICON
                ================================================== */}

                <Icon
                  size={19}
                  className={`
                    transition-all
                    duration-300

                    ${
                      active
                        ? `
                          text-lime-300
                          drop-shadow-[0_0_7px_rgba(163,230,53,0.65)]
                        `
                        : `
                          text-slate-500
                          group-hover:text-lime-300
                          group-hover:drop-shadow-[0_0_6px_rgba(163,230,53,0.55)]
                        `
                    }
                  `}
                />


                {/* =================================================
                    MENU NAME
                ================================================== */}

                <span
                  className="
                    text-sm
                    font-medium
                  "
                >

                  {item.name}

                </span>


                {/* =================================================
                    ACTIVE DOT
                ================================================== */}

                {active && (

                  <span
                    className="
                      ml-auto
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-lime-300
                      shadow-[
                        0_0_8px_rgba(163,230,53,1),
                        0_0_16px_rgba(163,230,53,0.7)
                      ]
                    "
                    style={{
                      boxShadow:
                        "0 0 8px rgba(163,230,53,1), 0 0 16px rgba(163,230,53,0.7)",
                    }}
                  />

                )}

              </Link>

            );

          })}

        </div>


        {/* =================================================
            ADMINISTRATION
        ================================================== */}

        {isAdmin && (

          <div className="mt-8">


            <p
              className="
                mb-4
                px-3
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-slate-500
              "
            >

              Administration

            </p>


            <Link
              to="/user-management"
              className={`
                group
                relative
                flex
                items-center
                gap-4
                rounded-xl
                border
                px-4
                py-3.5
                transition-all
                duration-300

                ${
                  location.pathname === "/user-management"
                    ? `
                      border-lime-300/30
                      bg-lime-300/[0.09]
                      text-lime-300
                    `
                    : `
                      border-transparent
                      text-slate-300
                      hover:border-slate-700/70
                      hover:bg-[#0B192C]
                      hover:text-white
                    `
                }
              `}
              style={
                location.pathname === "/user-management"
                  ? {
                      boxShadow:
                        "0 0 10px rgba(163,230,53,0.10), 0 0 24px rgba(163,230,53,0.05)",
                    }
                  : undefined
              }
            >


              {/* ACTIVE INDICATOR */}

              {location.pathname === "/user-management" && (

                <span
                  className="
                    absolute
                    left-0
                    h-6
                    w-0.5
                    rounded-full
                    bg-lime-300
                  "
                  style={{
                    boxShadow:
                      "0 0 8px rgba(163,230,53,0.9), 0 0 16px rgba(163,230,53,0.6)",
                  }}
                />

              )}


              <Users
                size={19}
                className={
                  location.pathname === "/user-management"
                    ? `
                      text-lime-300
                      drop-shadow-[0_0_7px_rgba(163,230,53,0.65)]
                    `
                    : `
                      text-slate-500
                      group-hover:text-lime-300
                    `
                }
              />


              <span className="text-sm font-medium">

                User Management

              </span>


              {location.pathname === "/user-management" && (

                <span
                  className="
                    ml-auto
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-lime-300
                  "
                  style={{
                    boxShadow:
                      "0 0 8px rgba(163,230,53,1), 0 0 16px rgba(163,230,53,0.7)",
                  }}
                />

              )}

            </Link>

          </div>

        )}

      </nav>


      {/* =====================================================
          USER SECTION
      ====================================================== */}

      <div
        className="
          relative
          mt-auto
          shrink-0
          border-t
          border-slate-700/50
          bg-[#081526]/70
          p-5
        "
      >


        {/* USER INFORMATION */}

        <div
          className="
            mb-4
            flex
            items-center
            gap-3
            rounded-xl

            border
            border-slate-700/60

            bg-[#0B192C]

            p-3

            transition-all
            duration-300

            hover:border-lime-300/20
            hover:shadow-[0_0_15px_rgba(163,230,53,0.04)]
          "
        >


          {/* USER AVATAR */}

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full

              border
              border-lime-300/35

              bg-lime-300/[0.08]

              font-bold
              text-lime-300

              shadow-[0_0_12px_rgba(163,230,53,0.10)]
            "
          >

            A

          </div>


          {/* USER DETAILS */}

          <div className="min-w-0">

            <p
              className="
                truncate
                text-sm
                font-semibold
                text-white
              "
            >

              PricePilot User

            </p>


            <p
              className="
                mt-0.5
                text-[10px]
                uppercase
                tracking-wider
                text-slate-500
              "
            >

              {isAdmin ? "Admin" : "Analyst"}

            </p>

          </div>

        </div>


        {/* =================================================
            LOGOUT
        ================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2

            rounded-xl

            border
            border-red-400/15

            bg-red-400/[0.025]

            py-3

            text-sm
            font-medium
            text-red-300

            transition-all
            duration-300

            hover:border-red-400/25
            hover:bg-red-400/[0.07]
            hover:shadow-[0_0_18px_rgba(248,113,113,0.08)]
          "
        >

          <LogOut size={17} />

          Sign Out

        </button>

      </div>

    </aside>

  );

}


export default Sidebar;