import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, parsePagination } from '@/lib/api-auth'
import { thresholdCreateSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const category = searchParams.get('category')
    const technology = searchParams.get('technology')
    const isRegulatory = searchParams.get('isRegulatory')

    const where: any = { active: true }
    if (category) where.category = category
    if (technology) where.technology = technology
    if (isRegulatory !== null && isRegulatory !== undefined && isRegulatory !== '') {
      where.isRegulatory = isRegulatory === 'true'
    }

    const [thresholds, total] = await Promise.all([
      db.qosThreshold.findMany({
        where,
        include: { _count: { select: { conformityChecks: true } } },
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { technology: 'asc' }],
      }),
      db.qosThreshold.count({ where }),
    ])

    return NextResponse.json({
      thresholds,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching thresholds:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des seuils QoS' },
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

    const allowedRoles = ['super_admin']
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const validated = thresholdCreateSchema.parse(body)

    const threshold = await db.qosThreshold.create({ data: validated })

    return NextResponse.json({ threshold }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un seuil avec ce code existe déjà' },
        { status: 409 }
      )
    }
    console.error('Error creating threshold:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du seuil QoS' },
      { status: 500 }
    )
  }
}
