import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { db } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
];

const uploadSchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(['complaint', 'audit', 'decision', 'qos', 'sanction', 'operator']),
  category: z.enum(['rapport', 'piece_jointe', 'decision', 'audit', 'autre']).optional(),
  description: z.string().max(500).optional(),
});

export const POST = apiHandler({
  auth: true,
  rbac: ['super_admin', 'admin', 'agent', 'directeur', 'dg', 'juriste', 'chef_service'],
  handler: async (request: NextRequest, context) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityId = formData.get('entityId') as string;
    const entityType = formData.get('entityType') as string;
    const category = formData.get('category') as string | null;
    const description = formData.get('description') as string | null;

    // Validate inputs
    if (!file) throw new Error('Aucun fichier fourni');

    const validated = uploadSchema.parse({ entityId, entityType, category, description });

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Fichier trop volumineux (max 10MB)');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé: ${file.type}`);
    }

    // Ensure upload directory exists
    const entityDir = join(UPLOAD_DIR, validated.entityType);
    if (!existsSync(entityDir)) {
      await mkdir(entityDir, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = join(entityDir, uniqueName);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save document record in DB
    const userId = context.user?.id || undefined;
    const document = await db.document.create({
      data: {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        path: `${validated.entityType}/${uniqueName}`,
        category: validated.category || 'autre',
        description: validated.description,
        entityId: validated.entityId,
        entityType: validated.entityType,
        uploadedById: userId,
      },
    });

    logger.business('Document uploaded', 'Document', document.id, { filename: file.name, entityType: validated.entityType, userId });

    return document;
  },
});
