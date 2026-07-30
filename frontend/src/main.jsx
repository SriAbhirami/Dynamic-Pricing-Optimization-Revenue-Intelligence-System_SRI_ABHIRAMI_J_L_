import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import "./styles/global.css";

import App from "./App.jsx";

const GOOGLE_CLIENT_ID = "682227288742-cuiqe6i35eg6ql0be76p7php3m1241d6.apps.googleusercontent.com";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);