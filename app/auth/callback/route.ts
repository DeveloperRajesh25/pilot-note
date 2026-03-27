import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
       const forwardedHost = request.headers.get('x-forwarded-host') // For cloud providers
       const isLocalEnv = process.env.NODE_ENV === 'development'
       if (isLocalEnv) {
         // we can be sure that there is no proxy involved in localhost
         return NextResponse.redirect(`${origin}${next}`)
       } else if (forwardedHost) {
         return NextResponse.redirect(`https://${forwardedHost}${next}`)
       } else {
         return NextResponse.redirect(`${origin}${next}`)
       }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
