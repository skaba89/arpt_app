import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const localityCreateSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  prefecture: z.string().optional(),
  type: z.enum(["urbain", "periurbain", "rural", "axe_routier"]).optional().default("urbain"),
  population: z.number().int().optional(),
  hasMobile2G: z.boolean().optional().default(false),
  hasMobile3G: z.boolean().optional().default(false),
  hasMobile4G: z.boolean().optional().default(false),
  hasFixedInternet: z.boolean().optional().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isRoadAxis: z.boolean().optional().default(false),
  roadAxisName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const region = searchParams.get("region");
    const type = searchParams.get("type");
    const tested = searchParams.get("tested");

    const where: Record<string, unknown> = {};
    if (region) where.region = region;
    if (type) where.type = type;
    if (tested !== null && tested !== undefined && tested !== "") where.tested = tested === "true";

    const [localities, total] = await Promise.all([
      db.locality.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      db.locality.count({ where }),
    ]);

    return NextResponse.json({
      localities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching localities:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des localités" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("arpt-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validated = localityCreateSchema.parse(body);

    const locality = await db.locality.create({
      data: {
        name: validated.name,
        region: validated.region,
        prefecture: validated.prefecture,
        type: validated.type,
        population: validated.population,
        hasMobile2G: validated.hasMobile2G,
        hasMobile3G: validated.hasMobile3G,
        hasMobile4G: validated.hasMobile4G,
        hasFixedInternet: validated.hasFixedInternet,
        latitude: validated.latitude,
        longitude: validated.longitude,
        isRoadAxis: validated.isRoadAxis || validated.type === "axe_routier",
        roadAxisName: validated.roadAxisName,
      },
    });

    return NextResponse.json({ locality }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating locality:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la localité" },
      { status: 500 }
    );
  }
}
