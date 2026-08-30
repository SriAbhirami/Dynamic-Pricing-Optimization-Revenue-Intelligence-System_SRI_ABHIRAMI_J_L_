import axios from "./axios";

// ============================================================
// COMPETITOR PRICING API
// ============================================================

/**
 * Compare the selected product's price with competitor prices
 * from Amazon and Flipkart.
 *
 * @param {string} productName - Product name from Products table
 * @returns {Promise<Object>} Competitor pricing comparison
 */
export const compareCompetitorPrices = async (productName) => {
  if (!productName || !productName.trim()) {
    throw new Error("Product name is required.");
  }

  try {
    const response = await axios.post(
      "/competitor-pricing/compare",
      {
        product_name: productName.trim(),
      }
    );

    return response.data;

  } catch (error) {

    console.error(
      "Competitor pricing comparison failed:",
      error
    );

    // Backend error message
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    // Network/server error
    if (error.message) {
      throw new Error(error.message);
    }

    throw new Error(
      "Unable to fetch competitor pricing."
    );
  }
};