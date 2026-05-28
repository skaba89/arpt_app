'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollText, Search } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api-client'

interface DecidedByUser {
  id: string
  name: string
  role: string
}

interface Decision {
  id: string
  reference: string
  title: string
  description: string
  type: string
  status: string
  decidedById: string | null
  decidedBy?: DecidedByUser | null
  decidedAt: string | null
  publishedAt: string | null
  createdAt: string
}

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  reglementaire: { label: 'Réglementation', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
  sanction: { label: 'Sanction', variant: 'destructive' },
  arbitrage: { label: 'Arbitrage', variant: 'secondary' },
  attribution: { label: 'Attribution', variant: 'default' },
  autre: { label: 'Autre', variant: 'outline' },
  attribution_frequences: { label: 'Attribution', variant: 'default' },
  licence: { label: 'Licence', variant: 'secondary' },
  tarif: { label: 'Tarif', variant: 'outline' },
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  draft: { label: 'Brouillon', variant: 'outline' },
  pending: { label: 'En attente', variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
  published: { label: 'Publiée', variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-600' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
}

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadDecisions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<Decision[]>('/api/decisions', {
        params: { limit: 100 },
      })
      if (response.success && response.data) {
        setDecisions(response.data)
      } else {
        setError(response.error?.message || 'Erreur de chargement')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erreur de chargement des décisions')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDecisions()
  }, [loadDecisions])

  const filtered = decisions.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.reference.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Décisions</h1>
        <p className="text-muted-foreground">
          Décisions réglementaires et administratives de l&apos;ARPT
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total décisions</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{decisions.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publiées</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {decisions.filter((d) => d.status === 'published').length}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Brouillons</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {decisions.filter((d) => d.status === 'draft').length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des décisions</CardTitle>
          <CardDescription>Toutes les décisions réglementaires enregistrées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une décision..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={loadDecisions}>
                Réessayer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Décidé par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((decision) => (
                    <TableRow key={decision.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                          {decision.reference}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {decision.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeMap[decision.type]?.variant}
                          className={typeMap[decision.type]?.className}
                        >
                          {typeMap[decision.type]?.label || decision.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusMap[decision.status]?.variant}
                          className={statusMap[decision.status]?.className}
                        >
                          {statusMap[decision.status]?.label || decision.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{decision.decidedBy?.name || '—'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucune décision trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
