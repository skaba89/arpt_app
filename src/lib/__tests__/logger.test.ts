import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("logs info messages", () => {
    logger.info("Test info message");
    expect(console.info).toHaveBeenCalled();
  });

  it("logs error with Error object", () => {
    const err = new Error("Test error");
    logger.error("Something failed", err);
    expect(console.error).toHaveBeenCalled();
  });

  it("logs API requests", () => {
    logger.apiRequest("GET", "/api/health", 200, 45);
    expect(console.info).toHaveBeenCalled();
  });

  it("logs API 500 as error", () => {
    logger.apiRequest("GET", "/api/crash", 500, 100);
    expect(console.error).toHaveBeenCalled();
  });

  it("logs API 404 as warn", () => {
    logger.apiRequest("GET", "/api/unknown", 404, 20);
    expect(console.warn).toHaveBeenCalled();
  });

  it("logs business actions", () => {
    logger.business("CREATE_OPERATOR", "Operator", "123", { name: "Orange" });
    expect(console.info).toHaveBeenCalled();
  });

  it("does not crash with undefined context", () => {
    expect(() => logger.info("No context")).not.toThrow();
  });
});
