import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt-auth";
import { logger } from "@/lib/logger";
import Papa, { ParseResult } from "papaparse";
import * as XLSX from "xlsx";

// ── Constants ────────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 1000;
const PREVIEW_ROWS = 10;

const ALLOWED_ROLES = ["super_admin", "admin", "dg", "directeur"];

type ImportType = "qos" | "complaints" | "operators";

// ── Expected columns per import type ─────────────────────────────
interface ColumnDef {
  key: string;
  label: string;
  required: boolean;
  type: "string" | "number" | "enum";
  enumValues?: string[];
}

const COLUMN_DEFINITIONS: Record<ImportType, ColumnDef[]> = {
  qos: [
    { key: "operator_name", label: "Nom opérateur", required: false, type: "string" },
    { key: "operator_code", label: "Code opérateur", required: false, type: "string" },
    { key: "period", label: "Période", required: true, type: "string" },
    { key: "region", label: "Région", required: false, type: "string" },
    { key: "call_success_rate", label: "Taux abouti (%)", required: false, type: "number" },
    { key: "drop_rate", label: "Taux coupé (%)", required: false, type: "number" },
    { key: "sms_success_rate", label: "Taux SMS (%)", required: false, type: "number" },
    { key: "data_throughput", label: "Débit data (Mbps)", required: false, type: "number" },
    { key: "latency", label: "Latence (ms)", required: false, type: "number" },
    { key: "overall_score", label: "Score global (%)", required: false, type: "number" },
  ],
  complaints: [
    { key: "title", label: "Titre", required: true, type: "string" },
    { key: "description", label: "Description", required: true, type: "string" },
    { key: "category", label: "Catégorie", required: true, type: "enum", enumValues: ["qualite_service", "facturation", "couverture", "service_client", "fraude", "autre", "reseau", "internet"] },
    { key: "priority", label: "Priorité", required: false, type: "enum", enumValues: ["low", "medium", "high", "critical"] },
    { key: "operator_name", label: "Nom opérateur", required: false, type: "string" },
    { key: "operator_code", label: "Code opérateur", required: false, type: "string" },
    { key: "complainant_name", label: "Nom plaignant", required: false, type: "string" },
    { key: "complainant_phone", label: "Téléphone plaignant", required: false, type: "string" },
    { key: "complainant_email", label: "Email plaignant", required: false, type: "string" },
  ],
  operators: [
    { key: "name", label: "Nom", required: true, type: "string" },
    { key: "code", label: "Code", required: true, type: "string" },
    { key: "type", label: "Type", required: true, type: "enum", enumValues: ["mobile", "fixe", "mobile_fixe", "internet"] },
    { key: "contact_email", label: "Email contact", required: false, type: "string" },
    { key: "contact_phone", label: "Téléphone contact", required: false, type: "string" },
  ],
};

// ── Auth helper ──────────────────────────────────────────────────
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookieToken = req.cookies.get("arpt-session")?.value;
  if (cookieToken) return cookieToken;
  return null;
}

// ── Normalise les clés de colonnes ──────────────────────────────
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "_")
    .replace(/[éèê]/g, "e")
    .replace(/[àâ]/g, "a")
    .replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/ç/g, "c");
}

// ── Valide les données par rapport aux colonnes attendues ───────
function validateRow(
  row: Record<string, unknown>,
  columns: ColumnDef[],
  rowIndex: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const col of columns) {
    const value = row[col.key];

    if (col.required && (value === undefined || value === null || String(value).trim() === "")) {
      errors.push(`Ligne ${rowIndex + 1}: Champ requis manquant "${col.label}" (${col.key})`);
      continue;
    }

    if (value === undefined || value === null || String(value).trim() === "") continue;

    if (col.type === "number") {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`Ligne ${rowIndex + 1}: Valeur non numérique pour "${col.label}" (${col.key}): "${value}"`);
      }
    }

    if (col.type === "enum" && col.enumValues) {
      const strVal = String(value).trim().toLowerCase();
      if (!col.enumValues.includes(strVal)) {
        errors.push(`Ligne ${rowIndex + 1}: Valeur invalide pour "${col.label}" (${col.key}): "${value}". Valeurs attendues: ${col.enumValues.join(", ")}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Spécificités de validation par type ─────────────────────────
function validateImportTypeSpecific(
  rows: Record<string, unknown>[],
  importType: ImportType
): string[] {
  const warnings: string[] = [];

  if (importType === "qos") {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const hasOperatorName = row.operator_name && String(row.operator_name).trim() !== "";
      const hasOperatorCode = row.operator_code && String(row.operator_code).trim() !== "";
      if (!hasOperatorName && !hasOperatorCode) {
        warnings.push(`Ligne ${i + 1}: Aucun identifiant opérateur (operator_name ou operator_code requis)`);
      }
      // Validate period format
      const period = String(row.period || "");
      if (period && !/^\d{4}-Q[1-4]$/.test(period) && !/^\d{4}-S[1-2]$/.test(period) && !/^\d{4}$/.test(period)) {
        warnings.push(`Ligne ${i + 1}: Format de période non standard "${period}". Attendu: 2025-Q1`);
      }
    }
  }

  if (importType === "operators") {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = String(row.code || "");
      if (code && code.length < 2) {
        warnings.push(`Ligne ${i + 1}: Code opérateur trop court (min. 2 caractères)`);
      }
    }
  }

  return warnings;
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

    // ── Parse FormData ──────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const importType = formData.get("importType") as ImportType | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Fichier requis" } },
        { status: 422 }
      );
    }

    if (!importType || !["qos", "complaints", "operators"].includes(importType)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Type d'import invalide. Types supportés: qos, complaints, operators" } },
        { status: 422 }
      );
    }

    // ── File size check ─────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Fichier trop volumineux. Taille max: ${MAX_FILE_SIZE / 1024 / 1024} Mo` } },
        { status: 422 }
      );
    }

    // ── File type check ─────────────────────────────────
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isCsv && !isExcel) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Format de fichier non supporté. Utilisez CSV (.csv) ou Excel (.xlsx, .xls)" } },
        { status: 422 }
      );
    }

    // ── Parse file ──────────────────────────────────────
    let rows: Record<string, unknown>[] = [];
    let columns: string[] = [];

    if (isCsv) {
      const text = await file.text();
      const result: ParseResult<Record<string, unknown>> = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => normalizeKey(header),
      });

      if (result.errors.length > 0) {
        const parseErrors = result.errors.slice(0, 10).map((e) => `Erreur de parsing: ${e.message} (ligne ${e.row})`);
        return NextResponse.json(
          { success: false, error: { code: "PARSE_ERROR", message: "Erreur lors du parsing du fichier CSV", details: parseErrors } },
          { status: 422 }
        );
      }

      rows = result.data;
      columns = result.meta.fields || [];
    } else {
      // Excel parsing
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      // Normalize column names
      rows = jsonData.map((row) => {
        const normalized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
          normalized[normalizeKey(key)] = value;
        }
        return normalized;
      });

      if (rows.length > 0) {
        columns = Object.keys(rows[0]);
      }
    }

    // ── Row limit check ─────────────────────────────────
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Trop de lignes (${rows.length}). Maximum: ${MAX_ROWS} lignes par import` } },
        { status: 422 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Le fichier est vide ou ne contient aucune donnée exploitable" } },
        { status: 422 }
      );
    }

    // ── Column validation ───────────────────────────────
    const expectedColumns = COLUMN_DEFINITIONS[importType];
    const requiredKeys = expectedColumns.filter((c) => c.required).map((c) => c.key);
    const allExpectedKeys = expectedColumns.map((c) => c.key);

    // Check required columns
    const missingRequired = requiredKeys.filter(
      (key) => !columns.includes(key)
    );

    // For QoS, either operator_name or operator_code is required
    let missingOperatorId = false;
    if (importType === "qos") {
      const hasOperatorName = columns.includes("operator_name");
      const hasOperatorCode = columns.includes("operator_code");
      if (!hasOperatorName && !hasOperatorCode) {
        missingOperatorId = true;
        missingRequired.push("operator_name ou operator_code");
      }
      // Remove individual operator checks since we handle them as a group
      const filteredMissing = missingRequired.filter(
        (k) => k !== "operator_name" && k !== "operator_code"
      );
      missingRequired.length = 0;
      missingRequired.push(...filteredMissing);
      if (missingOperatorId) {
        missingRequired.push("operator_name ou operator_code");
      }
    }

    // For complaints, either operator_name or operator_code is optional
    if (importType === "complaints") {
      // Remove operator_name and operator_code from required check since they're optional
      const idx1 = missingRequired.indexOf("operator_name");
      if (idx1 >= 0) missingRequired.splice(idx1, 1);
      const idx2 = missingRequired.indexOf("operator_code");
      if (idx2 >= 0) missingRequired.splice(idx2, 1);
    }

    const columnWarnings: string[] = [];
    const unmappedColumns = columns.filter((col) => !allExpectedKeys.includes(col));
    if (unmappedColumns.length > 0) {
      columnWarnings.push(`Colonnes non reconnues (ignorées): ${unmappedColumns.join(", ")}`);
    }

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Colonnes requises manquantes: ${missingRequired.join(", ")}`,
            details: { missingColumns: missingRequired, foundColumns: columns },
          },
        },
        { status: 422 }
      );
    }

    // ── Row validation ──────────────────────────────────
    const allErrors: string[] = [];
    const allWarnings: string[] = [...columnWarnings];

    for (let i = 0; i < rows.length; i++) {
      const { valid, errors } = validateRow(rows[i], expectedColumns, i);
      if (!valid) {
        allErrors.push(...errors);
      }
    }

    // Type-specific validation
    const typeWarnings = validateImportTypeSpecific(rows, importType);
    allWarnings.push(...typeWarnings);

    // ── Preview data ────────────────────────────────────
    const preview = rows.slice(0, PREVIEW_ROWS);

    // ── Build column mapping ────────────────────────────
    const columnMapping = expectedColumns.map((col) => ({
      key: col.key,
      label: col.label,
      required: col.required,
      type: col.type,
      enumValues: col.enumValues,
      mappedFrom: columns.includes(col.key) ? col.key : null,
    }));

    const duration = Date.now() - startTime;
    logger.apiRequest("POST", "/api/import", 200, duration, {
      userId: user.id,
      importType,
      rows: rows.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        preview,
        columns,
        columnMapping,
        totalRows: rows.length,
        errors: allErrors,
        warnings: allWarnings,
        importType,
        fileName: file.name,
        fileSize: file.size,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Erreur lors de l'import", error);
    logger.apiRequest("POST", "/api/import", 500, duration);

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erreur interne lors du traitement du fichier" } },
      { status: 500 }
    );
  }
}
