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
import { Gavel, Search } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api-client'

interface Operator {
  id: string
  name: string
  code: string
}

interface Sanction {
  id: string
  reference: string
  title: string
  description: string
  type: string
  amount: number | null
  operatorId: string
  operator?: Operator
  status: string
  createdAt: string
}

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  avertissement: { label: 'Avertissement', variant: 'outline' },
  amine: { label: 'Amende', variant: 'destructive' },
  suspension: { label: 'Suspension', variant: 'default', className: 'bg-orange-500 hover:bg-orange-600' },
  retrait_licence: { label: 'Retrait de licence', variant: 'destructive' },
  autre: { label: 'Autre', variant: 'secondary' },
  financial: { label: 'Financière', variant: 'destructive' },
  warning: { label: 'Avertissement', variant: 'outline' },
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  proposed: { label: 'Proposée', variant: 'outline' },
  decided: { label: 'Décidée', variant: 'default' },
  executed: { label: 'Exécutée', variant: 'secondary' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
}

function formatAmount(amount: number | null) {
  if (amount === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' GNF'
}

export default function SanctionsPage() {
  const [sanctions, setSanctions] = useState<Sanction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadSanctions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<Sanction[]>('/api/sanctions', {
        params: { limit: 100 },
      })
      if (response.success && response.data) {
        setSanctions(response.data)
      } else {
        setError(response.error?.message || 'Erreur de chargement')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erreur de chargement des sanctions')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSanctions()
  }, [loadSanctions])

  const filtered = sanctions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.reference.toLowerCase().includes(search.toLowerCase()) ||
      (s.operator?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalProposed = sanctions
    .filter((s) => s.status === 'proposed' && s.amount)
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sanctions</h1>
        <p className="text-muted-foreground">
          Gestion des sanctions infligées aux opérateurs de télécommunications
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total sanctions</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{sanctions.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proposées</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {sanctions.filter((s) => s.status === 'proposed').length}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Décidées</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {sanctions.filter((s) => s.status === 'decided').length}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant proposé</CardTitle>
            <span className="text-xs text-muted-foreground">GNF</span>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-destructive">
                {formatAmount(totalProposed)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des sanctions</CardTitle>
          <CardDescription>Toutes les sanctions enregistrées sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une sanction..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={loadSanctions}>
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
                  <TableHead className="text-right">Montant</TableHead>
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
                  filtered.map((sanction) => (
                    <TableRow key={sanction.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                          {sanction.reference}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {sanction.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeMap[sanction.type]?.variant}
                          className={typeMap[sanction.type]?.className}
                        >
                          {typeMap[sanction.type]?.label || sanction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{sanction.operator?.name || '—'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(sanction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMap[sanction.status]?.variant}>
                          {statusMap[sanction.status]?.label || sanction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucune sanction trouvée
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
