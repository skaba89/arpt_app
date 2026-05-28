import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, parsePagination } from '@/lib/api-auth'
import { z } from 'zod'

const soumissionCreateSchema = z.object({
  appelOffreId: z.string().min(1, "Appel d'offre requis"),
  companyName: z.string().min(1, 'Nom de l\'entreprise requis').max(200),
  companyEmail: z.string().email().optional().or(z.literal('')),
  companyPhone: z.string().max(50).optional(),
  companyCountry: z.string().max(100).optional(),
  companyRCCM: z.string().max(100).optional(),
  companyAddress: z.string().max(500).optional(),
  // Administrative dossier
  hasSubmissionLetter: z.boolean().optional().default(false),
  hasRCCM: z.boolean().optional().default(false),
  hasStatutes: z.boolean().optional().default(false),
  hasCompletionAttestations: z.boolean().optional().default(false),
  hasTaxClearance: z.boolean().optional().default(false),
  hasSocialClearance: z.boolean().optional().default(false),
  hasNonBankruptcyCert: z.boolean().optional().default(false),
  hasBankGuarantee: z.boolean().optional().default(false),
  hasRIB: z.boolean().optional().default(false),
  hasLegalRepID: z.boolean().optional().default(false),
  hasHonorDeclaration: z.boolean().optional().default(false),
  // Technical offer
  hasTechnicalLetter: z.boolean().optional().default(false),
  hasMissionUnderstanding: z.boolean().optional().default(false),
  hasMethodology: z.boolean().optional().default(false),
  hasWorkPlan: z.boolean().optional().default(false),
  hasTeamComposition: z.boolean().optional().default(false),
  hasEquipment: z.boolean().optional().default(false),
  hasReferences: z.boolean().optional().default(false),
  hasQualityAssurance: z.boolean().optional().default(false),
  // Financial offer
  globalCost: z.number().positive().optional().nullable(),
  hasDetailedPricing: z.boolean().optional().default(false),
  paymentSchedule: z.string().max(1000).optional(),
  // Scores
  technicalScore: z.number().min(0).max(100).optional().nullable(),
  financialScore: z.number().min(0).max(100).optional().nullable(),
  adminScore: z.number().min(0).max(100).optional().nullable(),
  totalScore: z.number().min(0).max(100).optional().nullable(),
  proposedAmount: z.number().positive().optional().nullable(),
  rank: z.number().int().positive().optional().nullable(),
  status: z.enum(['submitted', 'under_review', 'compliant', 'non_compliant', 'awarded', 'rejected']).optional().default('submitted'),
})

const soumissionUpdateSchema = soumissionCreateSchema.partial().omit({ appelOffreId: true })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appelOffreId = searchParams.get('appelOffreId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: Record<string, unknown> = {}
    if (appelOffreId) where.appelOffreId = appelOffreId
    if (status) where.status = status

    const [soumissions, total] = await Promise.all([
      db.soumission.findMany({
        where,
        include: {
          appelOffre: {
            select: {
              id: true,
              reference: true,
              title: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.soumission.count({ where }),
    ])

    return NextResponse.json({
      soumissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching soumissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des soumissions' },
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

    const body = await request.json()
    const validated = soumissionCreateSchema.parse(body)

    // Verify appel d'offre exists
    const ao = await db.appelOffre.findUnique({
      where: { id: validated.appelOffreId },
    })
    if (!ao) {
      return NextResponse.json(
        { error: "Appel d'offres introuvable" },
        { status: 404 }
      )
    }

    // Auto-calculate dossier completeness
    const adminFields = [
      validated.hasSubmissionLetter, validated.hasRCCM, validated.hasStatutes,
      validated.hasCompletionAttestations, validated.hasTaxClearance, validated.hasSocialClearance,
      validated.hasNonBankruptcyCert, validated.hasBankGuarantee, validated.hasRIB,
      validated.hasLegalRepID, validated.hasHonorDeclaration,
    ]
    const adminDossierComplete = adminFields.every(Boolean)

    const techFields = [
      validated.hasTechnicalLetter, validated.hasMissionUnderstanding, validated.hasMethodology,
      validated.hasWorkPlan, validated.hasTeamComposition, validated.hasEquipment,
      validated.hasReferences, validated.hasQualityAssurance,
    ]
    const technicalDossierComplete = techFields.every(Boolean)

    const financialDossierComplete = !!(validated.globalCost && validated.hasDetailedPricing)

    const soumission = await db.soumission.create({
      data: {
        ...validated,
        adminDossierComplete,
        technicalDossierComplete,
        financialDossierComplete,
      },
    })

    return NextResponse.json({ soumission }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating soumission:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la soumission' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const validated = soumissionUpdateSchema.parse(updateData)

    // Auto-calculate dossier completeness from the update data
    // First get existing soumission
    const existing = await db.soumission.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })
    }

    // Merge existing + new data for completeness calculation
    const merged = { ...existing, ...validated }

    const adminFields = [
      merged.hasSubmissionLetter, merged.hasRCCM, merged.hasStatutes,
      merged.hasCompletionAttestations, merged.hasTaxClearance, merged.hasSocialClearance,
      merged.hasNonBankruptcyCert, merged.hasBankGuarantee, merged.hasRIB,
      merged.hasLegalRepID, merged.hasHonorDeclaration,
    ]
    const adminDossierComplete = adminFields.every(Boolean)

    const techFields = [
      merged.hasTechnicalLetter, merged.hasMissionUnderstanding, merged.hasMethodology,
      merged.hasWorkPlan, merged.hasTeamComposition, merged.hasEquipment,
      merged.hasReferences, merged.hasQualityAssurance,
    ]
    const technicalDossierComplete = techFields.every(Boolean)

    const financialDossierComplete = !!(merged.globalCost && merged.hasDetailedPricing)

    const soumission = await db.soumission.update({
      where: { id },
      data: {
        ...validated,
        adminDossierComplete,
        technicalDossierComplete,
        financialDossierComplete,
      },
    })

    return NextResponse.json({ soumission })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating soumission:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la soumission' },
      { status: 500 }
    )
  }
}
