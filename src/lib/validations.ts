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

// ── Utilisateurs ──────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(100),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Mot de passe trop court (min. 8 caractères)"),
  role: z.enum([
    "super_admin",
    "admin",
    "dg",
    "directeur",
    "chef_service",
    "juriste",
    "agent",
    "operateur",
    "citoyen",
  ]).default("agent"),
  service: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
});

// ── Notifications ─────────────────────────────────────────────
export const createNotificationSchema = z.object({
  title: z.string().min(2, "Titre trop court").max(200),
  message: z.string().min(5, "Message trop court").max(2000),
  type: z.enum(["info", "warning", "error", "success"]).default("info"),
  category: z.string().optional().or(z.literal("")),
  userId: z.string().min(1, "Utilisateur requis"),
});

export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1, "Au moins une notification requise"),
});

// ── Query params communs ──────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

// ── Appel d'Offre ─────────────────────────────────────────────
export const appelOffreCreateSchema = z.object({
  reference: z.string().min(1, 'Référence requise').max(50),
  title: z.string().min(1, 'Titre requis').max(500),
  description: z.string().max(5000).optional(),
  type: z.enum(['audit', 'consultation', 'service']).default('audit'),
  status: z.enum(['draft', 'published', 'closed', 'awarded', 'cancelled']).default('draft'),
  budget: z.number().positive().optional(),
  currency: z.string().max(10).default('GNF'),
  startDate: z.string().optional(),
  deadlineDate: z.string().optional(),
  awardedDate: z.string().optional(),
  awardedToId: z.string().optional(),
  locality: z.string().max(500).optional(),
  durationDays: z.number().int().positive().optional(),
})

// ── FAI ────────────────────────────────────────────────────────
export const faiCreateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  code: z.string().min(2, 'Code requis (min 2 caractères)').max(10),
  type: z.enum(['fixe', 'wifi', 'satellite', 'fibre']).default('fixe'),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  licenseDate: z.string().optional(),
  avgDownloadSpeed: z.number().positive().optional(),
  avgUploadSpeed: z.number().positive().optional(),
  avgLatency: z.number().positive().optional(),
  subscriberCount: z.number().int().positive().optional(),
  coverageZones: z.number().int().positive().optional(),
})

export const faiUpdateSchema = faiCreateSchema.partial().omit({ code: true })

// ── QoS Threshold ─────────────────────────────────────────────
export const thresholdCreateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  code: z.string().min(1, 'Code requis').max(50),
  category: z.enum(['voix', 'sms', 'data', 'internet_fixe', 'couverture']),
  technology: z.enum(['2G', '3G', '4G', 'fixe']),
  metric: z.string().min(1, 'Métrique requise').max(200),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  unit: z.string().max(20).optional(),
  isRegulatory: z.boolean().default(false),
  source: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  active: z.boolean().default(true),
})

export const thresholdUpdateSchema = thresholdCreateSchema.partial().omit({ code: true })

// ── Conformity Check ──────────────────────────────────────────
export const conformityCheckCreateSchema = z.object({
  operatorId: z.string().optional(),
  faiId: z.string().optional(),
  thresholdId: z.string().min(1, 'Seuil requis'),
  measuredValue: z.number({ required_error: 'Valeur mesurée requise' }),
  isConform: z.boolean({ required_error: 'Conformité requise' }),
  period: z.string().min(1, 'Période requise').max(20),
  region: z.string().max(200).optional(),
  source: z.enum(['drive_test', 'fixed_test', 'operator_report']).optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => data.operatorId || data.faiId,
  { message: 'Opérateur ou FAI requis', path: ['operatorId'] }
)

// ── Types déduits ─────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>;
export type CreateQosReportInput = z.infer<typeof createQosReportSchema>;
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type CreateSanctionInput = z.infer<typeof createSanctionSchema>;
export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
