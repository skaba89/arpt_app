import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler({
  handler: async () => {
    return {
      message: "ARPT Guinee API",
      version: "1.0.0",
      documentation: "/api/health",
    };
  },
});
