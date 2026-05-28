/**
 * ARPT Guinée - Client API réutilisable
 *
 * Fetch wrapper qui gère automatiquement :
 * - Lecture du token JWT depuis le stockage client
 * - Header Authorization Bearer
 * - Gestion des erreurs 401 (redirection login)
 * - Réponses typées
 * - Credentials include pour cookie httpOnly
 */

// ── Types ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

// ── Client-side token storage ────────────────────────────────

let clientToken: string | null = null

/** Store the JWT token on the client side (called after login) */
export function setClientToken(token: string | null) {
  clientToken = token
  if (token) {
    try {
      sessionStorage.setItem('arpt-token', token)
    } catch {
      // sessionStorage may not be available
    }
  } else {
    try {
      sessionStorage.removeItem('arpt-token')
    } catch {
      // ignore
    }
  }
}

/** Get the stored JWT token (client-side) */
export function getClientToken(): string | null {
  if (clientToken) return clientToken
  try {
    if (typeof window !== 'undefined') {
      clientToken = sessionStorage.getItem('arpt-token')
      return clientToken
    }
  } catch {
    // ignore
  }
  return null
}

// ── Error class ──────────────────────────────────────────────

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

// ── Core fetch wrapper ───────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options

  // Build URL with query params
  let url = endpoint
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  // Add Authorization header if we have a client-side token
  const token = getClientToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Always send httpOnly cookies
    })

    // Parse JSON response
    const data: ApiResponse<T> = await response.json()

    // Handle 401 - Unauthorized
    if (response.status === 401) {
      setClientToken(null)
      // Redirect to login if on client side
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiError(401, 'UNAUTHORIZED', data.error?.message || 'Session expirée')
    }

    // Handle other error statuses
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'Une erreur est survenue',
        data.error?.details
      )
    }

    return data
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) throw error

    // Network errors
    throw new ApiError(0, 'NETWORK_ERROR', 'Erreur de connexion au serveur')
  }
}

// ── Typed HTTP methods ───────────────────────────────────────

export const apiClient = {
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: 'GET',
      params: options?.params,
      signal: options?.signal,
    })
  },

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      params: options?.params,
      signal: options?.signal,
    })
  },

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      params: options?.params,
      signal: options?.signal,
    })
  },

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      params: options?.params,
      signal: options?.signal,
    })
  },

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: 'DELETE',
      params: options?.params,
      signal: options?.signal,
    })
  },
}


