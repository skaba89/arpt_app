import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [operators, total] = await Promise.all([
      db.operator.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.operator.count({ where }),
    ]);

    return NextResponse.json({
      operators,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching operators:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des operateurs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, type, contactEmail, contactPhone } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Nom et code requis" },
        { status: 400 }
      );
    }

    const operator = await db.operator.create({
      data: {
        name,
        code: code.toUpperCase(),
        type: type || "mobile",
        contactEmail,
        contactPhone,
      },
    });

    return NextResponse.json({ operator }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Un operateur avec ce nom ou code existe deja" },
        { status: 409 }
      );
    }
    console.error("Error creating operator:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'operateur" },
      { status: 500 }
    );
  }
}
