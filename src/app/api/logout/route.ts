import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const POST = apiHandler({
  handler: async () => {
    const response = NextResponse.json({
      success: true,
      data: { message: "Deconnecte avec succes" },
    });

    response.cookies.set("arpt-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    logger.info("USER_LOGOUT");
    return response;
  },
});

export const GET = apiHandler({
  handler: async () => {
    const response = NextResponse.json({
      success: true,
      data: { message: "Deconnecte avec succes" },
    });

    response.cookies.set("arpt-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  },
});
