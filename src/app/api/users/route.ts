import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createUserSchema, paginationSchema } from "@/lib/validations";
import { apiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { ConflictError } from "@/lib/errors";

export const GET = apiHandler({
  auth: true,
  rbac: ["super_admin", "admin"],
  querySchema: paginationSchema,
  handler: async (req, { query }) => {
    const { page, limit, search } = (query as Record<string, unknown>) || {};
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (active !== null && active !== undefined && active !== "") {
      where.active = active === "true";
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          service: true,
          active: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { createdAt: "desc" },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
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
  rbac: ["super_admin"],
  bodySchema: createUserSchema,
  handler: async (req, { body, user }) => {
    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email: body!.email } });
    if (existing) {
      throw new ConflictError("Un utilisateur avec cet email existe déjà");
    }

    // Hash password with bcryptjs
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(body!.password, 12);

    const newUser = await db.user.create({
      data: {
        name: body!.name,
        email: body!.email,
        password: hashedPassword,
        role: body!.role || "agent",
        service: body!.service || null,
        active: body!.active !== undefined ? body!.active : true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        service: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.business("CREATE_USER", "User", newUser.id, {
      email: newUser.email,
      role: newUser.role,
      createdBy: user!.id,
    });

    return NextResponse.json(
      { success: true, data: newUser },
      { status: 201 }
    );
  },
});
