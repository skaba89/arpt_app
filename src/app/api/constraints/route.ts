import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const constraintCreateSchema = z.object({
  title: z.string().min(1),
  category: z.enum(["geographic", "regulatory", "technical", "calendar", "human_security", "confidentiality"]).optional().default("technical"),
  severity: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  description: z.string().min(1),
  mitigation: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  // For status updates via POST (simplified approach)
  id: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const [constraints, total] = await Promise.all([
      db.constraint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.constraint.count({ where }),
    ]);

    return NextResponse.json({
      constraints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching constraints:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des contraintes" },
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
    const validated = constraintCreateSchema.parse(body);

    // If id and status are provided, it's a status update
    if (validated.id && validated.status) {
      const constraint = await db.constraint.update({
        where: { id: validated.id },
        data: {
          status: validated.status,
          resolvedAt: validated.status === "resolved" ? new Date() : null,
        },
      });
      return NextResponse.json({ constraint });
    }

    // Otherwise, create a new constraint
    const constraint = await db.constraint.create({
      data: {
        title: validated.title,
        category: validated.category,
        severity: validated.severity,
        description: validated.description,
        mitigation: validated.mitigation,
        entityType: validated.entityType && validated.entityType !== "none" ? validated.entityType : null,
        entityId: validated.entityId,
      },
    });

    return NextResponse.json({ constraint }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating/updating constraint:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la contrainte" },
      { status: 500 }
    );
  }
}
