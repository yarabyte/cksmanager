"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime, formatTime } from "@/lib/formatting"
import { APP_TIMEZONE, formatInAppTimezone } from "@/lib/timezone"
import type { JournalCaisseJour } from "@/lib/types/caisse"

type PrintParametres = {
  nomClinique?: string | null
  adresse?: string | null
  telephone?: string | null
} | null

function modeLabel(mode: JournalCaisseJour["lignes"][number]["modePaiement"]) {
  if (mode === "ESPECES") return "Espèces"
  if (mode === "MOBILE_MONEY") return "MoMo"
  if (mode === "PORTEFEUILLE") return "Portemonnaie"
  return "—"
}

export function CaisseJournalPrintClient({
  journal,
  posteNom,
  periodeLabel,
  parametres,
}: {
  journal: JournalCaisseJour
  posteNom: string
  periodeLabel: string
  parametres: PrintParametres
}) {
  const showDateColumn = React.useMemo(() => {
    const days = new Set(journal.lignes.map((l) => l.createdAt.slice(0, 10)))
    return days.size > 1
  }, [journal.lignes])

  const printedAt = formatInAppTimezone(new Date(), {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  React.useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[297mm] items-center justify-between px-4">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/caisse/journal">
            <ArrowLeft className="h-4 w-4" />
            Retour au journal
          </Link>
        </Button>
        <Button
          onClick={() => window.print()}
          className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <div
        id="print-document"
        className="print-journal-landscape mx-auto max-w-[297mm] bg-white text-gray-900 shadow-sm print:shadow-none"
      >
        <div className="px-[10mm] py-[8mm] text-[11px] leading-snug">
          <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-gray-800 pb-3">
            <div>
              <h1 className="text-base font-extrabold uppercase tracking-tight">
                {parametres?.nomClinique ?? "Clinique"}
              </h1>
              {parametres?.adresse ? (
                <p className="text-[10px] text-gray-600">{parametres.adresse}</p>
              ) : null}
              {parametres?.telephone ? (
                <p className="text-[10px] text-gray-600">Tél. {parametres.telephone}</p>
              ) : null}
            </div>
            <div className="text-right text-[10px] text-gray-600">
              <p className="font-semibold text-gray-900">Journal de caisse</p>
              <p>Poste : {posteNom}</p>
              <p>Période : {periodeLabel}</p>
              <p>Fuseau : {APP_TIMEZONE}</p>
              <p>Édité le {printedAt}</p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3 text-[10px]">
            <div className="rounded border border-gray-300 px-2 py-1.5">
              <p className="text-gray-500">Encaissements</p>
              <p className="text-sm font-bold text-emerald-800">
                {formatCurrency(journal.totalEncaissements)}
              </p>
            </div>
            <div className="rounded border border-gray-300 px-2 py-1.5">
              <p className="text-gray-500">Décaissements</p>
              <p className="text-sm font-bold text-rose-800">
                {formatCurrency(journal.totalDecaissements)}
              </p>
            </div>
            <div className="rounded border border-gray-300 px-2 py-1.5">
              <p className="text-gray-500">Solde période</p>
              <p className="text-sm font-bold">{formatCurrency(journal.solde)}</p>
            </div>
          </div>

          {journal.lignes.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Aucun mouvement pour cette période.
            </p>
          ) : (
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-50">
                  <th className="px-1.5 py-1 text-left font-semibold">
                    {showDateColumn ? "Date" : "Heure"}
                  </th>
                  <th className="px-1.5 py-1 text-left font-semibold">Sens</th>
                  <th className="px-1.5 py-1 text-left font-semibold">Libellé</th>
                  <th className="px-1.5 py-1 text-left font-semibold">Patient</th>
                  <th className="px-1.5 py-1 text-left font-semibold">Mode</th>
                  <th className="px-1.5 py-1 text-right font-semibold">Montant</th>
                </tr>
              </thead>
              <tbody>
                {journal.lignes.map((l) => (
                  <tr key={l.id} className="border-b border-gray-200">
                    <td className="whitespace-nowrap px-1.5 py-1 text-gray-600">
                      {showDateColumn ? formatDateTime(l.createdAt) : formatTime(l.createdAt)}
                    </td>
                    <td className="px-1.5 py-1">
                      {l.sens === "ENCAISSEMENT" ? "Enc." : "Déc."}
                    </td>
                    <td className="max-w-[180px] truncate px-1.5 py-1" title={l.libelle}>
                      {l.libelle}
                    </td>
                    <td className="max-w-[120px] truncate px-1.5 py-1">
                      {l.patientLabel ?? "—"}
                    </td>
                    <td className="px-1.5 py-1">{modeLabel(l.modePaiement)}</td>
                    <td
                      className={`px-1.5 py-1 text-right font-medium ${
                        l.sens === "ENCAISSEMENT" ? "text-emerald-800" : "text-rose-800"
                      }`}
                    >
                      {l.sens === "ENCAISSEMENT" ? "+" : "−"}
                      {formatCurrency(l.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="mt-4 text-[9px] text-gray-500">
            {journal.lignes.length} mouvement{journal.lignes.length > 1 ? "s" : ""} — document
            généré par CKS Manager
          </p>
        </div>
      </div>
    </div>
  )
}
