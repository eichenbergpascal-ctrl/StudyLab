"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type FormState = "idle" | "loading" | "success"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formState, setFormState] = useState<FormState>("idle")
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.")
      return
    }

    setFormState("loading")

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError("Registrierung fehlgeschlagen. Bitte versuche es erneut.")
      setFormState("idle")
      return
    }

    setFormState("success")
  }

  if (formState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <Image src="/logo.svg" alt="StudyLab" width={140} height={32} priority />
          </div>

          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">
                Fast geschafft
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Wir haben dir eine Bestätigungs-E-Mail an{" "}
                <span className="font-medium text-foreground">{email}</span> geschickt.
                Klicke den Link darin, um dein Konto zu aktivieren.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Zurück zur Anmeldung
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo.svg" alt="StudyLab" width={140} height={32} priority />
        </div>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Konto erstellen
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Starte kostenlos mit deiner Klausurvorbereitung.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="deine@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={formState === "loading"}>
                {formState === "loading" ? "Wird registriert…" : "Konto erstellen"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Bereits ein Konto?{" "}
              <Link href="/login" className="text-primary hover:text-blue-600 transition-colors">
                Anmelden
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
