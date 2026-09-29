"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  Wallet,
  Banknote,
  Smartphone,
  Receipt,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowUpFromLine,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KPICard } from "@/components/shared/kpi-card"
import { CaisseJournalCard } from "@/components/caisse/caisse-journal-card"
import { CaisseSoldeTheoriqueCard } from "@/components/caisse/caisse-solde-theorique-card"
import { formatCurrency, formatDate, formatBirthAge } from "@/lib/formatting"
import {
  encaisserFacture,
  encaisserFeuille,
  encaisserPrescription,
  getCaisseStats,
  getEncaissementContext,
  getJournalCaisseJour,
  listEncaissementsEnAttente,
} from "@/app/actions/caisse"
import { creerVersement, getActiveCaisseSession } from "@/app/actions/caisse-sessions"
import { rechargeWallet } from "@/app/actions/wallets"
import type { CaisseEnAttenteItem, CaisseStats, EncaissementContext, JournalCaisseJour } from "@/lib/types/caisse"
import type { RechargeModePaiement } from "@/lib/types/caisse"
import type { CaisseSessionActive } from "@/lib/types/caisse-session"

export function CaissePageClient({
  initialStats,
  initialPending,
  initialJournal,
  session,
  canManageVersements,
}: {
  initialStats: CaisseStats
  initialPending: { feuilles: CaisseEnAttenteItem[]; factures: CaisseEnAttenteItem[]; prescriptions: CaisseEnAttenteItem[] }
  initialJournal: JournalCaisseJour
  session: CaisseSessionActive
  canManageVersements: boolean
}) {
  const router = useRouter()
  const [stats, setStats] = React.useState(initialStats)
  const [feuilles, setFeuilles] = React.useState(initialPending.feuilles)
  const [factures, setFactures] = React.useState(initialPending.factures)
  const [prescriptions, setPrescriptions] = React.useState(initialPending.prescriptions)
  const [search, setSearch] = React.useState("")
  const [tab, setTab] = React.useState<"FEUILLE" | "FACTURE" | "PRESCRIPTION">("FEUILLE")
  const [selected, setSelected] = React.useState<CaisseEnAttenteItem | null>(null)
  const [context, setContext] = React.useState<EncaissementContext | null>(null)
  const [loadingCtx, setLoadingCtx] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const [showRecharge, setShowRecharge] = React.useState(false)
  const [rechargeAmount, setRechargeAmount] = React.useState("")
  const [rechargeMode, setRechargeMode] = React.useState<RechargeModePaiement>("ESPECES")
  const [journal, setJournal] = React.useState(initialJournal)
  const [sessionState, setSessionState] = React.useState(session)

  const [showVersement, setShowVersement] = React.useState(false)
  const [versementMontant, setVersementMontant] = React.useState("")
  const [versementLibelle, setVersementLibelle] = React.useState("")
  const [versementBeneficiaire, setVersementBeneficiaire] = React.useState("")

  async function refresh(q?: string) {
    const [s, p, j] = await Promise.all([
      getCaisseStats(),
      listEncaissementsEnAttente({ q: q || undefined }),
      getJournalCaisseJour(sessionState.id),
    ])
    setStats(s)
    setFeuilles(p.feuilles)
    setFactures(p.factures)
    setPrescriptions(p.prescriptions)
    setJournal(j)
    const active = await getActiveCaisseSession()
    if (active) setSessionState(active)
  }

  async function loadContext(item: CaisseEnAttenteItem) {
    setSelected(item)
    setLoadingCtx(true)
    try {
      const ctx = await getEncaissementContext(item.type, item.id)
      setContext(ctx)
    } finally {
      setLoadingCtx(false)
    }
  }

  React.useEffect(() => {
    const t = setTimeout(() => void refresh(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const list = tab === "FEUILLE" ? feuilles : tab === "FACTURE" ? factures : prescriptions

  async function handleRecharge() {
    if (!selected) return
    const montant = Number.parseFloat(rechargeAmount.replace(",", "."))
    if (!Number.isFinite(montant) || montant <= 0) {
      toast.error("Montant invalide")
      return
    }
    setPending(true)
    try {
      const res = await rechargeWallet({
        patientId: selected.patientId,
        montant,
        modePaiement: rechargeMode,
      })
      if (res.ok) {
        toast.success(`Portemonnaie rechargé — solde : ${formatCurrency(res.solde)}`)
        setShowRecharge(false)
        setRechargeAmount("")
        await loadContext(selected)
        await refresh(search)
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  async function handleEncaisser() {
    if (!selected) return
    setPending(true)
    try {
      const res =
        selected.type === "FEUILLE"
          ? await encaisserFeuille(selected.id)
          : selected.type === "FACTURE"
            ? await encaisserFacture(selected.id)
            : await encaisserPrescription(selected.id)
      if (res.ok) {
        toast.success("Encaissement enregistré")
        router.push(`/caisse/recu/${res.encaissementId}`)
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  function openRecharge() {
    if (context && context.manque > 0) {
      setRechargeAmount(String(context.manque))
    }
    setShowRecharge(true)
  }

  async function handleVersement() {
    const montant = Number.parseFloat(versementMontant.replace(",", "."))
    if (!Number.isFinite(montant) || montant <= 0) {
      toast.error("Montant invalide")
      return
    }
    if (!versementLibelle.trim()) {
      toast.error("Libellé obligatoire")
      return
    }
    setPending(true)
    try {
      const res = await creerVersement({
        montant,
        libelle: versementLibelle.trim(),
        beneficiaire: versementBeneficiaire.trim() || null,
      })
      if (res.ok) {
        toast.success("Versement enregistré")
        setShowVersement(false)
        setVersementMontant("")
        setVersementLibelle("")
        setVersementBeneficiaire("")
        router.push(`/caisse/versement/${res.versementId}`)
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Caisse</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Poste <strong>{sessionState.posteNom}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageVersements ? (
            <Button variant="outline" className="gap-2" onClick={() => setShowVersement(true)}>
              <ArrowUpFromLine className="h-4 w-4" />
              Versement
            </Button>
          ) : null}
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/cloture">
              <Lock className="h-4 w-4" />
              Clôturer
            </Link>
          </Button>
        </div>
      </div>

      <CaisseSoldeTheoriqueCard
        session={sessionState}
        encaissementsJour={stats.encaissementsJour}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard
          title="Encaissements du jour"
          value={formatCurrency(stats.encaissementsJour)}
          icon={<Receipt className="h-6 w-6" />}
        />
        <KPICard
          title="En attente"
          value={String(stats.nbEnAttente)}
          changeLabel={formatCurrency(stats.montantEnAttente)}
          icon={<AlertCircle className="h-6 w-6" />}
        />
        <KPICard
          title="Montant en attente"
          value={formatCurrency(stats.montantEnAttente)}
          icon={<Wallet className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:h-[32rem]">
        <Card className="flex h-full min-h-0 flex-col gap-4 overflow-hidden py-5 lg:col-span-3">
          <CardHeader className="shrink-0 space-y-4 px-5 pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">À encaisser</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sélectionnez un élément pour procéder à l&apos;encaissement
                </p>
              </div>
              <div className="relative w-full sm:max-w-[17rem]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Patient, n°…"
                  className="h-9 pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as "FEUILLE" | "FACTURE" | "PRESCRIPTION")
                setSelected(null)
                setContext(null)
              }}
            >
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1">
                {(
                  [
                    { value: "FEUILLE" as const, label: "Feuilles", count: feuilles.length },
                    {
                      value: "PRESCRIPTION" as const,
                      label: "Prescriptions",
                      count: prescriptions.length,
                    },
                    { value: "FACTURE" as const, label: "Factures", count: factures.length },
                  ] as const
                ).map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="h-9 gap-1.5 rounded-lg px-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <span className="truncate">{t.label}</span>
                    <span
                      className={
                        tab === t.value
                          ? "inline-flex min-w-5 items-center justify-center rounded-md bg-[#cd3b86]/10 px-1.5 text-[11px] font-semibold text-[#cd3b86]"
                          : "inline-flex min-w-5 items-center justify-center rounded-md bg-background/80 px-1.5 text-[11px] font-semibold text-muted-foreground"
                      }
                    >
                      {t.count}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col px-5 pt-0">
            {list.length === 0 ? (
              <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  Aucun élément à encaisser
                </p>
                <p className="text-xs text-muted-foreground">
                  Les {tab === "FEUILLE" ? "feuilles" : tab === "FACTURE" ? "factures" : "prescriptions"}{" "}
                  en attente apparaîtront ici.
                </p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
                {list.map((item) => {
                  const isSelected =
                    selected?.id === item.id && selected.type === item.type
                  return (
                    <li key={`${item.type}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => void loadContext(item)}
                        className={
                          isSelected
                            ? "flex w-full items-start gap-3 rounded-xl border border-[#cd3b86]/30 bg-[#cd3b86]/[0.06] px-3.5 py-3 text-left shadow-sm transition-colors"
                            : "flex w-full items-start gap-3 rounded-xl border border-transparent bg-muted/30 px-3.5 py-3 text-left transition-colors hover:border-border hover:bg-muted/50"
                        }
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="rounded-md bg-background px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-tight text-foreground ring-1 ring-border">
                              {item.numero}
                            </span>
                            {item.dateVisite && (
                              <span className="text-[11px] text-muted-foreground">
                                Visite {formatDate(item.dateVisite)}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {item.patientLabel}
                          </p>
                          {item.patientDob && (
                            <p className="text-xs text-muted-foreground">
                              {formatBirthAge(item.patientDob)}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Part patient
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                            {formatCurrency(item.montantPatient)}
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-0 flex-col gap-4 overflow-hidden py-5 lg:col-span-2">
          <CardHeader className="shrink-0 px-5 pb-0">
            <CardTitle className="text-base">Encaissement</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5">
            {!selected ? (
              <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 text-center">
                <Banknote className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Sélectionnez une feuille, une prescription ou une facture dans la liste.
                </p>
              </div>
            ) : loadingCtx ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : context ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <div className="shrink-0 space-y-3 rounded-xl border bg-gradient-to-b from-muted/40 to-muted/10 p-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{selected.patientLabel}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{selected.numero}</p>
                    {selected.sourceLabel && (
                      <p className="mt-1 text-xs text-muted-foreground">{selected.sourceLabel}</p>
                    )}
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Part patient</span>
                      <span className="font-bold tabular-nums">
                        {formatCurrency(context.montantDu)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Solde portemonnaie</span>
                      <span
                        className={
                          context.peutEncaisser
                            ? "font-medium tabular-nums text-emerald-600"
                            : "font-medium tabular-nums text-amber-700"
                        }
                      >
                        {formatCurrency(context.walletSolde)}
                      </span>
                    </div>
                    {context.manque > 0 && (
                      <div className="flex justify-between gap-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800">
                        <span>Manque</span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(context.manque)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {(context.lignes?.length || context.feuillesGroupes?.length) ? (
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
                    {context.lignes && context.lignes.length > 0 && (
                      <div className="space-y-1.5 rounded-lg border bg-muted/20 p-2.5 text-xs text-muted-foreground">
                        {context.lignes.map((l) => (
                          <div key={l.id} className="flex justify-between gap-2">
                            <span className="min-w-0 truncate">
                              {l.typeLigne === "PHARMA" ? l.produitNom : l.acteNom} ×{l.quantite}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {formatCurrency(l.montantPatient)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {context.feuillesGroupes?.map((f) => (
                      <div
                        key={f.feuilleId}
                        className="space-y-1.5 rounded-lg border bg-muted/20 p-2.5 text-xs"
                      >
                        <p className="font-medium text-gray-700">
                          Feuille de circulation {f.numero}
                        </p>
                        {f.lignes.map((l) => (
                          <div
                            key={l.id}
                            className="flex justify-between gap-2 text-muted-foreground"
                          >
                            <span className="min-w-0 truncate">
                              {l.typeLigne === "PHARMA" ? l.produitNom : l.acteNom} ×{l.quantite}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {formatCurrency(l.montantPatient)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto flex shrink-0 flex-col gap-2 pt-1">
                  {!context.peutEncaisser && context.montantDu > 0 && (
                    <Button variant="outline" className="gap-2" onClick={openRecharge}>
                      <Wallet className="h-4 w-4" />
                      Recharger le portemonnaie
                    </Button>
                  )}
                  <Button
                    className="h-11 gap-2 bg-[#cd3b86] text-white hover:bg-[#b8307a]"
                    disabled={!context.peutEncaisser || pending}
                    onClick={() => void handleEncaisser()}
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Encaisser {formatCurrency(context.montantDu)}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <CaisseJournalCard
        journal={journal}
        title="Journal de caisse — journée"
        emptyMessage="Aucun mouvement enregistré aujourd'hui."
      />

      {canManageVersements ? (
      <Dialog open={showVersement} onOpenChange={setShowVersement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Versement sortant</DialogTitle>
            <DialogDescription>
              Espèces vers banque, promoteurs, etc. Solde disponible :{" "}
              {formatCurrency(sessionState.soldeTheorique)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Montant (FCFA)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={versementMontant}
                onChange={(e) => setVersementMontant(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Libellé</Label>
              <Input
                value={versementLibelle}
                onChange={(e) => setVersementLibelle(e.target.value)}
                placeholder="Versement banque, promoteur…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bénéficiaire (optionnel)</Label>
              <Input
                value={versementBeneficiaire}
                onChange={(e) => setVersementBeneficiaire(e.target.value)}
                placeholder="Banque, nom promoteur…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersement(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleVersement()}
              disabled={pending}
              className="bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer et imprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}

      <Dialog open={showRecharge} onOpenChange={setShowRecharge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recharger le portemonnaie</DialogTitle>
            <DialogDescription>
              {selected?.patientLabel} — alimentation avant encaissement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Montant (FCFA)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder={context?.manque ? String(context.manque) : "0"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mode de paiement</Label>
              <Select
                value={rechargeMode}
                onValueChange={(v) => setRechargeMode(v as RechargeModePaiement)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESPECES">
                    <span className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" /> Espèces
                    </span>
                  </SelectItem>
                  <SelectItem value="MOBILE_MONEY">
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" /> Mobile Money
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecharge(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleRecharge()}
              disabled={pending}
              className="bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Recharger"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
