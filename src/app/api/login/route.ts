import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signJwt } from "@/lib/jwt-auth";
import { loginSchema } from "@/lib/validations";
import { UnauthorizedError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { apiHandler } from "@/lib/api-handler";

export const POST = apiHandler({
  bodySchema: loginSchema,
  handler: async (req, { body }) => {
    const { email, password } = body!;

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      throw new UnauthorizedError("Utilisateur introuvable ou inactif");
    }

    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Mot de passe incorrect");
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

    logger.business("LOGIN", "User", user.id, { email: user.email, role: user.role });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          service: user.service,
        },
        token,
      },
    });

    response.cookies.set("arpt-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  },
});
