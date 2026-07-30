import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import API from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine selected role from URL
  const selectedRole =
    location.pathname === "/login/admin"
      ? "admin"
      : "analyst";

  const roleLabel =
    selectedRole === "admin"
      ? "Administrator"
      : "Analyst";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // Handle Input Changes
  // =========================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // Normal Login
  // =========================

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/users/login", {
        email: formData.email,
        password: formData.password,
        role: selectedRole,
      });

      const token = response.data.access_token;
      const role = response.data.role;

      // Store authentication details
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      // Go to dashboard
      navigate("/dashboard");

    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Google Login
  // =========================

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);

      const response = await API.post("/users/google", {
        credential: credentialResponse.credential,
      });

      const token = response.data.access_token;
      const role = response.data.role;

      // Store authentication details
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      // Go to dashboard
      navigate("/dashboard");

    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Google Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Google Login Error
  // =========================

  const handleGoogleError = () => {
    alert("Google Login was unsuccessful. Please try again.");
  };

  return (
    <div className="min-h-screen bg-[#050807] text-white flex items-center justify-center px-6 relative overflow-hidden">

      {/* =========================
          Background Glow
      ========================= */}

      <div className="absolute top-[-180px] left-[-180px] w-[450px] h-[450px] bg-lime-400/10 rounded-full blur-[120px]" />

      <div className="absolute bottom-[-200px] right-[-150px] w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[130px]" />


      {/* =========================
          Main Login Card
      ========================= */}

      <div className="relative w-full max-w-md">

        {/* Green Glow */}

        <div className="absolute inset-0 bg-lime-400/10 blur-3xl rounded-3xl" />


        <div className="relative bg-[#0b110e]/90 backdrop-blur-xl border border-lime-400/20 rounded-3xl p-9 shadow-[0_0_50px_rgba(163,230,53,0.08)]">


          {/* =========================
              Brand
          ========================= */}

          <div className="text-center mb-8">

            <div className="flex justify-center mb-4">

              <div className="w-14 h-14 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.15)]">

                <span className="text-2xl font-bold text-lime-300">
                  P
                </span>

              </div>

            </div>


            <h1 className="text-4xl font-bold tracking-tight">
              PricePilot
              <span className="text-lime-300"> AI</span>
            </h1>


            <p className="text-gray-400 text-sm mt-3">
              Dynamic Pricing & Revenue Intelligence
            </p>

          </div>


          {/* =========================
              Selected Role
          ========================= */}

          <div className="flex justify-center mb-6">

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-lime-400/10 border border-lime-400/20">

              <span className="w-2 h-2 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

              <span className="text-sm text-lime-300 font-medium">
                {roleLabel} Login
              </span>

            </div>

          </div>


          {/* =========================
              Login Heading
          ========================= */}

          <div className="mb-6">

            <h2 className="text-xl font-semibold">
              Welcome back
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Sign in to continue to your{" "}
              {roleLabel.toLowerCase()} workspace
            </p>

          </div>


          {/* =========================
              Login Form
          ========================= */}

          <div className="space-y-5">


            {/* Email */}

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Email address
              </label>

              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-xl bg-[#101813] border border-white/10 text-white placeholder-gray-600 outline-none transition duration-300 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/10"
              />

            </div>


            {/* Password */}

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Password
              </label>

              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-[#101813] border border-white/10 text-white placeholder-gray-600 outline-none transition duration-300 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/10"
              />

            </div>


            {/* =========================
                Login Button
            ========================= */}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-lime-300 hover:bg-lime-200 text-black font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(163,230,53,0.15)] hover:shadow-[0_0_35px_rgba(163,230,53,0.3)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >

              {loading
                ? "Authenticating..."
                : `Sign In as ${roleLabel}`}

            </button>


            {/* =========================
                Google Login
                Analyst ONLY
            ========================= */}

            {selectedRole === "analyst" && (
              <>
                <div className="flex items-center gap-4 py-2">

                  <div className="h-px bg-white/10 flex-1" />

                  <span className="text-xs text-gray-600">
                    OR
                  </span>

                  <div className="h-px bg-white/10 flex-1" />

                </div>


                <div className="flex justify-center">

                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={handleGoogleError}
                    text="continue_with"
                    shape="rectangular"
                    width="350"
                  />

                </div>


                {/* =========================
                    Create New Account
                ========================= */}

                <button
                  onClick={() => navigate("/register")}
                  className="w-full bg-transparent border border-white/10 hover:border-lime-400/40 hover:bg-lime-400/5 text-gray-300 hover:text-lime-300 font-semibold py-3.5 rounded-xl transition-all duration-300"
                >
                  Create New Account
                </button>
              </>
            )}


            {/* =========================
                Change Role
            ========================= */}

            <button
              onClick={() => navigate("/")}
              className="w-full text-gray-500 hover:text-lime-300 text-sm transition duration-300"
            >
              ← Choose a different login role
            </button>

          </div>


          {/* =========================
              Footer
          ========================= */}

          <div className="text-center mt-8">

            <p className="text-xs text-gray-600">
              Powered by Artificial Intelligence & Machine Learning
            </p>

            <div className="flex justify-center items-center gap-2 mt-3">

              <span className="w-1.5 h-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

              <span className="text-xs text-gray-500">
                PricePilot AI Intelligence Platform
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;