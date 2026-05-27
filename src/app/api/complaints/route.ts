import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const operatorId = searchParams.get("operatorId");
    const category = searchParams.get("category");

    const where: any = {};
    if (status) where.status = status;
    if (operatorId) where.operatorId = operatorId;
    if (category) where.category = category;

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        include: {
          operator: { select: { id: true, name: true, code: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.complaint.count({ where }),
    ]);

    return NextResponse.json({
      complaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des plaintes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "Titre et description requis" },
        { status: 400 }
      );
    }

    // Generate reference number
    const year = new Date().getFullYear();
    const count = await db.complaint.count();
    const reference = `PLA-${year}-${String(count + 1).padStart(3, "0")}`;

    const complaint = await db.complaint.create({
      data: {
        reference,
        title: body.title,
        description: body.description,
        category: body.category || "autre",
        priority: body.priority || "medium",
        operatorId: body.operatorId,
        complainantName: body.complainantName,
        complainantPhone: body.complainantPhone,
        complainantEmail: body.complainantEmail,
      },
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la plainte" },
      { status: 500 }
    );
  }
}
