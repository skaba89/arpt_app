import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditSchema, paginationSchema } from "@/lib/validations";
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

    const [audits, total] = await Promise.all([
      db.audit.findMany({
        where,
        include: {
          operator: { select: { id: true, name: true, code: true } },
        },
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { createdAt: "desc" },
      }),
      db.audit.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: audits,
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
  rbac: ["super_admin", "admin", "dg", "agent"],
  bodySchema: createAuditSchema,
  handler: async (req, { body, user }) => {
    const year = new Date().getFullYear();
    const count = await db.audit.count();
    const reference = `AUD-${year}-${String(count + 1).padStart(3, "0")}`;

    const audit = await db.audit.create({
      data: {
        reference,
        title: body!.title,
        description: body!.description,
        type: body!.type,
        operatorId: body!.operatorId || null,
        startDate: body!.startDate ? new Date(body!.startDate) : null,
        endDate: body!.endDate ? new Date(body!.endDate) : null,
        leadAuditorId: body!.leadAuditorId || null,
        createdById: user!.id,
      },
    });

    logger.business("CREATE_AUDIT", "Audit", audit.id, {
      reference: audit.reference,
      type: audit.type,
    });

    return NextResponse.json(
      { success: true, data: audit },
      { status: 201 }
    );
  },
});
