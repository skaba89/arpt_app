import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, parsePagination } from '@/lib/api-auth'
import { conformityCheckCreateSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const operatorId = searchParams.get('operatorId')
    const faiId = searchParams.get('faiId')
    const thresholdId = searchParams.get('thresholdId')
    const category = searchParams.get('category')
    const technology = searchParams.get('technology')
    const period = searchParams.get('period')
    const isConform = searchParams.get('isConform')
    const region = searchParams.get('region')

    const where: any = {}
    if (operatorId) where.operatorId = operatorId
    if (faiId) where.faiId = faiId
    if (thresholdId) where.thresholdId = thresholdId
    if (period) where.period = period
    if (isConform !== null && isConform !== undefined && isConform !== '') {
      where.isConform = isConform === 'true'
    }
    if (region) where.region = region
    if (category || technology) {
      where.threshold = {}
      if (category) where.threshold.category = category
      if (technology) where.threshold.technology = technology
    }

    const [checks, total] = await Promise.all([
      db.conformityCheck.findMany({
        where,
        include: {
          threshold: true,
          operator: { select: { id: true, name: true, code: true } },
          fai: { select: { id: true, name: true, code: true } },
          checkedBy: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { checkedAt: 'desc' },
      }),
      db.conformityCheck.count({ where }),
    ])

    // Compute summary stats
    const conformCount = await db.conformityCheck.count({ where: { ...where, isConform: true } })
    const nonConformCount = await db.conformityCheck.count({ where: { ...where, isConform: false } })

    return NextResponse.json({
      checks,
      summary: { conform: conformCount, nonConform: nonConformCount, total: conformCount + nonConformCount },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching conformity checks:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des contrôles de conformité' },
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

    const allowedRoles = ['super_admin', 'admin', 'agent', 'directeur']
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const validated = conformityCheckCreateSchema.parse(body)

    const data: any = {
      ...validated,
      checkedById: auth.id,
    }

    const check = await db.conformityCheck.create({
      data,
      include: {
        threshold: true,
        operator: { select: { id: true, name: true, code: true } },
        fai: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ check }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating conformity check:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du contrôle de conformité' },
      { status: 500 }
    )
  }
}
