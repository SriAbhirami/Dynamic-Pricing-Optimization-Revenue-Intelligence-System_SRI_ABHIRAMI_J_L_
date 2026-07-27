import {
  LayoutDashboard,
  Package,
  DollarSign,
  TrendingUp,
  Brain,
  Settings,
  LogOut
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Products",
      icon: Package,
      path: "/products",
    },
    {
      name: "Pricing",
      icon: DollarSign,
      path: "/pricing",
    },
    {
      name: "Forecast",
      icon: TrendingUp,
      path: "/forecast",
    },
    {
      name: "AI Insights",
      icon: Brain,
      path: "/insights",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <aside className="w-72 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col">

      <div className="p-8 border-b border-slate-700">

        <h1 className="text-3xl font-bold">
          PricePilot AI
        </h1>

        <p className="text-blue-300 mt-2 text-sm">
          Revenue Intelligence Platform
        </p>

      </div>

      <nav className="flex-1 p-5 space-y-3">

        {menuItems.map((item) => {

          const Icon = item.icon;

          const active = location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                active
                  ? "bg-blue-600 shadow-lg"
                  : "hover:bg-slate-800"
              }`}
            >
              <Icon size={22} />

              <span>{item.name}</span>

            </Link>
          );
        })}

      </nav>

      <div className="p-5 border-t border-slate-700">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
            A
          </div>

          <div>

            <h3 className="font-semibold">
              Welcome
            </h3>

            <p className="text-sm text-slate-400">
              PricePilot User
            </p>

          </div>

        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 rounded-xl py-3 flex justify-center items-center gap-2 transition"
        >
          <LogOut size={20} />

          Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;