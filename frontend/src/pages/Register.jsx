import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../api/axios";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // =========================
  // Normal Registration
  // =========================

  const handleRegister = async () => {
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await API.post("/users/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      alert("Account created successfully!");

      navigate("/");
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Registration failed"
      );
    }
  };

  // =========================
  // Google Registration
  // =========================

  const handleGoogleRegister = async (credentialResponse) => {
    try {
      const response = await API.post("/users/google", {
        credential: credentialResponse.credential
      });

      const token = response.data.access_token;
      const role = response.data.role;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      alert("Google account registered successfully!");

      navigate("/dashboard");
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Google registration failed"
      );
    }
  };

  return (
    <div className="register-page">

      {/* Background Effects */}

      <div className="register-glow register-glow-one"></div>

      <div className="register-glow register-glow-two"></div>


      {/* Back Button */}

      <button
        className="register-back"
        onClick={() => navigate("/")}
      >
        ← Back
      </button>


      <div className="register-wrapper">

        {/* Brand */}

        <div className="register-brand">

          <div className="register-brand-icon">
            ✦
          </div>

          <h1>
            PricePilot AI
          </h1>

          <p>
            Revenue Intelligence & Dynamic Pricing
          </p>

        </div>


        {/* Registration Card */}

        <div className="register-card">

          <div className="register-card-header">

            <span className="register-eyebrow">
              CREATE ACCOUNT
            </span>

            <h2>
              Welcome to PricePilot
            </h2>

            <p>
              Create your account to access intelligent
              pricing insights.
            </p>

          </div>


          {/* Analyst Badge */}

          <div className="analyst-badge">

            <div className="analyst-badge-icon">
              ◉
            </div>

            <div>
              <span>
                ACCOUNT TYPE
              </span>

              <strong>
                Analyst
              </strong>
            </div>

          </div>


          {/* Form */}

          <div className="register-form">

            {/* Full Name */}

            <div className="register-field">

              <label>
                FULL NAME
              </label>

              <input
                name="username"
                type="text"
                placeholder="Enter your full name"
                value={formData.username}
                onChange={handleChange}
              />

            </div>


            {/* Email */}

            <div className="register-field">

              <label>
                EMAIL ADDRESS
              </label>

              <input
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />

            </div>


            {/* Password */}

            <div className="register-field">

              <label>
                PASSWORD
              </label>

              <input
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />

            </div>


            {/* Confirm Password */}

            <div className="register-field">

              <label>
                CONFIRM PASSWORD
              </label>

              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />

            </div>


            {/* Register Button */}

            <button
              className="register-button"
              onClick={handleRegister}
            >
              <span>
                Create Analyst Account
              </span>

              <span className="register-arrow">
                →
              </span>
            </button>


            {/* OR Divider */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                margin: "20px 0"
              }}
            >

              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.1)",
                  flex: 1
                }}
              />

              <span
                style={{
                  fontSize: "12px",
                  color: "#6b7280"
                }}
              >
                OR
              </span>

              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.1)",
                  flex: 1
                }}
              />

            </div>


            {/* Google Registration */}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%"
              }}
            >

              <GoogleLogin
                onSuccess={handleGoogleRegister}
                onError={() => {
                  alert("Google registration failed");
                }}
                theme="filled_black"
                size="large"
                text="signup_with"
                shape="rectangular"
                width="100%"
              />

            </div>

          </div>


          {/* Login Link */}

          <div className="register-login">

            <span>
              Already have an account?
            </span>

            <button
              onClick={() => navigate("/")}
            >
              Sign in
            </button>

          </div>

        </div>


        {/* Footer */}

        <div className="register-footer">
          SECURE ACCESS • PRICEPILOT AI
        </div>

      </div>

    </div>
  );
}

export default Register;