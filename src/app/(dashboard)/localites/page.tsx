'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Map,
  Users,
  TreePine,
  Radio,
  Wifi,
  Signal,
  Cable,
  Building2,
} from 'lucide-react'

interface Locality {
  id: string
  name: string
  region: string
  prefecture: string | null
  type: string
  population: number | null
  hasMobile2G: boolean
  hasMobile3G: boolean
  hasMobile4G: boolean
  hasFixedInternet: boolean
  overallQoS: number | null
  coverageScore: number | null
  tested: boolean
  lastTestDate: string | null
  latitude: number | null
  longitude: number | null
  isRoadAxis: boolean
  roadAxisName: string | null
  active: boolean
  createdAt: string
}

const typeConfig: Record<string, { label: string; color: string }> = {
  urbain: { label: 'Urbain', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  periurbain: { label: 'Périurbain', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  rural: { label: 'Rural', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  axe_routier: { label: 'Axe routier', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
}

const regionNames: Record<string, string> = {
  CK: 'Conakry',
  KD: 'Kindia',
  KN: 'Kankan',
  BK: 'Boké',
  MM: 'Mamou',
  NZ: 'Nzérékoré',
  LB: 'Labé',
  FR: 'Faranah',
}

export default function LocalitesPage() {
  const [localities, setLocalities] = useState<Locality[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [testFilter, setTestFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formRegion, setFormRegion] = useState('CK')
  const [formPrefecture, setFormPrefecture] = useState('')
  const [formType, setFormType] = useState<string>('urbain')
  const [formPopulation, setFormPopulation] = useState('')
  const [form2G, setForm2G] = useState(false)
  const [form3G, setForm3G] = useState(false)
  const [form4G, setForm4G] = useState(false)
  const [formFixe, setFormFixe] = useState(false)

  const fetchLocalities = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (regionFilter && regionFilter !== 'all') params.set('region', regionFilter)
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
      if (testFilter && testFilter !== 'all') params.set('tested', testFilter)
      params.set('limit', '100')
      const res = await fetch(`/api/localities?${params}`)
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setLocalities(data.localities || [])
    } catch {
      setError('Impossible de charger les localités')
    } finally {
      setLoading(false)
    }
  }, [regionFilter, typeFilter, testFilter])

  useEffect(() => {
    fetchLocalities()
  }, [fetchLocalities])

  const handleCreate = async () => {
    if (!formName || !formRegion) return
    try {
      const res = await fetch('/api/localities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          region: formRegion,
          prefecture: formPrefecture || undefined,
          type: formType,
          population: formPopulation ? parseInt(formPopulation) : undefined,
          hasMobile2G: form2G,
          hasMobile3G: form3G,
          hasMobile4G: form4G,
          hasFixedInternet: formFixe,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setCreateDialogOpen(false)
      resetForm()
      fetchLocalities()
    } catch (err) {
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormRegion('CK')
    setFormPrefecture('')
    setFormType('urbain')
    setFormPopulation('')
    setForm2G(false)
    setForm3G(false)
    setForm4G(false)
    setFormFixe(false)
  }

  const filtered = localities.filter(
    (l) => l.name.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const totalLocalites = localities.length
  const testees = localities.filter((l) => l.tested).length
  const nonTestees = localities.filter((l) => !l.tested).length
  const zonesRurales = localities.filter((l) => l.type === 'rural').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Localités</h1>
          <p className="text-muted-foreground">
            Gestion des zones géographiques pour les campagnes d&apos;audit
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle localité
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total localités</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalLocalites}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Testées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-emerald-600">{testees}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Non testées</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-red-600">{nonTestees}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zones rurales</CardTitle>
            <TreePine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-green-600">{zonesRurales}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Filters and table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des localités</CardTitle>
          <CardDescription>Toutes les zones géographiques enregistrées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une localité..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {Object.entries(regionNames).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="urbain">Urbain</SelectItem>
                <SelectItem value="periurbain">Périurbain</SelectItem>
                <SelectItem value="rural">Rural</SelectItem>
                <SelectItem value="axe_routier">Axe routier</SelectItem>
              </SelectContent>
            </Select>
            <Select value={testFilter} onValueChange={setTestFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="true">Testées</SelectItem>
                <SelectItem value="false">Non testées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <XCircle className="h-8 w-8 mb-2" />
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mb-2" />
              <p>Aucune localité trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Population</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">2G</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">3G</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">4G</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Fixe</TableHead>
                    <TableHead className="text-center">QoS</TableHead>
                    <TableHead className="text-center">Couverture</TableHead>
                    <TableHead className="text-center">Testée</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const tc = typeConfig[l.type] || typeConfig.urbain
                    return (
                      <TableRow key={l.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium max-w-[180px] truncate">{l.name}</TableCell>
                        <TableCell className="text-sm">{regionNames[l.region] || l.region}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tc.color}`}>
                            {tc.label}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {l.population ? l.population.toLocaleString('fr-FR') : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          {l.hasMobile2G ? <Signal className="h-4 w-4 text-emerald-600 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          {l.hasMobile3G ? <Radio className="h-4 w-4 text-blue-600 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          {l.hasMobile4G ? <Wifi className="h-4 w-4 text-purple-600 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          {l.hasFixedInternet ? <Cable className="h-4 w-4 text-orange-600 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {l.overallQoS !== null ? (
                            <span className={`font-semibold ${l.overallQoS >= 70 ? 'text-emerald-600' : l.overallQoS >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {l.overallQoS}%
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {l.coverageScore !== null ? (
                            <span className={`font-semibold ${l.coverageScore >= 70 ? 'text-emerald-600' : l.coverageScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {l.coverageScore}%
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {l.tested ? (
                            <Badge variant="default" className="gap-1 bg-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Oui
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Non
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href="/carte" title="Voir sur la carte">
                              <Map className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Locality Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle localité</DialogTitle>
            <DialogDescription>
              Ajouter une nouvelle zone géographique pour les campagnes d&apos;audit
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="loc-name">Nom de la localité</Label>
              <Input id="loc-name" placeholder="Ex: Kaloum Centre" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="loc-region">Région</Label>
                <Select value={formRegion} onValueChange={setFormRegion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(regionNames).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loc-type">Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urbain">Urbain</SelectItem>
                    <SelectItem value="periurbain">Périurbain</SelectItem>
                    <SelectItem value="rural">Rural</SelectItem>
                    <SelectItem value="axe_routier">Axe routier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="loc-pref">Préfecture</Label>
                <Input id="loc-pref" placeholder="Ex: Kaloum" value={formPrefecture} onChange={(e) => setFormPrefecture(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loc-pop">Population</Label>
                <Input id="loc-pop" type="number" placeholder="Ex: 50000" value={formPopulation} onChange={(e) => setFormPopulation(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Technologies disponibles</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form2G} onChange={(e) => setForm2G(e.target.checked)} className="rounded border-gray-300" />
                  <Signal className="h-4 w-4 text-emerald-600" />
                  2G Mobile
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form3G} onChange={(e) => setForm3G(e.target.checked)} className="rounded border-gray-300" />
                  <Radio className="h-4 w-4 text-blue-600" />
                  3G Mobile
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form4G} onChange={(e) => setForm4G(e.target.checked)} className="rounded border-gray-300" />
                  <Wifi className="h-4 w-4 text-purple-600" />
                  4G Mobile
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={formFixe} onChange={(e) => setFormFixe(e.target.checked)} className="rounded border-gray-300" />
                  <Cable className="h-4 w-4 text-orange-600" />
                  Internet Fixe
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formName || !formRegion}>
              Créer la localité
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
