import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret-change-me"
);

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  service?: string;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function requireAuth(roles?: string[]) {
  return async (request: NextRequest) => {
    const token = request.cookies.get("arpt-session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    if (roles && !roles.includes(payload.role)) {
      return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
    }

    // Attach user info to headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.id);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);
    if (payload.service) {
      requestHeaders.set("x-user-service", payload.service);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  };
}
