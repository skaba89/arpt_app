import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signJwt } from "@/lib/jwt-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Utilisateur introuvable ou inactif" },
        { status: 401 }
      );
    }

    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signJwt({
      id: user.id,
      email: user.email,
      role: user.role,
      service: user.service ?? undefined,
    });

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        service: user.service,
      },
      token,
    });

    response.cookies.set("arpt-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
