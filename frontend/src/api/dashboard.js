import API from "./axios";

// Dashboard summary statistics
export const getDashboardStats = async () => {
  const response = await API.get("/dashboard/stats");
  return response.data;
};

// Pricing & demand summary
export const getPricingDemandSummary = async () => {
  const response = await API.get("/pricing-demand/summary");
  return response.data;
};

// Pricing & demand trends
export const getPricingDemandTrends = async () => {
  const response = await API.get("/pricing-demand/trends");
  return response.data;
};

// Pricing & demand price analysis
export const getPricingDemandPriceAnalysis = async () => {
  const response = await API.get("/pricing-demand/price-analysis");
  return response.data;
};

// Pricing & demand inventory analysis
export const getPricingDemandInventory = async () => {
  const response = await API.get("/pricing-demand/inventory");
  return response.data;
};

// Pricing & demand data
export const getPricingDemandData = async (skip = 0, limit = 20) => {
  const response = await API.get(
    `/pricing-demand/?skip=${skip}&limit=${limit}`
  );

  return response.data;
};

// Dataset-backed products
export const getDatasetProducts = async (
  page = 1,
  limit = 20,
  category = "",
  brand = ""
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (category) {
    params.append("category", category);
  }

  if (brand) {
    params.append("brand", brand);
  }

  const response = await API.get(
    `/pricing-demand/products?${params.toString()}`
  );

  return response.data;
};