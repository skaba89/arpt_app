'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setClientToken, getClientToken } from '@/lib/api-client'

interface User {
  id: string
  email: string
  name: string
  role: string
  service?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        // Try to get stored token first
        const storedToken = getClientToken()

        const res = await fetch('/api/auth/[...nextauth]', {
          method: 'GET',
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.user) {
            setUser(data.user)
          }
        } else if (!storedToken) {
          // No valid session and no stored token
          setUser(null)
        }
      } catch {
        // Session check failed, user is not authenticated
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur de connexion' }
      }

      // Store the JWT token from login response for Authorization header usage
      if (data.data?.token) {
        setClientToken(data.data.token)
      }

      setUser(data.data?.user || data.user)
      return { success: true }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // Ignore logout errors
    } finally {
      setClientToken(null)
      setUser(null)
      router.push('/login')
    }
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
