import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const campaignCreateSchema = z.object({
  reference: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["drive_test", "walk_test", "fixed_test", "combined"]),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional().default("planned"),
  phase: z.enum(["planning", "preparation", "field_work", "analysis", "reporting", "closed"]).optional().default("planning"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  regions: z.string().optional(),
  localities: z.string().optional(),
  technologies: z.string().optional(),
  services: z.string().optional(),
  teamSize: z.number().int().optional(),
  equipment: z.string().optional(),
  cabinetName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          teamLead: { select: { id: true, name: true, email: true } },
          _count: { select: { measurements: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des campagnes" },
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
    const validated = campaignCreateSchema.parse(body);

    const existing = await db.campaign.findUnique({
      where: { reference: validated.reference },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Une campagne avec cette référence existe déjà" },
        { status: 409 }
      );
    }

    const campaign = await db.campaign.create({
      data: {
        reference: validated.reference,
        name: validated.name,
        description: validated.description,
        type: validated.type,
        status: validated.status,
        phase: validated.phase,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        regions: validated.regions,
        localities: validated.localities,
        technologies: validated.technologies,
        services: validated.services,
        teamSize: validated.teamSize,
        equipment: validated.equipment,
        cabinetName: validated.cabinetName,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la campagne" },
      { status: 500 }
    );
  }
}
