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
import { ClipboardCheck, Search } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api-client'

interface Operator {
  id: string
  name: string
  code: string
}

interface Audit {
  id: string
  reference: string
  title: string
  description: string
  type: string
  status: string
  startDate: string | null
  endDate: string | null
  operatorId: string | null
  operator?: Operator | null
  createdAt: string
}

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  conformite: { label: 'Conformité', variant: 'secondary' },
  technique: { label: 'Technique', variant: 'default' },
  financier: { label: 'Financier', variant: 'destructive' },
  procedure: { label: 'Procédure', variant: 'outline' },
  autre: { label: 'Autre', variant: 'secondary' },
  coverage: { label: 'Couverture', variant: 'default' },
  compliance: { label: 'Conformité', variant: 'secondary' },
  qos: { label: 'QoS', variant: 'outline' },
  financial: { label: 'Financier', variant: 'destructive' },
  security: { label: 'Sécurité', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  planned: { label: 'Planifié', variant: 'outline' },
  in_progress: { label: 'En cours', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  completed: { label: 'Terminé', variant: 'secondary' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadAudits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<Audit[]>('/api/audits', {
        params: { limit: 100 },
      })
      if (response.success && response.data) {
        setAudits(response.data)
      } else {
        setError(response.error?.message || 'Erreur de chargement')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erreur de chargement des audits')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAudits()
  }, [loadAudits])

  const filtered = audits.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.reference.toLowerCase().includes(search.toLowerCase()) ||
      (a.operator?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audits</h1>
        <p className="text-muted-foreground">
          Planification et suivi des audits de conformité et de performance
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total audits</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{audits.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {audits.filter((a) => a.status === 'in_progress').length}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terminés</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {audits.filter((a) => a.status === 'completed').length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des audits</CardTitle>
          <CardDescription>Tous les audits planifiés et réalisés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un audit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={loadAudits}>
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
                  <TableHead>Opérateur</TableHead>
                  <TableHead>Date de début</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                          {audit.reference}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {audit.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeMap[audit.type]?.variant}
                          className={typeMap[audit.type]?.className}
                        >
                          {typeMap[audit.type]?.label || audit.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{audit.operator?.name || '—'}</TableCell>
                      <TableCell>
                        {audit.startDate
                          ? new Date(audit.startDate).toLocaleDateString('fr-FR')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusMap[audit.status]?.variant}
                          className={statusMap[audit.status]?.className}
                        >
                          {statusMap[audit.status]?.label || audit.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun audit trouvé
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
