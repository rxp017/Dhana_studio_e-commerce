import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOW = ['topbar', 'hero_kicker', 'hero_title_a', 'hero_title_b', 'hero_sub',
  'free_ship', 'ship_fee', 'gst_rate', 'store_address', 'store_email', 'store_phone',
  'gstin', 'whatsapp', 'instagram', 'colors']

export async function POST(req) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 })

    const { data: prof } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 })

    // require a FRESH email-verified login (OTP or Google) within 15 minutes
    const { data: au } = await supabaseAdmin.auth.admin.getUserById(user.id)
    const last = au?.user?.last_sign_in_at ? new Date(au.user.last_sign_in_at).getTime() : 0
    if (Date.now() - last > 15 * 60 * 1000)
      return NextResponse.json({ error: 'Email verification needed: click "Send code" in Settings, enter the 6-digit code from your email, then save (or log out and back in, then save within 15 minutes).' }, { status: 403 })

    const body = await req.json()
    const clean = {}
    for (const k of ALLOW) if (body?.data && k in body.data) clean[k] = body.data[k]
    if ('free_ship' in clean) clean.free_ship = Math.max(0, Math.round(+clean.free_ship || 0))
    if ('ship_fee' in clean) clean.ship_fee = Math.max(0, Math.round(+clean.ship_fee || 0))
    if ('gst_rate' in clean) clean.gst_rate = Math.min(28, Math.max(0, +clean.gst_rate || 0))

    const { data: cur } = await supabaseAdmin.from('site_settings').select('data').eq('id', 1).maybeSingle()
    const merged = { ...(cur?.data || {}), ...clean }

    const { error } = await supabaseAdmin.from('site_settings')
      .update({ data: merged, updated_at: new Date().toISOString() }).eq('id', 1)
    if (error) return NextResponse.json({ error: 'Could not save: ' + error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export async function GET() {
  const { data } = await supabaseAdmin.from('site_settings').select('data').eq('id', 1).maybeSingle()
  return NextResponse.json({ data: data?.data || {} })
}