'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus, Search, FileText, Calendar, Clock, Banknote, Eye, ChevronLeft, ChevronRight,
  ClipboardCheck, Shield, Award, TrendingUp, CheckCircle2, XCircle, AlertTriangle,
  Building2, Mail, Phone, Globe, FolderOpen,
} from 'lucide-react'

interface AppelOffre {
  id: string
  reference: string
  title: string
  description?: string
  type: string
  status: string
  budget?: number
  currency: string
  startDate?: string
  deadlineDate?: string
  awardedDate?: string
  locality?: string
  durationDays?: number
  createdAt: string
  createdBy?: { id: string; name: string; email: string }
  _count?: { submissions: number; documents: number }
}

interface Soumission {
  id: string
  appelOffreId: string
  companyName: string
  companyEmail?: string
  companyPhone?: string
  companyCountry?: string
  companyRCCM?: string
  companyAddress?: string
  // Administrative
  hasSubmissionLetter: boolean
  hasRCCM: boolean
  hasStatutes: boolean
  hasCompletionAttestations: boolean
  hasTaxClearance: boolean
  hasSocialClearance: boolean
  hasNonBankruptcyCert: boolean
  hasBankGuarantee: boolean
  hasRIB: boolean
  hasLegalRepID: boolean
  hasHonorDeclaration: boolean
  adminDossierComplete: boolean
  // Technical
  hasTechnicalLetter: boolean
  hasMissionUnderstanding: boolean
  hasMethodology: boolean
  hasWorkPlan: boolean
  hasTeamComposition: boolean
  hasEquipment: boolean
  hasReferences: boolean
  hasQualityAssurance: boolean
  technicalDossierComplete: boolean
  // Financial
  globalCost?: number | null
  hasDetailedPricing: boolean
  paymentSchedule?: string | null
  financialDossierComplete: boolean
  // Scores
  adminScore?: number | null
  technicalScore?: number | null
  financialScore?: number | null
  totalScore?: number | null
  rank?: number | null
  proposedAmount?: number | null
  status: string
  createdAt: string
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  draft: { label: 'Brouillon', variant: 'outline' },
  published: { label: 'Publié', variant: 'default' },
  closed: { label: 'Clôturé', variant: 'secondary' },
  awarded: { label: 'Attribué', variant: 'default', className: 'bg-emerald-600 hover:bg-emerald-700' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
}

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  audit: { label: 'Audit', variant: 'default' },
  consultation: { label: 'Consultation', variant: 'secondary' },
  service: { label: 'Service', variant: 'outline' },
}

const soumissionStatusConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  submitted: { label: 'Soumise', className: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  under_review: { label: 'En examen', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle },
  compliant: { label: 'Conforme', className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  non_compliant: { label: 'Non conforme', className: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  awarded: { label: 'Attribué', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Award },
  rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
}

function formatAmount(amount: number | null | undefined, currency: string = 'GNF') {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ' + currency
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

// Admin dossier checklist items
const adminChecklistItems = [
  { key: 'hasSubmissionLetter', label: 'Lettre de soumission' },
  { key: 'hasRCCM', label: 'RCCM' },
  { key: 'hasStatutes', label: 'Statuts' },
  { key: 'hasCompletionAttestations', label: 'Attestations de bonne exécution' },
  { key: 'hasTaxClearance', label: 'Quitus fiscal' },
  { key: 'hasSocialClearance', label: 'Quitus social' },
  { key: 'hasNonBankruptcyCert', label: 'Attestation non-faillite' },
  { key: 'hasBankGuarantee', label: 'Caution bancaire' },
  { key: 'hasRIB', label: 'RIB' },
  { key: 'hasLegalRepID', label: "Pièce d'identité" },
  { key: 'hasHonorDeclaration', label: "Déclaration sur l'honneur" },
] as const

const technicalChecklistItems = [
  { key: 'hasTechnicalLetter', label: 'Lettre soumission technique' },
  { key: 'hasMissionUnderstanding', label: 'Compréhension mission' },
  { key: 'hasMethodology', label: 'Méthodologie' },
  { key: 'hasWorkPlan', label: 'Plan de travail' },
  { key: 'hasTeamComposition', label: "Composition équipe" },
  { key: 'hasEquipment', label: 'Équipements' },
  { key: 'hasReferences', label: 'Références' },
  { key: 'hasQualityAssurance', label: 'Assurance qualité' },
] as const

export default function AppelOffresPage() {
  const [appelOffres, setAppelOffres] = useState<AppelOffre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAO, setSelectedAO] = useState<AppelOffre | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Soumissions state
  const [soumissions, setSoumissions] = useState<Soumission[]>([])
  const [soumissionsLoading, setSoumissionsLoading] = useState(false)
  const [soumissionDialogOpen, setSoumissionDialogOpen] = useState(false)
  const [soumissionDetailOpen, setSoumissionDetailOpen] = useState(false)
  const [selectedSoumission, setSelectedSoumission] = useState<Soumission | null>(null)
  const [savingSoumission, setSavingSoumission] = useState(false)

  // Form state - Appel d'offres
  const [formRef, setFormRef] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState('audit')
  const [formBudget, setFormBudget] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formLocality, setFormLocality] = useState('')
  const [formDuration, setFormDuration] = useState('')

  // Form state - Soumission
  const [sFormCompanyName, setSFormCompanyName] = useState('')
  const [sFormCompanyEmail, setSFormCompanyEmail] = useState('')
  const [sFormCompanyPhone, setSFormCompanyPhone] = useState('')
  const [sFormCompanyCountry, setSFormCompanyCountry] = useState('')
  const [sFormCompanyRCCM, setSFormCompanyRCCM] = useState('')
  const [sFormCompanyAddress, setSFormCompanyAddress] = useState('')
  const [sFormChecklist, setSFormChecklist] = useState<Record<string, boolean>>({})
  const [sFormGlobalCost, setSFormGlobalCost] = useState('')
  const [sFormPaymentSchedule, setSFormPaymentSchedule] = useState('')

  const fetchAppelOffres = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/appel-offres?${params}`)
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setAppelOffres(data.appelOffres || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    fetchAppelOffres()
  }, [fetchAppelOffres])

  const fetchSoumissions = useCallback(async (appelOffreId: string) => {
    try {
      setSoumissionsLoading(true)
      const res = await fetch(`/api/soumissions?appelOffreId=${appelOffreId}&limit=50`)
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setSoumissions(data.soumissions || [])
    } catch {
      setSoumissions([])
    } finally {
      setSoumissionsLoading(false)
    }
  }, [])

  const handleCreate = async () => {
    try {
      setSubmitting(true)
      const body: any = {
        reference: formRef,
        title: formTitle,
        description: formDesc || undefined,
        type: formType,
        budget: formBudget ? parseFloat(formBudget) : undefined,
        startDate: formStartDate || undefined,
        deadlineDate: formDeadline || undefined,
        locality: formLocality || undefined,
        durationDays: formDuration ? parseInt(formDuration) : undefined,
      }
      const res = await fetch('/api/appel-offres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la création')
      }
      setDialogOpen(false)
      resetForm()
      fetchAppelOffres()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormRef('')
    setFormTitle('')
    setFormDesc('')
    setFormType('audit')
    setFormBudget('')
    setFormStartDate('')
    setFormDeadline('')
    setFormLocality('')
    setFormDuration('')
  }

  const resetSoumissionForm = () => {
    setSFormCompanyName('')
    setSFormCompanyEmail('')
    setSFormCompanyPhone('')
    setSFormCompanyCountry('')
    setSFormCompanyRCCM('')
    setSFormCompanyAddress('')
    setSFormChecklist({})
    setSFormGlobalCost('')
    setSFormPaymentSchedule('')
  }

  const openDetail = (ao: AppelOffre) => {
    setSelectedAO(ao)
    setDetailOpen(true)
    fetchSoumissions(ao.id)
  }

  const openSoumissionCreate = () => {
    resetSoumissionForm()
    setSoumissionDialogOpen(true)
  }

  const openSoumissionDetail = (s: Soumission) => {
    setSelectedSoumission(s)
    setSoumissionDetailOpen(true)
  }

  const handleCreateSoumission = async () => {
    if (!selectedAO || !sFormCompanyName) return
    try {
      setSavingSoumission(true)
      const body: any = {
        appelOffreId: selectedAO.id,
        companyName: sFormCompanyName,
        companyEmail: sFormCompanyEmail || undefined,
        companyPhone: sFormCompanyPhone || undefined,
        companyCountry: sFormCompanyCountry || undefined,
        companyRCCM: sFormCompanyRCCM || undefined,
        companyAddress: sFormCompanyAddress || undefined,
        globalCost: sFormGlobalCost ? parseFloat(sFormGlobalCost) : null,
        paymentSchedule: sFormPaymentSchedule || undefined,
        hasDetailedPricing: sFormChecklist.hasDetailedPricing || false,
        ...Object.fromEntries(
          [...adminChecklistItems, ...technicalChecklistItems].map(item => [
            item.key,
            sFormChecklist[item.key] || false,
          ])
        ),
      }
      const res = await fetch('/api/soumissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setSoumissionDialogOpen(false)
      resetSoumissionForm()
      fetchSoumissions(selectedAO.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSavingSoumission(false)
    }
  }

  const handleToggleChecklist = (key: string, checked: boolean) => {
    setSFormChecklist(prev => ({ ...prev, [key]: checked }))
  }

  const handleToggleSoumissionChecklist = async (soumissionId: string, key: string, checked: boolean) => {
    try {
      const res = await fetch('/api/soumissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: soumissionId, [key]: checked }),
      })
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      // Update local state
      setSoumissions(prev => prev.map(s => s.id === soumissionId ? { ...s, ...data.soumission } : s))
      if (selectedSoumission && selectedSoumission.id === soumissionId) {
        setSelectedSoumission(prev => prev ? { ...prev, ...data.soumission } : prev)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getAdminProgress = (s: Soumission | Record<string, boolean>) => {
    const total = adminChecklistItems.length
    const checked = adminChecklistItems.reduce((acc, item) => acc + ((s as any)[item.key] ? 1 : 0), 0)
    return Math.round((checked / total) * 100)
  }

  const getTechnicalProgress = (s: Soumission | Record<string, boolean>) => {
    const total = technicalChecklistItems.length
    const checked = technicalChecklistItems.reduce((acc, item) => acc + ((s as any)[item.key] ? 1 : 0), 0)
    return Math.round((checked / total) * 100)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFinancialProgress = (s: any) => {
    let checked = 0
    let total = 3
    if (s.globalCost) checked++
    if (s.hasDetailedPricing) checked++
    if (s.paymentSchedule) checked++
    return Math.round((checked / total) * 100)
  }

  const totalAOs = appelOffres.length
  const publishedCount = appelOffres.filter(a => a.status === 'published').length
  const awardedCount = appelOffres.filter(a => a.status === 'awarded').length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appels d&apos;offres</h1>
          <p className="text-muted-foreground">
            Gestion des dossiers d&apos;appels d&apos;offres (DAO)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvel appel d&apos;offres
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvel appel d&apos;offres</DialogTitle>
              <DialogDescription>
                Créer un nouveau dossier d&apos;appel d&apos;offres
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ao-ref">Référence</Label>
                <Input id="ao-ref" placeholder="Ex: DAO-2025-004" value={formRef} onChange={e => setFormRef(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ao-title">Titre</Label>
                <Input id="ao-title" placeholder="Titre de l'appel d'offres" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ao-desc">Description</Label>
                <Textarea id="ao-desc" placeholder="Description détaillée..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ao-type">Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audit">Audit</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ao-budget">Budget (GNF)</Label>
                  <Input id="ao-budget" type="number" placeholder="0" value={formBudget} onChange={e => setFormBudget(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ao-start">Date de publication</Label>
                  <Input id="ao-start" type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ao-deadline">Date limite</Label>
                  <Input id="ao-deadline" type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ao-locality">Localisation</Label>
                  <Input id="ao-locality" placeholder="Ex: Conakry" value={formLocality} onChange={e => setFormLocality(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ao-duration">Durée (jours)</Label>
                  <Input id="ao-duration" type="number" placeholder="90" value={formDuration} onChange={e => setFormDuration(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={submitting || !formRef || !formTitle}>
                {submitting ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedAO && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{selectedAO.reference}</code>
                  <Badge variant={statusMap[selectedAO.status]?.variant} className={statusMap[selectedAO.status]?.className}>
                    {statusMap[selectedAO.status]?.label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selectedAO.title}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details" className="gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Détails DAO
                  </TabsTrigger>
                  <TabsTrigger value="soumissions" className="gap-1">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Soumissions ({soumissions.length})
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 max-h-[65vh] overflow-y-auto">
                  <TabsContent value="details" className="space-y-3">
                    <div className="text-sm space-y-3">
                      {selectedAO.description && <p className="text-muted-foreground">{selectedAO.description}</p>}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span>Type : <strong>{typeMap[selectedAO.type]?.label}</strong></span></div>
                        <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-muted-foreground" /><span>Budget : <strong>{formatAmount(selectedAO.budget, selectedAO.currency)}</strong></span></div>
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Publication : {formatDate(selectedAO.startDate)}</span></div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>Limite : {formatDate(selectedAO.deadlineDate)}</span></div>
                      </div>
                      {selectedAO.locality && <p>📍 Localisation : {selectedAO.locality}</p>}
                      {selectedAO.durationDays && <p>⏱ Durée : {selectedAO.durationDays} jours</p>}
                      {selectedAO._count && (
                        <div className="flex gap-4 pt-2 border-t">
                          <span className="text-muted-foreground">{selectedAO._count.submissions} soumission(s)</span>
                          <span className="text-muted-foreground">{selectedAO._count.documents} document(s)</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="soumissions" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Soumissions reçues</h3>
                      <Button size="sm" className="gap-1" onClick={openSoumissionCreate}>
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter
                      </Button>
                    </div>

                    {soumissionsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                    ) : soumissions.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <ClipboardCheck className="h-8 w-8 mb-2" />
                        <p>Aucune soumission enregistrée</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {soumissions.map((s) => {
                          const ssc = soumissionStatusConfig[s.status] || soumissionStatusConfig.submitted
                          const SIcon = ssc.icon
                          return (
                            <Card
                              key={s.id}
                              className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                              onClick={() => openSoumissionDetail(s)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{s.companyName}</span>
                                  {s.companyRCCM && (
                                    <code className="rounded bg-muted px-1 py-0.5 text-xs">{s.companyRCCM}</code>
                                  )}
                                </div>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${ssc.className}`}>
                                  <SIcon className="h-3 w-3" />
                                  {ssc.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                <div>
                                  <span className="text-[10px] text-muted-foreground block">Dossier Admin.</span>
                                  <div className="flex items-center gap-1">
                                    <Progress value={getAdminProgress(s)} className="h-1.5 flex-1" />
                                    <span className="text-[10px] font-medium">{getAdminProgress(s)}%</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block">Offre Technique</span>
                                  <div className="flex items-center gap-1">
                                    <Progress value={getTechnicalProgress(s)} className="h-1.5 flex-1" />
                                    <span className="text-[10px] font-medium">{getTechnicalProgress(s)}%</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block">Offre Financière</span>
                                  <div className="flex items-center gap-1">
                                    <Progress value={getFinancialProgress(s)} className="h-1.5 flex-1" />
                                    <span className="text-[10px] font-medium">{getFinancialProgress(s)}%</span>
                                  </div>
                                </div>
                              </div>
                              {s.totalScore !== null && s.totalScore !== undefined && (
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Score : <strong>{s.totalScore}/100</strong>
                                  </span>
                                  {s.rank && (
                                    <span className="flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      Rang : <strong>#{s.rank}</strong>
                                    </span>
                                  )}
                                  {s.globalCost && (
                                    <span className="flex items-center gap-1">
                                      <Banknote className="h-3 w-3" />
                                      {formatAmount(s.globalCost)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Soumission Create Dialog */}
      <Dialog open={soumissionDialogOpen} onOpenChange={setSoumissionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Nouvelle soumission</DialogTitle>
            <DialogDescription>
              Enregistrer une soumission pour le DAO {selectedAO?.reference}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto space-y-6 py-4">
            {/* Company Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informations entreprise
              </h4>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Nom de l&apos;entreprise *</Label>
                    <Input placeholder="Nom de l'entreprise" value={sFormCompanyName} onChange={e => setSFormCompanyName(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">RCCM</Label>
                    <Input placeholder="RCCM" value={sFormCompanyRCCM} onChange={e => setSFormCompanyRCCM(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Email</Label>
                    <Input placeholder="email@company.com" value={sFormCompanyEmail} onChange={e => setSFormCompanyEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Téléphone</Label>
                    <Input placeholder="+224..." value={sFormCompanyPhone} onChange={e => setSFormCompanyPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Pays</Label>
                    <Input placeholder="Guinée" value={sFormCompanyCountry} onChange={e => setSFormCompanyCountry(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Adresse</Label>
                  <Input placeholder="Adresse de l'entreprise" value={sFormCompanyAddress} onChange={e => setSFormCompanyAddress(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Administrative Dossier */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Dossier Administratif
              </h4>
              <div className="mb-2 flex items-center gap-2">
                <Progress value={getAdminProgress(sFormChecklist)} className="h-2 flex-1" />
                <span className="text-xs font-medium">{getAdminProgress(sFormChecklist)}%</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {adminChecklistItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 rounded border p-2 hover:bg-muted/30">
                    <Checkbox
                      checked={sFormChecklist[item.key] || false}
                      onCheckedChange={(checked) => handleToggleChecklist(item.key, !!checked)}
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Offer */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-purple-500" />
                Offre Technique
              </h4>
              <div className="mb-2 flex items-center gap-2">
                <Progress value={getTechnicalProgress(sFormChecklist)} className="h-2 flex-1" />
                <span className="text-xs font-medium">{getTechnicalProgress(sFormChecklist)}%</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {technicalChecklistItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 rounded border p-2 hover:bg-muted/30">
                    <Checkbox
                      checked={sFormChecklist[item.key] || false}
                      onCheckedChange={(checked) => handleToggleChecklist(item.key, !!checked)}
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Offer */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-500" />
                Offre Financière
              </h4>
              <div className="mb-2 flex items-center gap-2">
                <Progress value={getFinancialProgress({ globalCost: sFormGlobalCost ? parseFloat(sFormGlobalCost) : null, hasDetailedPricing: sFormChecklist.hasDetailedPricing, paymentSchedule: sFormPaymentSchedule })} className="h-2 flex-1" />
                <span className="text-xs font-medium">
                  {getFinancialProgress({ globalCost: sFormGlobalCost ? parseFloat(sFormGlobalCost) : null, hasDetailedPricing: sFormChecklist.hasDetailedPricing, paymentSchedule: sFormPaymentSchedule })}%
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">Coût global (GNF)</Label>
                  <Input type="number" placeholder="0" value={sFormGlobalCost} onChange={e => setSFormGlobalCost(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 rounded border p-2">
                  <Checkbox
                    checked={sFormChecklist.hasDetailedPricing || false}
                    onCheckedChange={(checked) => handleToggleChecklist('hasDetailedPricing', !!checked)}
                  />
                  <span className="text-sm">Détail des prix</span>
                </div>
              </div>
              <div className="grid gap-1 mt-2">
                <Label className="text-xs">Plan de paiement</Label>
                <Textarea placeholder="Description du plan de paiement..." value={sFormPaymentSchedule} onChange={e => setSFormPaymentSchedule(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoumissionDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateSoumission} disabled={savingSoumission || !sFormCompanyName}>
              {savingSoumission ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Soumission Detail Dialog */}
      <Dialog open={soumissionDetailOpen} onOpenChange={setSoumissionDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          {selectedSoumission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedSoumission.companyName}
                  {selectedSoumission.companyRCCM && (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{selectedSoumission.companyRCCM}</code>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Soumission pour le DAO {selectedAO?.reference}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[65vh] overflow-y-auto space-y-6">
                {/* Status & Compliance Badge */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const ssc = soumissionStatusConfig[selectedSoumission.status] || soumissionStatusConfig.submitted
                    const SIcon = ssc.icon
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${ssc.className}`}>
                        <SIcon className="h-4 w-4" />
                        {ssc.label}
                      </span>
                    )
                  })()}
                </div>

                {/* Company info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedSoumission.companyEmail && (
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{selectedSoumission.companyEmail}</div>
                  )}
                  {selectedSoumission.companyPhone && (
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selectedSoumission.companyPhone}</div>
                  )}
                  {selectedSoumission.companyCountry && (
                    <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{selectedSoumission.companyCountry}</div>
                  )}
                  {selectedSoumission.companyAddress && (
                    <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{selectedSoumission.companyAddress}</div>
                  )}
                </div>

                {/* Administrative Dossier */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Dossier Administratif
                    </h4>
                    <div className="flex items-center gap-2">
                      <Progress value={getAdminProgress(selectedSoumission)} className="h-2 w-24" />
                      <span className="text-xs font-medium">{getAdminProgress(selectedSoumission)}%</span>
                      {selectedSoumission.adminDossierComplete && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {adminChecklistItems.map((item) => (
                      <div key={item.key} className="flex items-center gap-2 rounded border p-1.5 hover:bg-muted/30">
                        <Checkbox
                          checked={(selectedSoumission as any)[item.key] || false}
                          onCheckedChange={(checked) => handleToggleSoumissionChecklist(selectedSoumission.id, item.key, !!checked)}
                        />
                        <span className="text-xs">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Offer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-purple-500" />
                      Offre Technique
                    </h4>
                    <div className="flex items-center gap-2">
                      <Progress value={getTechnicalProgress(selectedSoumission)} className="h-2 w-24" />
                      <span className="text-xs font-medium">{getTechnicalProgress(selectedSoumission)}%</span>
                      {selectedSoumission.technicalDossierComplete && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {technicalChecklistItems.map((item) => (
                      <div key={item.key} className="flex items-center gap-2 rounded border p-1.5 hover:bg-muted/30">
                        <Checkbox
                          checked={(selectedSoumission as any)[item.key] || false}
                          onCheckedChange={(checked) => handleToggleSoumissionChecklist(selectedSoumission.id, item.key, !!checked)}
                        />
                        <span className="text-xs">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Offer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-emerald-500" />
                      Offre Financière
                    </h4>
                    <div className="flex items-center gap-2">
                      <Progress value={getFinancialProgress(selectedSoumission)} className="h-2 w-24" />
                      <span className="text-xs font-medium">{getFinancialProgress(selectedSoumission)}%</span>
                      {selectedSoumission.financialDossierComplete && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border p-2">
                      <p className="text-xs text-muted-foreground">Coût global</p>
                      <p className="font-semibold text-sm">{selectedSoumission.globalCost ? formatAmount(selectedSoumission.globalCost) : '—'}</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-xs text-muted-foreground">Détail des prix</p>
                      <p className="text-sm">{selectedSoumission.hasDetailedPricing ? '✅ Fourni' : '❌ Non fourni'}</p>
                    </div>
                  </div>
                  {selectedSoumission.paymentSchedule && (
                    <div className="rounded border p-2 mt-2">
                      <p className="text-xs text-muted-foreground">Plan de paiement</p>
                      <p className="text-sm">{selectedSoumission.paymentSchedule}</p>
                    </div>
                  )}
                </div>

                {/* Evaluation Scores */}
                {(selectedSoumission.adminScore !== null || selectedSoumission.technicalScore !== null || selectedSoumission.financialScore !== null) && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                      Évaluation
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Card className="p-3">
                        <p className="text-xs text-muted-foreground">Score Admin.</p>
                        <p className="text-lg font-bold text-blue-600">{selectedSoumission.adminScore ?? '—'}</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-xs text-muted-foreground">Score Technique</p>
                        <p className="text-lg font-bold text-purple-600">{selectedSoumission.technicalScore ?? '—'}</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-xs text-muted-foreground">Score Financier</p>
                        <p className="text-lg font-bold text-emerald-600">{selectedSoumission.financialScore ?? '—'}</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-xs text-muted-foreground">Score Total</p>
                        <p className="text-lg font-bold text-amber-600">
                          {selectedSoumission.totalScore ?? '—'}
                          {selectedSoumission.rank && (
                            <span className="text-xs font-normal text-muted-foreground ml-1">#{selectedSoumission.rank}</span>
                          )}
                        </p>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total appels d&apos;offres</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appelOffres.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publiés</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attribués</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awardedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des appels d&apos;offres</CardTitle>
          <CardDescription>Tous les dossiers d&apos;appels d&apos;offres enregistrés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre ou référence..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="closed">Clôturé</SelectItem>
                <SelectItem value="awarded">Attribué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">{error}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Limite</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appelOffres.map((ao) => (
                    <TableRow key={ao.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{ao.reference}</code>
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">{ao.title}</TableCell>
                      <TableCell>
                        <Badge variant={typeMap[ao.type]?.variant || 'outline'}>
                          {typeMap[ao.type]?.label || ao.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatAmount(ao.budget, ao.currency)}</TableCell>
                      <TableCell className="text-sm">{formatDate(ao.deadlineDate)}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[ao.status]?.variant} className={statusMap[ao.status]?.className}>
                          {statusMap[ao.status]?.label || ao.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(ao)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {appelOffres.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aucun appel d&apos;offres trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
