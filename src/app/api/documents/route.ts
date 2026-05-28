import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppError, NotFoundError, ForbiddenError } from '@/lib/errors';

const listQuerySchema = z.object({
  entityId: z.string().optional(),
  entityType: z.enum(['complaint', 'audit', 'decision', 'qos', 'sanction', 'operator']).optional(),
  category: z.enum(['rapport', 'piece_jointe', 'decision', 'audit', 'autre']).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v) : 50),
});

const deleteQuerySchema = z.object({
  id: z.string().min(1),
});

/** GET /api/documents - List documents for an entity or all documents */
export const GET = apiHandler({
  auth: true,
  rbac: ['super_admin', 'admin', 'agent', 'directeur', 'dg', 'juriste', 'chef_service'],
  handler: async (request: NextRequest, context) => {
    const url = new URL(request.url);
    const rawQuery: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      rawQuery[key] = value;
    });

    const query = listQuerySchema.parse(rawQuery);
    const { entityId, entityType, category, search, page, limit } = query;

    const where: Record<string, unknown> = {};

    if (entityId && entityType) {
      where.entityId = entityId;
      where.entityType = entityType;
    } else if (entityType) {
      where.entityType = entityType;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.filename = { contains: search };
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.document.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
});

/** DELETE /api/documents?id=xxx - Delete a document (super_admin, admin only) */
export const DELETE = apiHandler({
  auth: true,
  rbac: ['super_admin', 'admin'],
  handler: async (request: NextRequest, context) => {
    const url = new URL(request.url);
    const rawQuery: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      rawQuery[key] = value;
    });

    const { id } = deleteQuerySchema.parse(rawQuery);

    // Find the document
    const document = await db.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundError('Document', id);
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'uploads', document.path);
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (err) {
        logger.error('Failed to delete file from disk', err as Error, { path: document.path });
      }
    }

    // Delete document record from DB
    await db.document.delete({
      where: { id },
    });

    logger.business('Document deleted', 'Document', id, { filename: document.filename, deletedBy: context.user?.id });

    return { success: true, message: 'Document supprimé avec succès' };
  },
});
