// --- EXISTING FEED FACTORS ---
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
};

// --- NEW MANURE FACTORS ---
export const MANURE_EMISSION_FACTORS: Record<string, number> = {
  'Aerobic treatment - forced aeration': 0.00116,
  'Aerobic treatment - natural aeration': 0.00232,
  'Anaerobic Digester, High leakage, low quality technology, high quality gas-tight storage technology': 0.00659,
  'Anaerobic Digester, High leakage, low quality technology, low quality gas-tight storage technology': 0.00744,
  'Anaerobic Digester, High leakage, low quality technology, open storage': 0.00887,
  'Anaerobic Digester, Low leakage, High quality gas-tight storage, best complete industrial technology': 0.00081,
  'Anaerobic Digester, Low leakage, High quality industrial technology, low quality gas-tight storage technology': 0.00109,
  'Anaerobic Digester, Low leakage, High quality industrial technology, open storage': 0.00309,
  'Composting - In vessel (forced aeration)': 0.00173,
  'Composting - Intensive windrow': 0.00183,
  'Composting - Passive windrow (infrequent turning)': 0.00250,
  'Composting - Static pile (Forced aeration)': 0.00366,
  'Daily spread': 0.00034,
  'Deep bedding - active mixing (< 1 month)': 0.02117,
  'Deep bedding - active mixing (> 1 month)': 0.04381,
  'Deep bedding - no mixing (< 1 month)': 0.00727,
  'Deep bedding - no mixing (> 1 month)': 0.02991,
  'Dry lot': 0.00564,
  'Exporting manure off-farm - zero on farm emissions.': 0.00000,
  'Liquid slurry with cover': 0.02202,
  'Liquid slurry with natural crust cover': 0.01798,
  'Liquid slurry without natural crust cover': 0.02759,
  'Pasture': 0.00032,
  'Pit storage below animal confinements (1 month)': 0.01056,
  'Pit storage below animal confinements (12 months)': 0.04353,
  'Pit storage below animal confinements (3 months)': 0.01931,
  'Pit storage below animal confinements (4 months)': 0.02200,
  'Pit storage below animal confinements (6 months)': 0.02805,
  'Poultry manure with litter': 0.00217,
  'Poultry manure without litter': 0.00252,
  'Solid storage': 0.00529,
  'Solid storage - Additives': 0.00250,
  'Solid storage - Bulking addition': 0.00183,
  'Solid storage - Covered/compacted': 0.00501,
  'Uncovered anaerobic lagoon': 0.05207,
};

// --- EXISTING FEED HELPER FUNCTIONS ---
export const getEmissionFactor = (feedType: string): number => {
  return EMISSION_FACTORS[feedType] || 0;
};

export const calculateFeedEmission = (quantity: number, feedType: string): number => {
  const emissionFactor = getEmissionFactor(feedType);
  return quantity * emissionFactor;
};