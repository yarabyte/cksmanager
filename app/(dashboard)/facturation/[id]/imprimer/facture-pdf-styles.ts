/** Styles PDF en hex/rgb uniquement (compatible capture DOM, sans lab/oklch). */
export const FACTURE_PDF_PAGE_WIDTH_MM = 210

export const FACTURE_PDF_STYLES = `
.print-facture-page {
  width: ${FACTURE_PDF_PAGE_WIDTH_MM}mm;
  max-width: ${FACTURE_PDF_PAGE_WIDTH_MM}mm;
  min-width: ${FACTURE_PDF_PAGE_WIDTH_MM}mm;
  box-sizing: border-box;
  background: #ffffff;
  color: #1f2937;
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.fp-inner {
  width: 100%;
  box-sizing: border-box;
  padding: 10mm 8mm;
}
.fp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 2px solid #1f2937;
  padding-bottom: 16px;
}
.fp-header-left { display: flex; align-items: flex-start; gap: 16px; }
.fp-logo { height: 64px; width: auto; object-fit: contain; }
.fp-clinique { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #111827; }
.fp-meta { font-size: 13px; color: #4b5563; margin: 0; }
.fp-meta-sm { font-size: 12px; color: #6b7280; margin: 0; }
.fp-header-right { text-align: right; }
.fp-doc-type {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin: 0;
}
.fp-duplicata {
  margin: 4px 0 0;
  padding: 0;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #000000;
  border: none;
  border-radius: 0;
}
.fp-numero { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
.fp-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
  margin-top: 20px;
  font-size: 12px;
}
.fp-info-full { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.fp-label { color: #6b7280; }
.fp-value { font-weight: 600; color: #111827; }
.fp-right { text-align: right; }
.fp-section-title {
  margin: 16px 0 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
}
.fp-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
.fp-table thead tr { border-top: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; background: #f9fafb; }
.fp-table th { padding: 8px 6px; font-weight: 600; text-align: left; }
.fp-table th.fp-center { text-align: center; }
.fp-table th.fp-right { text-align: right; }
.fp-table th.fp-col-designation,
.fp-table td.fp-col-designation { width: 42%; }
.fp-table th.fp-col-qty,
.fp-table td.fp-col-qty { width: 7%; }
.fp-table th.fp-col-taux,
.fp-table td.fp-col-taux { width: 8%; }
.fp-table td { padding: 6px 6px; border-bottom: 1px solid #f3f4f6; word-wrap: break-word; }
.fp-table td.fp-center { text-align: center; }
.fp-table td.fp-right { text-align: right; }
.fp-muted { color: #9ca3af; }
.fp-medium { font-weight: 500; color: #111827; }
.fp-empty { margin-top: 32px; text-align: center; font-size: 14px; color: #6b7280; }
.fp-totals { margin-top: 24px; display: flex; justify-content: flex-end; }
.fp-totals table { min-width: 300px; font-size: 13px; border-collapse: collapse; }
.fp-totals td { padding: 4px 0; }
.fp-totals .fp-total-row td {
  border-top: 2px solid #1f2937;
  padding-top: 8px;
  font-weight: 700;
  color: #111827;
}
.fp-notes {
  margin-top: 32px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  text-align: center;
  font-size: 10px;
  color: #6b7280;
}
.fp-payments { margin-top: 24px; }
.fp-payments-empty {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}
.fp-payments-total {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: #374151;
}
.fp-payments-total strong {
  margin-left: 8px;
  font-weight: 700;
  color: #047857;
}
`
