/**
 * ARPT Guinée - Schémas de validation Zod
 *
 * Centralise tous les schémas de validation pour les API routes.
 * Utilisés avec apiHandler({ bodySchema, querySchema }).
 */

import { z } from "zod";

// ── Authentification ──────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Mot de passe trop court (min. 6 caractères)"),
});

// ── Opérateurs ────────────────────────────────────────────────
export const createOperatorSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(100),
  code: z.string().min(2, "Code trop court").max(10),
  type: z.enum(["mobile", "fixe", "internet", "mobile_fixe"]).default("mobile"),
  status: z.enum(["active", "suspended", "revoked"]).default("active"),
  licenseDate: z.string().datetime().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().min(8).optional().or(z.literal("")),
});

export const updateOperatorSchema = createOperatorSchema.partial();

// ── QoS Reports ───────────────────────────────────────────────
export const createQosReportSchema = z.object({
  operatorId: z.string().min(1, "Opérateur requis"),
  period: z.string().min(4, "Période requise (ex: 2025-Q1)"),
  region: z.string().optional(),
  callSuccessRate: z.number().min(0).max(100).optional(),
  callSetupTime: z.number().min(0).optional(),
  dropRate: z.number().min(0).max(100).optional(),
  handoverSuccessRate: z.number().min(0).max(100).optional(),
  smsSuccessRate: z.number().min(0).max(100).optional(),
  dataThroughput: z.number().min(0).optional(),
  latency: z.number().min(0).optional(),
  overallScore: z.number().min(0).max(100).optional(),
});

// ── Plaintes ──────────────────────────────────────────────────
export const createComplaintSchema = z.object({
  title: z.string().min(5, "Titre trop court (min. 5)").max(200),
  description: z.string().min(10, "Description trop courte (min. 10)").max(5000),
  category: z.enum([
    "qualite_service",
    "facturation",
    "couverture",
    "service_client",
    "fraude",
    "autre",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  operatorId: z.string().optional(),
  complainantName: z.string().min(2).optional().or(z.literal("")),
  complainantPhone: z.string().min(8).optional().or(z.literal("")),
  complainantEmail: z.string().email().optional().or(z.literal("")),
});

// ── Sanctions ─────────────────────────────────────────────────
export const createSanctionSchema = z.object({
  title: z.string().min(5, "Titre trop court").max(200),
  description: z.string().min(10, "Description trop courte").max(5000),
  type: z.enum(["avertissement", "amine", "suspension", "retrait_licence", "autre"]),
  amount: z.number().min(0).optional(),
  operatorId: z.string().min(1, "Opérateur requis"),
});

// ── Audits ────────────────────────────────────────────────────
export const createAuditSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  type: z.enum(["conformite", "technique", "financier", "procedure", "autre"]),
  operatorId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  leadAuditorId: z.string().optional(),
});

// ── Décisions ─────────────────────────────────────────────────
export const createDecisionSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  type: z.enum(["reglementaire", "sanction", "arbitrage", "attribution", "autre"]),
});

// ── Query params communs ──────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

// ── Types déduits ─────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>;
export type CreateQosReportInput = z.infer<typeof createQosReportSchema>;
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type CreateSanctionInput = z.infer<typeof createSanctionSchema>;
export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
