import API from "./axios";


// ============================================================
// GET PRODUCTS
// ============================================================

export const getProducts = async () => {
  const response = await API.get(
    "/products/",
    {
      params: {
        skip: 0,
        limit: 100,
        order: "asc",
      },
    }
  );

  return response.data;
};


// ============================================================
// ANALYZE PRODUCT PRICING
// ============================================================

export const analyzeProductPricing = async (productId) => {
  const response = await API.get(
    `/price-prediction/analyze/${productId}`
  );

  return response.data;
};