"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatBirthAge } from "@/lib/formatting"
import { formatCategorieLabel } from "@/components/shared/categorie-icon"
import type { FeuilleDetail } from "@/lib/types/feuille-circulation"

export type PrintParametres = {
  nomClinique?: string | null
  logo?: string | null
  adresse?: string | null
  telephone?: string | null
  email?: string | null
  niu?: string | null
  registreCommerce?: string | null
  noteBasPage1?: string | null
  noteBasPage2?: string | null
} | null

export function FeuillePrintClient({
  feuille,
  parametres,
}: {
  feuille: FeuilleDetail
  parametres: PrintParametres
}) {
  const router = useRouter()
  const dateVisite = new Date(feuille.visite.dateVisite)
  const dateCreation = feuille.createdAt ? new Date(feuille.createdAt) : null

  React.useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      {/* Toolbar (masquée à l'impression) */}
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <button
          onClick={() => router.push(`/feuilles-circulation/${feuille.id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <Button onClick={() => window.print()} className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      {/* Document imprimable */}
      <div
        id="print-document"
        className="mx-auto max-w-[210mm] bg-white text-gray-800 shadow-sm print:fixed print:inset-0 print:mx-0 print:max-w-none print:shadow-none"
      >
        <div className="px-[12mm] py-[10mm] text-[13px] print:px-0 print:py-0">
        {/* En-tête clinique */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-gray-800 pb-4">
          <div className="flex items-start gap-4">
            {parametres?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={parametres.logo}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            ) : null}
            <div>
              <h1 className="text-lg font-extrabold uppercase tracking-tight text-gray-900">
                {parametres?.nomClinique ?? "Clinique"}
              </h1>
              {parametres?.adresse && <p className="text-xs text-gray-600">{parametres.adresse}</p>}
              <p className="text-xs text-gray-600">
                {[parametres?.telephone, parametres?.email].filter(Boolean).join(" • ")}
              </p>
              <p className="text-[11px] text-gray-500">
                {[
                  parametres?.niu ? `NIU : ${parametres.niu}` : null,
                  parametres?.registreCommerce ? `RC : ${parametres.registreCommerce}` : null,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Feuille de circulation
            </p>
            <p className="font-sans text-base font-bold text-gray-900">{feuille.numero}</p>
            <p className="text-xs text-gray-600">
              Visite : {format(dateVisite, "d MMMM yyyy", { locale: fr })} à{" "}
              {format(dateVisite, "HH:mm")}
            </p>
            {dateCreation && (
              <p className="text-xs text-gray-600">
                Créée le {format(dateCreation, "d MMMM yyyy", { locale: fr })} à{" "}
                {format(dateCreation, "HH:mm")}
              </p>
            )}
          </div>
        </div>

        {/* Infos patient / médecin */}
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div>
            <span className="text-gray-500">Patient : </span>
            <span className="font-semibold text-gray-900">
              {feuille.visite.patientLabel ?? `#${feuille.visite.patientId}`}
            </span>
            {feuille.visite.patientDob && (
              <span className="text-gray-500">
                {" · "}
                {formatBirthAge(feuille.visite.patientDob)}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-gray-500">Médecin : </span>
            <span className="font-semibold text-gray-900">{feuille.visite.medecinNom ?? "-"}</span>
            {feuille.visite.medecinNumeroOrdre && (
              <span className="text-gray-500">
                {" · N° ONMC "}
                {feuille.visite.medecinNumeroOrdre}
              </span>
            )}
          </div>
          {feuille.libelle && (
            <div className="col-span-2">
              <span className="text-gray-500">Objet : </span>
              <span className="text-gray-800">{feuille.libelle}</span>
            </div>
          )}
        </div>

        {/* Tableau des lignes */}
        <table className="mt-6 w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-y border-gray-300 bg-gray-50 text-left">
              <th className="py-2 font-semibold">Désignation</th>
              <th className="w-10 py-2 text-center font-semibold">Qté</th>
              <th className="w-24 py-2 text-right font-semibold">P.U.</th>
              <th className="w-12 py-2 text-center font-semibold">Taux</th>
              <th className="w-24 py-2 text-right font-semibold">HNC</th>
              <th className="w-24 py-2 text-right font-semibold">Assurance</th>
              <th className="w-24 py-2 text-right font-semibold">Patient</th>
            </tr>
          </thead>
          <tbody>
            {feuille.lignes.map((l) => (
              <tr key={l.id} className="border-b border-gray-100">
                <td className="py-1.5">
                  <span className="font-medium text-gray-900">
                    {l.typeLigne === "PHARMA"
                      ? `${l.produitNom ?? "Produit"}${l.produitDosage ? " " + l.produitDosage : ""}`
                      : l.acteNom ?? "Acte"}
                  </span>
                  <span className="text-gray-400"> — {formatCategorieLabel(l.categorieNom)}</span>
                </td>
                <td className="py-1.5 text-center">{l.quantite}</td>
                <td className="py-1.5 text-right">{formatCurrency(l.valeur)}</td>
                <td className="py-1.5 text-center">{l.taux}%</td>
                <td className="py-1.5 text-right">{formatCurrency(l.hnc * l.quantite)}</td>
                <td className="py-1.5 text-right">{formatCurrency(l.montantAssurance)}</td>
                <td className="py-1.5 text-right font-medium">
                  {formatCurrency(l.montantPatient)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-6 flex justify-end">
          <table className="min-w-[220px] text-[12px]">
            <tbody>
              <tr>
                <td className="py-1 pr-4 text-gray-500">Part assurance</td>
                <td className="py-1 text-right font-semibold tabular-nums">
                  {formatCurrency(feuille.totaux.totalAssurance)}
                </td>
              </tr>
              <tr className="border-t border-gray-300">
                <td className="py-1 pr-4 font-semibold text-gray-700">Part patient</td>
                <td className="py-1 text-right font-bold tabular-nums">
                  {formatCurrency(feuille.totaux.totalPatient)}
                </td>
              </tr>
              <tr className="border-t-2 border-gray-800">
                <td className="py-1 pr-4 font-bold text-gray-900">TOTAL</td>
                <td className="py-1 text-right font-extrabold tabular-nums text-gray-900">
                  {formatCurrency(feuille.totaux.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes de bas de page */}
        {(parametres?.noteBasPage1 || parametres?.noteBasPage2) && (
          <div className="mt-8 border-t border-gray-200 pt-4 text-center text-[10px] text-gray-500">
            {parametres?.noteBasPage1 && <p>{parametres.noteBasPage1}</p>}
            {parametres?.noteBasPage2 && <p>{parametres.noteBasPage2}</p>}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
