"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatBirthAge, formatFactureNumero } from "@/lib/formatting"
import { encaissementTypeLabel } from "@/lib/facture/encaissement-labels"
import { formatCategorieLabel } from "@/components/shared/categorie-icon"
import type { FactureFeuilleResume, FacturePrintData } from "@/lib/types/facture"
import type { FeuilleLigneRow } from "@/lib/types/feuille-circulation"
import { FACTURE_PDF_PAGE_WIDTH_MM, FACTURE_PDF_STYLES } from "./facture-pdf-styles"

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

function ligneDesignation(l: FeuilleLigneRow) {
  return l.typeLigne === "PHARMA"
    ? `${l.produitNom ?? "Produit"}${l.produitDosage ? " " + l.produitDosage : ""}`
    : l.acteNom ?? "Acte"
}

function CliniqueHeader({
  parametres,
  titre,
  numero,
  dateVisite,
  dateFacture,
  duplicata,
}: {
  parametres: PrintParametres
  titre: string
  numero: string
  dateVisite: Date | null
  dateFacture: Date | null
  duplicata?: boolean
}) {
  return (
    <div className="fp-header">
      <div className="fp-header-left">
        {parametres?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={parametres.logo} alt="Logo" className="fp-logo" />
        ) : null}
        <div>
          <h1 className="fp-clinique">{parametres?.nomClinique ?? "Clinique"}</h1>
          {parametres?.adresse && <p className="fp-meta">{parametres.adresse}</p>}
          <p className="fp-meta">
            {[parametres?.telephone, parametres?.email].filter(Boolean).join(" • ")}
          </p>
          <p className="fp-meta-sm">
            {[
              parametres?.niu ? `NIU : ${parametres.niu}` : null,
              parametres?.registreCommerce ? `RC : ${parametres.registreCommerce}` : null,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
      </div>
      <div className="fp-header-right">
        <p className="fp-doc-type">{titre}</p>
        {duplicata ? <p className="fp-duplicata">Duplicata</p> : null}
        <p className="fp-numero">{numero}</p>
        {dateVisite && (
          <p className="fp-meta">
            Visite : {format(dateVisite, "d MMMM yyyy", { locale: fr })} à{" "}
            {format(dateVisite, "HH:mm")}
          </p>
        )}
        {dateFacture && (
          <p className="fp-meta">
            Facture du {format(dateFacture, "d MMMM yyyy", { locale: fr })}
          </p>
        )}
      </div>
    </div>
  )
}

function PatientAssuranceBlock({
  facture,
  variant,
}: {
  facture: FacturePrintData
  variant: "patient" | "assurance"
}) {
  return (
    <div className="fp-info">
      <div>
        <span className="fp-label">Patient : </span>
        <span className="fp-value">{facture.patientLabel ?? `#${facture.patientId}`}</span>
        {facture.patientDob && (
          <span className="fp-label">
            {" · "}
            {formatBirthAge(facture.patientDob)}
          </span>
        )}
      </div>
      <div className="fp-right">
        <span className="fp-label">Médecin : </span>
        <span className="fp-value">{facture.medecinNom ?? "—"}</span>
        {facture.medecinNumeroOrdre && (
          <span className="fp-label">
            {" · N° ONMC "}
            {facture.medecinNumeroOrdre}
          </span>
        )}
      </div>
      {variant === "assurance" && (
        <div className="fp-info-full">
          <div>
            <span className="fp-label">Assureur : </span>
            <span className="fp-value">{facture.assurance.assuranceNom ?? "Non assuré"}</span>
          </div>
          <div className="fp-right">
            {facture.assurance.numeroAttestation && (
              <>
                <span className="fp-label">N° attestation : </span>
                <span className="fp-value">{facture.assurance.numeroAttestation}</span>
              </>
            )}
            {facture.assurance.tauxCouverture != null && facture.assurance.assuranceNom && (
              <span className="fp-label">
                {facture.assurance.numeroAttestation ? " · " : ""}
                Taux : {facture.assurance.tauxCouverture}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FeuilleLignesTable({
  feuille,
  variant,
}: {
  feuille: FactureFeuilleResume
  variant: "patient" | "assurance"
}) {
  const lignes = feuille.lignes.filter(
    (l) => l.montantPatient > 0 || l.montantAssurance > 0,
  )

  if (lignes.length === 0) return null

  return (
    <div>
      <p className="fp-section-title">
        {feuille.kind === "prescription" ? "Prescription" : "Feuille"} {feuille.numero}
        {feuille.libelle ? ` — ${feuille.libelle}` : ""}
      </p>
      <table className="fp-table">
        <thead>
          <tr>
            <th className="fp-col-designation">Désignation</th>
            <th className="fp-center fp-col-qty">Qté</th>
            <th className="fp-center fp-col-taux">Taux</th>
            <th className="fp-right">Part patient</th>
            <th className="fp-right">Part assurance</th>
            <th className="fp-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => {
            const ligneTotal = l.montantTotal ?? l.montantPatient + l.montantAssurance
            return (
              <tr key={l.id}>
                <td className="fp-col-designation">
                  <span className="fp-medium">{ligneDesignation(l)}</span>
                  <span className="fp-muted"> — {formatCategorieLabel(l.categorieNom)}</span>
                </td>
                <td className="fp-center fp-col-qty">{l.quantite}</td>
                <td className="fp-center fp-col-taux">{l.taux}%</td>
                <td
                  className={
                    variant === "patient"
                      ? "fp-right fp-medium"
                      : "fp-right"
                  }
                >
                  {formatCurrency(l.montantPatient)}
                </td>
                <td
                  className={
                    variant === "assurance"
                      ? "fp-right fp-medium"
                      : "fp-right"
                  }
                >
                  {formatCurrency(l.montantAssurance)}
                </td>
                <td className="fp-right fp-medium">{formatCurrency(ligneTotal)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PaiementHistoriqueBlock({ facture }: { facture: FacturePrintData }) {
  const { historiquePaiements, totalEncaisse } = facture

  return (
    <div className="fp-payments">
      <p className="fp-section-title">Historique de paiement</p>
      {historiquePaiements.length === 0 ? (
        <p className="fp-payments-empty">Aucun paiement enregistré.</p>
      ) : (
        <>
          <table className="fp-table">
            <thead>
              <tr>
                <th>Reçu</th>
                <th>Type</th>
                <th>Référence</th>
                <th>Date</th>
                <th className="fp-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {historiquePaiements.map((row) => (
                <tr key={row.id}>
                  <td className="fp-medium">{row.numero}</td>
                  <td>{encaissementTypeLabel(row.type)}</td>
                  <td>
                    {row.type === "FEUILLE" && row.feuilleNumero
                      ? row.feuilleNumero
                      : "Facture groupée"}
                  </td>
                  <td>
                    {format(new Date(row.createdAt), "d MMM yyyy HH:mm", { locale: fr })}
                  </td>
                  <td className="fp-right fp-medium">{formatCurrency(row.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fp-payments-total">
            Total encaissé
            <strong>{formatCurrency(totalEncaisse)}</strong>
          </p>
        </>
      )}
    </div>
  )
}

function FacturePage({
  facture,
  parametres,
  variant,
  duplicata,
}: {
  facture: FacturePrintData
  parametres: PrintParametres
  variant: "patient" | "assurance"
  duplicata?: boolean
}) {
  const dateVisite = facture.dateVisite ? new Date(facture.dateVisite) : null
  const dateFacture = facture.confirmedAt
    ? new Date(facture.confirmedAt)
    : facture.createdAt
      ? new Date(facture.createdAt)
      : null
  const titre = variant === "patient" ? "Facture patient" : "Facture assureur"
  // Impression : part patient brute (somme des lignes), sans exclure les
  // feuilles déjà payées stockées dans facture.montantPatient.
  const partPatientBrute = facture.feuilles.reduce(
    (sum, f) =>
      sum + f.lignes.reduce((s, l) => s + (l.montantPatient ?? 0), 0),
    0,
  )
  const totalGeneral = partPatientBrute + facture.montantAssurance
  const hasLignes = facture.feuilles.some((f) =>
    f.lignes.some((l) => l.montantPatient > 0 || l.montantAssurance > 0),
  )

  return (
    <div className="print-facture-page">
      <div className="fp-inner">
        <CliniqueHeader
          parametres={parametres}
          titre={titre}
          numero={formatFactureNumero(facture.numero)}
          dateVisite={dateVisite}
          dateFacture={dateFacture}
          duplicata={duplicata}
        />

        <PatientAssuranceBlock facture={facture} variant={variant} />

        {hasLignes ? (
          facture.feuilles.map((f) => (
            <FeuilleLignesTable key={f.feuilleId} feuille={f} variant={variant} />
          ))
        ) : (
          <p className="fp-empty">
            {variant === "assurance"
              ? "Aucune part assurance sur cette facture."
              : "Aucune ligne patient."}
          </p>
        )}

        {variant === "patient" && <PaiementHistoriqueBlock facture={facture} />}

        <div className="fp-totals">
          <table>
            <tbody>
              {variant === "assurance" ? (
                <>
                  <tr>
                    <td className="fp-label">Part patient</td>
                    <td className="fp-right fp-value">
                      {formatCurrency(partPatientBrute)}
                    </td>
                  </tr>
                  <tr className="fp-total-row">
                    <td>Total assureur</td>
                    <td className="fp-right">
                      {formatCurrency(facture.montantAssurance)}
                    </td>
                  </tr>
                  <tr>
                    <td className="fp-label">TOTAL</td>
                    <td className="fp-right fp-value">
                      {formatCurrency(totalGeneral)}
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  <tr>
                    <td className="fp-label">Part assurance</td>
                    <td className="fp-right fp-value">
                      {formatCurrency(facture.montantAssurance)}
                    </td>
                  </tr>
                  <tr className="fp-total-row">
                    <td>Total patient</td>
                    <td className="fp-right">
                      {formatCurrency(partPatientBrute)}
                    </td>
                  </tr>
                  <tr>
                    <td className="fp-label">TOTAL</td>
                    <td className="fp-right fp-value">
                      {formatCurrency(totalGeneral)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {(parametres?.noteBasPage1 || parametres?.noteBasPage2) && (
          <div className="fp-notes">
            {parametres?.noteBasPage1 && <p>{parametres.noteBasPage1}</p>}
            {parametres?.noteBasPage2 && <p>{parametres.noteBasPage2}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export function FacturePrintClient({
  facture,
  parametres,
  bacItemId,
  backHref,
}: {
  facture: FacturePrintData
  parametres: PrintParametres
  /** Si défini, marque l'élément du bac comme imprimé après téléchargement PDF. */
  bacItemId?: string
  backHref?: string
}) {
  const router = useRouter()
  const documentRef = React.useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = React.useState(false)
  const hasAutoDownloaded = React.useRef(false)

  const pdfFilename = `facture-${formatFactureNumero(facture.numero).replace(/[#/\s]+/g, "-")}.pdf`
  const retourHref = backHref ?? `/facturation/${facture.id}`

  const handleDownload = React.useCallback(async () => {
    if (!documentRef.current || downloading) return
    setDownloading(true)
    try {
      const { downloadPagesPdf } = await import("@/lib/pdf/download-pages-pdf")
      await downloadPagesPdf({
        root: documentRef.current,
        pageSelector: ".print-facture-page",
        filename: pdfFilename,
        orientation: "portrait",
        pageWidthMm: FACTURE_PDF_PAGE_WIDTH_MM,
      })
      toast.success("PDF téléchargé")
      if (bacItemId) {
        const { markBacFactureImprime } = await import("@/app/actions/bac-factures")
        const res = await markBacFactureImprime(bacItemId)
        if (res.ok) {
          router.push("/facturation/bac")
          router.refresh()
        } else {
          toast.error(res.error)
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléchargement PDF")
    } finally {
      setDownloading(false)
    }
  }, [downloading, pdfFilename, bacItemId, router])

  React.useEffect(() => {
    if (hasAutoDownloaded.current) return
    hasAutoDownloaded.current = true
    const t = setTimeout(() => void handleDownload(), 600)
    return () => clearTimeout(t)
  }, [handleDownload])

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <style dangerouslySetInnerHTML={{ __html: FACTURE_PDF_STYLES }} />

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <button
          type="button"
          onClick={() => router.push(retourHref)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <Button
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {downloading ? "Génération…" : "Télécharger le PDF"}
        </Button>
      </div>

      <div
        ref={documentRef}
        id="print-document"
        className="print-facture-portrait mx-auto w-[210mm] space-y-8"
      >
        <FacturePage facture={facture} parametres={parametres} variant="patient" />
        <FacturePage facture={facture} parametres={parametres} variant="assurance" />
        <FacturePage
          facture={facture}
          parametres={parametres}
          variant="assurance"
          duplicata
        />
      </div>
    </div>
  )
}
