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

  // =========================
  // Google Registration Error
  // =========================

  const handleGoogleError = () => {
    alert("Google registration failed");
  };

  return (
    <>
      <style>{`
        /* =========================================================
           PRICEPILOT AI - REGISTER PAGE
           ========================================================= */

        * {
          box-sizing: border-box;
        }

        .register-page {
          min-height: 100vh;
          width: 100%;

          position: relative;

          overflow-x: hidden;
          overflow-y: auto;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px;

          color: white;

          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(132, 204, 22, 0.14),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(16, 185, 129, 0.15),
              transparent 32%
            ),
            radial-gradient(
              circle at 50% 50%,
              rgba(30, 64, 175, 0.16),
              transparent 55%
            ),
            linear-gradient(
              135deg,
              #020617 0%,
              #07142f 42%,
              #081a38 65%,
              #020617 100%
            );
        }


        /* =========================================================
           BACKGROUND GLOW
           ========================================================= */

        .register-glow {
          position: absolute;

          border-radius: 9999px;

          pointer-events: none;

          z-index: 0;
        }

        .register-glow-one {
          width: 620px;
          height: 620px;

          top: -300px;
          left: -230px;

          background: rgba(163, 230, 53, 0.18);

          filter: blur(145px);
        }

        .register-glow-two {
          width: 680px;
          height: 680px;

          bottom: -350px;
          right: -250px;

          background: rgba(52, 211, 153, 0.17);

          filter: blur(155px);
        }

        .register-glow-three {
          position: absolute;

          width: 430px;
          height: 430px;

          top: 45%;
          left: 50%;

          transform: translate(-50%, -50%);

          background: rgba(132, 204, 22, 0.065);

          border-radius: 9999px;

          filter: blur(125px);

          pointer-events: none;

          z-index: 0;
        }


        /* =========================================================
           BACK BUTTON
           ========================================================= */

        .register-back {
          position: fixed;

          top: 20px;
          left: 24px;

          z-index: 30;

          padding: 9px 17px;

          border-radius: 11px;

          background: rgba(15, 23, 42, 0.78);

          border: 1px solid rgba(163, 230, 53, 0.25);

          color: #a1a1aa;

          font-size: 14px;
          font-weight: 600;

          cursor: pointer;

          transition: all 0.3s ease;

          backdrop-filter: blur(12px);

          box-shadow:
            0 0 18px rgba(163, 230, 53, 0.04);
        }

        .register-back:hover {
          color: #bef264;

          border-color: rgba(163, 230, 53, 0.65);

          background: rgba(163, 230, 53, 0.08);

          box-shadow:
            0 0 20px rgba(163, 230, 53, 0.22),
            0 0 40px rgba(163, 230, 53, 0.08);
        }


        /* =========================================================
           MAIN WRAPPER
           ========================================================= */

        .register-wrapper {
          position: relative;

          z-index: 10;

          width: 100%;

          max-width: 580px;

          margin: auto;
        }


        /* =========================================================
           BRAND
           ========================================================= */

        .register-brand {
          text-align: center;

          margin-bottom: 18px;
        }

        .register-brand-icon {
          width: 56px;
          height: 56px;

          margin: 0 auto 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 17px;

          background: rgba(163, 230, 53, 0.10);

          border: 1px solid rgba(163, 230, 53, 0.42);

          color: #bef264;

          font-size: 27px;
          font-weight: 800;

          box-shadow:
            0 0 20px rgba(163, 230, 53, 0.25),
            0 0 50px rgba(163, 230, 53, 0.14),
            inset 0 0 22px rgba(163, 230, 53, 0.06);
        }

        .register-brand h1 {
          margin: 0;

          font-size: 38px;
          line-height: 1.05;

          font-weight: 900;

          letter-spacing: -1.4px;

          color: #ffffff;

          text-shadow:
            0 0 28px rgba(163, 230, 53, 0.12);
        }

        .register-brand p {
          margin: 6px 0 0;

          color: #94a3b8;

          font-size: 14px;

          font-weight: 500;
        }


        /* =========================================================
           REGISTRATION CARD
           ========================================================= */

        .register-card {
          position: relative;

          width: 100%;

          padding: 25px 36px 21px;

          border-radius: 25px;

          background:
            linear-gradient(
              145deg,
              rgba(9, 24, 43, 0.98),
              rgba(4, 17, 35, 0.97)
            );

          border: 1px solid rgba(163, 230, 53, 0.32);

          backdrop-filter: blur(24px);

          box-shadow:
            0 0 35px rgba(163, 230, 53, 0.13),
            0 0 90px rgba(163, 230, 53, 0.09),
            0 30px 80px rgba(0, 0, 0, 0.48),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);

          overflow: hidden;
        }

        .register-card::before {
          content: "";

          position: absolute;

          top: 0;
          left: 7%;
          right: 7%;

          height: 1px;

          background: linear-gradient(
            90deg,
            transparent,
            rgba(190, 242, 100, 0.95),
            transparent
          );

          box-shadow:
            0 0 20px rgba(163, 230, 53, 0.85),
            0 0 45px rgba(163, 230, 53, 0.40);
        }

        .register-card::after {
          content: "";

          position: absolute;

          width: 260px;
          height: 260px;

          top: -170px;
          right: -110px;

          background: rgba(163, 230, 53, 0.10);

          border-radius: 9999px;

          filter: blur(75px);

          pointer-events: none;
        }


        /* =========================================================
           CARD HEADER
           ========================================================= */

        .register-card-header {
          text-align: center;

          margin-bottom: 15px;

          position: relative;

          z-index: 2;
        }

        .register-eyebrow {
          display: inline-block;

          margin-bottom: 6px;

          color: #bef264;

          font-size: 11px;

          font-weight: 800;

          letter-spacing: 1.8px;

          text-shadow:
            0 0 13px rgba(163, 230, 53, 0.38);
        }

        .register-card-header h2 {
          margin: 0;

          color: #ffffff;

          font-size: 25px;

          line-height: 1.2;

          font-weight: 800;

          letter-spacing: -0.5px;
        }

        .register-card-header p {
          margin: 6px auto 0;

          max-width: 440px;

          color: #94a3b8;

          font-size: 13px;

          line-height: 1.45;
        }


        /* =========================================================
           ANALYST BADGE
           ========================================================= */

        .analyst-badge {
          position: relative;

          z-index: 2;

          display: flex;

          align-items: center;

          gap: 11px;

          padding: 9px 13px;

          margin-bottom: 14px;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              rgba(163, 230, 53, 0.11),
              rgba(16, 185, 129, 0.055)
            );

          border: 1px solid rgba(163, 230, 53, 0.27);

          box-shadow:
            0 0 22px rgba(163, 230, 53, 0.08),
            inset 0 0 18px rgba(163, 230, 53, 0.025);
        }

        .analyst-badge-icon {
          width: 34px;
          height: 34px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background: rgba(163, 230, 53, 0.12);

          border: 1px solid rgba(163, 230, 53, 0.28);

          color: #bef264;

          font-size: 16px;

          box-shadow:
            0 0 17px rgba(163, 230, 53, 0.17);
        }

        .analyst-badge span {
          display: block;

          margin-bottom: 1px;

          color: #64748b;

          font-size: 9px;

          font-weight: 800;

          letter-spacing: 1.4px;
        }

        .analyst-badge strong {
          display: block;

          color: #d9f99d;

          font-size: 14px;

          font-weight: 700;
        }


        /* =========================================================
           FORM
           ========================================================= */

        .register-form {
          position: relative;

          z-index: 2;
        }

        .register-field {
          margin-bottom: 11px;
        }

        .register-field label {
          display: block;

          margin-bottom: 5px;

          color: #a1a1aa;

          font-size: 11px;

          font-weight: 700;

          letter-spacing: 0.75px;
        }

        .register-field input {
          width: 100%;

          box-sizing: border-box;

          padding: 11px 14px;

          border-radius: 11px;

          background: rgba(8, 20, 35, 0.97);

          border: 1px solid rgba(255, 255, 255, 0.10);

          color: #ffffff;

          font-size: 14px;

          outline: none;

          transition:
            border-color 0.3s ease,
            box-shadow 0.3s ease,
            background 0.3s ease;
        }

        .register-field input::placeholder {
          color: #475569;
        }

        .register-field input:hover {
          border-color: rgba(163, 230, 53, 0.28);
        }

        .register-field input:focus {
          background: rgba(8, 22, 37, 1);

          border-color: rgba(163, 230, 53, 0.72);

          box-shadow:
            0 0 0 3px rgba(163, 230, 53, 0.075),
            0 0 25px rgba(163, 230, 53, 0.16);
        }


        /* =========================================================
           REGISTER BUTTON
           ========================================================= */

        .register-button {
          width: 100%;

          margin-top: 3px;

          padding: 12px 17px;

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 9px;

          border: none;

          border-radius: 11px;

          background: #bef264;

          color: #07110a;

          font-size: 14px;

          font-weight: 800;

          cursor: pointer;

          transition:
            transform 0.3s ease,
            background 0.3s ease,
            box-shadow 0.3s ease;
        }

        .register-button:hover {
          background: #d9f99d;

          transform: translateY(-2px);

          box-shadow:
            0 0 20px rgba(163, 230, 53, 0.52),
            0 0 45px rgba(163, 230, 53, 0.27),
            0 0 75px rgba(163, 230, 53, 0.12);
        }

        .register-button:active {
          transform: translateY(0);
        }

        .register-arrow {
          font-size: 19px;

          line-height: 1;

          transition: transform 0.3s ease;
        }

        .register-button:hover .register-arrow {
          transform: translateX(4px);
        }


        /* =========================================================
           OR DIVIDER
           ========================================================= */

        .register-divider {
          display: flex;

          align-items: center;

          gap: 12px;

          margin: 12px 0;
        }

        .register-divider-line {
          flex: 1;

          height: 1px;

          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.14)
          );
        }

        .register-divider-line:last-child {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.14),
            transparent
          );
        }

        .register-divider span {
          color: #64748b;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 1px;
        }


        /* =========================================================
           GOOGLE SIGNUP SECTION
           ========================================================= */

        .google-register-section {
          position: relative;

          width: 100%;

          padding: 0;

          border-radius: 14px;

          transition: all 0.3s ease;
        }


        /* =========================================================
           CUSTOM GOOGLE BUTTON
           ========================================================= */

        .google-register-button {
          position: relative;

          width: 100%;

          min-height: 54px;

          display: flex;

          align-items: center;

          justify-content: center;
        }

        .custom-google-register-button {
          position: relative;

          width: 100%;

          height: 54px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 12px;

          border-radius: 11px;

          background: #111827;

          border: 1px solid rgba(255, 255, 255, 0.10);

          color: #ffffff;

          font-size: 14px;

          font-weight: 700;

          cursor: pointer;

          overflow: hidden;

          transition:
            transform 0.3s ease,
            background 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .custom-google-register-button::before {
          content: "";

          position: absolute;

          inset: 0;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.045),
              transparent
            );

          opacity: 0;

          transition: opacity 0.3s ease;
        }

        .custom-google-register-button:hover {
          background: #182235;

          border-color: rgba(255, 255, 255, 0.20);

          transform: translateY(-2px);

          box-shadow:
            0 0 22px rgba(255, 255, 255, 0.08),
            0 0 35px rgba(163, 230, 53, 0.08);
        }

        .custom-google-register-button:hover::before {
          opacity: 1;
        }

        .custom-google-register-button:active {
          transform: translateY(0);
        }

        .custom-google-register-button:disabled {
          opacity: 0.60;

          cursor: not-allowed;
        }

        .google-register-icon {
          position: relative;

          width: 24px;

          height: 24px;

          flex-shrink: 0;

          display: flex;

          align-items: center;

          justify-content: center;
        }

        .google-register-icon svg {
          width: 20px;

          height: 20px;
        }

        .google-register-text {
          position: relative;

          white-space: nowrap;
        }


        /* =========================================================
           LOGIN LINK
           ========================================================= */

        .register-login {
          position: relative;

          z-index: 2;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          margin-top: 14px;

          font-size: 13px;
        }

        .register-login span {
          color: #64748b;
        }

        .register-login button {
          padding: 0;

          border: none;

          background: transparent;

          color: #bef264;

          font-size: 13px;

          font-weight: 700;

          cursor: pointer;

          transition: all 0.3s ease;
        }

        .register-login button:hover {
          color: #d9f99d;

          text-shadow:
            0 0 13px rgba(163, 230, 53, 0.40);
        }


        /* =========================================================
           FOOTER
           ========================================================= */

        .register-footer {
          text-align: center;

          margin-top: 11px;

          color: #475569;

          font-size: 9px;

          font-weight: 700;

          letter-spacing: 1.4px;
        }


        /* =========================================================
           DESKTOP SCREEN FIT
           ========================================================= */

        @media (min-width: 900px) and (min-height: 700px) {

          .register-page {
            padding: 20px 24px;
          }

          .register-wrapper {
            transform: translateY(-2px);
          }
        }


        /* =========================================================
           SMALL HEIGHT LAPTOPS
           ========================================================= */

        @media (min-width: 768px) and (max-height: 700px) {

          .register-page {
            align-items: flex-start;

            padding-top: 18px;
            padding-bottom: 18px;
          }

          .register-brand {
            margin-bottom: 12px;
          }

          .register-brand-icon {
            width: 46px;
            height: 46px;

            margin-bottom: 6px;

            font-size: 23px;
          }

          .register-brand h1 {
            font-size: 32px;
          }

          .register-brand p {
            font-size: 12px;
          }

          .register-card {
            padding: 20px 32px 18px;
          }

          .register-card-header {
            margin-bottom: 11px;
          }

          .analyst-badge {
            margin-bottom: 10px;
          }

          .register-field {
            margin-bottom: 8px;
          }

          .register-divider {
            margin: 9px 0;
          }

          .google-register-button {
            min-height: 50px;
          }

          .custom-google-register-button {
            height: 50px;
          }

          .register-login {
            margin-top: 10px;
          }

          .register-footer {
            margin-top: 8px;
          }
        }


        /* =========================================================
           TABLET
           ========================================================= */

        @media (max-width: 767px) {

          .register-page {
            min-height: 100vh;

            align-items: flex-start;

            padding: 80px 18px 35px;
          }

          .register-back {
            top: 16px;
            left: 16px;

            font-size: 13px;

            padding: 8px 14px;
          }

          .register-wrapper {
            max-width: 100%;
          }

          .register-brand {
            margin-bottom: 18px;
          }

          .register-brand h1 {
            font-size: 34px;
          }

          .register-brand p {
            font-size: 13px;
          }

          .register-brand-icon {
            width: 54px;
            height: 54px;

            font-size: 25px;
          }

          .register-card {
            padding: 25px 24px 22px;

            border-radius: 22px;
          }

          .register-card-header h2 {
            font-size: 23px;
          }

          .register-card-header p {
            font-size: 13px;
          }

          .register-field input {
            font-size: 14px;

            padding: 12px 14px;
          }

          .register-button {
            font-size: 14px;

            padding: 13px 16px;
          }

          .google-register-button {
            min-height: 52px;
          }

          .custom-google-register-button {
            height: 52px;
          }
        }


        /* =========================================================
           MOBILE
           ========================================================= */

        @media (max-width: 480px) {

          .register-page {
            padding: 75px 14px 30px;
          }

          .register-brand h1 {
            font-size: 30px;
          }

          .register-brand p {
            font-size: 12px;
          }

          .register-brand-icon {
            width: 50px;
            height: 50px;

            font-size: 23px;
          }

          .register-card {
            padding: 22px 18px 20px;

            border-radius: 20px;
          }

          .register-card-header h2 {
            font-size: 21px;
          }

          .register-card-header p {
            font-size: 12px;
          }

          .analyst-badge {
            padding: 9px 11px;
          }

          .register-field {
            margin-bottom: 10px;
          }

          .register-field label {
            font-size: 10px;
          }

          .register-field input {
            font-size: 13px;

            padding: 11px 12px;
          }

          .register-button {
            font-size: 13px;
          }

          .custom-google-register-button {
            height: 50px;

            font-size: 13px;

            gap: 10px;
          }

          .register-login {
            flex-direction: column;

            gap: 4px;
          }
        }


        /* =========================================================
           VERY SMALL DEVICES
           ========================================================= */

        @media (max-width: 380px) {

          .register-card {
            padding: 20px 15px 18px;
          }

          .register-brand h1 {
            font-size: 27px;
          }

          .analyst-badge {
            padding: 8px 10px;
          }

          .analyst-badge-icon {
            width: 31px;
            height: 31px;
          }

          .custom-google-register-button {
            font-size: 12px;
          }
        }
      `}</style>


      <div className="register-page">

        {/* =========================
            Background Glow Effects
            ========================= */}

        <div className="register-glow register-glow-one"></div>

        <div className="register-glow register-glow-two"></div>

        <div className="register-glow-three"></div>


        {/* =========================
            Back Button
            ========================= */}

        <button
          className="register-back"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>


        {/* =========================
            Main Wrapper
            ========================= */}

        <div className="register-wrapper">


          {/* =========================
              Brand
              ========================= */}

          <div className="register-brand">

            <div className="register-brand-icon">
              ✦
            </div>

            <h1>
              PricePilot
              <span
                style={{
                  color: "#bef264",
                  textShadow:
                    "0 0 24px rgba(163,230,53,0.30)"
                }}
              >
                {" "}AI
              </span>
            </h1>

            <p>
              Revenue Intelligence & Dynamic Pricing
            </p>

          </div>


          {/* =========================
              Registration Card
              ========================= */}

          <div className="register-card">


            {/* =========================
                Card Header
                ========================= */}

            <div className="register-card-header">

              <span className="register-eyebrow">
                CREATE ACCOUNT
              </span>

              <h2>
                Welcome to PricePilot
              </h2>

              <p>
                Create your account to access
                intelligent pricing insights.
              </p>

            </div>


            {/* =========================
                Analyst Badge
                ========================= */}

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


            {/* =========================
                Registration Form
                ========================= */}

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


              {/* =========================
                  Register Button
                  ========================= */}

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


              {/* =========================
                  OR Divider
                  ========================= */}

              <div className="register-divider">

                <div className="register-divider-line" />

                <span>
                  OR
                </span>

                <div className="register-divider-line" />

              </div>


              {/* =========================
                  Google Registration
                  ========================= */}

              <div className="google-register-section">

                <div className="google-register-button">

                  {/* Visible Custom Google Button */}

                  <button
                    type="button"
                    className="custom-google-register-button"
                    onClick={() => {
                      const googleButton =
                        document.querySelector(
                          '[data-google-register-hidden] button'
                        );

                      if (googleButton) {
                        googleButton.click();
                      }
                    }}
                  >

                    {/* Google Logo */}

                    <span className="google-register-icon">

                      <svg
                        viewBox="0 0 24 24"
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

                    <span className="google-register-text">
                      Continue with Google
                    </span>

                  </button>


                  {/* Hidden Google OAuth Button */}

                  <div
                    data-google-register-hidden
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      opacity: 0,
                      pointerEvents: "none",
                      width: "1px",
                      height: "1px",
                      overflow: "hidden"
                    }}
                  >

                    <GoogleLogin
                      onSuccess={handleGoogleRegister}
                      onError={handleGoogleError}
                      theme="filled_black"
                      size="large"
                      text="signup_with"
                      shape="rectangular"
                      width="1"
                    />

                  </div>

                </div>

              </div>


            </div>


            {/* =========================
                Login Link
                ========================= */}

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


          {/* =========================
              Footer
              ========================= */}

          <div className="register-footer">
            SECURE ACCESS • PRICEPILOT AI
          </div>


        </div>

      </div>
    </>
  );
}

export default Register;