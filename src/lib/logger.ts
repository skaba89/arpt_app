/**
 * ARPT Guinée - Service de Logging Structuré
 *
 * Logging uniforme pour toute l'application :
 * - Format JSON en production, lisible en dev
 * - Niveaux : debug, info, warn, error
 * - Contexte automatique (timestamp, requestId, userId)
 * - Compatible avec les agrégateurs de logs (Datadog, ELK)
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  duration?: number;
  statusCode?: number;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  env: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const shouldLog = (level: LogLevel): boolean =>
  LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatEntry(level: LogLevel, message: string, context?: LogContext, err?: Error): string {
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    message,
    service: "arpt-guinee",
    env: process.env.NODE_ENV || "development",
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (err) {
    entry.error = {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    };
  }

  // Production: JSON pour agrégateur de logs
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }

  // Dev: format lisible avec couleurs
  const colors: Record<LogLevel, string> = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m",  // green
    warn: "\x1b[33m",  // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  const errorStr = err ? ` | ${err.message}` : "";

  return `${colors[level]}[${level.toUpperCase()}]${reset} ${formatTimestamp()} - ${message}${contextStr}${errorStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog("debug")) console.debug(formatEntry("debug", message, context));
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog("info")) console.info(formatEntry("info", message, context));
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog("warn")) console.warn(formatEntry("warn", message, context));
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    if (shouldLog("error")) console.error(formatEntry("error", message, context, err));
  },

  /** Log une requête API avec durée et statut */
  apiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    this[level](`${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  },

  /** Log une action métier (audit trail) */
  business(action: string, entity: string, entityId?: string, context?: LogContext): void {
    this.info(`[BUSINESS] ${action} ${entity}${entityId ? `#${entityId}` : ""}`, {
      action,
      entity,
      entityId,
      ...context,
    });
  },
};

export default logger;
