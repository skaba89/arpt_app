import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from './jwt-auth'

export async function getAuthFromRequest(request: NextRequest) {
  const token = request.cookies.get('arpt-session')?.value
  if (!token) return null

  const payload = await verifyJwt(token)
  if (!payload) return null

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    service: payload.service,
  }
}

export function requireRoles(...roles: string[]) {
  return async (request: NextRequest) => {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (!roles.includes(auth.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }
    return null
  }
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  return { page, limit, skip: (page - 1) * limit }
}
