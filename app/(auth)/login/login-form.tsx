"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, Activity, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const STATS = [
  { icon: Users, label: "Patients", value: "12 480" },
  { icon: Activity, label: "Visites / mois", value: "3 200" },
  { icon: FileText, label: "Factures", value: "98%" },
]

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Identifiants incorrects.")
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Erreur de connexion.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">

      {/* ── LEFT: Cover panel ─────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col overflow-hidden bg-[#0c1408]">

        {/* Background image */}
        <Image
          src="/login-cover.png"
          alt="Équipe CKS"
          fill
          className="object-cover object-[center_72%]"
          priority
        />

        {/* Dark overlay with green tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1a09]/95 via-[#0f1a09]/80 to-[#0f1a09]/92" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">

          <div>
            {/* Logo top-left */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#68b33d] shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-white tracking-tight">CKS Manager</p>
                <p className="text-xs text-white/50 mt-0.5">Version 2.0</p>
              </div>
            </div>

            {/* Headline */}
            <div className="mt-10 max-w-lg">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#68b33d]/40 bg-[#68b33d]/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#68b33d] animate-pulse" />
                <span className="text-xs font-medium text-[#a8d97e] tracking-wide uppercase">
                  Système de gestion clinique
                </span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-white text-balance mb-5">
                La gestion de votre clinique,{" "}
                <span className="text-[#68b33d]">simplifiée.</span>
              </h1>
              <p className="text-base text-white/60 leading-relaxed text-pretty">
                Gérez vos patients, visites, facturation et équipes depuis une
                seule plateforme sécurisée, conçue pour les professionnels de santé.
              </p>
            </div>
          </div>

          {/* Stats bottom */}
          <div>
            <div className="mb-6 h-px bg-white/10" />
            <div className="flex items-center gap-8">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <Icon className="h-4 w-4 text-[#68b33d]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none text-white">{value}</p>
                    <p className="text-xs text-white/50 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-white/30">
              &copy; 2026 CKS Medical Systems. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ─────────────────────────────── */}
      <div className="flex w-full flex-col lg:w-[45%] xl:w-[40%] bg-background">

        {/* Mobile logo */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#68b33d]">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground">CKS Manager</span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-sm">

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Connexion
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Entrez vos identifiants pour accéder à votre espace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Adresse e-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nom@clinique.cm"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  className="h-11"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    className="h-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(!!v)}
                  className="data-[state=checked]:bg-[#68b33d] data-[state=checked]:border-[#68b33d]"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Rester connecté
                </Label>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="h-11 w-full bg-[#68b33d] text-white hover:bg-[#5a9e33] transition-colors font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Connexion en cours…
                  </span>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            {/* Security note */}
            <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#68b33d]" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Connexion sécurisée par chiffrement TLS 256 bits.
                Vos données médicales sont protégées conformément aux normes RGPD.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-10 py-4 lg:px-12 xl:px-16">
          <p className="text-xs text-muted-foreground">
            Besoin d&apos;aide ?{" "}
            <Link href="#" className="text-[#68b33d] hover:underline underline-offset-4">
              Contacter le support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
