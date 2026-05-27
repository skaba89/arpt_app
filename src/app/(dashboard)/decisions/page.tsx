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
import { ScrollText, Search } from 'lucide-react'

const mockDecisions = [
  { id: '1', reference: 'DEC-2025-012', title: 'Décision d\'attribution de fréquences 5G', type: 'attribution', status: 'published', decidedBy: 'Directeur Général' },
  { id: '2', reference: 'DEC-2025-011', title: 'Renouvellement de licence — Orange Guinée', type: 'licence', status: 'published', decidedBy: 'Conseil d\'Administration' },
  { id: '3', reference: 'DEC-2025-010', title: 'Sanction financière — Celcom Guinée', type: 'sanction', status: 'published', decidedBy: 'Directeur Général' },
  { id: '4', reference: 'DEC-2025-009', title: 'Modification des conditions tarifaires', type: 'tarif', status: 'draft', decidedBy: null },
  { id: '5', reference: 'DEC-2024-045', title: 'Décision de résiliation de licence', type: 'licence', status: 'published', decidedBy: 'Conseil d\'Administration' },
  { id: '6', reference: 'DEC-2025-008', title: 'Appel à candidatures — Nouveaux opérateurs', type: 'attribution', status: 'draft', decidedBy: null },
  { id: '7', reference: 'DEC-2024-040', title: 'Normes techniques de qualité de service', type: 'reglementation', status: 'published', decidedBy: 'Directeur Général' },
  { id: '8', reference: 'DEC-2024-038', title: 'Avertissement officiel — MTN Guinée', type: 'sanction', status: 'published', decidedBy: 'Directeur Général' },
  { id: '9', reference: 'DEC-2025-013', title: 'Révision des redevances réglementaires', type: 'tarif', status: 'draft', decidedBy: null },
]

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  attribution: { label: 'Attribution', variant: 'default' },
  licence: { label: 'Licence', variant: 'secondary' },
  sanction: { label: 'Sanction', variant: 'destructive' },
  tarif: { label: 'Tarif', variant: 'outline' },
  reglementation: { label: 'Réglementation', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  draft: { label: 'Brouillon', variant: 'outline' },
  pending: { label: 'En attente', variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
  published: { label: 'Publiée', variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-600' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
}

export default function DecisionsPage() {
  const [search, setSearch] = useState('')

  const filtered = mockDecisions.filter(
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
            <div className="text-2xl font-bold">{mockDecisions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publiées</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDecisions.filter((d) => d.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Brouillons</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDecisions.filter((d) => d.status === 'draft').length}
            </div>
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
              {filtered.map((decision) => (
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
                      {typeMap[decision.type]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusMap[decision.status]?.variant}
                      className={statusMap[decision.status]?.className}
                    >
                      {statusMap[decision.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{decision.decidedBy || '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Aucune décision trouvée
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
