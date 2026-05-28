import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const measurementCreateSchema = z.object({
  campaignId: z.string().min(1),
  operatorId: z.string().optional(),
  region: z.string().optional(),
  locality: z.string().optional(),
  testType: z.enum(["drive_test", "walk_test", "fixed_test"]),
  technology: z.enum(["2G", "3G", "4G", "fixe"]),
  callAttempted: z.number().int().optional(),
  callSuccess: z.number().int().optional(),
  callDropped: z.number().int().optional(),
  callSetupTime: z.number().optional(),
  smsSent: z.number().int().optional(),
  smsSuccess: z.number().int().optional(),
  smsDelay: z.number().optional(),
  downloadSpeed: z.number().optional(),
  uploadSpeed: z.number().optional(),
  latency: z.number().optional(),
  packetLoss: z.number().optional(),
  webPageLoadTime: z.number().optional(),
  videoStreamingScore: z.number().min(1).max(5).optional(),
  downloadSuccessRate: z.number().optional(),
  signalStrength: z.number().optional(),
  coverageLevel: z.enum(["excellent", "good", "fair", "poor", "no_signal"]).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  measuredAt: z.string(),
  isConform: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const campaignId = searchParams.get("campaignId");
    const operatorId = searchParams.get("operatorId");
    const region = searchParams.get("region");
    const technology = searchParams.get("technology");
    const testType = searchParams.get("testType");

    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;
    if (operatorId) where.operatorId = operatorId;
    if (region) where.region = region;
    if (technology) where.technology = technology;
    if (testType) where.testType = testType;

    const [measurements, total] = await Promise.all([
      db.measurement.findMany({
        where,
        include: {
          operator: { select: { id: true, name: true, code: true } },
          campaign: { select: { id: true, reference: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { measuredAt: "desc" },
      }),
      db.measurement.count({ where }),
    ]);

    return NextResponse.json({
      measurements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching measurements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des mesures" },
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
    const validated = measurementCreateSchema.parse(body);

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

    const measurement = await db.measurement.create({
      data: {
        campaignId: validated.campaignId,
        operatorId: validated.operatorId,
        region: validated.region,
        locality: validated.locality,
        testType: validated.testType,
        technology: validated.technology,
        callAttempted: validated.callAttempted,
        callSuccess: validated.callSuccess,
        callDropped: validated.callDropped,
        callSetupTime: validated.callSetupTime,
        smsSent: validated.smsSent,
        smsSuccess: validated.smsSuccess,
        smsDelay: validated.smsDelay,
        downloadSpeed: validated.downloadSpeed,
        uploadSpeed: validated.uploadSpeed,
        latency: validated.latency,
        packetLoss: validated.packetLoss,
        webPageLoadTime: validated.webPageLoadTime,
        videoStreamingScore: validated.videoStreamingScore,
        downloadSuccessRate: validated.downloadSuccessRate,
        signalStrength: validated.signalStrength,
        coverageLevel: validated.coverageLevel,
        latitude: validated.latitude,
        longitude: validated.longitude,
        measuredAt: new Date(validated.measuredAt),
        isConform: validated.isConform,
        notes: validated.notes,
      },
    });

    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating measurement:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la mesure" },
      { status: 500 }
    );
  }
}
