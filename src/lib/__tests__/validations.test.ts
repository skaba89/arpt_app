import { describe, it, expect } from "vitest";
import {
  loginSchema,
  createOperatorSchema,
  createComplaintSchema,
  createSanctionSchema,
  createQosReportSchema,
  createAuditSchema,
  createDecisionSchema,
  paginationSchema,
} from "@/lib/validations";

describe("loginSchema", () => {
  it("validates correct input", () => {
    const result = loginSchema.safeParse({ email: "admin@arpt.gn", password: "Admin@2025" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "admin@arpt.gn", password: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("createOperatorSchema", () => {
  it("validates correct input", () => {
    const result = createOperatorSchema.safeParse({ name: "Orange", code: "ORG" });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = createOperatorSchema.safeParse({ name: "O", code: "ORG" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createOperatorSchema.safeParse({ name: "Orange", code: "ORG", type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts valid type enum", () => {
    for (const type of ["mobile", "fixe", "internet", "mobile_fixe"]) {
      const result = createOperatorSchema.safeParse({ name: "Op", code: "OP", type });
      expect(result.success).toBe(true);
    }
  });
});

describe("createComplaintSchema", () => {
  it("validates correct input", () => {
    const result = createComplaintSchema.safeParse({
      title: "Problème de réseau",
      description: "Le réseau est très instable depuis 3 jours dans la région de Kindia",
      category: "qualite_service",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = createComplaintSchema.safeParse({
      title: "Ok",
      description: "Description longue enough",
      category: "autre",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short description", () => {
    const result = createComplaintSchema.safeParse({
      title: "Titre valide",
      description: "Court",
      category: "autre",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createComplaintSchema.safeParse({
      title: "Titre valide",
      description: "Description valide et longue",
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("createSanctionSchema", () => {
  it("validates correct input", () => {
    const result = createSanctionSchema.safeParse({
      title: "Avertissement Orange",
      description: "Non-respect des seuils QoS pendant 3 mois consécutifs",
      type: "avertissement",
      operatorId: "cmp123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing operatorId", () => {
    const result = createSanctionSchema.safeParse({
      title: "Avertissement",
      description: "Description valide pour test",
      type: "amine",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createSanctionSchema.safeParse({
      title: "Sanction",
      description: "Description valide pour test sanction",
      type: "invalid",
      operatorId: "cmp123",
    });
    expect(result.success).toBe(false);
  });
});

describe("createQosReportSchema", () => {
  it("validates correct input", () => {
    const result = createQosReportSchema.safeParse({
      operatorId: "op1",
      period: "2025-Q1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = createQosReportSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("validates numeric ranges", () => {
    const result = createQosReportSchema.safeParse({
      operatorId: "op1",
      period: "2025-Q1",
      callSuccessRate: 150, // max 100
    });
    expect(result.success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("provides defaults", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.order).toBe("desc");
    }
  });

  it("coerces string to number", () => {
    const result = paginationSchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects limit over 100", () => {
    const result = paginationSchema.safeParse({ limit: "200" });
    expect(result.success).toBe(false);
  });
});
