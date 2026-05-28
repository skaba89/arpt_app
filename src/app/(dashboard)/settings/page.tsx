'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/providers/auth-provider'
import { apiClient, ApiError } from '@/lib/api-client'
import { User, Lock, Bell, Shield, Check, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Notification preferences (placeholder)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPlatform, setNotifPlatform] = useState(true)
  const [notifSms, setNotifSms] = useState(false)

  const handleChangePassword = async () => {
    try {
      setPasswordLoading(true)
      setPasswordError(null)
      setPasswordSuccess(false)

      if (newPassword !== confirmPassword) {
        setPasswordError('Les mots de passe ne correspondent pas')
        return
      }

      if (newPassword.length < 8) {
        setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères')
        return
      }

      const response = await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })

      if (response.success) {
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(response.error?.message || 'Erreur lors du changement de mot de passe')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message)
      } else {
        setPasswordError('Erreur lors du changement de mot de passe')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrateur',
    admin: 'Administrateur',
    dg: 'Directeur Général',
    directeur: 'Directeur',
    chef_service: 'Chef de Service',
    juriste: 'Juriste',
    agent: 'Agent',
    operateur: 'Opérateur',
    citoyen: 'Citoyen',
  }

  const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    super_admin: 'destructive',
    admin: 'default',
    dg: 'default',
    directeur: 'secondary',
    chef_service: 'secondary',
    juriste: 'outline',
    agent: 'outline',
    operateur: 'outline',
    citoyen: 'outline',
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre profil et vos préférences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Profile & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Profil</CardTitle>
              </div>
              <CardDescription>Vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nom complet</Label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Adresse email</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Rôle</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleBadgeVariant[user?.role || 'agent'] || 'outline'}>
                      {roleLabels[user?.role || 'agent'] || user?.role || 'Agent'}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Service</Label>
                  <Input
                    value={user?.service || '—'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Les informations de profil sont gérées par l&apos;administration. Contactez votre responsable pour toute modification.
              </p>
            </CardContent>
          </Card>

          {/* Change password section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Changer le mot de passe</CardTitle>
              </div>
              <CardDescription>Modifiez votre mot de passe pour sécuriser votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
                  <Check className="h-4 w-4" />
                  Mot de passe modifié avec succès
                </div>
              )}
              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {passwordError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Exigences du mot de passe :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Au moins 8 caractères</li>
                  <li>Au moins une majuscule</li>
                  <li>Au moins une minuscule</li>
                  <li>Au moins un chiffre</li>
                </ul>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                {passwordLoading ? 'Modification...' : 'Changer le mot de passe'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Notifications & Security */}
        <div className="space-y-6">
          {/* Notification preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Configurez vos préférences de notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifications par email</p>
                  <p className="text-xs text-muted-foreground">Recevoir les alertes par email</p>
                </div>
                <button
                  onClick={() => setNotifEmail(!notifEmail)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    notifEmail ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifEmail ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifications plateforme</p>
                  <p className="text-xs text-muted-foreground">Notifications in-app</p>
                </div>
                <button
                  onClick={() => setNotifPlatform(!notifPlatform)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    notifPlatform ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifPlatform ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifications SMS</p>
                  <p className="text-xs text-muted-foreground">Alertes urgentes par SMS</p>
                </div>
                <button
                  onClick={() => setNotifSms(!notifSms)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    notifSms ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifSms ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Les préférences de notification seront bientôt fonctionnelles.
              </p>
            </CardContent>
          </Card>

          {/* Security info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Sécurité</CardTitle>
              </div>
              <CardDescription>Informations de sécurité du compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Authentification à deux facteurs</span>
                <Badge variant="outline">Non activée</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dernière connexion</span>
                <span className="font-medium">—</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sessions actives</span>
                <span className="font-medium">1</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
