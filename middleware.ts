import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Skip middleware for API routes (they handle their own auth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // For now, let the client-side handle authentication
  // We'll add server-side validation later
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
