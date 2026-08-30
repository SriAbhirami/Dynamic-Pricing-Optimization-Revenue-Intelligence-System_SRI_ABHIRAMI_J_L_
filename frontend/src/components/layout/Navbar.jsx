function Navbar() {
  const currentHour = new Date().getHours();

  let greeting = "Good Evening";

  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 18) {
    greeting = "Good Afternoon";
  }

  return (
    <header className="w-full border-b border-lime-400/10 bg-[#050807] px-6 py-5 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* =====================================================
            LEFT SECTION
        ====================================================== */}

        <div>

          <div className="flex items-center gap-2">

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
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-lime-300
              "
            >
              Command Center
            </span>

          </div>


          <h1
            className="
              mt-2
              text-2xl
              font-bold
              text-white
              lg:text-3xl
            "
          >
            {greeting}, Welcome back
          </h1>


          <p className="mt-1 text-sm text-gray-500">
            Your pricing intelligence system is monitoring the market.
          </p>

        </div>


        {/* =====================================================
            RIGHT SECTION
        ====================================================== */}

        <div className="flex items-center">

          {/* User Avatar */}

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-lime-400/30
              bg-lime-300/10
              font-bold
              text-lime-300
              shadow-[0_0_20px_rgba(163,230,53,0.08)]
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