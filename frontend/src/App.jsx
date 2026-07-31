import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import PricingIntelligence from "./pages/PricingIntelligence";
import Forecast from "./pages/Forecast";
import RoleSelection from "./pages/RoleSelection";
import UserManagement from "./pages/UserManagement";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            Landing / Role Selection
        ========================= */}
        <Route
          path="/"
          element={<RoleSelection />}
        />


        {/* =========================
            Admin Login
        ========================= */}
        <Route
          path="/login/admin"
          element={<Login />}
        />


        {/* =========================
            Analyst Login
        ========================= */}
        <Route
          path="/login/analyst"
          element={<Login />}
        />


        {/* =========================
            Registration
        ========================= */}
        <Route
          path="/register"
          element={<Register />}
        />


        {/* =========================
            Main Dashboard
        ========================= */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* =========================
            User Management
            Admin Feature
        ========================= */}
        <Route
          path="/user-management"
          element={<UserManagement />}
        />


        {/* =========================
            Products
        ========================= */}
        <Route
          path="/products"
          element={<Products />}
        />


        {/* =========================
            Pricing Intelligence
        ========================= */}
        <Route
          path="/pricing-intelligence"
          element={<PricingIntelligence />}
        />


        {/* =========================
            Demand Forecast
        ========================= */}
        <Route
          path="/forecast"
          element={<Forecast />}
        />


        {/* =========================
            Unknown Routes
        ========================= */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;