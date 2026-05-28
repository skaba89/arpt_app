'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Image as ImageIcon,
  File,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api-client'
import { useAuth } from '@/providers/auth-provider'

interface Document {
  id: string
  filename: string
  mimeType: string
  size: number
  path: string
  category: string | null
  description: string | null
  entityId: string
  entityType: string
  uploadedById: string | null
  uploadedBy?: {
    id: string
    name: string | null
    email: string
    role: string
  } | null
  createdAt: string
  updatedAt: string
}

interface FileUploadProps {
  entityId: string
  entityType: 'complaint' | 'audit' | 'decision' | 'qos' | 'sanction' | 'operator'
  category?: string
  maxFiles?: number
  readOnly?: boolean
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType === 'application/pdf') return FileText
  return File
}

const categoryLabels: Record<string, string> = {
  rapport: 'Rapport',
  piece_jointe: 'Pièce jointe',
  decision: 'Décision',
  audit: 'Audit',
  autre: 'Autre',
}

export function FileUpload({ entityId, entityType, category, maxFiles, readOnly = false }: FileUploadProps) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin'

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<{ documents: Document[] }>('/api/documents', {
        params: { entityId, entityType, limit: 100 },
      })
      if (response.success && response.data) {
        setDocuments(response.data.documents || [])
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erreur de chargement des documents')
      }
    } finally {
      setLoading(false)
    }
  }, [entityId, entityType])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const uploadFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Type de fichier non autorisé: ${file.type}. Types acceptés: PDF, images (JPEG, PNG, GIF), Office (DOC, DOCX, XLS, XLSX), CSV, TXT`)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Fichier trop volumineux (max 10MB)')
      return
    }

    if (maxFiles && documents.length >= maxFiles) {
      setError(`Nombre maximum de fichiers atteint (${maxFiles})`)
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityId', entityId)
      formData.append('entityType', entityType)
      if (category) formData.append('category', category)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      // We need to use fetch directly for FormData since apiClient uses JSON
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('arpt-token') : null
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erreur lors du téléchargement')
      }

      // Refresh documents list
      await fetchDocuments()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erreur lors du téléchargement du fichier')
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(uploadFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (readOnly) return
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!readOnly) setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDelete = async (docId: string) => {
    try {
      setDeleting(true)
      await apiClient.delete('/api/documents', { params: { id: docId } })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      setDeleteConfirm(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erreur lors de la suppression du document')
      }
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('arpt-token') : null
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`/api/documents/${doc.id}/download`, {
        headers,
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erreur de téléchargement')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError('Erreur lors du téléchargement du fichier')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {documents.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" className="ml-auto h-auto p-0 text-destructive" onClick={() => setError(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Téléchargement en cours...
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Drop zone */}
        {!readOnly && !uploading && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer
              transition-colors
              ${dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <Upload className={`h-8 w-8 mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium text-center">
              {dragOver ? 'Déposez le fichier ici' : 'Glissez-déposez un fichier ici'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              PDF, images, Office, CSV, TXT — Max 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        )}

        {/* Documents list */}
        {loading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Chargement des documents...
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.mimeType)
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatFileSize(doc.size)}</span>
                      {doc.category && (
                        <>
                          <span>·</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {categoryLabels[doc.category] || doc.category}
                          </Badge>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                      {doc.uploadedBy && (
                        <>
                          <span>·</span>
                          <span>{doc.uploadedBy.name || doc.uploadedBy.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(doc)
                      }}
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isAdmin && !readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm(doc.id)
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          !readOnly ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun document attaché. Ajoutez un fichier ci-dessus.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun document attaché.
            </p>
          )
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
