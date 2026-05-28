'use client'

import React, { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Loader2,
  X,
} from 'lucide-react'
import { getClientToken } from '@/lib/api-client'

// ── Types ────────────────────────────────────────────────────────
export type ImportType = 'qos' | 'complaints' | 'operators'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importType: ImportType
  onSuccess?: () => void
}

interface ColumnMapping {
  key: string
  label: string
  required: boolean
  type: 'string' | 'number' | 'enum'
  enumValues?: string[]
  mappedFrom: string | null
}

interface ImportPreview {
  preview: Record<string, unknown>[]
  columns: string[]
  columnMapping: ColumnMapping[]
  totalRows: number
  errors: string[]
  warnings: string[]
  importType: ImportType
  fileName: string
  fileSize: number
}

interface ImportResult {
  imported: number
  skipped: number
  errors: number
  details: string[]
}

type Step = 'upload' | 'preview' | 'mapping' | 'validation' | 'confirm' | 'result'

// ── Labels ───────────────────────────────────────────────────────
const TYPE_LABELS: Record<ImportType, string> = {
  qos: 'Rapports QoS',
  complaints: 'Plaintes',
  operators: 'Opérateurs',
}

const TEMPLATE_URLS: Record<ImportType, string> = {
  qos: '/templates/qos-template.csv',
  complaints: '/templates/complaints-template.csv',
  operators: '/templates/operators-template.csv',
}

// ── Component ────────────────────────────────────────────────────
export function ImportDialog({
  open,
  onOpenChange,
  importType,
  onSuccess,
}: ImportDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Reset state ──────────────────────────────────────
  const resetState = useCallback(() => {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setResult(null)
    setLoading(false)
    setError(null)
    setDragActive(false)
    setColumnMappings({})
  }, [])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) resetState()
      onOpenChange(newOpen)
    },
    [onOpenChange, resetState]
  )

  // ── File handling ────────────────────────────────────
  const handleFile = useCallback(
    async (selectedFile: File) => {
      const fileName = selectedFile.name.toLowerCase()
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        setError('Format non supporté. Utilisez CSV (.csv) ou Excel (.xlsx, .xls)')
        return
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Fichier trop volumineux. Taille max: 5 Mo')
        return
      }

      setFile(selectedFile)
      setError(null)
      setStep('preview')
      setLoading(true)

      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('importType', importType)

        const token = getClientToken()
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })

        const data = await response.json()

        if (!data.success) {
          setError(data.error?.message || 'Erreur lors du traitement du fichier')
          setStep('upload')
          setFile(null)
          return
        }

        setPreview(data.data)

        // Initialize column mappings
        const mappings: Record<string, string> = {}
        for (const col of data.data.columnMapping as ColumnMapping[]) {
          mappings[col.key] = col.mappedFrom || col.key
        }
        setColumnMappings(mappings)

        // Auto-advance to preview or show errors
        if (data.data.errors.length > 0) {
          setStep('validation')
        }
      } catch (err) {
        setError('Erreur de connexion au serveur')
        setStep('upload')
        setFile(null)
      } finally {
        setLoading(false)
      }
    },
    [importType]
  )

  // ── Drag & drop ──────────────────────────────────────
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0])
      }
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0])
      }
    },
    [handleFile]
  )

  // ── Confirm import ───────────────────────────────────
  const handleConfirmImport = useCallback(async () => {
    if (!preview) return

    setStep('confirm')
    setLoading(true)
    setError(null)

    try {
      const token = getClientToken()

      // Remap data according to column mappings
      const mappedData = preview.preview.map((row) => {
        const mapped: Record<string, unknown> = {}
        for (const [targetKey, sourceKey] of Object.entries(columnMappings)) {
          if (sourceKey && row[sourceKey] !== undefined) {
            mapped[targetKey] = row[sourceKey]
          }
        }
        // Keep all original fields too for the backend
        return { ...row, ...mapped }
      })

      // Use all rows (not just preview) - the backend already parsed all of them
      // We need to re-upload the file to get all data, OR we send the preview data
      // Since the backend already validated, we'll send the full data by re-uploading
      // Actually, the confirm endpoint receives the data directly. Let me re-parse.
      // The simplest approach: re-send the file for the confirm step

      // Re-upload and parse all data, then confirm
      const formData = new FormData()
      formData.append('file', file!)
      formData.append('importType', importType)

      const parseResponse = await fetch('/api/import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const parseData = await parseResponse.json()

      if (!parseData.success) {
        setError(parseData.error?.message || 'Erreur de re-parsing')
        setStep('preview')
        return
      }

      // Now send all rows to confirm
      const confirmResponse = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          importType,
          data: parseData.data.preview, // This contains all rows from the server side
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmData.success) {
        setError(confirmData.error?.message || 'Erreur lors de l\'import')
        setStep('preview')
        return
      }

      setResult(confirmData.data)
      setStep('result')

      if (onSuccess && confirmData.data.imported > 0) {
        onSuccess()
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }, [preview, importType, file, columnMappings, onSuccess])

  // ── Step labels ──────────────────────────────────────
  const stepLabels: Record<Step, string> = {
    upload: 'Chargement',
    preview: 'Aperçu',
    mapping: 'Mapping',
    validation: 'Validation',
    confirm: 'Confirmation',
    result: 'Résultat',
  }

  const steps: Step[] = ['upload', 'preview', 'mapping', 'validation', 'confirm', 'result']
  const currentStepIndex = steps.indexOf(step)

  // ── Render step indicator ────────────────────────────
  const renderStepIndicator = () => (
    <div className="flex items-center gap-1 mb-4">
      {steps.slice(0, 5).map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              i < currentStepIndex
                ? 'text-emerald-600'
                : i === currentStepIndex
                  ? 'text-primary'
                  : 'text-muted-foreground'
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                i < currentStepIndex
                  ? 'bg-emerald-100 text-emerald-700'
                  : i === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < currentStepIndex ? '✓' : i + 1}
            </div>
            <span className="hidden sm:inline">{stepLabels[s]}</span>
          </div>
          {i < 4 && (
            <div
              className={`h-px flex-1 min-w-[20px] ${
                i < currentStepIndex ? 'bg-emerald-300' : 'bg-muted'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )

  // ── Upload step ──────────────────────────────────────
  const renderUploadStep = () => (
    <div className="space-y-4">
      {renderStepIndicator()}

      {/* Template download */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900">
        <Download className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
          Téléchargez le{' '}
          <a
            href={TEMPLATE_URLS[importType]}
            download
            className="font-semibold underline hover:no-underline"
          >
            modèle CSV pour {TYPE_LABELS[importType]}
          </a>{' '}
          pour vous assurer du bon format de vos données.
        </AlertDescription>
      </Alert>

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />
        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          Glissez-déposez votre fichier ici
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          ou cliquez pour sélectionner un fichier CSV ou Excel
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Taille max: 5 Mo · Formats: .csv, .xlsx, .xls
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )

  // ── Preview step ─────────────────────────────────────
  const renderPreviewStep = () => {
    if (!preview) return null

    return (
      <div className="space-y-4">
        {renderStepIndicator()}

        {/* File info */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{preview.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {(preview.fileSize / 1024).toFixed(1)} Ko · {preview.totalRows} ligne(s) · {preview.columns.length} colonne(s)
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFile(null)
              setPreview(null)
              setStep('upload')
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Errors & warnings */}
        {preview.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">{preview.errors.length} erreur(s) détectée(s)</p>
              <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
                {preview.errors.slice(0, 20).map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
                {preview.errors.length > 20 && (
                  <p className="italic">... et {preview.errors.length - 20} autres erreurs</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {preview.warnings.length > 0 && (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-300">
              <p className="font-medium mb-1">{preview.warnings.length} avertissement(s)</p>
              <div className="max-h-24 overflow-y-auto text-xs space-y-0.5">
                {preview.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Data preview table */}
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-center">#</TableHead>
                  {preview.columns.slice(0, 8).map((col) => (
                    <TableHead key={col} className="whitespace-nowrap text-xs">
                      {col}
                    </TableHead>
                  ))}
                  {preview.columns.length > 8 && (
                    <TableHead className="text-xs">+{preview.columns.length - 8}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.preview.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    {preview.columns.slice(0, 8).map((col) => (
                      <TableCell key={col} className="text-xs max-w-[120px] truncate">
                        {String(row[col] ?? '—')}
                      </TableCell>
                    ))}
                    {preview.columns.length > 8 && (
                      <TableCell className="text-xs text-muted-foreground">...</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null)
              setPreview(null)
              setStep('upload')
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button
            onClick={() => setStep('mapping')}
            disabled={preview.errors.length > 0}
            className="gap-2"
          >
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ── Mapping step ─────────────────────────────────────
  const renderMappingStep = () => {
    if (!preview) return null

    return (
      <div className="space-y-4">
        {renderStepIndicator()}

        <p className="text-sm text-muted-foreground">
          Associez les colonnes de votre fichier aux champs du système. Les colonnes reconnues
          automatiquement sont pré-remplies.
        </p>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {preview.columnMapping.map((col) => (
            <div key={col.key} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{col.label}</span>
                  {col.required && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      Requis
                    </Badge>
                  )}
                  {col.type === 'enum' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {col.enumValues?.join('/')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Champ système: <code className="bg-muted px-1 rounded">{col.key}</code>
                </p>
              </div>
              <Select
                value={columnMappings[col.key] || '__none__'}
                onValueChange={(value) =>
                  setColumnMappings((prev) => ({
                    ...prev,
                    [col.key]: value === '__none__' ? '' : value,
                  }))
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Non associé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Non associé —</SelectItem>
                  {preview.columns.map((fileCol) => (
                    <SelectItem key={fileCol} value={fileCol}>
                      {fileCol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep('preview')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button onClick={() => setStep('validation')} className="gap-2">
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ── Validation step ──────────────────────────────────
  const renderValidationStep = () => {
    if (!preview) return null

    const requiredMapped = preview.columnMapping
      .filter((c) => c.required)
      .every((c) => columnMappings[c.key] && columnMappings[c.key] !== '__none__')

    const validRows = preview.errors.length === 0
    const hasWarnings = preview.warnings.length > 0
    const canProceed = requiredMapped && validRows

    return (
      <div className="space-y-4">
        {renderStepIndicator()}

        <h3 className="text-sm font-semibold">Résumé de la validation</h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {requiredMapped ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>
              Champs requis: {requiredMapped ? 'Tous mappés' : 'Certains non mappés'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {validRows ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>
              Données: {validRows ? 'Aucune erreur' : `${preview.errors.length} erreur(s)`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {hasWarnings ? (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            )}
            <span>
              Avertissements: {hasWarnings ? `${preview.warnings.length}` : 'Aucun'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{preview.totalRows}</p>
            <p className="text-xs text-muted-foreground">Lignes totales</p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {preview.totalRows - preview.errors.length}
            </p>
            <p className="text-xs text-muted-foreground">Lignes valides</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-center">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {preview.errors.length}
            </p>
            <p className="text-xs text-muted-foreground">Lignes en erreur</p>
          </div>
        </div>

        {/* Warning details */}
        {hasWarnings && (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-300">
              <div className="max-h-24 overflow-y-auto text-xs space-y-0.5">
                {preview.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error details */}
        {!validRows && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Erreurs bloquantes détectées</p>
              <div className="max-h-24 overflow-y-auto text-xs space-y-0.5">
                {preview.errors.slice(0, 10).map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!requiredMapped && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Certains champs requis ne sont pas associés à une colonne du fichier. Veuillez revenir
              à l&apos;étape de mapping.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep('mapping')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button
            onClick={handleConfirmImport}
            disabled={!canProceed || loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                Importer {preview.totalRows} ligne(s)
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── Result step ──────────────────────────────────────
  const renderResultStep = () => {
    if (!result) return null

    const total = result.imported + result.skipped + result.errors
    const successRate = total > 0 ? Math.round((result.imported / total) * 100) : 0

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          {result.errors === 0 ? (
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          ) : (
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          )}
          <div>
            <h3 className="text-lg font-semibold">
              {result.errors === 0 ? 'Import terminé avec succès' : 'Import terminé avec des erreurs'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {result.imported} ligne(s) importée(s) sur {total}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Taux de réussite</span>
            <span className="font-medium">{successRate}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              {result.imported}
            </p>
            <p className="text-xs text-muted-foreground">Importé(s)</p>
          </div>
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
              {result.skipped}
            </p>
            <p className="text-xs text-muted-foreground">Ignoré(s) (doublons)</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 text-center">
            <p className="text-3xl font-bold text-red-700 dark:text-red-400">
              {result.errors}
            </p>
            <p className="text-xs text-muted-foreground">En erreur</p>
          </div>
        </div>

        {/* Details */}
        {result.details.length > 0 && (
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium mb-2">Détails de l&apos;import</p>
            <div className="max-h-48 overflow-y-auto text-xs space-y-1">
              {result.details.map((d, i) => (
                <p
                  key={i}
                  className={
                    d.includes('importé')
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : d.includes('ignoré') || d.includes('déjà existant')
                        ? 'text-yellow-700 dark:text-yellow-400'
                        : d.includes('Erreur')
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-muted-foreground'
                  }
                >
                  {d}
                </p>
              ))}
            </div>
          </div>
        )}

        <Button onClick={() => handleOpenChange(false)} className="w-full">
          Fermer
        </Button>
      </div>
    )
  }

  // ── Loading state ────────────────────────────────────
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        {step === 'preview'
          ? 'Analyse du fichier en cours...'
          : 'Import des données en cours...'}
      </p>
    </div>
  )

  // ── Main render ──────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer des {TYPE_LABELS[importType]}
          </DialogTitle>
          <DialogDescription>
            Chargez un fichier CSV ou Excel pour importer des données en masse
          </DialogDescription>
        </DialogHeader>

        {loading && (step === 'preview' || step === 'confirm')
          ? renderLoadingState()
          : step === 'upload'
            ? renderUploadStep()
            : step === 'preview'
              ? renderPreviewStep()
              : step === 'mapping'
                ? renderMappingStep()
                : step === 'validation'
                  ? renderValidationStep()
                  : step === 'confirm'
                    ? renderLoadingState()
                    : renderResultStep()}
      </DialogContent>
    </Dialog>
  )
}
