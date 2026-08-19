"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowUpFromLine,
  Loader2,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react"
import { creerVersement } from "@/app/actions/caisse-sessions"
import { KPICard } from "@/components/shared/kpi-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/formatting"
import type { VersementsPageData } from "@/lib/types/caisse-session"

export function VersementsPageClient({ data }: { data: VersementsPageData }) {
  const router = useRouter()
  const [showForm, setShowForm] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [montant, setMontant] = React.useState("")
  const [libelle, setLibelle] = React.useState("")
  const [beneficiaire, setBeneficiaire] = React.useState("")

  function resetForm() {
    setMontant("")
    setLibelle("")
    setBeneficiaire("")
  }

  async function handleSubmit() {
    const montantNum = Number.parseFloat(montant.replace(",", "."))
    if (!Number.isFinite(montantNum) || montantNum <= 0) {
      toast.error("Montant invalide")
      return
    }
    if (!libelle.trim()) {
      toast.error("Libellé obligatoire")
      return
    }

    setPending(true)
    try {
      const res = await creerVersement({
        montant: montantNum,
        libelle: libelle.trim(),
        beneficiaire: beneficiaire.trim() || null,
      })
      if (res.ok) {
        toast.success("Versement enregistré")
        setShowForm(false)
        resetForm()
        router.refresh()
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
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
        <Link href="/caisse">
          <ArrowLeft className="h-4 w-4" />
          Retour à la caisse
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ArrowUpFromLine className="h-6 w-6" />
            Versements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sorties d&apos;espèces — poste <strong>{data.posteNom}</strong>
          </p>
        </div>
        <Button
          className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          Nouveau versement
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KPICard
          title="Solde disponible"
          value={formatCurrency(data.soldeTheorique)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KPICard
          title="Total versements (session)"
          value={formatCurrency(data.totalVersements)}
          icon={<ArrowUpFromLine className="h-5 w-5" />}
        />
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Versements de la session ({data.versements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.versements.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun versement enregistré sur cette session.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>N°</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.versements.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-sans text-xs">{v.numero}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm" title={v.libelle}>
                        {v.libelle}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {v.beneficiaire ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(v.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-700">
                        −{formatCurrency(v.montant)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
                          <Link href={`/caisse/versement/${v.id}`} target="_blank">
                            <Receipt className="h-3.5 w-3.5" />
                            Reçu
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau versement sortant</DialogTitle>
            <DialogDescription>
              Espèces vers banque, promoteurs, etc. Solde disponible :{" "}
              {formatCurrency(data.soldeTheorique)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Montant (FCFA)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Libellé</Label>
              <Input
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Versement banque, promoteur…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bénéficiaire (optionnel)</Label>
              <Input
                value={beneficiaire}
                onChange={(e) => setBeneficiaire(e.target.value)}
                placeholder="Banque, nom promoteur…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={pending}
              className="bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Enregistrer et imprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
