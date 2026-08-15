/*Previously Dashboards page now updated as Product management page*/

import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import RecentProducts from "../components/tables/RecentProducts";

import {
  Package,
} from "lucide-react";


function Dashboard() {
  const [refreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar />


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="ml-72 min-h-screen">

        <Navbar />


        <main className="px-6 py-7 lg:px-8">


          {/* =====================================================
              PAGE TITLE
          ====================================================== */}

          <div className="mb-7 flex items-center">

            <div className="flex items-center gap-4">

              {/* Neon Icon */}

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-lime-300/60
                  bg-lime-300/10
                  shadow-[0_0_12px_rgba(163,230,53,0.45),0_0_28px_rgba(163,230,53,0.18)]
                "
              >

                <Package
                  className="
                    h-6
                    w-6
                    text-lime-300
                    drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]
                  "
                />

              </div>


              <div>

                <p
                  className="
                    mb-1
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-lime-300
                  "
                >
                  PricePilot AI
                </p>


                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    text-white
                  "
                >
                  Product Management
                </h1>


                <p
                  className="
                    mt-1
                    text-sm
                    font-medium
                    text-white/70
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
              overflow-hidden
              rounded-2xl
              border
              border-lime-300/45
              bg-[#111C2E]
              shadow-[0_0_10px_rgba(163,230,53,0.28),0_0_28px_rgba(163,230,53,0.14),0_0_60px_rgba(163,230,53,0.06)]
              transition-all
              duration-300
              hover:border-lime-300/60
              hover:shadow-[0_0_14px_rgba(163,230,53,0.38),0_0_36px_rgba(163,230,53,0.18),0_0_70px_rgba(163,230,53,0.08)]
            "
          >


            {/* =====================================================
                TABLE HEADER
            ====================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-lime-300/20
                bg-[#0F192A]
                px-6
                py-5
                shadow-[0_4px_20px_rgba(163,230,53,0.06)]
              "
            >

              <div>

                <h2 className="text-lg font-bold text-white">
                  Products
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    font-medium
                    text-white/60
                  "
                >
                  Product catalogue
                </p>

              </div>


              {/* Live Status */}

              <div className="flex items-center gap-2">

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
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-lime-200
                  "
                >
                  Live
                </span>

              </div>

            </div>


            {/* =====================================================
                PRODUCTS
            ====================================================== */}

            <div className="w-full">

              <RecentProducts key={refreshKey} />

            </div>


          </section>


          {/* =====================================================
              STATUS
          ====================================================== */}

          <div
            className="
              mt-5
              flex
              items-center
              gap-2
              text-xs
              font-semibold
              text-white/60
            "
          >

            <span
              className="
                h-1.5
                w-1.5
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

    </div>
  );
}


export default Dashboard;