"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime } from "@/lib/formatting"
import type {
  MedicamentSortiPeriod,
  MedicamentSortiRow,
} from "@/app/actions/pharmacie-sortie"

const PERIOD_LABELS: Record<MedicamentSortiPeriod, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "7 derniers jours",
  month: "30 derniers jours",
  all: "Tout",
}

const STYLES = `
.print-meds-page {
  width: 297mm;
  min-height: 210mm;
  box-sizing: border-box;
  background: #fff;
  color: #111827;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  padding: 8mm 7mm;
  font-size: 8.5px;
  line-height: 1.25;
}
.ms-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 6px;
  border-bottom: 1.5px solid #111827;
}
.ms-clinique {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0;
  text-transform: uppercase;
}
.ms-contact {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 7.5px;
}
.ms-doc-right { text-align: right; }
.ms-doc-type {
  margin: 0;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
}
.ms-title {
  margin: 1px 0 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.ms-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 6px;
  padding: 5px 0 6px;
  border-bottom: 0.5px solid #d1d5db;
  color: #374151;
  font-size: 8px;
}
.ms-filters strong {
  font-weight: 700;
  color: #111827;
}
.ms-summary {
  display: flex;
  gap: 0;
  margin-top: 6px;
  border: 0.5px solid #d1d5db;
}
.ms-summary-item {
  flex: 1;
  padding: 4px 8px;
  border-right: 0.5px solid #d1d5db;
}
.ms-summary-item:last-child { border-right: none; }
.ms-summary-label {
  font-size: 6.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
}
.ms-summary-value {
  font-size: 12px;
  font-weight: 700;
  margin-top: 1px;
  font-variant-numeric: tabular-nums;
}
.ms-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  table-layout: fixed;
}
.ms-table th,
.ms-table td {
  border-bottom: 0.4px solid #e5e7eb;
  padding: 3px 4px;
  text-align: left;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ms-table th {
  background: #f3f4f6;
  font-weight: 700;
  font-size: 7px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #4b5563;
  border-bottom: 0.8px solid #9ca3af;
  padding: 4px;
}
.ms-table tbody tr:nth-child(even) td { background: #fafafa; }
.ms-table .ms-center { text-align: center; }
.ms-table .ms-right { text-align: right; }
.ms-table .ms-wrap {
  white-space: normal;
  line-height: 1.2;
}
.ms-dosage {
  color: #6b7280;
  font-weight: 400;
}
.ms-mono {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 8px;
  letter-spacing: -0.02em;
}
.ms-muted { color: #6b7280; }
.ms-foot {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #111827;
  font-size: 8px;
}
.ms-foot-totals {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.ms-foot-note {
  color: #9ca3af;
  font-size: 7px;
  text-align: right;
}
.ms-empty {
  text-align: center;
  padding: 18px 8px !important;
  color: #6b7280;
  white-space: normal !important;
}
.col-n { width: 4%; }
.col-med { width: 24%; }
.col-qte { width: 5%; }
.col-pat { width: 18%; }
.col-lot { width: 14%; }
.col-sortie { width: 14%; }
.col-user { width: 11%; }
.col-date { width: 10%; }
`

export function MedicamentsSortisPrintClient({
  rows,
  totalQuantite,
  period,
  pharmacieNom,
  recherche,
  parametres,
}: {
  rows: MedicamentSortiRow[]
  totalQuantite: number
  period: MedicamentSortiPeriod
  pharmacieNom: string
  recherche: string
  parametres: {
    nomClinique?: string | null
    adresse?: string | null
    telephone?: string | null
    email?: string | null
  } | null
}) {
  const router = useRouter()
  const ref = React.useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = React.useState(false)
  const generatedAt = React.useMemo(() => new Date().toISOString(), [])
  const uniqueSorties = React.useMemo(
    () => new Set(rows.map((r) => r.sortieId)).size,
    [rows],
  )

  const contactLine = [parametres?.telephone, parametres?.email]
    .filter(Boolean)
    .join(" · ")

  async function download() {
    if (!ref.current) return
    setDownloading(true)
    try {
      const { downloadPagesPdf } = await import("@/lib/pdf/download-pages-pdf")
      await downloadPagesPdf({
        root: ref.current,
        pageSelector: ".print-meds-page",
        filename: `medicaments-dispenses-${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: "landscape",
        pageWidthMm: 297,
      })
      toast.success("PDF téléchargé")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF")
    } finally {
      setDownloading(false)
    }
  }

  React.useEffect(() => {
    const t = setTimeout(() => void download(), 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="mx-auto mb-4 flex max-w-[297mm] justify-between px-4">
        <button
          type="button"
          onClick={() => router.push("/pharmacie/sorties/medicaments-sortis")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </button>
        <Button
          type="button"
          onClick={() => void download()}
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

      <div ref={ref} className="mx-auto w-[297mm]">
        <div className="print-meds-page">
          <header className="ms-head">
            <div>
              <p className="ms-clinique">
                {parametres?.nomClinique ?? "Clinique"}
              </p>
              {parametres?.adresse ? (
                <p className="ms-contact">{parametres.adresse}</p>
              ) : null}
              {contactLine ? <p className="ms-contact">{contactLine}</p> : null}
            </div>
            <div className="ms-doc-right">
              <p className="ms-doc-type">Pharmacie · Dispensation</p>
              <h1 className="ms-title">Médicaments dispensés</h1>
            </div>
          </header>

          <div className="ms-filters">
            <span>
              <strong>Période</strong> {PERIOD_LABELS[period]}
            </span>
            <span>
              <strong>Pharmacie</strong> {pharmacieNom}
            </span>
            {recherche ? (
              <span>
                <strong>Recherche</strong> {recherche}
              </span>
            ) : null}
            <span>
              <strong>Édité</strong> {formatDateTime(generatedAt)}
            </span>
          </div>

          <div className="ms-summary">
            <div className="ms-summary-item">
              <div className="ms-summary-label">Lignes</div>
              <div className="ms-summary-value">{rows.length}</div>
            </div>
            <div className="ms-summary-item">
              <div className="ms-summary-label">Qté</div>
              <div className="ms-summary-value">{totalQuantite}</div>
            </div>
            <div className="ms-summary-item">
              <div className="ms-summary-label">Sorties</div>
              <div className="ms-summary-value">{uniqueSorties}</div>
            </div>
          </div>

          <table className="ms-table">
            <colgroup>
              <col className="col-n" />
              <col className="col-med" />
              <col className="col-qte" />
              <col className="col-pat" />
              <col className="col-lot" />
              <col className="col-sortie" />
              <col className="col-user" />
              <col className="col-date" />
            </colgroup>
            <thead>
              <tr>
                <th className="ms-center">N°</th>
                <th>Médicament</th>
                <th className="ms-center">Qté</th>
                <th>Patient</th>
                <th>Lot / Pérem.</th>
                <th>Sortie</th>
                <th>Dispensé par</th>
                <th className="ms-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="ms-empty">
                    Aucun médicament pour ces filtres
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.ligneId}>
                    <td className="ms-center ms-muted">{i + 1}</td>
                    <td className="ms-wrap">
                      <strong>{r.produitNom}</strong>
                      {r.produitDosage ? (
                        <span className="ms-dosage"> · {r.produitDosage}</span>
                      ) : null}
                    </td>
                    <td className="ms-center">
                      <strong>{r.quantiteServie}</strong>
                    </td>
                    <td>{r.patientLabel ?? `#${r.patientId}`}</td>
                    <td>
                      <span className="ms-mono">{r.numeroLot}</span>
                      <span className="ms-muted">
                        {" "}
                        · {formatDate(r.datePeremption)}
                      </span>
                    </td>
                    <td>
                      <span className="ms-mono">{r.sortieNumero}</span>
                      <span className="ms-muted"> · {r.pharmacieNom}</span>
                    </td>
                    <td>{r.userNom}</td>
                    <td className="ms-right">
                      {r.createdAt ? formatDateTime(r.createdAt) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <footer className="ms-foot">
            <div className="ms-foot-totals">
              {rows.length} ligne{rows.length > 1 ? "s" : ""} · {totalQuantite}{" "}
              qté · {uniqueSorties} sortie{uniqueSorties > 1 ? "s" : ""}
            </div>
            <div className="ms-foot-note">
              Document généré automatiquement — usage interne pharmacie
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
