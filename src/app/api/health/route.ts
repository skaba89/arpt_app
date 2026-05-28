import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const GET = apiHandler({
  handler: async () => {
    const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

    // ── Database check ──────────────────────────────
    try {
      const start = Date.now();
      const { db } = await import("@/lib/db");
      await db.$queryRaw`SELECT 1`;
      checks.database = { status: "connected", latency: Date.now() - start };
    } catch (err) {
      checks.database = {
        status: "disconnected",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }

    // ── Redis check (optional) ──────────────────────
    try {
      const start = Date.now();
      const Redis = (await import("ioredis")).default;
      const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        connectTimeout: 3000,
        lazyConnect: true,
        retryStrategy: () => null,
      });
      await redis.connect();
      await redis.ping();
      await redis.quit();
      checks.redis = { status: "connected", latency: Date.now() - start };
    } catch {
      checks.redis = { status: "unavailable" };
    }

    // ── Determine overall status ────────────────────
    const dbOk = checks.database.status === "connected";
    const redisOk = checks.redis.status !== "disconnected";
    const isHealthy = dbOk;
    const isDegraded = dbOk && !redisOk;

    const status = isHealthy && redisOk ? "ok" : isDegraded ? "degraded" : "unhealthy";
    const httpStatus = isHealthy ? 200 : 503;

    if (!isHealthy) {
      logger.warn("Health check failed", checks);
    }

    return NextResponse.json(
      {
        success: isHealthy,
        data: {
          status,
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || "1.0.0",
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || "development",
          services: checks,
        },
      },
      { status: httpStatus }
    );
  },
});
