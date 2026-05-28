/**
 * ARPT Guinée - Handler API standardisé
 *
 * Wrapper pour toutes les routes API qui gère automatiquement :
 * - Authentification et RBAC
 * - Validation Zod
 * - Gestion d'erreurs centralisée
 * - Logging structuré
 * - Réponses au format uniforme
 *
 * Usage:
 *   export const GET = apiHandler({
 *     auth: true,
 *     rbac: ['admin', 'super_admin'],
 *     handler: async (req, context) => {
 *       const data = await db.operator.findMany();
 *       return { success: true, data };
 *     },
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";
import { AppError, toAppError, formatErrorResponse, UnauthorizedError, ForbiddenError } from "./errors";
import { logger } from "./logger";
import { verifyJwt } from "./jwt-auth";

interface ApiHandlerOptions<T = unknown> {
  /** Exige une authentification (défaut: false) */
  auth?: boolean;
  /** Rôles autorisés (si auth = true) */
  rbac?: string[];
  /** Schéma de validation Zod pour le body */
  bodySchema?: ZodSchema<T>;
  /** Schéma de validation Zod pour les query params */
  querySchema?: ZodSchema;
  /** La fonction handler */
  handler: (
    req: NextRequest,
    context: {
      params: Record<string, string | string[]>;
      user?: { id: string; email: string; role: string; service?: string | null };
      body?: T;
      query?: Record<string, string | string[]>;
    }
  ) => Promise<NextResponse | unknown>;
}

/** Extrait le token JWT du header Authorization ou du cookie */
function extractToken(req: NextRequest): string | null {
  // 1. Header Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // 2. Cookie arpt-session
  const cookieToken = req.cookies.get("arpt-session")?.value;
  if (cookieToken) return cookieToken;

  // 3. Cookie next-auth
  const nextAuthCookie = req.cookies.get("next-auth.session-token")?.value;
  if (nextAuthCookie) return nextAuthCookie;

  return null;
}

/** Récupère les params de la route */
async function getParams(req: NextRequest): Promise<Record<string, string | string[]>> {
  try {
    // Next.js 16: les params sont dans l'URL
    const url = new URL(req.url);
    const params: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

/** Parse les query params en objet simple */
function parseQuery(req: NextRequest): Record<string, string | string[]> {
  const url = new URL(req.url);
  const query: Record<string, string | string[]> = {};
  url.searchParams.forEach((value, key) => {
    const existing = query[key];
    if (existing) {
      query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      query[key] = value;
    }
  });
  return query;
}

/**
 * Crée un handler API standardisé
 */
export function apiHandler<T = unknown>(options: ApiHandlerOptions<T>) {
  const { auth = false, rbac, bodySchema, querySchema, handler } = options;

  return async function (
    req: NextRequest,
    routeContext?: { params: Promise<Record<string, string | string[]>> }
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const method = req.method;
    const path = new URL(req.url).pathname;
    const params = routeContext ? await routeContext.params : await getParams(req);

    try {
      // ── Authentification ───────────────────────────
      let user: ApiHandlerOptions<T>["handler"] extends (
        req: NextRequest,
        ctx: infer C
      ) => Promise<unknown>
        ? C extends { user: infer U }
          ? U
          : undefined
        : undefined;

      if (auth) {
        const token = extractToken(req);
        if (!token) {
          throw new UnauthorizedError("Authentification requise");
        }

        try {
          const payload = await verifyJwt(token);
          user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            service: payload.service,
          } as never;
        } catch {
          throw new UnauthorizedError("Session expirée ou invalide");
        }

        // ── RBAC ──────────────────────────────────────
        if (rbac && rbac.length > 0) {
          if (!rbac.includes(user!.role)) {
            throw new ForbiddenError(
              `Rôle '${user!.role}' non autorisé. Rôles requis: ${rbac.join(", ")}`
            );
          }
        }
      }

      // ── Validation body ─────────────────────────────
      let body: T | undefined;
      if (bodySchema && (method === "POST" || method === "PUT" || method === "PATCH")) {
        try {
          const rawBody = await req.json();
          body = bodySchema.parse(rawBody) as T;
        } catch (err) {
          if (err instanceof z.ZodError) {
            throw new AppError(
              "Données invalides",
              422,
              "VALIDATION_ERROR",
              true,
              err.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              }))
            );
          }
          throw new AppError("Body JSON invalide", 400, "INVALID_JSON");
        }
      }

      // ── Validation query ────────────────────────────
      let query: Record<string, string | string[]> | undefined;
      if (querySchema) {
        try {
          const rawQuery = parseQuery(req);
          query = querySchema.parse(rawQuery) as Record<string, string | string[]>;
        } catch (err) {
          if (err instanceof z.ZodError) {
            throw new AppError(
              "Paramètres invalides",
              422,
              "VALIDATION_ERROR",
              true,
              err.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              }))
            );
          }
        }
      }

      // ── Exécution du handler ────────────────────────
      const result = await handler(req, {
        params,
        user: user as never,
        body,
        query,
      });

      // ── Réponse standardisée ────────────────────────
      const duration = Date.now() - startTime;
      logger.apiRequest(method, path, 200, duration, { userId: (user as never)?.id });

      if (result instanceof NextResponse) return result;

      return NextResponse.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: unknown) {
      const appError = toAppError(error);
      const duration = Date.now() - startTime;

      logger.apiRequest(method, path, appError.statusCode, duration, {
        errorCode: appError.code,
        errorMessage: appError.message,
      });

      if (!appError.isOperational) {
        logger.error("Erreur non-opérationnelle", error);
      }

      return NextResponse.json(formatErrorResponse(appError), {
        status: appError.statusCode,
      });
    }
  };
}
