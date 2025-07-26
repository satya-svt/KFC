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
// Get current user's email from Supabase session
export const getCurrentUserEmail = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || null
}

// Get user profile information from local storage
export const getUserProfile = () => {
  // First try to get from userProfile (set after profile completion)
  const userProfileStr = localStorage.getItem('userProfile')
  if (userProfileStr) {
    try {
      const userProfile = JSON.parse(userProfileStr)
      if (userProfile.username) {
        return {
          username: userProfile.username,
          organization_name: userProfile.organization_name || null
        }
      }
    } catch (error) {
      console.error('Error parsing user profile:', error)
    }
  }

  // Fallback to pendingUserProfile (set during registration)
  const pendingProfileStr = localStorage.getItem('pendingUserProfile')
  if (pendingProfileStr) {
    try {
      const pendingProfile = JSON.parse(pendingProfileStr)
      if (pendingProfile.username) {
        // Transfer pending profile to active profile
        localStorage.setItem('userProfile', JSON.stringify({
          username: pendingProfile.username,
          organization_name: pendingProfile.organization_name || null,
          user_email: pendingProfile.email
        }))
        // Remove pending profile
        localStorage.removeItem('pendingUserProfile')

        return {
          username: pendingProfile.username,
          organization_name: pendingProfile.organization_name || null
        }
      }
    } catch (error) {
      console.error('Error parsing pending user profile:', error)
    }
  }

  // Return null values if no valid profile found
  return {
    username: null,
    organization_name: null
  }
}
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
}