import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    // Decode base64url payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const rawToken = request.cookies.get('fireslab_admin_token')?.value;
  const hasValidToken = rawToken && !isJwtExpired(rawToken);
  const { pathname } = request.nextUrl;

  // Root redirect
  if (pathname === '/') {
    if (hasValidToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protected dashboard routes: redirect to /login if no valid token
  if (pathname.startsWith('/dashboard')) {
    if (!hasValidToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const response = NextResponse.redirect(loginUrl);
      if (rawToken) {
        // Clear expired/tampered cookie
        response.cookies.delete('fireslab_admin_token');
      }
      return response;
    }
  }

  // Already logged in: redirect from /login to /dashboard
  if (pathname === '/login') {
    if (hasValidToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
