import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotificationSchema, markNotificationsReadSchema, paginationSchema } from "@/lib/validations";
import { apiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const GET = apiHandler({
  auth: true,
  querySchema: paginationSchema,
  handler: async (req, { query, user }) => {
    const { page, limit } = (query as Record<string, unknown>) || {};
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const read = searchParams.get("read");

    // Filter by current user's ID from JWT
    const where: Record<string, unknown> = {
      userId: user!.id,
    };
    if (type) where.type = type;
    if (category) where.category = category;
    if (read !== null && read !== undefined && read !== "") {
      where.read = read === "true";
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { createdAt: "desc" },
      }),
      db.notification.count({ where }),
    ]);

    // Count unread for convenience
    const unreadCount = await db.notification.count({
      where: { userId: user!.id, read: false },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page: page as number,
        limit: limit as number,
        total,
        totalPages: Math.ceil(total / (limit as number)),
      },
      meta: {
        unreadCount,
      },
    });
  },
});

export const POST = apiHandler({
  auth: true,
  rbac: ["super_admin", "admin"],
  bodySchema: createNotificationSchema,
  handler: async (req, { body, user }) => {
    const notification = await db.notification.create({
      data: {
        title: body!.title,
        message: body!.message,
        type: body!.type || "info",
        category: body!.category || undefined,
        userId: body!.userId,
      },
    });

    logger.business("CREATE_NOTIFICATION", "Notification", notification.id, {
      userId: notification.userId ?? undefined,
      type: notification.type,
      createdBy: user!.id,
    });

    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    );
  },
});

export const PATCH = apiHandler({
  auth: true,
  bodySchema: markNotificationsReadSchema,
  handler: async (req, { body, user }) => {
    // Only allow marking notifications that belong to the current user
    const result = await db.notification.updateMany({
      where: {
        id: { in: body!.notificationIds },
        userId: user!.id,
      },
      data: {
        read: true,
      },
    });

    logger.business("MARK_NOTIFICATIONS_READ", "Notification", undefined, {
      count: result.count,
      userId: user!.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        updated: result.count,
      },
    });
  },
});
