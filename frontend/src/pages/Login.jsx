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
    <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden">

      {/* =========================
          Background Glow
      ========================= */}

      <div className="absolute top-[-220px] left-[-200px] w-[520px] h-[520px] bg-lime-400/12 rounded-full blur-[140px]" />

      <div className="absolute bottom-[-220px] right-[-180px] w-[560px] h-[560px] bg-emerald-400/12 rounded-full blur-[150px]" />

      <div className="absolute top-[35%] right-[8%] w-[300px] h-[300px] bg-lime-300/6 rounded-full blur-[130px]" />

      <div className="absolute bottom-[15%] left-[8%] w-[280px] h-[280px] bg-emerald-300/5 rounded-full blur-[120px]" />


      {/* =========================
          Main Login Card
      ========================= */}

      <div className="relative w-full max-w-xl min-w-0">

        {/* Strong Green Glow */}

        <div className="absolute -inset-3 bg-lime-300/10 blur-3xl rounded-[2rem]" />

        <div className="absolute -inset-1 bg-lime-300/5 blur-xl rounded-[2rem]" />


        {/* =========================
            Login Card
        ========================= */}

        <div className="relative bg-[#111C2E]/95 backdrop-blur-xl border border-lime-300/30 rounded-3xl px-5 py-8 sm:px-8 md:px-14 sm:py-10 shadow-[0_0_15px_rgba(163,230,53,0.18),0_0_40px_rgba(163,230,53,0.12),0_0_80px_rgba(163,230,53,0.06)]">


          {/* Top Neon Line */}

          <div className="absolute top-0 left-6 right-6 sm:left-12 sm:right-12 h-px bg-gradient-to-r from-transparent via-lime-300 to-transparent shadow-[0_0_12px_rgba(163,230,53,0.8)]" />


          {/* =========================
              Brand
          ========================= */}

          <div className="text-center mb-8">

            <div className="flex justify-center mb-4">

              <div className="w-14 h-14 rounded-2xl bg-lime-300/10 border border-lime-300/40 flex items-center justify-center shadow-[0_0_18px_rgba(163,230,53,0.25),0_0_35px_rgba(163,230,53,0.12)]">

                <span className="text-2xl font-bold text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]">
                  P
                </span>

              </div>

            </div>


            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">

              PricePilot
              <span className="text-lime-300 drop-shadow-[0_0_10px_rgba(163,230,53,0.45)]">
                {" "}AI
              </span>

            </h1>


            <p className="text-gray-400 text-sm mt-3">
              Dynamic Pricing & Revenue Intelligence
            </p>

          </div>


          {/* =========================
              Selected Role
          ========================= */}

          <div className="flex justify-center mb-6">

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-lime-300/10 border border-lime-300/25 shadow-[0_0_15px_rgba(163,230,53,0.10)]">

              <span className="w-2 h-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.9),0_0_18px_rgba(163,230,53,0.45)]" />

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
                className="w-full px-4 py-3.5 rounded-xl bg-[#0B1220] border border-white/10 text-white placeholder-gray-600 outline-none transition duration-300 focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10 focus:shadow-[0_0_15px_rgba(163,230,53,0.08)]"
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
                className="w-full px-4 py-3.5 rounded-xl bg-[#0B1220] border border-white/10 text-white placeholder-gray-600 outline-none transition duration-300 focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10 focus:shadow-[0_0_15px_rgba(163,230,53,0.08)]"
              />

            </div>


            {/* =========================
                Login Button
            ========================= */}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-lime-300 hover:bg-lime-200 text-black font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(163,230,53,0.25),0_0_40px_rgba(163,230,53,0.10)] hover:shadow-[0_0_25px_rgba(163,230,53,0.50),0_0_50px_rgba(163,230,53,0.22)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
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

                {/* OR Divider */}

                <div className="flex items-center gap-4 py-2">

                  <div className="h-px bg-white/10 flex-1" />

                  <span className="text-xs text-gray-600">
                    OR
                  </span>

                  <div className="h-px bg-white/10 flex-1" />

                </div>


                {/* =========================
                    Custom Google Button
                ========================= */}

                <div className="relative w-full">

                  {/* Visible Custom Button */}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      const googleButton =
                        document.querySelector(
                          '[data-google-login-hidden] button'
                        );

                      if (googleButton) {
                        googleButton.click();
                      }
                    }}
                    className="
                      group
                      relative
                      w-full
                      h-[54px]
                      flex
                      items-center
                      justify-center
                      gap-3
                      rounded-xl
                      bg-[#111827]
                      border
                      border-white/10
                      text-white
                      font-semibold
                      transition-all
                      duration-300
                      hover:bg-[#182235]
                      hover:border-white/20
                      hover:shadow-[0_0_22px_rgba(255,255,255,0.08),0_0_35px_rgba(163,230,53,0.08)]
                      hover:-translate-y-0.5
                      active:translate-y-0
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                      overflow-hidden
                    "
                  >

                    {/* Subtle hover glow */}

                    <span
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-r
                        from-transparent
                        via-white/[0.035]
                        to-transparent
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        duration-300
                      "
                    />

                    {/* Google Logo */}

                    <span className="relative flex items-center justify-center w-6 h-6 shrink-0">

                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M21.35 12.27c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.21z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.55 0-4.71-1.72-5.49-4.03H3.26v2.52A9.74 9.74 0 0 0 12 21.5z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M6.51 13.6A5.86 5.86 0 0 1 6.2 12c0-.56.1-1.1.31-1.6V7.88H3.26A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.01 4.12l3.25-2.52z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 6.37c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.48 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.74 5.38L6.51 10.4C7.29 8.09 9.45 6.37 12 6.37z"
                        />
                      </svg>

                    </span>


                    {/* Button Text */}

                    <span className="relative">
                      Continue with Google
                    </span>

                  </button>


                  {/* =========================
                      Hidden Google OAuth Button
                  ========================= */}

                  <div
                    data-google-login-hidden
                    className="
                      absolute
                      left-1/2
                      top-1/2
                      -translate-x-1/2
                      -translate-y-1/2
                      opacity-0
                      pointer-events-none
                      w-[1px]
                      h-[1px]
                      overflow-hidden
                    "
                  >

                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={handleGoogleError}
                      theme="filled_black"
                      size="large"
                      text="continue_with"
                      shape="rectangular"
                      width="1"
                    />

                  </div>

                </div>


                {/* =========================
                    Create New Account
                ========================= */}

                <button
                  onClick={() => navigate("/register")}
                  className="w-full bg-transparent border border-white/10 hover:border-lime-300/50 hover:bg-lime-300/5 hover:shadow-[0_0_20px_rgba(163,230,53,0.10)] text-gray-300 hover:text-lime-300 font-semibold py-3.5 rounded-xl transition-all duration-300"
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
              className="w-full text-gray-500 hover:text-lime-300 text-sm transition duration-300 hover:drop-shadow-[0_0_8px_rgba(163,230,53,0.35)]"
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

              <span className="w-1.5 h-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8),0_0_16px_rgba(163,230,53,0.4)]" />

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