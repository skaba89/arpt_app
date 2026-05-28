/**
 * ARPT Guinée - Erreurs métier standardisées
 *
 * Hiérarchie d'erreurs avec codes HTTP appropriés :
 * - AppError : classe de base
 * - UnauthorizedError : 401
 * - ForbiddenError : 403
 * - NotFoundError : 404
 * - ValidationError : 422
 * - ConflictError : 409
 * - InternalError : 500
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Non authentifié", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé", details?: unknown) {
    super(message, 403, "FORBIDDEN", true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Ressource", id?: string, details?: unknown) {
    const msg = id ? `${resource}#${id} introuvable` : `${resource} introuvable`;
    super(msg, 404, "NOT_FOUND", true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Données invalides", details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit de données", details?: unknown) {
    super(message, 409, "CONFLICT", true, details);
  }
}

export class InternalError extends AppError {
  constructor(message = "Erreur interne du serveur", details?: unknown) {
    super(message, 500, "INTERNAL_ERROR", false, details);
  }
}

/**
 * Convertit une erreur inconnue en AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Error) {
    // Prisma errors
    const prismaError = error as { code?: string; meta?: unknown };
    if (prismaError.code === "P2002") {
      return new ConflictError("Un enregistrement avec ces données existe déjà", prismaError.meta);
    }
    if (prismaError.code === "P2025") {
      return new NotFoundError("Enregistrement");
    }
    return new InternalError(error.message);
  }

  return new InternalError("Une erreur inattendue s'est produite");
}

/**
 * Formate une erreur pour la réponse API
 */
export function formatErrorResponse(error: AppError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && process.env.NODE_ENV !== "production"
        ? { details: error.details }
        : {}),
    },
  };
}
