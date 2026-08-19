"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/formatting"
import type { VersementRecuDetail } from "@/lib/types/caisse-session"

export function VersementRecuPrintClient({ recu }: { recu: VersementRecuDetail }) {
  const router = useRouter()
  const dateVers = new Date(recu.createdAt)

  React.useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[297mm] items-center justify-between px-4">
        <button
          onClick={() => router.push("/caisse")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour caisse
        </button>
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
        className="print-recu-landscape mx-auto w-full max-w-[297mm] bg-white font-sans text-[12px] leading-snug text-black shadow-sm print:shadow-none"
      >
        <div className="px-[10mm] py-[8mm]">
          <div className="flex items-start justify-between gap-8 border-b-2 border-black pb-3">
            <div>
              <h1 className="text-base font-bold uppercase tracking-wide">
                {recu.clinique.nomClinique ?? "CLINIQUE"}
              </h1>
              {recu.clinique.adresse && (
                <p className="mt-0.5 text-[11px]">{recu.clinique.adresse}</p>
              )}
              <p className="text-[11px]">
                {[recu.clinique.telephone, recu.clinique.email].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-wider">Bon de versement</p>
              <p className="text-sm font-bold">{recu.numero}</p>
              <p className="mt-1 text-[11px]">
                {format(dateVers, "dd/MM/yyyy HH:mm", { locale: fr })}
              </p>
              {recu.caissierNom && (
                <p className="text-[11px]">Caissier : {recu.caissierNom}</p>
              )}
              {recu.posteNom && <p className="text-[11px]">Poste : {recu.posteNom}</p>}
            </div>
          </div>

          <table className="mt-6 w-full border-collapse text-[12px]">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="py-2 pr-4 font-bold w-48">Libellé</td>
                <td className="py-2">{recu.libelle}</td>
              </tr>
              {recu.beneficiaire && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 pr-4 font-bold">Bénéficiaire</td>
                  <td className="py-2">{recu.beneficiaire}</td>
                </tr>
              )}
              <tr className="border-b border-gray-300">
                <td className="py-2 pr-4 font-bold">Mode</td>
                <td className="py-2">Espèces</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-base">Montant versé</td>
                <td className="py-3 text-base font-bold">{formatCurrency(recu.montant)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 border-t border-black pt-4 flex justify-between text-[11px]">
            <div>
              <p className="mb-8">Signature caissier</p>
              <p className="border-t border-gray-400 w-48 pt-1">{recu.caissierNom ?? ""}</p>
            </div>
            <div className="text-right">
              <p>Solde caisse après versement</p>
              <p className="font-bold text-sm">{formatCurrency(recu.soldeApres)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
