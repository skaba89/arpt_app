import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createOperatorSchema, paginationSchema } from "@/lib/validations";
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

    const [operators, total] = await Promise.all([
      db.operator.findMany({
        where,
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { createdAt: "desc" },
      }),
      db.operator.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: operators,
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
  rbac: ["super_admin", "admin", "dg"],
  bodySchema: createOperatorSchema,
  handler: async (req, { body, user }) => {
    const operator = await db.operator.create({
      data: {
        name: body!.name,
        code: body!.code.toUpperCase(),
        type: body!.type || "mobile",
        status: body!.status || "active",
        contactEmail: body!.contactEmail || null,
        contactPhone: body!.contactPhone || null,
        createdById: user!.id,
      },
    });

    logger.business("CREATE_OPERATOR", "Operator", operator.id, { name: operator.name, code: operator.code });

    return NextResponse.json(
      { success: true, data: operator },
      { status: 201 }
    );
  },
});
