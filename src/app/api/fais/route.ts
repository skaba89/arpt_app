import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, parsePagination } from '@/lib/api-auth'
import { faiCreateSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ]
    }

    const [fais, total] = await Promise.all([
      db.fai.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { qosReports: true, documents: true, conformityChecks: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.fai.count({ where }),
    ])

    return NextResponse.json({
      fais,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching FAIs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des FAI' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const allowedRoles = ['super_admin', 'admin']
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const validated = faiCreateSchema.parse(body)

    const data: any = {
      ...validated,
      code: validated.code.toUpperCase(),
      createdById: auth.id,
    }
    if (validated.licenseDate) data.licenseDate = new Date(validated.licenseDate)

    const fai = await db.fai.create({ data })

    return NextResponse.json({ fai }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un FAI avec ce code existe déjà' },
        { status: 409 }
      )
    }
    console.error('Error creating FAI:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du FAI' },
      { status: 500 }
    )
  }
}
