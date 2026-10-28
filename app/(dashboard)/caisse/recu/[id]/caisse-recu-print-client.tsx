"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatBirthAge, formatFactureNumero } from "@/lib/formatting"
import { formatCategorieLabel } from "@/components/shared/categorie-icon"
import {
  montantExonereLigne,
  montantPatientDuLigne,
} from "@/lib/feuille-circulation/exoneration"
import type { EncaissementRecuDetail } from "@/lib/types/caisse"

export function CaisseRecuPrintClient({
  recu,
  reprint = false,
}: {
  recu: EncaissementRecuDetail
  reprint?: boolean
}) {
  const router = useRouter()
  const dateEnc = new Date(recu.createdAt)
  const dateVisite = recu.dateVisite ? new Date(recu.dateVisite) : null

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
          {reprint ? "Réimprimer" : "Imprimer"}
        </Button>
      </div>

      <div
        id="print-document"
        className="print-recu-listing mx-auto w-full max-w-[241mm] bg-white text-[13px] leading-snug text-black shadow-sm print:shadow-none"
      >
        <div className="px-[8mm] py-[6mm] print:px-0 print:py-0">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-3">
            <div>
              <h1 className="text-[16px] font-bold uppercase">
                {recu.clinique.nomClinique ?? "CLINIQUE"}
              </h1>
              {recu.clinique.adresse && <p className="mt-0.5">{recu.clinique.adresse}</p>}
              <p>
                {[recu.clinique.telephone, recu.clinique.email].filter(Boolean).join(" - ")}
              </p>
              <p className="text-[12px]">
                {[
                  recu.clinique.niu ? `NIU : ${recu.clinique.niu}` : null,
                  recu.clinique.registreCommerce
                    ? `RC : ${recu.clinique.registreCommerce}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" - ")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold uppercase">Reçu de caisse</p>
              {reprint ? <p className="font-bold uppercase">Réimpression</p> : null}
              <p className="text-[16px] font-bold">{recu.numero}</p>
              <p className="mt-1">{format(dateEnc, "dd/MM/yyyy HH:mm", { locale: fr })}</p>
              {recu.caissierNom && <p>Caissier : {recu.caissierNom}</p>}
            </div>
          </div>

          {/* Infos patient / visite */}
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-b border-black pb-3">
            <p>
              <span className="font-bold">Patient : </span>
              {recu.patientLabel ?? `#${recu.patientId}`}
              {recu.patientDob ? ` - ${formatBirthAge(recu.patientDob)}` : ""}
            </p>
            {dateVisite && (
              <p className="text-right">
                <span className="font-bold">Visite : </span>
                {format(dateVisite, "dd/MM/yyyy HH:mm", { locale: fr })}
              </p>
            )}
            {recu.medecinNom && (
              <p>
                <span className="font-bold">Médecin : </span>
                {recu.medecinNom}
              </p>
            )}
            <p className="text-right">
              {recu.type === "FEUILLE" && recu.feuilleNumero && (
                <>
                  <span className="font-bold">Feuille de circulation : </span>
                  {recu.feuilleNumero}
                </>
              )}
              {recu.type === "FACTURE" && recu.factureNumero && (
                <>
                  <span className="font-bold">Facture : </span>
                  {formatFactureNumero(recu.factureNumero)}
                </>
              )}
              {recu.type === "PRESCRIPTION" && recu.prescriptionNumero && (
                <>
                  <span className="font-bold">Prescription : </span>
                  {recu.prescriptionNumero}
                </>
              )}
            </p>
          </div>

          {/* Détail des lignes */}
          {recu.feuilles.map((f) => (
            <div key={f.feuilleId} className="mt-4">
              {recu.feuilles.length > 1 && (
                <p className="mb-1 font-bold uppercase">
                  {recu.type === "PRESCRIPTION"
                    ? `Prescription ${f.numero}`
                    : `Feuille de circulation ${f.numero}`}
                </p>
              )}
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-y-2 border-black">
                    <th className="py-1 pr-2 text-left font-bold">Désignation</th>
                    <th className="w-[5%] py-1 text-center font-bold">Qté</th>
                    <th className="w-[13%] py-1 text-right font-bold">P.U.</th>
                    <th className="w-[6%] py-1 text-center font-bold">Taux</th>
                    <th className="w-[12%] py-1 text-right font-bold">HNC</th>
                    <th className="w-[14%] py-1 text-right font-bold">Assurance</th>
                    <th className="w-[14%] py-1 text-right font-bold">Patient</th>
                  </tr>
                </thead>
                <tbody>
                  {f.lignes.map((l) => (
                    <tr key={l.id} className="border-b border-dashed border-black">
                      <td className="py-1 pr-2 align-top break-words">
                        <span className="block font-bold">
                          {l.typeLigne === "PHARMA"
                            ? `${l.produitNom ?? "Produit"}${l.produitDosage ? " " + l.produitDosage : ""}`
                            : (l.acteNom ?? "Acte")}
                        </span>
                        <span className="block text-[12px]">
                          {formatCategorieLabel(l.categorieNom)}
                        </span>
                      </td>
                      <td className="py-1 text-center align-top">{l.quantite}</td>
                      <td className="py-1 text-right align-top whitespace-nowrap">
                        {formatCurrency(l.valeur)}
                      </td>
                      <td className="py-1 text-center align-top">{l.taux}%</td>
                      <td className="py-1 text-right align-top whitespace-nowrap">
                        {formatCurrency(l.hnc * l.quantite)}
                      </td>
                      <td className="py-1 text-right align-top whitespace-nowrap">
                        {formatCurrency(l.montantAssurance)}
                      </td>
                      <td className="py-1 text-right align-top whitespace-nowrap font-bold">
                        {formatCurrency(montantPatientDuLigne(l))}
                        {montantExonereLigne(l) > 0 ? (
                          <span className="block text-[12px] whitespace-normal">
                            Réglée par avoir
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {recu.feuilles.length > 1 && (
                  <tfoot>
                    <tr className="border-t-2 border-black font-bold">
                      <td colSpan={6} className="py-1 text-right">
                        Sous-total patient {recu.type === "PRESCRIPTION" ? "prescription" : "feuille de circulation"} {f.numero}
                      </td>
                      <td className="py-1 text-right whitespace-nowrap">
                        {formatCurrency(
                          f.lignes.reduce((s, l) => s + montantPatientDuLigne(l), 0),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ))}

          {/* Totaux */}
          <div className="mt-5 flex justify-end">
            <table className="w-[100mm] border-collapse">
              <tbody>
                <tr>
                  <td className="py-1 pr-4">Part assurance (info)</td>
                  <td className="py-1 text-right whitespace-nowrap">
                    {formatCurrency(recu.montantAssurance)}
                  </td>
                </tr>
                <tr className="border-y-2 border-black text-[15px]">
                  <td className="py-1.5 pr-4 font-bold">Part patient payée</td>
                  <td className="py-1.5 text-right font-bold whitespace-nowrap">
                    {formatCurrency(recu.montant)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Mode de paiement</td>
                  <td className="py-1 text-right">Portemonnaie</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Solde portemonnaie</td>
                  <td className="py-1 text-right whitespace-nowrap">
                    {formatCurrency(recu.walletSoldeApres)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-8 text-center font-bold">Merci de votre confiance</p>
        </div>
      </div>
    </div>
  )
}
