import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PricingIntelligence from "./pages/PricingIntelligence";


function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/pricing-intelligence"
          element={<PricingIntelligence />}
        />

      </Routes>

    </BrowserRouter>

  );

}


export default App;