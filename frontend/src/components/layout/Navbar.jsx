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
    <header className="w-full bg-[#050807] border-b border-lime-400/10 px-6 py-5 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* Left Section */}
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.9)]" />

            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
              Command Center
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-white lg:text-3xl">
            {greeting}, Welcome back
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Your pricing intelligence system is monitoring the market.
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="relative hidden xl:block">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
            />

            <input
              type="text"
              placeholder="Search products..."
              className="w-72 rounded-xl border border-white/10 bg-[#0b110e] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-lime-400/40 focus:ring-1 focus:ring-lime-400/20"
            />
          </div>

          {/* Notification */}
          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0b110e] text-gray-400 transition hover:border-lime-400/30 hover:bg-lime-400/5 hover:text-lime-300"
          >
            <Bell size={19} />
          </button>

          {/* Settings */}
          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0b110e] text-gray-400 transition hover:border-lime-400/30 hover:bg-lime-400/5 hover:text-lime-300"
          >
            <Settings size={19} />
          </button>

          {/* User Avatar */}
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-lime-400/30 bg-lime-300/10 font-bold text-lime-300 shadow-[0_0_20px_rgba(163,230,53,0.08)]">
            A
          </div>

        </div>
      </div>
    </header>
  );
}

export default Navbar;