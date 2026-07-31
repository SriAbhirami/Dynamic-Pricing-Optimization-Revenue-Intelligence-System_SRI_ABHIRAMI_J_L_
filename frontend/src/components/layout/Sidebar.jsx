import {
  DollarSign,
  TrendingUp,
  Brain,
  Settings,
  LogOut,
  Activity,
  Sparkles,
  Package,
  BarChart3,
  Users,
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
      name: "Analytics",
      icon: BarChart3,
      path: "/products",
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
      name: "AI Intelligence",
      icon: Brain,
      path: "/insights",
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
        border-lime-400/10
        bg-[#050807]
        text-white

        scrollbar-thin
        scrollbar-track-transparent
        scrollbar-thumb-lime-300/20
        hover:scrollbar-thumb-lime-300/40
      "
    >

      {/* =====================================================
          LOGO
      ====================================================== */}

      <div className="shrink-0 border-b border-white/10 px-7 py-7">

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-lime-300/30
              bg-lime-300/10
              shadow-[0_0_25px_rgba(163,230,53,0.12)]
            "
          >
            <Sparkles className="h-5 w-5 text-lime-300" />
          </div>

          <div>

            <h1 className="text-xl font-bold tracking-tight">
              PricePilot
              <span className="text-lime-300"> AI</span>
            </h1>

            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
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
          mx-5
          mt-6
          shrink-0
          rounded-2xl
          border
          border-lime-400/10
          bg-lime-400/[0.03]
          p-4
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              relative
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-lime-300/10
            "
          >

            <Activity className="h-4 w-4 text-lime-300" />

            <span
              className="
                absolute
                right-1
                top-1
                h-1.5
                w-1.5
                rounded-full
                bg-lime-300
                shadow-[0_0_8px_rgba(163,230,53,0.9)]
              "
            />

          </div>

          <div>

            <p className="text-[10px] uppercase tracking-widest text-white/70">
              System
            </p>

            <p className="mt-0.5 text-sm font-semibold text-lime-300">
              Intelligence Online
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav className="shrink-0 px-4 py-7">

        <p
          className="
            mb-4
            px-3
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.2em]
            text-white/70
          "
        >
          Navigation
        </p>

        <div className="space-y-2">

          {menuItems.map((item) => {

            const Icon = item.icon;

            const active = location.pathname === item.path;

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
                  px-4
                  py-3.5
                  transition-all
                  duration-300

                  ${
                    active
                      ? `
                        border
                        border-lime-400/20
                        bg-lime-400/10
                        text-lime-300
                        shadow-[0_0_18px_rgba(163,230,53,0.04)]
                      `
                      : `
                        border
                        border-transparent
                        text-white/80
                        hover:border-white/10
                        hover:bg-white/[0.03]
                        hover:text-white
                      `
                  }
                `}
              >

                {/* Active Indicator */}

                {active && (
                  <span
                    className="
                      absolute
                      left-0
                      h-6
                      w-0.5
                      rounded-full
                      bg-lime-300
                      shadow-[0_0_10px_rgba(163,230,53,0.8)]
                    "
                  />
                )}

                <Icon
                  size={19}
                  className={
                    active
                      ? "text-lime-300"
                      : "text-white/70 group-hover:text-lime-300"
                  }
                />

                <span className="text-sm font-medium">
                  {item.name}
                </span>

                {active && (
                  <span
                    className="
                      ml-auto
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-lime-300
                      shadow-[0_0_10px_rgba(163,230,53,0.8)]
                    "
                  />
                )}

              </Link>
            );

          })}

        </div>


        {/* =================================================
            ADMIN SECTION
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
                text-white/70
              "
            >
              Administration
            </p>

            <Link
              to="/user-management"
              className={`
                group
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
                      border-lime-400/20
                      bg-lime-400/10
                      text-lime-300
                      shadow-[0_0_18px_rgba(163,230,53,0.04)]
                    `
                    : `
                      border-transparent
                      text-white/80
                      hover:border-white/10
                      hover:bg-white/[0.03]
                      hover:text-white
                    `
                }
              `}
            >

              <Users
                size={19}
                className={
                  location.pathname === "/user-management"
                    ? "text-lime-300"
                    : "text-white/70 group-hover:text-lime-300"
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
                    shadow-[0_0_10px_rgba(163,230,53,0.8)]
                  "
                />
              )}

            </Link>

          </div>
        )}


        {/* =================================================
            WORKSPACE
        ================================================== */}

        <div className="mt-8">

          <p
            className="
              mb-4
              px-3
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-white/70
            "
          >
            Workspace
          </p>

          <Link
            to="/settings"
            className={`
              group
              flex
              items-center
              gap-4
              rounded-xl
              border
              border-transparent
              px-4
              py-3.5
              transition-all
              duration-300

              ${
                location.pathname === "/settings"
                  ? `
                    border-lime-400/20
                    bg-lime-400/10
                    text-lime-300
                  `
                  : `
                    text-white/80
                    hover:border-white/10
                    hover:bg-white/[0.03]
                    hover:text-white
                  `
              }
            `}
          >

            <Settings
              size={19}
              className={
                location.pathname === "/settings"
                  ? "text-lime-300"
                  : "text-white/70 group-hover:text-lime-300"
              }
            />

            <span className="text-sm font-medium">
              System Settings
            </span>

          </Link>

        </div>

      </nav>


      {/* =====================================================
          USER SECTION
          THIS IS NOW AT THE ACTUAL END OF SIDEBAR
      ====================================================== */}

      <div className="shrink-0 border-t border-white/10 p-5">

        {/* User Information */}

        <div
          className="
            mb-4
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-white/10
            bg-white/[0.02]
            p-3
          "
        >

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
              border-lime-300/30
              bg-lime-300/10
              font-bold
              text-lime-300
            "
          >
            {role === "admin" ? "A" : "A"}
          </div>

          <div className="min-w-0">

            <p className="truncate text-sm font-semibold text-white">
              PricePilot User
            </p>

            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/70">
              {isAdmin ? "Admin" : "Analyst"}
            </p>

          </div>

        </div>


        {/* =================================================
            LOGOUT
            APPEARS ONLY AT THE END AFTER SCROLLING
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
            border-red-400/10
            bg-red-400/[0.03]
            py-3
            text-sm
            font-medium
            text-red-300
            transition-all
            duration-300
            hover:border-red-400/20
            hover:bg-red-400/10
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