import {
  Bell,
  Search,
  Settings,
} from "lucide-react";

function Navbar() {
  const currentHour = new Date().getHours();

  let greeting = "Good Evening";

  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 18) {
    greeting = "Good Afternoon";
  }

  return (
    <header
      className="
        sticky
        top-0
        z-50
        bg-gradient-to-r
        from-blue-100
        via-cyan-50
        to-white
        backdrop-blur-md
        border-b
        border-blue-200
        shadow-md
        px-8
        py-5
      "
    >
      <div className="flex justify-between items-center">

        {/* Left Section */}
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900">
            Dashboard
          </h1>

          <p className="text-blue-700 font-medium mt-1">
            {greeting}, Welcome back 👋
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">

          {/* Search Box */}
          <div className="relative hidden lg:block">

            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search products..."
              className="
                pl-10
                pr-4
                py-2.5
                w-80
                rounded-xl
                bg-white/80
                backdrop-blur-md
                border
                border-blue-200
                shadow-sm
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                transition-all
              "
            />

          </div>

          {/* Notification */}
          <button
            className="
              p-3
              rounded-xl
              bg-white/70
              hover:bg-blue-100
              shadow-sm
              transition-all
              duration-300
              hover:scale-105
            "
          >
            <Bell size={22} className="text-blue-700" />
          </button>

          {/* Settings */}
          <button
            className="
              p-3
              rounded-xl
              bg-white/70
              hover:bg-blue-100
              shadow-sm
              transition-all
              duration-300
              hover:scale-105
            "
          >
            <Settings size={22} className="text-blue-700" />
          </button>

          {/* User Avatar */}
          <div
            className="
              w-12
              h-12
              rounded-full
              bg-gradient-to-r
              from-blue-600
              to-cyan-500
              flex
              items-center
              justify-center
              text-white
              font-bold
              text-lg
              shadow-lg
              ring-2
              ring-white
              cursor-pointer
              hover:scale-105
              transition-all
              duration-300
            "
          >
            A
          </div>

        </div>

      </div>
    </header>
  );
}

export default Navbar;