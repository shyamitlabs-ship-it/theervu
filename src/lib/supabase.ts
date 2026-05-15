import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rxcqqojbwbuzzdmgbaqz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y3Fxb2pid2J1enpkbWdiYXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAwNTQsImV4cCI6MjA5NDM4NjA1NH0.D49cWlmsSRHDiEqNnOKwaTj0_TFsta5qBdgefkWdigQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})