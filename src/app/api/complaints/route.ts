import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createComplaintSchema, paginationSchema } from "@/lib/validations";
import { apiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const GET = apiHandler({
  auth: true,
  querySchema: paginationSchema,
  handler: async (req, { query }) => {
    const { page, limit } = (query as Record<string, unknown>) || {};
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const operatorId = searchParams.get("operatorId");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (operatorId) where.operatorId = operatorId;
    if (category) where.category = category;

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        include: {
          operator: { select: { id: true, name: true, code: true } },
        },
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { createdAt: "desc" },
      }),
      db.complaint.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: complaints,
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
  bodySchema: createComplaintSchema,
  handler: async (req, { body, user }) => {
    // Generate reference number
    const year = new Date().getFullYear();
    const count = await db.complaint.count();
    const reference = `PLA-${year}-${String(count + 1).padStart(3, "0")}`;

    const complaint = await db.complaint.create({
      data: {
        reference,
        title: body!.title,
        description: body!.description,
        category: body!.category,
        priority: body!.priority || "medium",
        operatorId: body!.operatorId || null,
        complainantName: body!.complainantName || null,
        complainantPhone: body!.complainantPhone || null,
        complainantEmail: body!.complainantEmail || null,
        createdById: user!.id,
      },
    });

    logger.business("CREATE_COMPLAINT", "Complaint", complaint.id, {
      reference: complaint.reference,
      category: complaint.category,
    });

    return NextResponse.json(
      { success: true, data: complaint },
      { status: 201 }
    );
  },
});
