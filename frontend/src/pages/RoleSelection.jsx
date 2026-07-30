import { useNavigate } from "react-router-dom";

function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050807] text-white relative overflow-hidden flex items-center justify-center px-6">

      {/* =========================
          Background Glow Effects
      ========================= */}

      <div className="absolute top-[-250px] left-[-200px] w-[550px] h-[550px] bg-lime-400/10 rounded-full blur-[140px]" />

      <div className="absolute bottom-[-250px] right-[-200px] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[150px]" />

      <div className="absolute top-[35%] left-[45%] w-[300px] h-[300px] bg-lime-300/5 rounded-full blur-[120px]" />


      {/* =========================
          Main Content
      ========================= */}

      <div className="relative z-10 w-full max-w-3xl text-center">


        {/* Logo */}

        <div className="flex justify-center mb-7">

          <div className="w-20 h-20 rounded-3xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shadow-[0_0_45px_rgba(163,230,53,0.15)]">

            <span className="text-4xl font-black text-lime-300">
              P
            </span>

          </div>

        </div>


        {/* Brand */}

        <h1 className="text-5xl md:text-6xl font-black tracking-tight">

          PricePilot
          <span className="text-lime-300"> AI</span>

        </h1>


        <p className="text-gray-400 mt-4 text-base md:text-lg">

          Dynamic Pricing & Revenue Intelligence System

        </p>


        {/* Small Status */}

        <div className="flex justify-center mt-6">

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-lime-400/5 border border-lime-400/20">

            <span className="w-2 h-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.9)]" />

            <span className="text-xs text-lime-300 tracking-wide">
              INTELLIGENT PRICING PLATFORM
            </span>

          </div>

        </div>


        {/* =========================
            Role Selection
        ========================= */}

        <div className="mt-14">

          <h2 className="text-xl md:text-2xl font-semibold">
            Choose your workspace
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Select how you want to access PricePilot AI
          </p>


          {/* Buttons */}

          <div className="grid md:grid-cols-2 gap-5 mt-8 max-w-xl mx-auto">


            {/* =========================
                Admin
            ========================= */}

            <button
              onClick={() => navigate("/login/admin")}
              className="group relative overflow-hidden bg-[#0b110e] border border-lime-400/20 hover:border-lime-300/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(163,230,53,0.12)]"
            >

              {/* Hover Glow */}

              <div className="absolute inset-0 bg-lime-400/0 group-hover:bg-lime-400/5 transition duration-300" />


              <div className="relative flex items-center justify-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">

                  <span className="text-xl">
                    👑
                  </span>

                </div>

                <span className="text-lg font-semibold group-hover:text-lime-300 transition">

                  Login as Admin

                </span>

              </div>

            </button>


            {/* =========================
                Analyst
            ========================= */}

            <button
              onClick={() => navigate("/login/analyst")}
              className="group relative overflow-hidden bg-[#0b110e] border border-lime-400/20 hover:border-lime-300/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(163,230,53,0.12)]"
            >

              {/* Hover Glow */}

              <div className="absolute inset-0 bg-lime-400/0 group-hover:bg-lime-400/5 transition duration-300" />


              <div className="relative flex items-center justify-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">

                  <span className="text-xl">
                    📊
                  </span>

                </div>

                <span className="text-lg font-semibold group-hover:text-lime-300 transition">

                  Login as Analyst

                </span>

              </div>

            </button>

          </div>

        </div>


        {/* Footer */}

        <div className="mt-16">

          <div className="flex items-center justify-center gap-2">

            <span className="w-1.5 h-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

            <span className="text-xs text-gray-600">
              AI-POWERED REVENUE INTELLIGENCE
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default RoleSelection;