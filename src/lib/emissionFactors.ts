// emissionFactors.ts

// --- 1. EXISTING FEED FACTORS ---
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

// --- 2. EXISTING MANURE FACTORS ---
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

// src/lib/emissionFactors.ts

// --- UTILITY FUNCTION TO CONVERT POULTRY TO TONS ---
const convertPoultryToTons = (quantity: number, unit: string): number => {
  switch (unit?.toLowerCase()) {
    case 'tons':
      return quantity;
    case 'quintal':
      return quantity * 0.1; // 1 Quintal = 0.1 Tons
    case 'kg':
      return quantity * 0.001; // 1 Kg = 0.001 Tons
    default:
      return 0;
  }
};

// --- NEW MANURE EMISSION CALCULATION FUNCTION ---

/**
 * Calculates manure emissions based on poultry supply, a factor, and days used.
 * @param poultryQuantity - The amount of processed poultry.
 * @param poultryUnit - The unit for the poultry amount ('Kg', 'Quintal', 'Tons').
 * @param manureFactor - The specific emission factor for the manure system.
 * @param daysUsed - The number of days the system was used.
 * @returns The final emission value in Tons.
 */
export const calculateManureEmissionWithPoultry = (
  poultryQuantity: number,
  poultryUnit: string,
  manureFactor: number,
  daysUsed: number
): number => {
  // 1. Convert the processed poultry supplied to tons, as requested.
  const poultryInTons = convertPoultryToTons(poultryQuantity, poultryUnit);

  // 2. Perform the core calculation to get the result in Kgs.
  const emissionInKgs = poultryInTons * manureFactor * daysUsed;

  // 3. Convert the final result from Kgs to Tons.
  const emissionInTons = emissionInKgs / 1000;

  return emissionInTons;
};

// --- 3. NEW ENERGY FACTORS ---
export const ENERGY_EMISSION_FACTORS: Record<string, number> = {
  'Electricity (grid)': 0.716,
  'Petrol (average biofuel blend)': 2.81,
  'Diesel (average biofuel blend)': 3.12,
  'LPG': 0.35,
  'Biodiesel HVO': 0.25,
  'Biodiesel ME': 0.59,
  'Bioethanol': 0.55,
  'CHP export - (biogas)': 0.00,
  'CHP export - electricity (natural gas)': -0.14,
  'CHP export - heat (natural gas)': -0.07,
  'CHP import - electricity (natural gas)': 0.14,
  'CHP import - heat (natural gas)': 0.07,
  'CHP import (biogas)': 0.00,
  'CHP onsite (biogas)': 0.00,
  'CHP onsite (natural gas)': 0.18,
  'Coal (by energy)': 0.38,
  'Coal (by weight)': 2.80,
  'Diesel (100% mineral diesel)': 3.33,
  'Electricity (hydroelectric)': 0.01,
  'Electricity (photo-voltaic)': 0.07,
  'Electricity (wind)': 0.01,
  'Fuel wood': 0.14,
  'Gas (by energy)': 0.21,
  'Gas (by volume)': 0.000,
  'Gas (by weight)': 2.97,
  'Oil (by energy)': 0.32,
  'Oil (by volume)': 3.39,
  'Petrol (100% mineral petrol)': 2.94,
  'Propane': 1.72,
  'Wood pellets': 0.25
};


// --- EXISTING FEED HELPER FUNCTIONS ---
export const getEmissionFactor = (feedType: string): number => {
  return EMISSION_FACTORS[feedType] || 0;
};

export const calculateFeedEmission = (quantity: number, feedType: string): number => {
  const emissionFactor = getEmissionFactor(feedType);
  return quantity * emissionFactor;
};

// --- EXISTING MANURE HELPER FUNCTIONS ---
export const getManureEmissionFactor = (manureType: string): number => {
  return MANURE_EMISSION_FACTORS[manureType] || 0;
};

export const calculateManureEmission = (quantity: number, manureType: string): number => {
  const emissionFactor = getManureEmissionFactor(manureType);
  return quantity * emissionFactor;
};

// --- NEW ENERGY HELPER FUNCTIONS ---

/**
 * Helper function to get emission factor for an energy type.
 * @param energyType The type of energy.
 * @returns The emission factor, or 0 if not found.
 */
export const getEnergyEmissionFactor = (energyType: string): number => {
  return ENERGY_EMISSION_FACTORS[energyType] || 0;
};

/**
 * Helper function to calculate energy emission.
 * Implements a special formula for 'Electricity (grid)' to account for transmission loss.
 * Uses a standard formula for all other energy types.
 * @param quantity The amount of consumption.
 * @param energyType The type of energy consumed.
 * @returns The calculated emission value.
 */
export const calculateEnergyEmission = (quantity: number, energyType: string): number => {
  const emissionFactor = getEnergyEmissionFactor(energyType);
  const transmissionLossPercentage = 0.176; // 17.6%

  if (energyType === 'Electricity (grid)') {
    // Step 1: Calculate total consumption including transmission loss (ANS1)
    const totalConsumption = quantity / (1 - transmissionLossPercentage);

    // Step 2: Calculate the amount of energy lost during transmission (ANS2)
    const transmissionLoss = totalConsumption - quantity;

    // Step 3: Calculate the final emission value based on the transmission loss
    return transmissionLoss * emissionFactor;
  } else {
    // Standard calculation for all other energy types
    return quantity * emissionFactor;
  }
};

interface WasteWaterFactors {
  biochemical: number;
  chemical: number;
}

// This object holds the new factor data
export const WASTE_WATER_EMISSION_FACTORS: Record<string, WasteWaterFactors> = {
  'None - unspecified aquatic environment': { biochemical: 1.8414, chemical: 0.76725 },
  'None - stagnant sewer': { biochemical: 8.37, chemical: 3.4875 },
  'None - fast flowing sewer': { biochemical: 0, chemical: 0 },
  'Centralized aerobic treatment plant': { biochemical: 0.5022, chemical: 0.20925 },
  'Sludge anaerobic digestion - DEPRECATED': { biochemical: 13.392, chemical: 5.58 },
  'Anaerobic reactor': { biochemical: 13.392, chemical: 5.58 },
  'Anaerobic lagoon - depth < 2m': { biochemical: 3.348, chemical: 1.395 },
  'Anaerobic lagoon - depth > 2m': { biochemical: 13.392, chemical: 5.58 },
  'None - other than reservoirs, lakes, and estuaries': { biochemical: 0.5859, chemical: 0.24413 },
  'None - reservoirs, lakes, and estuaries': { biochemical: 3.1806, chemical: 1.32525 },
  'Constructed Wetlands - Surface Flow': { biochemical: 6.696, chemical: 2.79 },
  'Constructed Wetlands - Horizontal Subsurface Flow': { biochemical: 1.674, chemical: 0.6975 },
  'Constructed Wetlands - Vertical Subsurface Flow': { biochemical: 0.1674, chemical: 0.06975 }
};

// --- NEW WASTE WATER CALCULATION FUNCTION ---

/**
 * Calculates waste water emissions based on multiple factors.
 * @param oxygenDemand - The BOD/COD value in mg/L.
 * @param wasteWaterTreated - The amount of water treated in Liters.
 * @param waterTreatmentType - The type of water treatment system used.
 * @param etpType - The type of ETP, 'Chemical' or 'Biochemical'.
 * @returns The final emission value in Tons.
 */
export const calculateWasteWaterEmission = (
  oxygenDemand: number,
  wasteWaterTreated: number,
  waterTreatmentType: string,
  etpType: 'Chemical' | 'Biochemical' | string
): number => {
  // 1. Find the factor object for the given treatment type
  const factorObject = WASTE_WATER_EMISSION_FACTORS[waterTreatmentType];
  if (!factorObject) {
    return 0; // Return 0 if the treatment type is not found
  }

  // 2. Select the correct factor based on the ETP type
  const factor = etpType === 'Biochemical' ? factorObject.biochemical : factorObject.chemical;

  // 3. Calculate the emission in Kgs
  const emissionInKgs = oxygenDemand * wasteWaterTreated * factor;

  // 4. Convert Kgs to Tons and return the value
  const emissionInTons = emissionInKgs / 1000;

  return emissionInTons;
};

interface TransportFactors {
  ttw: number; // Tank to Wheel
  wtt: number; // Well to Tank
}

// New constant holding the transport emission factors
export const TRANSPORT_EMISSION_FACTORS: Record<string, TransportFactors> = {
  'LGV ( < 3.5 tons ) - Diesel': { ttw: 0.21, wtt: 0.04 },
  'LGV ( < 3.5 tons ) - CNG': { ttw: 0.08, wtt: 0.02 },
  'LGV ( < 3.5 tons ) - Petrol': { ttw: 0.15, wtt: 0.03 },
  'LGV ( < 3.5 tons ) - Electric': { ttw: 0.05, wtt: 0.00 },
  'MGV ( 3.5 - 7.5 tons ) - Diesel': { ttw: 0.23, wtt: 0.05 },
  'MGV ( 3.5 - 7.5 tons ) - CNG': { ttw: 0.10, wtt: 0.03 },
  'HGV ( > 7.5 tons ) - Diesel': { ttw: 0.25, wtt: 0.06 }
};

/**
 * Calculates transport emissions by summing TTW and WTT.
 * @param distance - The distance traveled in km.
 * @param vehicleType - The type of vehicle used.
 * @returns The final total emission value in Tons.
 */
export const calculateTransportEmission = (
  distance: number,
  vehicleType: string
): number => {
  // 1. Find the factor object for the given vehicle type
  const factors = TRANSPORT_EMISSION_FACTORS[vehicleType];
  if (!factors) {
    return 0; // Return 0 if the vehicle type is not found
  }

  // 2. Calculate TTW and WTT emissions in Tons
  const ttwEmission = (factors.ttw * distance) / 1000;
  const wttEmission = (factors.wtt * distance) / 1000;

  // 3. Return the sum of the two values
  return ttwEmission + wttEmission;
};