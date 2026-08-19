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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
}: {
  initialStats: CaisseStats
  initialPending: { feuilles: CaisseEnAttenteItem[]; factures: CaisseEnAttenteItem[]; prescriptions: CaisseEnAttenteItem[] }
  initialJournal: JournalCaisseJour
  session: CaisseSessionActive
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
          <Button variant="outline" className="gap-2" onClick={() => setShowVersement(true)}>
            <ArrowUpFromLine className="h-4 w-4" />
            Versement
          </Button>
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

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">À encaisser</CardTitle>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Patient, n° feuille, prescription ou facture…"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as "FEUILLE" | "FACTURE" | "PRESCRIPTION")
                setSelected(null)
                setContext(null)
              }}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="FEUILLE">
                  Feuilles de circulation ({feuilles.length})
                </TabsTrigger>
                <TabsTrigger value="PRESCRIPTION">
                  Prescriptions ({prescriptions.length})
                </TabsTrigger>
                <TabsTrigger value="FACTURE">Factures ({factures.length})</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-0">
                {list.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucun élément à encaisser.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N°</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Visite</TableHead>
                          <TableHead className="text-right">Part patient</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((item) => (
                          <TableRow
                            key={`${item.type}-${item.id}`}
                            className={
                              selected?.id === item.id && selected.type === item.type
                                ? "bg-primary/5 cursor-pointer"
                                : "cursor-pointer"
                            }
                            onClick={() => void loadContext(item)}
                          >
                            <TableCell className="font-sans text-xs">{item.numero}</TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{item.patientLabel}</div>
                              {item.patientDob && (
                                <div className="text-xs text-muted-foreground">
                                  {formatBirthAge(item.patientDob)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.dateVisite ? formatDate(item.dateVisite) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.montantPatient)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Encaissement</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground">
                Sélectionnez une feuille, une prescription ou une facture dans la liste.
              </p>
            ) : loadingCtx ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : context ? (
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
                  <p className="font-medium">{selected.patientLabel}</p>
                  <p className="text-muted-foreground font-sans">{selected.numero}</p>
                  {selected.sourceLabel && (
                    <p className="text-xs text-muted-foreground">{selected.sourceLabel}</p>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Part patient</span>
                    <span className="font-bold">{formatCurrency(context.montantDu)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Solde portemonnaie</span>
                    <span
                      className={
                        context.peutEncaisser ? "text-emerald-600 font-medium" : "text-amber-700"
                      }
                    >
                      {formatCurrency(context.walletSolde)}
                    </span>
                  </div>
                  {context.manque > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Manque</span>
                      <span className="font-medium">{formatCurrency(context.manque)}</span>
                    </div>
                  )}
                </div>

                {context.lignes && context.lignes.length > 0 && (
                  <div className="max-h-40 overflow-y-auto text-xs text-muted-foreground space-y-1">
                    {context.lignes.map((l) => (
                      <div key={l.id} className="flex justify-between gap-2">
                        <span className="truncate">
                          {l.typeLigne === "PHARMA" ? l.produitNom : l.acteNom} ×{l.quantite}
                        </span>
                        <span className="shrink-0">{formatCurrency(l.montantPatient)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {context.feuillesGroupes?.map((f) => (
                  <div key={f.feuilleId} className="text-xs">
                    <p className="font-medium text-gray-700 mb-1">
                      Feuille de circulation {f.numero}
                    </p>
                    {f.lignes.map((l) => (
                      <div key={l.id} className="flex justify-between gap-2 text-muted-foreground">
                        <span className="truncate">
                          {l.typeLigne === "PHARMA" ? l.produitNom : l.acteNom} ×{l.quantite}
                        </span>
                        <span>{formatCurrency(l.montantPatient)}</span>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="flex flex-col gap-2">
                  {!context.peutEncaisser && context.montantDu > 0 && (
                    <Button variant="outline" className="gap-2" onClick={openRecharge}>
                      <Wallet className="h-4 w-4" />
                      Recharger le portemonnaie
                    </Button>
                  )}
                  <Button
                    className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
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

      <CaisseJournalCard journal={journal} />

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
