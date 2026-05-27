import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Deconnecte avec succes" });

  response.cookies.set("arpt-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function GET() {
  const response = NextResponse.json({ message: "Deconnecte avec succes" });

  response.cookies.set("arpt-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
