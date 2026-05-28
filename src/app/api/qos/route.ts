import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createQosReportSchema, paginationSchema } from "@/lib/validations";
import { apiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const GET = apiHandler({
  auth: true,
  querySchema: paginationSchema,
  handler: async (req, { query }) => {
    const { page, limit } = (query as Record<string, unknown>) || {};
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId");
    const period = searchParams.get("period");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (operatorId) where.operatorId = operatorId;
    if (period) where.period = period;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      db.qosReport.findMany({
        where,
        include: { operator: { select: { id: true, name: true, code: true } } },
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { createdAt: "desc" },
      }),
      db.qosReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
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
  rbac: ["super_admin", "admin", "agent", "directeur"],
  bodySchema: createQosReportSchema,
  handler: async (req, { body, user }) => {
    const report = await db.qosReport.create({
      data: {
        operatorId: body!.operatorId,
        period: body!.period,
        region: body!.region || null,
        callSuccessRate: body!.callSuccessRate ?? null,
        callSetupTime: body!.callSetupTime ?? null,
        dropRate: body!.dropRate ?? null,
        handoverSuccessRate: body!.handoverSuccessRate ?? null,
        smsSuccessRate: body!.smsSuccessRate ?? null,
        dataThroughput: body!.dataThroughput ?? null,
        latency: body!.latency ?? null,
        overallScore: body!.overallScore ?? null,
        createdById: user!.id,
      },
    });

    logger.business("CREATE_QOS_REPORT", "QosReport", report.id, {
      operatorId: report.operatorId,
      period: report.period,
    });

    return NextResponse.json(
      { success: true, data: report },
      { status: 201 }
    );
  },
});
