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
      <div className="no-print mx-auto mb-4 flex max-w-[241mm] items-center justify-between px-4">
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
        className="print-recu-listing mx-auto w-full max-w-[241mm] bg-white text-[13px] leading-snug text-black shadow-sm print:shadow-none"
      >
        <div className="px-[8mm] py-[6mm] print:px-0 print:py-0">
          <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-3">
            <div>
              <h1 className="text-[16px] font-bold uppercase">
                {recu.clinique.nomClinique ?? "CLINIQUE"}
              </h1>
              {recu.clinique.adresse && <p className="mt-0.5">{recu.clinique.adresse}</p>}
              <p>
                {[recu.clinique.telephone, recu.clinique.email].filter(Boolean).join(" - ")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold uppercase">Bon de versement</p>
              <p className="text-[16px] font-bold">{recu.numero}</p>
              <p className="mt-1">{format(dateVers, "dd/MM/yyyy HH:mm", { locale: fr })}</p>
              {recu.caissierNom && <p>Caissier : {recu.caissierNom}</p>}
              {recu.posteNom && <p>Poste : {recu.posteNom}</p>}
            </div>
          </div>

          <table className="mt-6 w-full border-collapse">
            <tbody>
              <tr className="border-b border-dashed border-black">
                <td className="py-2 pr-4 font-bold w-48">Libellé</td>
                <td className="py-2">{recu.libelle}</td>
              </tr>
              {recu.beneficiaire && (
                <tr className="border-b border-dashed border-black">
                  <td className="py-2 pr-4 font-bold">Bénéficiaire</td>
                  <td className="py-2">{recu.beneficiaire}</td>
                </tr>
              )}
              <tr className="border-b border-dashed border-black">
                <td className="py-2 pr-4 font-bold">Mode</td>
                <td className="py-2">Espèces</td>
              </tr>
              <tr className="text-[15px]">
                <td className="py-3 pr-4 font-bold">Montant versé</td>
                <td className="py-3 font-bold">{formatCurrency(recu.montant)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 border-t-2 border-black pt-4 flex justify-between">
            <div>
              <p className="mb-8">Signature caissier</p>
              <p className="border-t border-black w-48 pt-1">{recu.caissierNom ?? ""}</p>
            </div>
            <div className="text-right">
              <p>Solde caisse après versement</p>
              <p className="font-bold text-[15px]">{formatCurrency(recu.soldeApres)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
