import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Maintenance mode — set NEXT_PUBLIC_MAINTENANCE=true in Vercel to enable
  if (process.env.NEXT_PUBLIC_MAINTENANCE === 'true') {
    const path = request.nextUrl.pathname;
    if (path !== '/in-curand' && !path.startsWith('/api') && !path.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/in-curand', request.url));
    }
    return supabaseResponse;
  }

  const protectedPaths = ['/postare', '/profil', '/mesaje', '/oferte'];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
