import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const deliverableCreateSchema = z.object({
  title: z.string().min(1),
  campaignId: z.string().min(1),
  type: z.enum([
    "methodological_note",
    "sampling_plan",
    "raw_data",
    "coverage_map",
    "technical_report",
    "benchmark_report",
    "ppt_presentation",
    "digital_support",
    "results_presentation",
  ]).optional().default("technical_report"),
  confidentiality: z.enum(["confidential", "public", "restricted"]).optional().default("confidential"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const campaignId = searchParams.get("campaignId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const confidentiality = searchParams.get("confidentiality");

    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (confidentiality) where.confidentiality = confidentiality;

    const [deliverables, total] = await Promise.all([
      db.deliverable.findMany({
        where,
        include: {
          campaign: {
            select: {
              id: true,
              reference: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.deliverable.count({ where }),
    ]);

    return NextResponse.json({
      deliverables,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching deliverables:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des livrables" },
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
    const validated = deliverableCreateSchema.parse(body);

    // Verify campaign exists
    const campaign = await db.campaign.findUnique({
      where: { id: validated.campaignId },
    });
    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne introuvable" },
        { status: 404 }
      );
    }

    const deliverable = await db.deliverable.create({
      data: {
        title: validated.title,
        campaignId: validated.campaignId,
        type: validated.type,
        confidentiality: validated.confidentiality,
        description: validated.description,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      },
    });

    return NextResponse.json({ deliverable }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating deliverable:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du livrable" },
      { status: 500 }
    );
  }
}
