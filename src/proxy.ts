import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/onboarding']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Auth routes (login, signup) - redirect to dashboard if already logged in
  // Note: forgot-password and reset-password are NOT redirected even if logged in
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.includes(pathname)

  if (isProtectedRoute && !user) {
    // Not logged in, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    // Already logged in, check if they have a venue
    const { data: operatorUser } = await supabase
      .from('operator_users')
      .select('venue_id')
      .eq('auth_user_id', user.id)
      .single()

    const url = request.nextUrl.clone()
    if (operatorUser?.venue_id) {
      url.pathname = '/dashboard'
    } else {
      url.pathname = '/onboarding/venue'
    }
    return NextResponse.redirect(url)
  }

  // For dashboard routes, verify user has a venue
  if (pathname.startsWith('/dashboard') && user) {
    const { data: operatorUser } = await supabase
      .from('operator_users')
      .select('venue_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!operatorUser?.venue_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/venue'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
  ],
}
