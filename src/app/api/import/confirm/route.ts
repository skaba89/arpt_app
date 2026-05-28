import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/jwt-auth";
import { logger } from "@/lib/logger";

// ── Constants ────────────────────────────────────────────────────
const ALLOWED_ROLES = ["super_admin", "admin", "dg", "directeur"];

type ImportType = "qos" | "complaints" | "operators";

// ── Auth helper ──────────────────────────────────────────────────
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookieToken = req.cookies.get("arpt-session")?.value;
  if (cookieToken) return cookieToken;
  return null;
}

// ── Import QoS data ─────────────────────────────────────────────
async function importQosData(
  rows: Record<string, unknown>[],
  userId: string
): Promise<{ imported: number; skipped: number; errors: number; details: string[] }> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const details: string[] = [];

  // Load all operators for mapping
  const operators = await db.operator.findMany({
    select: { id: true, name: true, code: true },
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Find operator by code or name
      let operatorId: string | null = null;
      const operatorCode = String(row.operator_code || "").trim().toUpperCase();
      const operatorName = String(row.operator_name || "").trim();

      if (operatorCode) {
        const op = operators.find((o) => o.code.toUpperCase() === operatorCode);
        if (op) operatorId = op.id;
      }
      if (!operatorId && operatorName) {
        const op = operators.find(
          (o) => o.name.toLowerCase() === operatorName.toLowerCase()
        );
        if (op) operatorId = op.id;
      }

      if (!operatorId) {
        errors++;
        details.push(`Ligne ${i + 1}: Opérateur non trouvé ("${operatorCode || operatorName}")`);
        continue;
      }

      const period = String(row.period || "").trim();
      if (!period) {
        errors++;
        details.push(`Ligne ${i + 1}: Période manquante`);
        continue;
      }

      // Check for duplicate (same operator + period + region)
      const region = row.region ? String(row.region).trim() : null;
      const existing = await db.qosReport.findFirst({
        where: { operatorId, period, region },
      });

      if (existing) {
        skipped++;
        details.push(`Ligne ${i + 1}: Rapport QoS déjà existant pour ${operatorCode || operatorName} - ${period}${region ? ` - ${region}` : ""}`);
        continue;
      }

      await db.qosReport.create({
        data: {
          operatorId,
          period,
          region,
          callSuccessRate: row.call_success_rate ? parseFloat(String(row.call_success_rate)) : null,
          dropRate: row.drop_rate ? parseFloat(String(row.drop_rate)) : null,
          smsSuccessRate: row.sms_success_rate ? parseFloat(String(row.sms_success_rate)) : null,
          dataThroughput: row.data_throughput ? parseFloat(String(row.data_throughput)) : null,
          latency: row.latency ? parseFloat(String(row.latency)) : null,
          overallScore: row.overall_score ? parseFloat(String(row.overall_score)) : null,
          status: "draft",
          createdById: userId,
        },
      });

      imported++;
      details.push(`Ligne ${i + 1}: Rapport QoS importé pour ${operatorCode || operatorName} - ${period}`);
    } catch (err) {
      errors++;
      details.push(`Ligne ${i + 1}: Erreur technique - ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    }
  }

  return { imported, skipped, errors, details };
}

// ── Import Complaints data ──────────────────────────────────────
async function importComplaintsData(
  rows: Record<string, unknown>[],
  userId: string
): Promise<{ imported: number; skipped: number; errors: number; details: string[] }> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const details: string[] = [];

  // Load all operators for mapping
  const operators = await db.operator.findMany({
    select: { id: true, name: true, code: true },
  });

  // Get current complaint count for reference generation
  const count = await db.complaint.count();
  const year = new Date().getFullYear();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const title = String(row.title || "").trim();
      const description = String(row.description || "").trim();
      const category = String(row.category || "").trim().toLowerCase();

      if (!title || !description || !category) {
        errors++;
        details.push(`Ligne ${i + 1}: Champs requis manquants (titre, description, catégorie)`);
        continue;
      }

      // Find operator by code or name (optional for complaints)
      let operatorId: string | null = null;
      const operatorCode = String(row.operator_code || "").trim().toUpperCase();
      const operatorName = String(row.operator_name || "").trim();

      if (operatorCode) {
        const op = operators.find((o) => o.code.toUpperCase() === operatorCode);
        if (op) operatorId = op.id;
      }
      if (!operatorId && operatorName) {
        const op = operators.find(
          (o) => o.name.toLowerCase() === operatorName.toLowerCase()
        );
        if (op) operatorId = op.id;
      }

      // Generate reference
      const reference = `PLA-${year}-${String(count + imported + 1).padStart(3, "0")}`;

      const priority = String(row.priority || "medium").trim().toLowerCase();
      const validPriorities = ["low", "medium", "high", "critical"];
      const finalPriority = validPriorities.includes(priority) ? priority : "medium";

      await db.complaint.create({
        data: {
          reference,
          title,
          description,
          category,
          priority: finalPriority,
          operatorId: operatorId || null,
          complainantName: row.complainant_name ? String(row.complainant_name).trim() : null,
          complainantPhone: row.complainant_phone ? String(row.complainant_phone).trim() : null,
          complainantEmail: row.complainant_email ? String(row.complainant_email).trim() : null,
          status: "open",
          createdById: userId,
        },
      });

      imported++;
      details.push(`Ligne ${i + 1}: Plainte importée ${reference} - ${title}`);
    } catch (err) {
      errors++;
      details.push(`Ligne ${i + 1}: Erreur technique - ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    }
  }

  return { imported, skipped, errors, details };
}

// ── Import Operators data ───────────────────────────────────────
async function importOperatorsData(
  rows: Record<string, unknown>[],
  userId: string
): Promise<{ imported: number; skipped: number; errors: number; details: string[] }> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const details: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = String(row.name || "").trim();
      const code = String(row.code || "").trim().toUpperCase();

      if (!name || !code) {
        errors++;
        details.push(`Ligne ${i + 1}: Nom ou code opérateur manquant`);
        continue;
      }

      // Check for duplicate by name or code
      const existing = await db.operator.findFirst({
        where: {
          OR: [{ name }, { code }],
        },
      });

      if (existing) {
        skipped++;
        details.push(`Ligne ${i + 1}: Opérateur déjà existant ("${name}" / "${code}")`);
        continue;
      }

      const type = String(row.type || "mobile").trim().toLowerCase();
      const validTypes = ["mobile", "fixe", "mobile_fixe", "internet"];
      const finalType = validTypes.includes(type) ? type : "mobile";

      await db.operator.create({
        data: {
          name,
          code,
          type: finalType,
          status: "active",
          contactEmail: row.contact_email ? String(row.contact_email).trim() : null,
          contactPhone: row.contact_phone ? String(row.contact_phone).trim() : null,
          createdById: userId,
        },
      });

      imported++;
      details.push(`Ligne ${i + 1}: Opérateur importé "${name}" (${code})`);
    } catch (err) {
      errors++;
      details.push(`Ligne ${i + 1}: Erreur technique - ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    }
  }

  return { imported, skipped, errors, details };
}

// ── POST handler ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // ── Authentification ────────────────────────────────
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentification requise" } },
        { status: 401 }
      );
    }

    let user: { id: string; email: string; role: string };
    try {
      const payload = await verifyJwt(token);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Session expirée ou invalide" } },
          { status: 401 }
        );
      }
      user = { id: payload.id, email: payload.email, role: payload.role };
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Session expirée ou invalide" } },
        { status: 401 }
      );
    }

    // ── RBAC ────────────────────────────────────────────
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: `Rôle '${user.role}' non autorisé pour l'import` } },
        { status: 403 }
      );
    }

    // ── Parse body ──────────────────────────────────────
    const body = await req.json();
    const { importType, data } = body as {
      importType: ImportType;
      data: Record<string, unknown>[];
    };

    if (!importType || !["qos", "complaints", "operators"].includes(importType)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Type d'import invalide" } },
        { status: 422 }
      );
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Aucune donnée à importer" } },
        { status: 422 }
      );
    }

    if (data.length > 1000) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Trop de lignes. Maximum: 1000 par import" } },
        { status: 422 }
      );
    }

    // ── Execute import ──────────────────────────────────
    let result: { imported: number; skipped: number; errors: number; details: string[] };

    switch (importType) {
      case "qos":
        result = await importQosData(data, user.id);
        break;
      case "complaints":
        result = await importComplaintsData(data, user.id);
        break;
      case "operators":
        result = await importOperatorsData(data, user.id);
        break;
      default:
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Type d'import non supporté" } },
          { status: 422 }
        );
    }

    const duration = Date.now() - startTime;
    logger.business("IMPORT_DATA", importType, undefined, {
      userId: user.id,
      importType,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
    });
    logger.apiRequest("POST", "/api/import/confirm", 200, duration, { userId: user.id });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Erreur lors de la confirmation d'import", error);
    logger.apiRequest("POST", "/api/import/confirm", 500, duration);

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erreur interne lors de l'import des données" } },
      { status: 500 }
    );
  }
}
