import API from "./axios";


// ============================================================
// OPTIMIZE PRODUCT PRICE
// ============================================================
//
// Backend endpoint:
// GET /price-prediction/optimize/{product_id}
//
// Optimization goal:
// Maximum predicted revenue
//
// ============================================================

export const optimizeProductPrice = async (productId) => {
  const response = await API.get(
    `/price-prediction/optimize/${productId}`
  );

  return response.data;
};


// ============================================================
// ANALYZE PRODUCT PRICING
// ============================================================
//
// Backend endpoint:
// GET /price-prediction/analyze/{product_id}
//
// Returns:
// - Current price
// - Predicted/recommended price
// - Price difference
// - Price change percentage
// - Demand level
// - Sales velocity
// - Inventory status
// - Historical discount
// - Pricing reasons
//
// ============================================================

export const analyzeProductPricing = async (productId) => {
  const response = await API.get(
    `/price-prediction/analyze/${productId}`
  );

  return response.data;
};