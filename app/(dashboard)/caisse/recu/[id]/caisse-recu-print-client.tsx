"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatBirthAge, formatFactureNumero } from "@/lib/formatting"
import { formatCategorieLabel } from "@/components/shared/categorie-icon"
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
          {reprint ? "Réimprimer" : "Imprimer"}
        </Button>
      </div>

      <div
        id="print-document"
        className="print-recu-landscape mx-auto w-full max-w-[297mm] bg-white font-sans text-[12px] leading-snug text-black shadow-sm print:shadow-none"
      >
        <div className="px-[10mm] py-[8mm] print:px-[10mm] print:py-[8mm]">
          {/* En-tête */}
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
              <p className="text-[10px]">
                {[
                  recu.clinique.niu ? `NIU : ${recu.clinique.niu}` : null,
                  recu.clinique.registreCommerce
                    ? `RC : ${recu.clinique.registreCommerce}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-wider">Reçu de caisse</p>
              {reprint ? (
                <p className="text-[11px] font-bold uppercase tracking-wider">Réimpression</p>
              ) : null}
              <p className="text-sm font-bold">{recu.numero}</p>
              <p className="mt-1 text-[11px]">
                {format(dateEnc, "dd/MM/yyyy HH:mm", { locale: fr })}
              </p>
              {recu.caissierNom && (
                <p className="text-[11px]">Caissier : {recu.caissierNom}</p>
              )}
            </div>
          </div>

          {/* Infos patient / visite */}
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] border-b border-black/30 pb-3">
            <p>
              <span className="font-semibold">Patient : </span>
              {recu.patientLabel ?? `#${recu.patientId}`}
              {recu.patientDob ? ` · ${formatBirthAge(recu.patientDob)}` : ""}
            </p>
            {dateVisite && (
              <p className="text-right">
                <span className="font-semibold">Visite : </span>
                {format(dateVisite, "dd/MM/yyyy HH:mm", { locale: fr })}
              </p>
            )}
            {recu.medecinNom && (
              <p>
                <span className="font-semibold">Médecin : </span>
                {recu.medecinNom}
              </p>
            )}
            <p className="text-right">
              {recu.type === "FEUILLE" && recu.feuilleNumero && (
                <>
                  <span className="font-semibold">Feuille de circulation : </span>
                  {recu.feuilleNumero}
                </>
              )}
              {recu.type === "FACTURE" && recu.factureNumero && (
                <>
                  <span className="font-semibold">Facture : </span>
                  {formatFactureNumero(recu.factureNumero)}
                </>
              )}
              {recu.type === "PRESCRIPTION" && recu.prescriptionNumero && (
                <>
                  <span className="font-semibold">Prescription : </span>
                  {recu.prescriptionNumero}
                </>
              )}
            </p>
          </div>

          {/* Détail des lignes */}
          {recu.feuilles.map((f) => (
            <div key={f.feuilleId} className="mt-4">
              {recu.feuilles.length > 1 && (
                <p className="mb-1 text-[11px] font-bold uppercase">
                  {recu.type === "PRESCRIPTION"
                    ? `Prescription ${f.numero}`
                    : `Feuille de circulation ${f.numero}`}
                </p>
              )}
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-y border-black">
                    <th className="py-1.5 text-left font-bold">Désignation</th>
                    <th className="w-12 py-1.5 text-center font-bold">Qté</th>
                    <th className="w-28 py-1.5 text-right font-bold">P.U.</th>
                    <th className="w-12 py-1.5 text-center font-bold">Taux</th>
                    <th className="w-28 py-1.5 text-right font-bold">HNC</th>
                    <th className="w-28 py-1.5 text-right font-bold">Assurance</th>
                    <th className="w-28 py-1.5 text-right font-bold">Patient</th>
                  </tr>
                </thead>
                <tbody>
                  {f.lignes.map((l) => (
                    <tr key={l.id} className="border-b border-black/20">
                      <td className="py-1 pr-2">
                        <span className="font-medium">
                          {l.typeLigne === "PHARMA"
                            ? `${l.produitNom ?? "Produit"}${l.produitDosage ? " " + l.produitDosage : ""}`
                            : (l.acteNom ?? "Acte")}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {" "}
                          — {formatCategorieLabel(l.categorieNom)}
                        </span>
                      </td>
                      <td className="py-1 text-center">{l.quantite}</td>
                      <td className="py-1 text-right">{formatCurrency(l.valeur)}</td>
                      <td className="py-1 text-center">{l.taux}%</td>
                      <td className="py-1 text-right">
                        {formatCurrency(l.hnc * l.quantite)}
                      </td>
                      <td className="py-1 text-right">
                        {formatCurrency(l.montantAssurance)}
                      </td>
                      <td className="py-1 text-right font-medium">
                        {formatCurrency(l.montantPatient)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {recu.feuilles.length > 1 && (
                  <tfoot>
                    <tr className="border-t border-black font-bold">
                      <td colSpan={6} className="py-1 text-right">
                        Sous-total patient {recu.type === "PRESCRIPTION" ? "prescription" : "feuille de circulation"} {f.numero}
                      </td>
                      <td className="py-1 text-right">
                        {formatCurrency(f.totaux.totalPatient)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ))}

          {/* Totaux */}
          <div className="mt-5 flex justify-end">
            <table className="w-[72mm] border-collapse text-[11px]">
              <tbody>
                <tr>
                  <td className="py-1 pr-4">Part assurance (info)</td>
                  <td className="py-1 text-right font-medium">
                    {formatCurrency(recu.montantAssurance)}
                  </td>
                </tr>
                <tr className="border-t border-black">
                  <td className="py-1 pr-4 font-bold">Part patient payée</td>
                  <td className="py-1 text-right font-bold">
                    {formatCurrency(recu.montant)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Mode de paiement</td>
                  <td className="py-1 text-right">Portemonnaie</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Solde portemonnaie</td>
                  <td className="py-1 text-right">
                    {formatCurrency(recu.walletSoldeApres)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-8 text-center text-[11px] font-medium">
            Merci de votre confiance
          </p>
        </div>
      </div>
    </div>
  )
}
