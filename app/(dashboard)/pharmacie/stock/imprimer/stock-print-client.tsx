"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatting"

const STYLES = `
.print-stock-page {
  width: 297mm; min-height: 210mm; box-sizing: border-box;
  background: #fff; color: #1f2937; font-family: Inter, system-ui, sans-serif;
  padding: 10mm 8mm; font-size: 11px;
}
.st-title { font-size: 18px; font-weight: 800; margin: 0; }
.st-meta { color: #6b7280; font-size: 11px; margin: 2px 0 0; }
.st-kpis { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
.st-kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; min-width: 120px; }
.st-kpi-label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 700; }
.st-kpi-value { font-size: 16px; font-weight: 800; margin-top: 2px; }
.st-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
.st-table th, .st-table td { border-bottom: 1px solid #e5e7eb; padding: 6px 4px; text-align: left; }
.st-table th { background: #f9fafb; font-weight: 600; font-size: 10px; text-transform: uppercase; color: #6b7280; }
.st-table .st-right { text-align: right; }
.st-table .st-center { text-align: center; }
.st-alert { color: #b45309; font-weight: 600; }
.st-low { color: #e11d48; font-weight: 600; }
.st-totals { margin-top: 14px; text-align: right; font-weight: 700; }
.st-footer { margin-top: 20px; font-size: 10px; color: #9ca3af; }
`

export type StockColumnId =
  | "produit"
  | "forme"
  | "conditionnement"
  | "magasin"
  | "lot"
  | "peremption"
  | "quantite"
  | "prixAchat"
  | "valeur"

const COLUMN_LABELS: Record<StockColumnId, string> = {
  produit: "Produit",
  forme: "Forme",
  conditionnement: "Conditionnement",
  magasin: "Magasin",
  lot: "Lot",
  peremption: "Péremption",
  quantite: "Qté",
  prixAchat: "PU achat",
  valeur: "Valeur",
}

type StockLotPrint = {
  id: string
  produitNom: string
  produitDosage: string
  produitForme: string
  produitConditionnement: string
  magasinNom: string
  numeroLot: string
  datePeremption: string
  quantite: number
  prixAchat: number
  valeur: number
  alerteStock: boolean
  alertePeremption: boolean
}

function cellClass(id: StockColumnId) {
  if (id === "quantite") return "st-center"
  if (id === "prixAchat" || id === "valeur") return "st-right"
  return undefined
}

function renderCell(l: StockLotPrint, id: StockColumnId) {
  switch (id) {
    case "produit":
      return (
        <>
          {l.produitNom}
          {l.produitDosage ? ` ${l.produitDosage}` : ""}
        </>
      )
    case "forme":
      return l.produitForme || "—"
    case "conditionnement":
      return l.produitConditionnement || "—"
    case "magasin":
      return l.magasinNom
    case "lot":
      return l.numeroLot
    case "peremption":
      return (
        <span className={l.alertePeremption ? "st-alert" : undefined}>
          {formatDate(l.datePeremption)}
          {l.alertePeremption ? " *" : ""}
        </span>
      )
    case "quantite":
      return (
        <span className={l.alerteStock ? "st-low" : undefined}>{l.quantite}</span>
      )
    case "prixAchat":
      return formatCurrency(l.prixAchat)
    case "valeur":
      return formatCurrency(l.valeur ?? l.quantite * l.prixAchat)
  }
}

export function StockPrintClient({
  lots,
  columns,
  magasinNom,
  recherche,
  alertesOnly,
  parametres,
}: {
  lots: StockLotPrint[]
  columns: StockColumnId[]
  magasinNom: string
  recherche: string
  alertesOnly: boolean
  parametres: { nomClinique?: string | null } | null
}) {
  const router = useRouter()
  const ref = React.useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = React.useState(false)
  const generatedAt = React.useMemo(() => new Date().toISOString(), [])

  const totalUnites = lots.reduce((s, l) => s + l.quantite, 0)
  const valeurTotale = lots.reduce(
    (s, l) => s + (l.valeur ?? l.quantite * l.prixAchat),
    0,
  )
  const alertes = lots.filter((l) => l.alerteStock || l.alertePeremption).length

  async function download() {
    if (!ref.current) return
    setDownloading(true)
    try {
      const { downloadPagesPdf } = await import("@/lib/pdf/download-pages-pdf")
      await downloadPagesPdf({
        root: ref.current,
        pageSelector: ".print-stock-page",
        filename: `rapport-stock-${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: "landscape",
        pageWidthMm: 297,
      })
      toast.success("Rapport PDF téléchargé")
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
          onClick={() => router.push("/pharmacie/stock")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au stock
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
        <div className="print-stock-page">
          <p className="st-meta">{parametres?.nomClinique ?? "Clinique"}</p>
          <h1 className="st-title">Rapport de stock</h1>
          <p className="st-meta">Magasin : {magasinNom}</p>
          {recherche ? <p className="st-meta">Recherche : {recherche}</p> : null}
          {alertesOnly ? (
            <p className="st-meta">Filtre : lots en alerte uniquement</p>
          ) : null}
          <p className="st-meta">Édité le {formatDateTime(generatedAt)}</p>

          <div className="st-kpis">
            <div className="st-kpi">
              <div className="st-kpi-label">Lots</div>
              <div className="st-kpi-value">{lots.length}</div>
            </div>
            <div className="st-kpi">
              <div className="st-kpi-label">Unités</div>
              <div className="st-kpi-value">{totalUnites}</div>
            </div>
            <div className="st-kpi">
              <div className="st-kpi-label">Valeur</div>
              <div className="st-kpi-value">{formatCurrency(valeurTotale)}</div>
            </div>
            <div className="st-kpi">
              <div className="st-kpi-label">Alertes</div>
              <div className="st-kpi-value">{alertes}</div>
            </div>
          </div>

          <table className="st-table">
            <thead>
              <tr>
                {columns.map((id) => (
                  <th key={id} className={cellClass(id)}>
                    {COLUMN_LABELS[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lots.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{ textAlign: "center", padding: 24 }}
                  >
                    Aucun lot à afficher
                  </td>
                </tr>
              ) : (
                lots.map((l) => (
                  <tr key={l.id}>
                    {columns.map((id) => (
                      <td key={id} className={cellClass(id)}>
                        {renderCell(l, id)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <p className="st-totals">
            Unités : {totalUnites} · Valeur totale : {formatCurrency(valeurTotale)}
          </p>
          <p className="st-footer">
            * Péremption dans les 30 jours · Quantité en rouge = stock bas
          </p>
        </div>
      </div>
    </div>
  )
}
