import { supabase, getCurrentUserEmail, getUserProfile } from './supabase'

export interface AutoSaveData {
  id?: string
  user_email: string
  username?: string | null
  organization_name?: string | null
  page: string
  entry_id: string
  form_data: any
  created_at?: string
  updated_at?: string
}

// Save form data to Supabase with debouncing and entry isolation
let saveTimeout: NodeJS.Timeout | null = null

export const autoSaveFormData = async (page: string, formData: any, entryId: string = 'entry_1'): Promise<void> => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  // Debounce the save operation by 1 second
  saveTimeout = setTimeout(async () => {
    try {
      const userEmail = await getCurrentUserEmail()
      if (!userEmail) return

      const userProfile = getUserProfile()

      const autoSaveData: AutoSaveData = {
        user_email: userEmail,
        username: userProfile.username,
        organization_name: userProfile.organization_name,
        page,
        entry_id: entryId,
        form_data: formData
      }

      // Use .contains for tags
      const { data: existing, error: fetchError } = await supabase
        .from('data_rows')
        .select('id')
        .eq('user_email', userEmail)
        .eq('category', 'autosave')
        .eq('name', page)
        .contains('tags', ['autosave', page, entryId])
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing auto-save:', fetchError)
        return
      }

      if (existing) {
        // Update existing row
        const { error: updateError } = await supabase
          .from('data_rows')
          .update({
            description: JSON.stringify(autoSaveData),
            updated_at: new Date().toISOString(),
            username: userProfile.username,
            organization_name: userProfile.organization_name
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating auto-save:', updateError)
        }
      } else {
        // Insert new row
        const { error: insertError } = await supabase
          .from('data_rows')
          .insert({
            name: page,
            description: JSON.stringify(autoSaveData),
            category: 'autosave',
            value: 0,
            status: 'active',
            tags: ['autosave', page, entryId],
            priority: 'low',
            user_email: userEmail,
            username: userProfile.username,
            organization_name: userProfile.organization_name
          })

        if (insertError) {
          console.error('Error creating auto-save:', insertError)
        }
      }
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }, 1000)
}

// Load saved form data from Supabase for specific entry
export const loadAutoSavedData = async (page: string, entryId: string = 'entry_1'): Promise<any | null> => {
  try {
    const userEmail = await getCurrentUserEmail()
    if (!userEmail) return null

    const { data, error } = await supabase
      .from('data_rows')
      .select('description')
      .eq('user_email', userEmail)
      .eq('category', 'autosave')
      .eq('name', page)
      .contains('tags', ['autosave', page, entryId])
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading auto-saved data:', error)
      return null
    }

    if (data?.description) {
      const autoSaveData: AutoSaveData = JSON.parse(data.description)
      return autoSaveData.form_data
    }

    return null
  } catch (error) {
    console.error('Error loading auto-saved data:', error)
    return null
  }
}

// Clear auto-saved data after successful submission for specific entry
export const clearAutoSavedData = async (page: string, entryId: string = 'entry_1'): Promise<void> => {
  try {
    const userEmail = await getCurrentUserEmail()
    if (!userEmail) return

    const { error } = await supabase
      .from('data_rows')
      .delete()
      .eq('user_email', userEmail)
      .eq('category', 'autosave')
      .eq('name', page)
      .contains('tags', ['autosave', page, entryId])

    if (error) {
      console.error('Error clearing auto-saved data:', error)
    }
  } catch (error) {
    console.error('Error clearing auto-saved data:', error)
  }
}

// Get all auto-saved pages for a user and specific entry
export const getAutoSavedPages = async (entryId: string = 'entry_1'): Promise<string[]> => {
  try {
    const userEmail = await getCurrentUserEmail()
    if (!userEmail) return []

    const { data, error } = await supabase
      .from('data_rows')
      .select('name')
      .eq('user_email', userEmail)
      .eq('category', 'autosave')
      .contains('tags', [entryId])

    if (error) {
      console.error('Error getting auto-saved pages:', error)
      return []
    }

    return data?.map(item => item.name) || []
  } catch (error) {
    console.error('Error getting auto-saved pages:', error)
    return []
  }
}

// Get all auto-saved data for all pages for a specific entry
export const getAllAutoSavedData = async (entryId: string = 'entry_1'): Promise<Record<string, any>> => {
  try {
    const userEmail = await getCurrentUserEmail()
    if (!userEmail) return {}

    const { data, error } = await supabase
      .from('data_rows')
      .select('name, description')
      .eq('user_email', userEmail)
      .eq('category', 'autosave')
      .contains('tags', [entryId])

    if (error) {
      console.error('Error getting all auto-saved data:', error)
      return {}
    }

    const result: Record<string, any> = {}
    data?.forEach(item => {
      if (item.description) {
        const autoSaveData: AutoSaveData = JSON.parse(item.description)
        result[item.name] = autoSaveData.form_data
      }
    })

    return result
  } catch (error) {
    console.error('Error getting all auto-saved data:', error)
    return {}
  }
}

// Save form data immediately (for navigation events)
export const saveFormDataImmediately = async (page: string, formData: any, entryId: string = 'entry_1'): Promise<void> => {
  // Clear any pending timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }

  try {
    const userEmail = await getCurrentUserEmail()
    if (!userEmail) return

    const userProfile = getUserProfile()

    const autoSaveData: AutoSaveData = {
      user_email: userEmail,
      username: userProfile.username,
      organization_name: userProfile.organization_name,
      page,
      entry_id: entryId,
      form_data: formData
    }

    // Use .contains for tags
    const { data: existing, error: fetchError } = await supabase
      .from('data_rows')
      .select('id')
      .eq('user_email', userEmail)
      .eq('category', 'autosave')
      .eq('name', page)
      .contains('tags', ['autosave', page, entryId])
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing auto-save:', fetchError)
      return
    }

    if (existing) {
      // Update existing row
      const { error: updateError } = await supabase
        .from('data_rows')
        .update({
          description: JSON.stringify(autoSaveData),
          updated_at: new Date().toISOString(),
          username: userProfile.username,
          organization_name: userProfile.organization_name
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating auto-save:', updateError)
      }
    } else {
      // Insert new row
      const { error: insertError } = await supabase
        .from('data_rows')
        .insert({
          name: page,
          description: JSON.stringify(autoSaveData),
          category: 'autosave',
          value: 0,
          status: 'active',
          tags: ['autosave', page, entryId],
          priority: 'low',
          user_email: userEmail,
          username: userProfile.username,
          organization_name: userProfile.organization_name
        })

      if (insertError) {
        console.error('Error creating auto-save:', insertError)
      }
    }
  } catch (error) {
    console.error('Immediate save error:', error)
  }
}