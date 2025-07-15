import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AdminAuth } from '@/lib/admin-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip login page
  if (pathname === '/admin/login') {
    const isAuthenticated = await AdminAuth.isAuthenticatedFromRequest(request);
    
    if (isAuthenticated) {
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/admin';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const isAuthenticated = await AdminAuth.isAuthenticatedFromRequest(request);
    
    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin API routes - except auth stuff
  if (pathname.startsWith('/api/admin') && !pathname.includes('/auth')) {
    const isAuthenticated = await AdminAuth.isAuthenticatedFromRequest(request);
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};