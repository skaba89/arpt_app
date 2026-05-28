import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createDecisionSchema, paginationSchema } from "@/lib/validations";
import { apiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const GET = apiHandler({
  auth: true,
  querySchema: paginationSchema,
  handler: async (req, { query }) => {
    const { page, limit } = (query as Record<string, unknown>) || {};
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [decisions, total] = await Promise.all([
      db.decision.findMany({
        where,
        include: {
          decidedBy: { select: { id: true, name: true, role: true } },
        },
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { createdAt: "desc" },
      }),
      db.decision.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: decisions,
      pagination: {
        page: page as number,
        limit: limit as number,
        total,
        totalPages: Math.ceil(total / (limit as number)),
      },
    });
  },
});

export const POST = apiHandler({
  auth: true,
  rbac: ["super_admin", "admin", "dg", "juriste"],
  bodySchema: createDecisionSchema,
  handler: async (req, { body, user }) => {
    const year = new Date().getFullYear();
    const count = await db.decision.count();
    const reference = `DEC-${year}-${String(count + 1).padStart(3, "0")}`;

    const decision = await db.decision.create({
      data: {
        reference,
        title: body!.title,
        description: body!.description,
        type: body!.type,
        createdById: user!.id,
      },
    });

    logger.business("CREATE_DECISION", "Decision", decision.id, {
      reference: decision.reference,
      type: decision.type,
    });

    return NextResponse.json(
      { success: true, data: decision },
      { status: 201 }
    );
  },
});
