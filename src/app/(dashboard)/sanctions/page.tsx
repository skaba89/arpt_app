'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Gavel, Search } from 'lucide-react'

const mockSanctions = [
  { id: '1', reference: 'SAN-2025-001', title: 'Non-respect des seuils QoS Q3 2024', type: 'financial', operator: 'Celcom Guinée', amount: 50000000, status: 'proposed' },
  { id: '2', reference: 'SAN-2025-002', title: 'Retard de déclaration de couverture', type: 'financial', operator: 'MTN Guinée', amount: 25000000, status: 'decided' },
  { id: '3', reference: 'SAN-2024-015', title: 'Interruption de service non signalée', type: 'suspension', operator: 'Sotelgui', amount: null, status: 'executed' },
  { id: '4', reference: 'SAN-2025-003', title: 'Non-conformité aux conditions de licence', type: 'financial', operator: 'Orange Guinée', amount: 75000000, status: 'proposed' },
  { id: '5', reference: 'SAN-2024-012', title: 'Publicité mensongère sur les tarifs', type: 'warning', operator: 'MTN Guinée', amount: null, status: 'executed' },
  { id: '6', reference: 'SAN-2024-010', title: 'Défaut de qualité voix persistant', type: 'financial', operator: 'Celcom Guinée', amount: 30000000, status: 'decided' },
  { id: '7', reference: 'SAN-2025-004', title: 'Non-respect obligations couverture rurale', type: 'financial', operator: 'Orange Guinée', amount: 40000000, status: 'proposed' },
]

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  financial: { label: 'Financière', variant: 'destructive' },
  suspension: { label: 'Suspension', variant: 'default', className: 'bg-orange-500 hover:bg-orange-600' },
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
  const [search, setSearch] = useState('')

  const filtered = mockSanctions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.reference.toLowerCase().includes(search.toLowerCase()) ||
      s.operator.toLowerCase().includes(search.toLowerCase())
  )

  const totalProposed = mockSanctions
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
            <div className="text-2xl font-bold">{mockSanctions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proposées</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSanctions.filter((s) => s.status === 'proposed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Décidées</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSanctions.filter((s) => s.status === 'decided').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant proposé</CardTitle>
            <span className="text-xs text-muted-foreground">GNF</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatAmount(totalProposed)}
            </div>
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
              {filtered.map((sanction) => (
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
                      {typeMap[sanction.type]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{sanction.operator}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(sanction.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[sanction.status]?.variant}>
                      {statusMap[sanction.status]?.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucune sanction trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
