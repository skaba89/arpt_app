import { describe, it, expect } from "vitest";
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  InternalError,
  toAppError,
  formatErrorResponse,
} from "@/lib/errors";

describe("AppError", () => {
  it("should create an error with correct properties", () => {
    const error = new AppError("Test error", 400, "TEST_ERROR");
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("TEST_ERROR");
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("should default to 500 and INTERNAL_ERROR", () => {
    const error = new AppError("Oops");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
  });
});

describe("Error subclasses", () => {
  it("UnauthorizedError should have 401", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("ForbiddenError should have 403", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("NotFoundError should have 404", () => {
    const error = new NotFoundError("Utilisateur");
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain("Utilisateur");
  });

  it("NotFoundError with id includes it in message", () => {
    const error = new NotFoundError("Utilisateur", "123");
    expect(error.message).toBe("Utilisateur#123 introuvable");
  });

  it("ValidationError should have 422", () => {
    const error = new ValidationError();
    expect(error.statusCode).toBe(422);
  });

  it("ConflictError should have 409", () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
  });

  it("InternalError should have isOperational=false", () => {
    const error = new InternalError();
    expect(error.isOperational).toBe(false);
  });
});

describe("toAppError", () => {
  it("returns AppError as-is", () => {
    const original = new NotFoundError("Test");
    expect(toAppError(original)).toBe(original);
  });

  it("converts generic Error to InternalError", () => {
    const result = toAppError(new Error("oops"));
    expect(result.statusCode).toBe(500);
  });

  it("converts Prisma P2002 to ConflictError", () => {
    const err: any = new Error("Unique");
    err.code = "P2002";
    expect(toAppError(err).statusCode).toBe(409);
  });

  it("converts Prisma P2025 to NotFoundError", () => {
    const err: any = new Error("Not found");
    err.code = "P2025";
    expect(toAppError(err).statusCode).toBe(404);
  });

  it("handles non-Error values", () => {
    expect(toAppError("string").statusCode).toBe(500);
  });
});

describe("formatErrorResponse", () => {
  it("formats error for API response", () => {
    const err = new ValidationError("Bad input");
    const res = formatErrorResponse(err);
    expect(res.success).toBe(false);
    expect(res.error.code).toBe("VALIDATION_ERROR");
  });

  it("hides details in production", () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const res = formatErrorResponse(new ValidationError("Bad", "secret"));
    expect(res.error.details).toBeUndefined();
    process.env.NODE_ENV = orig;
  });
});
