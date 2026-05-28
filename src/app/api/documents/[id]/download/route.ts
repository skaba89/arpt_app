import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { NotFoundError } from '@/lib/errors';

/** GET /api/documents/[id]/download - Download a file by document ID */
export const GET = apiHandler({
  auth: true,
  rbac: ['super_admin', 'admin', 'agent', 'directeur', 'dg', 'juriste', 'chef_service'],
  handler: async (request: NextRequest, context) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const docId = pathParts[pathParts.indexOf('documents') + 1];

    if (!docId) {
      throw new NotFoundError('Document');
    }

    // Find the document record
    const document = await db.document.findUnique({
      where: { id: docId },
    });

    if (!document) {
      throw new NotFoundError('Document', docId);
    }

    // Read the file from disk
    const filePath = join(process.cwd(), 'uploads', document.path);
    if (!existsSync(filePath)) {
      throw new NotFoundError('Fichier physique', document.path);
    }

    const fileBuffer = await readFile(filePath);
    const fileStat = await stat(filePath);

    // Determine content type
    const contentType = document.mimeType || 'application/octet-stream';

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.filename)}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  },
});
