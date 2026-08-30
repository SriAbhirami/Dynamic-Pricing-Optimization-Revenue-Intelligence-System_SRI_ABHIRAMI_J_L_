
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfitabilityAnalytics from "./pages/ProfitabilityAnalytics";
import PricingIntelligence from "./pages/PricingIntelligence";
import Forecast from "./pages/Forecast";
import RoleSelection from "./pages/RoleSelection";
import UserManagement from "./pages/UserManagement";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import BusinessIntelligenceReport from "./pages/BusinessIntelligenceReport.jsx";

import DashboardLayout from "./components/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            LANDING / ROLE SELECTION
        ===================================================== */}

        <Route
          path="/"
          element={<RoleSelection />}
        />

        {/* =====================================================
            LOGIN
        ===================================================== */}

        <Route
          path="/login/admin"
          element={<Login />}
        />

        <Route
          path="/login/analyst"
          element={<Login />}
        />

        {/* =====================================================
            REGISTRATION
        ===================================================== */}

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =====================================================
            MAIN APPLICATION
            SIDEBAR REMAINS VISIBLE
        ===================================================== */}

        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/products"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/pricing-intelligence"
          element={
            <DashboardLayout>
              <PricingIntelligence />
            </DashboardLayout>
          }
        />

        <Route
          path="/forecast"
          element={
            <DashboardLayout>
              <Forecast />
            </DashboardLayout>
          }
        />

        <Route
          path="/competitor-analysis"
          element={
            <DashboardLayout>
              <CompetitorAnalysis />
            </DashboardLayout>
          }
        />

        <Route
          path="/profitability-analytics"
          element={
            <DashboardLayout>
              <ProfitabilityAnalytics />
            </DashboardLayout>
          }
        />

        <Route
          path="/business-intelligence-report"
          element={
            <DashboardLayout>
              <BusinessIntelligenceReport />
            </DashboardLayout>
          }
        />

        {/* =====================================================
            ADMIN
        ===================================================== */}

        <Route
          path="/user-management"
          element={
            <DashboardLayout>
              <UserManagement />
            </DashboardLayout>
          }
        />

        {/* =====================================================
            UNKNOWN ROUTES
        ===================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

