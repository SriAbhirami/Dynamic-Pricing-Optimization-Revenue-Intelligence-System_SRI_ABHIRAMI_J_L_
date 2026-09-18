import { useState } from "react";
import { Menu } from "lucide-react";

import Sidebar from "./layout/Sidebar";


function DashboardLayout({ children }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);


  return (

    <div className="min-h-screen bg-[#010302] text-white">


      {/* =====================================================
          SIDEBAR
          Desktop:
            Fixed 72 width sidebar

          Mobile:
            Slide-out drawer
      ====================================================== */}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />


      {/* =====================================================
          MAIN APPLICATION AREA
      ====================================================== */}

      <div
        className="
          min-h-screen
          w-full

          lg:ml-72
          lg:w-[calc(100%-18rem)]
        "
      >


        {/* ===================================================
            MOBILE TOP BAR
        ==================================================== */}

        <div
          className="
            sticky
            top-0
            z-30
            flex
            h-16
            items-center
            border-b
            border-lime-300/10
            bg-[#07111f]/95
            px-4
            backdrop-blur-xl

            lg:hidden
          "
        >

          {/* HAMBURGER */}

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl

              border
              border-lime-300/20

              bg-lime-300/[0.05]

              text-lime-300

              shadow-[0_0_12px_rgba(163,230,53,0.05)]

              transition-all
              duration-300

              hover:border-lime-300/40
              hover:bg-lime-300/[0.09]
              hover:shadow-[0_0_18px_rgba(163,230,53,0.10)]
            "
            aria-label="Open navigation"
          >

            <Menu size={21} />

          </button>


          {/* MOBILE BRAND */}

          <div className="ml-3">

            <p
              className="
                text-sm
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

            </p>

            <p
              className="
                text-[8px]
                uppercase
                tracking-[0.18em]
                text-slate-500
              "
            >

              Intelligence System

            </p>

          </div>

        </div>


        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}

        <main className="min-h-screen w-full">

          {children}

        </main>

      </div>

    </div>

  );

}


export default DashboardLayout;