import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const operatorId = searchParams.get("operatorId");
    const period = searchParams.get("period");
    const status = searchParams.get("status");

    const where: any = {};
    if (operatorId) where.operatorId = operatorId;
    if (period) where.period = period;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      db.qosReport.findMany({
        where,
        include: { operator: { select: { id: true, name: true, code: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.qosReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching QoS reports:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des rapports QoS" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.operatorId || !body.period) {
      return NextResponse.json(
        { error: "Operateur et periode requis" },
        { status: 400 }
      );
    }

    const report = await db.qosReport.create({
      data: {
        operatorId: body.operatorId,
        period: body.period,
        region: body.region,
        callSuccessRate: body.callSuccessRate,
        callSetupTime: body.callSetupTime,
        dropRate: body.dropRate,
        handoverSuccessRate: body.handoverSuccessRate,
        smsSuccessRate: body.smsSuccessRate,
        dataThroughput: body.dataThroughput,
        latency: body.latency,
        overallScore: body.overallScore,
        status: body.status || "draft",
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error creating QoS report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du rapport QoS" },
      { status: 500 }
    );
  }
}
