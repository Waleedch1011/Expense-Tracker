import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dzmugxoxpoikhtmwqsil.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rZ6i0A3aKdcqj8bzSj6bMg_41VEknhQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
