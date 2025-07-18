// Emission factors for different feed types
// Values are in appropriate units for emission calculation
export const EMISSION_FACTORS: Record<string, number> = {
  'Soyameal': 1.8,
  'Corn(Maize)': 0.271287,
  'Cotton': 0.38754,
  'Field Bean(Broad Bean, Faba Bean)': 0.04233,
  'Field Pea': 0.03521,
  'Fodder Legumes': 0.019528,
  'Fodderbeet': 0.141725,
  'Groundnut(Peanut)': 0.088651,
  'Lentil': 0.177361,
  'Chickpea': 0.189185,
  'Millet': 0.305291,
  'Oats': 0.208017,
  'Oilseed Rape': 0.427958,
  'Pigeon pea/cowpea/mungbean': 0.228568,
  'Potato': 0.090766,
  'Rice': 0.183096,
  'Rye': 0.273685,
  'Safflower': 0.432638,
  'Sorghum': 0.151138,
  'Soybean': 0.098743,
  'Spring barley': 0.335077,
  'Sugarbeet': 0.010127,
  'Sunflower': 0.287491,
  'Sweet Potato': 0.097895,
  'Temperate Grassland: Grass/Legume Swards': 0.031442,
  'Temperate Grassland: Permanent Grass and Sown Grass or Leys': 0.432288,
  'Tropical Grasses': 0.045454,
  'Wheat': 0.141025,
  'Winter barley': 0.271136,
  'Yams and Cocoyams': 0.038263,
  'Groundnut cake': 0.1,
  'palm kernel cake': 0.1
}

// Helper function to get emission factor for a feed type
export const getEmissionFactor = (feedType: string): number => {
  return EMISSION_FACTORS[feedType] || 0
}

// Helper function to calculate feed emission
export const calculateFeedEmission = (quantity: number, feedType: string): number => {
  const emissionFactor = getEmissionFactor(feedType)
  return quantity * emissionFactor
}