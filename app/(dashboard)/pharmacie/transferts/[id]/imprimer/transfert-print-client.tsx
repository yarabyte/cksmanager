"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime } from "@/lib/formatting"

const STYLES = `
.print-transfert-page {
  width: 210mm; min-height: 297mm; box-sizing: border-box;
  background: #fff; color: #1f2937; font-family: Inter, system-ui, sans-serif;
  padding: 12mm 10mm; font-size: 13px;
}
.tp-title { font-size: 18px; font-weight: 800; margin: 0; }
.tp-meta { color: #6b7280; font-size: 12px; }
.tp-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.tp-table th, .tp-table td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: left; }
.tp-table th { background: #f9fafb; font-weight: 600; }
`

export function TransfertPrintClient({
  transfert,
  parametres,
}: {
  transfert: {
    numero: string
    magasinSourceNom: string
    magasinDestNom: string
    userNom: string
    createdAt: string | null
    lignes: {
      produitNom: string
      produitDosage: string
      numeroLot: string
      datePeremption: string
      quantite: number
    }[]
  }
  parametres: { nomClinique?: string | null } | null
}) {
  const router = useRouter()
  const ref = React.useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = React.useState(false)

  async function download() {
    if (!ref.current) return
    setDownloading(true)
    try {
      const { downloadPagesPdf } = await import("@/lib/pdf/download-pages-pdf")
      await downloadPagesPdf({
        root: ref.current,
        pageSelector: ".print-transfert-page",
        filename: `transfert-${transfert.numero}.pdf`,
        orientation: "portrait",
        pageWidthMm: 210,
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
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-between px-4">
        <button
          type="button"
          onClick={() => router.push("/pharmacie/transferts")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <Button onClick={() => void download()} disabled={downloading} className="gap-2 bg-[#cd3b86] text-white">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          PDF
        </Button>
      </div>
      <div ref={ref} className="mx-auto w-[210mm]">
        <div className="print-transfert-page">
          <p className="tp-meta">{parametres?.nomClinique ?? "Clinique"}</p>
          <h1 className="tp-title">Bon de transfert {transfert.numero}</h1>
          <p className="tp-meta">
            {transfert.magasinSourceNom} → {transfert.magasinDestNom}
          </p>
          <p className="tp-meta">
            Par {transfert.userNom}
            {transfert.createdAt ? ` · ${formatDateTime(transfert.createdAt)}` : ""}
          </p>
          <table className="tp-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Lot</th>
                <th>Péremption</th>
                <th>Qté</th>
              </tr>
            </thead>
            <tbody>
              {transfert.lignes.map((l, i) => (
                <tr key={i}>
                  <td>
                    {l.produitNom} {l.produitDosage}
                  </td>
                  <td>{l.numeroLot}</td>
                  <td>{formatDate(l.datePeremption)}</td>
                  <td>{l.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
