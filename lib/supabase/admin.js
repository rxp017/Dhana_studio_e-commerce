import { createClient } from '@supabase/supabase-js'

// Server-only. Bypasses row-level security — never import in a browser component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)