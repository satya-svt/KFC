import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const getCurrentUserEmail = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || null
}

// --- CHANGE START: The entire function below has been replaced ---
// It no longer uses localStorage and now fetches the profile directly from the database.
/**
 * Gets the profile information of the current logged-in user directly from the database.
 * @returns The user's profile object or null if not found.
 */
export const getUserProfile = async (): Promise<{ username: string | null, organization_name: string | null } | null> => {
  // 1. Get the current user session securely from Supabase
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // If no user is logged in, there is no profile to fetch
    return null;
  }

  try {
    // 2. Use the user's ID to fetch their specific profile from the 'profiles' table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, organization_name')
      .eq('id', user.id)
      .single();

    if (error) {
      // This can happen if the profile hasn't been created yet, which is okay.
      if (error.code !== 'PGRST116') { // PGRST116 = "exact one row not found"
        console.error("Error fetching user profile:", error);
      }
      return null;
    }

    // 3. Return the correct profile data from the database
    return profile;

  } catch (error) {
    console.error("An error occurred while fetching the profile:", error);
    return null;
  }
}
// --- CHANGE END ---

export interface ResponseData {
  id: string; // uuid
  name: string; // text
  description?: string; // text null
  category: string; // text
  value?: number; // numeric null
  date?: string; // date null (can be parsed to Date object if needed)
  tags?: string[]; // text[] null
  user_email?: string; // text null
  created_at?: string; // timestamp with time zone null (can be parsed to Date object)
  updated_at?: string; // timestamp with time zone null (can be parsed to Date object)
  phone_number?: string; // text null
  feed_emission?: number; // numeric null
  organization_name?: string; // text null
  entry_id?: number; // bigint null
  user_id?: string; // uuid null
  status?: string; // text null
  priority?: string; // text null
  username?: string; // text null
  energy_emission?: number; // double precision null
  processed_poultry_quantity?: number; // real null
  processed_poultry_unit?: string; // text null
  kfc_share?: number; // real null
  bird_count?: number; // bigint null
  waste_water_treated?: number; // numeric null
  oxygen_demand?: number; // numeric null
  etp_type?: string; // text null
  water_treatment_type?: string; // text null
  waste_emission?: number; // numeric null
  manure_emission?: number; // numeric null
  transport_emission?: number | string | null;
}