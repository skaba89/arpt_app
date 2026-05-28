import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSanctionSchema, paginationSchema } from "@/lib/validations";
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
    const operatorId = searchParams.get("operatorId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (operatorId) where.operatorId = operatorId;

    const [sanctions, total] = await Promise.all([
      db.sanction.findMany({
        where,
        include: {
          operator: { select: { id: true, name: true, code: true } },
        },
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { createdAt: "desc" },
      }),
      db.sanction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: sanctions,
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
  bodySchema: createSanctionSchema,
  handler: async (req, { body, user }) => {
    const year = new Date().getFullYear();
    const count = await db.sanction.count();
    const reference = `SAN-${year}-${String(count + 1).padStart(3, "0")}`;

    const sanction = await db.sanction.create({
      data: {
        reference,
        title: body!.title,
        description: body!.description,
        type: body!.type,
        amount: body!.amount ?? null,
        operatorId: body!.operatorId,
        createdById: user!.id,
      },
    });

    logger.business("CREATE_SANCTION", "Sanction", sanction.id, {
      reference: sanction.reference,
      type: sanction.type,
    });

    return NextResponse.json(
      { success: true, data: sanction },
      { status: 201 }
    );
  },
});
