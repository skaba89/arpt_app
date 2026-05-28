import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Routes publiques (sans authentification) ──────────────────
const publicRoutes = [
  "/",
  "/login",
  "/api/auth",
  "/api/health",
  "/api/login",
  "/api/route",
];

// ── CORS allowed origins ──────────────────────────────────────
const allowedOrigins = [
  process.env.NEXTAUTH_URL || "http://localhost:3000",
];

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const response = NextResponse.next();

  // ── CORS (API routes) ───────────────────────────────
  if (pathname.startsWith("/api/")) {
    const requestOrigin = request.headers.get("origin");

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      response.headers.set("Access-Control-Allow-Origin", requestOrigin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
      response.headers.set("Access-Control-Max-Age", "86400");
    }

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // ── CSRF Protection ─────────────────────────────────
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    // Les routes d'auth sont exemptées (login/logout n'ont pas encore de token)
    const authRoutes = ["/api/login", "/api/logout", "/api/auth"];
    if (!authRoutes.some((r) => pathname.startsWith(r))) {
      const csrfToken = request.headers.get("x-csrf-token");
      const cookieToken = request.cookies.get("arpt-csrf")?.value;

      // En dev, on tolère l'absence de CSRF (pour les tests API directs)
      if (process.env.NODE_ENV === "production" && (!csrfToken || csrfToken !== cookieToken)) {
        return NextResponse.json(
          { success: false, error: { code: "CSRF_ERROR", message: "Token CSRF invalide" } },
          { status: 403 }
        );
      }
    }
  }

  // ── Security Headers (toutes les réponses) ──────────
  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js dev needs unsafe-eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.arpt.gn",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", cspHeader);

  // HTTP Strict Transport Security (production only)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  // Anti-clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // XSS Protection (legacy but useful for older browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // ── Authentification ────────────────────────────────
  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Set CSRF cookie on public pages if not present
    if (!request.cookies.get("arpt-csrf")?.value) {
      const csrfValue = generateCsrfToken();
      response.cookies.set("arpt-csrf", csrfValue, {
        httpOnly: false, // Must be readable by JS
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
    return response;
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // Check for session cookie
  const sessionToken =
    request.cookies.get("arpt-session")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Non authentifie" } },
        { status: 401 }
      );
    }
    // Page routes redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

/** Génère un token CSRF simple */
function generateCsrfToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(32);
  // Simple random generation (crypto not available in Edge middleware)
  for (let i = 0; i < 32; i++) {
    array[i] = chars.charCodeAt(Math.floor(Math.random() * chars.length));
  }
  return String.fromCharCode(...array);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
