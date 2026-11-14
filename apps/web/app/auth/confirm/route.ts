import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '../../../lib/supabase/server'

function sanitizeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard'
  }
  return raw
}

async function ensureProfileRow(userId: string) {
  try {
    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    })
  } catch (error) {
    console.warn('[Auth Confirm] Profile provision warning:', error)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = sanitizeNextPath(searchParams.get('next'))

  const supabase = await createClient()

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      await ensureProfileRow(data.user.id)
      return NextResponse.redirect(new URL(next, request.nextUrl.origin))
    }
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error && data.user) {
      await ensureProfileRow(data.user.id)
      return NextResponse.redirect(new URL(next, request.nextUrl.origin))
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=invalid_or_expired_token', request.nextUrl.origin)
  )
}
