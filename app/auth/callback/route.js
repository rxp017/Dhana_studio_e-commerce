import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const n = searchParams.get('next')
  const next = n && n.startsWith('/') && !n.startsWith('//') ? n : '/'

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Build the public origin from the proxy headers Render sends.
  // request.url can resolve to the internal host (localhost:10000) behind
  // Render's proxy, which would send users to a dead localhost page.
  const fwdHost = request.headers.get('x-forwarded-host')
  const fwdProto = (request.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim()
  const host = fwdHost || request.headers.get('host') || ''
  const isLocal = /^(localhost|127\.|0\.0\.0\.0)(:|$)/.test(host)
  const base = !isLocal && host
    ? `${fwdProto}://${host}`
    : (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin)

  return NextResponse.redirect(`${base}${next}`)
}