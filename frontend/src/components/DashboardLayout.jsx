import Sidebar from "./layout/Sidebar";

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#010302] text-white">

      {/* =====================================================
          SIDEBAR
          Sidebar is fixed and has width: w-72
      ====================================================== */}

      <Sidebar />


      {/* =====================================================
          MAIN APPLICATION AREA
          Leave exactly 72 (18rem) space for the sidebar
      ====================================================== */}

      <div className="ml-72 min-h-screen w-[calc(100%-18rem)]">

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