import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/libs/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth refresh for public pages that don't need it
  const isPublicRoute =
    pathname.startsWith("/instance/") ||
    pathname.startsWith("/review/") ||
    pathname.startsWith("/masters/") ||
    pathname.startsWith("/admin/") ||
    pathname === "/" ||
    pathname === "/signin";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
