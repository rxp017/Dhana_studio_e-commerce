import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const n = searchParams.get('next')
  const next = n && n.startsWith('/') && !n.startsWith('//') ? n : '/'
  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}${next}`)
}