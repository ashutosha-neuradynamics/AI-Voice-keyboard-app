import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dictation/:path*',
    '/dictionary/:path*',
    '/settings/:path*',
    '/api/transcribe/:path*',
    '/api/transcriptions/:path*',
    '/api/dictionary/:path*',
  ],
};

