export const RAPPORT_PDF_PAGE_WIDTH_MM = 210

export const RAPPORT_PDF_STYLES = `
.print-rapport-page {
  width: ${RAPPORT_PDF_PAGE_WIDTH_MM}mm;
  max-width: ${RAPPORT_PDF_PAGE_WIDTH_MM}mm;
  min-width: ${RAPPORT_PDF_PAGE_WIDTH_MM}mm;
  min-height: 297mm;
  box-sizing: border-box;
  background: #ffffff;
  color: #1f2937;
  font-family: Inter, system-ui, sans-serif;
  font-size: 13px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.rp-inner {
  width: 100%;
  box-sizing: border-box;
  padding: 10mm 8mm;
}
.rp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 2px solid #1f2937;
  padding-bottom: 16px;
}
.rp-header-left { display: flex; align-items: flex-start; gap: 16px; }
.rp-logo { height: 56px; width: auto; object-fit: contain; }
.rp-clinique { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #111827; margin: 0; }
.rp-meta { font-size: 12px; color: #4b5563; margin: 0; }
.rp-header-right { text-align: right; }
.rp-doc-type {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin: 0;
}
.rp-title { font-size: 16px; font-weight: 700; color: #111827; margin: 4px 0 0; }
.rp-periode { font-size: 12px; color: #4b5563; margin: 4px 0 0; }
.rp-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.rp-kpi {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
}
.rp-kpi-label { font-size: 10px; text-transform: uppercase; color: #6b7280; margin: 0; }
.rp-kpi-value { font-size: 14px; font-weight: 700; color: #111827; margin: 4px 0 0; }
.rp-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
.rp-table thead tr { border-top: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; background: #f9fafb; }
.rp-table th { padding: 8px 6px; font-weight: 600; text-align: left; }
.rp-table th.rp-right { text-align: right; }
.rp-table th.rp-center { text-align: center; }
.rp-table td { padding: 6px; border-bottom: 1px solid #f3f4f6; }
.rp-table td.rp-right { text-align: right; }
.rp-table td.rp-center { text-align: center; }
.rp-table tfoot td {
  border-top: 2px solid #1f2937;
  padding-top: 8px;
  font-weight: 700;
}
`
