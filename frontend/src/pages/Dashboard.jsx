/* Previously Dashboards page now updated as Product Management page */

import { useState } from "react";

import RecentProducts from "../components/tables/RecentProducts";

import {
  Package,
} from "lucide-react";


function Dashboard() {
  const [refreshKey] = useState(0);

  return (
    <div className="min-h-screen w-full bg-[#0B1220] text-white">

      {/* =====================================================
          MAIN CONTENT
          Sidebar and Navbar are handled by DashboardLayout
      ====================================================== */}

      <main className="w-full px-3 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7 lg:px-8">

        {/* =====================================================
            PAGE TITLE
        ====================================================== */}

        <div className="mb-5 flex items-center sm:mb-7">

          <div className="flex min-w-0 items-center gap-3 sm:gap-4">

            {/* Neon Icon */}

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-lime-300/60
                bg-lime-300/10
                shadow-[0_0_12px_rgba(163,230,53,0.45),0_0_28px_rgba(163,230,53,0.18)]
                sm:h-12
                sm:w-12
              "
            >

              <Package
                className="
                  h-5
                  w-5
                  text-lime-300
                  drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]
                  sm:h-6
                  sm:w-6
                "
              />

            </div>


            <div className="min-w-0">

              <h1
                className="
                  truncate
                  text-2xl
                  font-bold
                  tracking-tight
                  text-white
                  sm:text-3xl
                "
              >
                Product Management
              </h1>


              <p
                className="
                  mt-1
                  text-xs
                  font-medium
                  text-white/70
                  sm:text-sm
                "
              >
                Manage products, prices and inventory
              </p>

            </div>

          </div>

        </div>


        {/* =====================================================
            PRODUCT TABLE CONTAINER
        ====================================================== */}

        <section
          className="
            w-full
            overflow-hidden
            rounded-xl
            border
            border-lime-300/45
            bg-[#111C2E]
            shadow-[0_0_10px_rgba(163,230,53,0.28),0_0_28px_rgba(163,230,53,0.14),0_0_60px_rgba(163,230,53,0.06)]
            transition-all
            duration-300
            hover:border-lime-300/60
            hover:shadow-[0_0_14px_rgba(163,230,53,0.38),0_0_36px_rgba(163,230,53,0.18),0_0_70px_rgba(163,230,53,0.08)]
            sm:rounded-2xl
          "
        >

          {/* ===================================================
              TABLE HEADER
          ==================================================== */}

          <div
            className="
              flex
              flex-col
              gap-3
              border-b
              border-lime-300/20
              bg-[#0F192A]
              px-4
              py-4
              shadow-[0_4px_20px_rgba(163,230,53,0.06)]
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-6
              sm:py-5
            "
          >

            <div className="min-w-0">

              <h2 className="text-base font-bold text-white sm:text-lg">
                Products
              </h2>


              <p
                className="
                  mt-1
                  text-xs
                  font-medium
                  text-white/60
                  sm:text-sm
                "
              >
                Product catalogue
              </p>

            </div>


            {/* Live Status */}

            <div className="flex shrink-0 items-center gap-2">

              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-lime-300
                  shadow-[0_0_7px_rgba(163,230,53,1),0_0_16px_rgba(163,230,53,0.75)]
                "
              />

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-lime-200
                  sm:text-xs
                "
              >
                Live
              </span>

            </div>

          </div>


          {/* ===================================================
              PRODUCTS
          ==================================================== */}

          <div className="w-full overflow-x-auto">

            <RecentProducts key={refreshKey} />

          </div>


        </section>


        {/* =====================================================
            STATUS
        ====================================================== */}

        <div
          className="
            mt-4
            flex
            items-center
            gap-2
            text-[11px]
            font-semibold
            text-white/60
            sm:mt-5
            sm:text-xs
          "
        >

          <span
            className="
              h-1.5
              w-1.5
              shrink-0
              rounded-full
              bg-lime-300
              shadow-[0_0_6px_rgba(163,230,53,1),0_0_12px_rgba(163,230,53,0.7)]
            "
          />

          <span>
            Product data connected
          </span>

        </div>


      </main>

    </div>
  );
}


export default Dashboard;