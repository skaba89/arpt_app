import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, parsePagination } from '@/lib/api-auth'
import { appelOffreCreateSchema } from '@/lib/validations'
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
        { title: { contains: search } },
        { reference: { contains: search } },
      ]
    }

    const [appelOffres, total] = await Promise.all([
      db.appelOffre.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { submissions: true, documents: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.appelOffre.count({ where }),
    ])

    return NextResponse.json({
      appelOffres,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching appels d\'offres:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des appels d\'offres' },
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

    const allowedRoles = ['super_admin', 'admin', 'dg']
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const validated = appelOffreCreateSchema.parse(body)

    const data: any = { ...validated, createdById: auth.id }
    if (validated.startDate) data.startDate = new Date(validated.startDate)
    if (validated.deadlineDate) data.deadlineDate = new Date(validated.deadlineDate)
    if (validated.awardedDate) data.awardedDate = new Date(validated.awardedDate)

    const appelOffre = await db.appelOffre.create({ data })

    return NextResponse.json({ appelOffre }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un appel d\'offres avec cette référence existe déjà' },
        { status: 409 }
      )
    }
    console.error('Error creating appel d\'offre:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'appel d\'offres' },
      { status: 500 }
    )
  }
}
