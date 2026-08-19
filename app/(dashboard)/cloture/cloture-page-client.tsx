"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Calculator,
  History,
  Loader2,
  Lock,
  Receipt,
  Scale,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatCurrency, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import { closeCaisseSession } from "@/app/actions/caisse-sessions"

type ClotureContext = {
  session: {
    id: string
    posteNom: string
    soldeOuverture: number
    openedAt: string
  }
  stats: {
    soldeTheorique: number
    totalRecharges: number
    nbRecharges: number
    totalVersements: number
    nbVersements: number
    totalEncaissements: number
    nbEncaissements: number
  }
}

export function CloturePageClient({ context }: { context: ClotureContext }) {
  const router = useRouter()
  const [soldeReel, setSoldeReel] = React.useState("")
  const [commentaire, setCommentaire] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const soldeReelNum = Number.parseFloat(soldeReel.replace(",", "."))
  const ecart = Number.isFinite(soldeReelNum)
    ? Math.round((soldeReelNum - context.stats.soldeTheorique) * 100) / 100
    : null
  const ecartNonNul = ecart !== null && ecart !== 0
  const canClose =
    Number.isFinite(soldeReelNum) &&
    soldeReelNum >= 0 &&
    (!ecartNonNul || commentaire.trim().length > 0)

  async function handleClose() {
    if (!Number.isFinite(soldeReelNum) || soldeReelNum < 0) {
      toast.error("Comptage physique invalide.")
      return
    }
    if (ecartNonNul && !commentaire.trim()) {
      toast.error("Commentaire obligatoire en cas d'écart.")
      return
    }
    setPending(true)
    try {
      const res = await closeCaisseSession({
        soldeReel: soldeReelNum,
        commentaireEcart: commentaire.trim() || null,
      })
      if (res.ok) {
        toast.success("Caisse clôturée")
        router.push("/caisse/ouverture")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  const kpis = [
    {
      label: "Solde d'ouverture",
      value: formatCurrency(context.session.soldeOuverture),
      icon: Banknote,
      accent: "text-gray-900",
      bg: "bg-gray-100",
    },
    {
      label: `Recharges (${context.stats.nbRecharges})`,
      value: `+${formatCurrency(context.stats.totalRecharges)}`,
      icon: ArrowDownToLine,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: `Versements (${context.stats.nbVersements})`,
      value: `−${formatCurrency(context.stats.totalVersements)}`,
      icon: ArrowUpFromLine,
      accent: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Solde théorique",
      value: formatCurrency(context.stats.soldeTheorique),
      icon: Scale,
      accent: "text-[#cd3b86]",
      bg: "bg-[#cd3b86]/8",
    },
  ]

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Clôture de caisse
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {context.session.posteNom} — ouverte le{" "}
            {formatDateTime(context.session.openedAt)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg">
          <Link href="/cloture/historique">
            <History className="h-4 w-4" />
            Historique
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, accent, bg }) => (
          <Card
            key={label}
            className="border border-gray-100 shadow-sm rounded-2xl bg-white"
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className={cn("text-xl font-extrabold mt-1 tabular-nums", accent)}>
                    {value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    bg,
                    accent,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#cd3b86]" />
              Récapitulatif session
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {[
                {
                  label: "Solde d'ouverture",
                  value: formatCurrency(context.session.soldeOuverture),
                  className: "text-gray-800",
                },
                {
                  label: `Recharges portefeuille (${context.stats.nbRecharges})`,
                  value: `+${formatCurrency(context.stats.totalRecharges)}`,
                  className: "text-emerald-700",
                },
                {
                  label: `Versements sortants (${context.stats.nbVersements})`,
                  value: `−${formatCurrency(context.stats.totalVersements)}`,
                  className: "text-rose-700",
                },
                {
                  label: `Encaissements prestations (${context.stats.nbEncaissements})`,
                  value: formatCurrency(context.stats.totalEncaissements),
                  className: "text-gray-500",
                  hint: "Déjà inclus via le portefeuille patient",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 px-5 py-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-gray-600">{row.label}</p>
                    {"hint" in row && row.hint ? (
                      <p className="text-[11px] text-gray-400 mt-0.5">{row.hint}</p>
                    ) : null}
                  </div>
                  <span className={cn("font-semibold tabular-nums shrink-0", row.className)}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gray-50/80">
                <p className="text-sm font-bold text-gray-900">Solde théorique</p>
                <p className="text-lg font-extrabold tabular-nums text-[#cd3b86]">
                  {formatCurrency(context.stats.soldeTheorique)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#cd3b86]" />
              Comptage physique
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="solde-reel" className="text-xs font-semibold text-gray-500">
                Solde réel compté (FCFA)
              </Label>
              <Input
                id="solde-reel"
                type="text"
                inputMode="decimal"
                value={soldeReel}
                onChange={(e) => setSoldeReel(e.target.value)}
                placeholder={String(context.stats.soldeTheorique)}
                className="h-11 rounded-xl border-gray-200 text-lg font-semibold tabular-nums"
              />
              <p className="text-[11px] text-gray-400">
                Saisissez le montant réellement présent dans le tiroir.
              </p>
            </div>

            {ecart !== null && (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  ecartNonNul
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {ecartNonNul ? "Écart constaté" : "Caisse équilibrée"}
                  </span>
                  <strong className="text-base tabular-nums">{formatCurrency(ecart)}</strong>
                </div>
                <p className="text-xs mt-1 opacity-80">
                  {ecartNonNul
                    ? "Un commentaire est obligatoire pour clôturer."
                    : "Le solde réel correspond au solde théorique."}
                </p>
              </div>
            )}

            {ecartNonNul && (
              <div className="space-y-2">
                <Label htmlFor="commentaire" className="text-xs font-semibold text-gray-500">
                  Commentaire sur l&apos;écart
                </Label>
                <Textarea
                  id="commentaire"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Expliquez l'écart constaté…"
                  rows={3}
                  className="rounded-xl border-gray-200 resize-y"
                />
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={!canClose || pending}
                  className="w-full h-11 gap-2 rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Clôturer la caisse
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la clôture ?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        Le poste <strong className="text-foreground">{context.session.posteNom}</strong>{" "}
                        sera fermé.
                      </p>
                      <p>
                        Solde théorique :{" "}
                        <strong className="text-foreground">
                          {formatCurrency(context.stats.soldeTheorique)}
                        </strong>
                        {" · "}
                        Solde réel :{" "}
                        <strong className="text-foreground">
                          {Number.isFinite(soldeReelNum)
                            ? formatCurrency(soldeReelNum)
                            : "—"}
                        </strong>
                      </p>
                      {ecartNonNul && (
                        <p className="text-amber-700">
                          Écart de {formatCurrency(ecart!)} avec commentaire.
                        </p>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-lg">Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleClose()}
                    className="rounded-lg bg-[#cd3b86] hover:bg-[#b8307a]"
                  >
                    Confirmer la clôture
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
