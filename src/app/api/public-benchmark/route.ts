import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const category = searchParams.get("category");
    const isPublic = searchParams.get("isPublic");

    const where: Record<string, unknown> = {};
    if (period && period !== "all") where.period = period;
    if (category) where.category = category;
    // Only return public results by default
    if (isPublic === "true") where.isPublic = true;

    const results = await db.benchmarkResult.findMany({
      where,
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        fai: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { category: "asc" },
        { rank: "asc" },
      ],
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching public benchmark:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données de benchmark" },
      { status: 500 }
    );
  }
}
