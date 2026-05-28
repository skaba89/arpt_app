import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler({
  handler: async () => {
    const regions = await db.region.findMany({
      orderBy: { name: "asc" },
      include: {
        operators: {
          include: {
            operator: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: regions,
      meta: { timestamp: new Date().toISOString() },
    });
  },
});
