/** Styles PDF en hex/rgb uniquement (compatible capture DOM). */
export const BORDEREAU_PDF_PAGE_WIDTH_MM = 210

export const BORDEREAU_PDF_STYLES = `
.print-bordereau-page {
  width: ${BORDEREAU_PDF_PAGE_WIDTH_MM}mm;
  max-width: ${BORDEREAU_PDF_PAGE_WIDTH_MM}mm;
  min-width: ${BORDEREAU_PDF_PAGE_WIDTH_MM}mm;
  min-height: 297mm;
  box-sizing: border-box;
  background: #ffffff;
  color: #1f2937;
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.bp-inner {
  width: 100%;
  box-sizing: border-box;
  padding: 10mm 8mm;
}
.bp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 2px solid #1f2937;
  padding-bottom: 16px;
}
.bp-header-left { display: flex; align-items: flex-start; gap: 16px; }
.bp-logo { height: 64px; width: auto; object-fit: contain; }
.bp-clinique { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #111827; margin: 0; }
.bp-meta { font-size: 13px; color: #4b5563; margin: 0; }
.bp-meta-sm { font-size: 12px; color: #6b7280; margin: 0; }
.bp-header-right { text-align: right; }
.bp-doc-type {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin: 0;
}
.bp-numero { font-size: 16px; font-weight: 700; color: #111827; margin: 4px 0 0; }
.bp-statut {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #cd3b86;
  border: 1px solid #cd3b86;
  border-radius: 4px;
}
.bp-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
  margin-top: 20px;
  font-size: 12px;
}
.bp-label { color: #6b7280; }
.bp-value { font-weight: 600; color: #111827; }
.bp-right { text-align: right; }
.bp-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; }
.bp-table thead tr { border-top: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; background: #f9fafb; }
.bp-table th { padding: 8px 6px; font-weight: 600; text-align: left; }
.bp-table th.bp-right { text-align: right; }
.bp-table td { padding: 6px; border-bottom: 1px solid #f3f4f6; }
.bp-table td.bp-right { text-align: right; }
.bp-totals { margin-top: 24px; display: flex; justify-content: flex-end; }
.bp-totals table { min-width: 280px; font-size: 13px; border-collapse: collapse; }
.bp-totals td { padding: 4px 0; }
.bp-totals .bp-total-row td {
  border-top: 2px solid #1f2937;
  padding-top: 8px;
  font-weight: 700;
  color: #111827;
}
.bp-notes {
  margin-top: 24px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  font-size: 12px;
  color: #4b5563;
}
.bp-footer-notes {
  margin-top: 32px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  text-align: center;
  font-size: 10px;
  color: #6b7280;
}
`
