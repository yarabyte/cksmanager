import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IBordersOptions,
} from 'docx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency, formatFactureNumero } from '@/lib/formatting'
import type { BordereauDetail, BordereauStatut } from '@/lib/types/bordereau'

export type BordereauDocxParametres = {
  nomClinique?: string | null
  adresse?: string | null
  telephone?: string | null
  email?: string | null
  niu?: string | null
  registreCommerce?: string | null
  noteBasPage1?: string | null
  noteBasPage2?: string | null
} | null

const STATUT_LABEL: Record<BordereauStatut, string> = {
  BROUILLON: 'Brouillon',
  PARTIEL: 'Partiel',
  DEPOSE: 'Déposé',
  PAYE: 'Payé',
}

const THIN: IBordersOptions = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
}

const NO_BORDER: IBordersOptions = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

function formatDateFr(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'd MMMM yyyy', { locale: fr })
}

function cell(
  text: string,
  opts?: {
    bold?: boolean
    align?: (typeof AlignmentType)[keyof typeof AlignmentType]
    width?: number
    shade?: string
    borders?: IBordersOptions
  },
) {
  return new TableCell({
    borders: opts?.borders ?? THIN,
    width: { size: opts?.width ?? 2500, type: WidthType.DXA },
    shading: opts?.shade ? { fill: opts.shade } : undefined,
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts?.bold,
            size: 20,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  })
}

function metaLine(text: string) {
  return new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text, size: 18, color: '4B5563', font: 'Calibri' }),
    ],
  })
}

function labelValue(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: label, size: 20, color: '6B7280', font: 'Calibri' }),
      new TextRun({
        text: value,
        bold: true,
        size: 20,
        color: '111827',
        font: 'Calibri',
      }),
    ],
  })
}

/** Génère un .docx du bordereau (même contenu que l’impression PDF). */
export async function buildBordereauDocxBlob(
  bordereau: BordereauDetail,
  parametres?: BordereauDocxParametres,
): Promise<Blob> {
  const clinique = parametres?.nomClinique?.trim() || 'Clinique'
  const contact = [parametres?.telephone, parametres?.email]
    .filter(Boolean)
    .join(' • ')
  const ids = [
    parametres?.niu ? `NIU : ${parametres.niu}` : null,
    parametres?.registreCommerce ? `RC : ${parametres.registreCommerce}` : null,
  ]
    .filter(Boolean)
    .join(' • ')

  const headerRows: Paragraph[] = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: clinique,
          bold: true,
          size: 32,
          font: 'Calibri',
          allCaps: true,
        }),
      ],
    }),
  ]
  if (parametres?.adresse) headerRows.push(metaLine(parametres.adresse))
  if (contact) headerRows.push(metaLine(contact))
  if (ids) headerRows.push(metaLine(ids))

  headerRows.push(
    new Paragraph({
      spacing: { before: 200, after: 40 },
      children: [
        new TextRun({
          text: 'BORDEREAU ASSUREUR',
          bold: true,
          size: 22,
          color: '6B7280',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: bordereau.numero,
          bold: true,
          size: 28,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: STATUT_LABEL[bordereau.statut],
          size: 20,
          font: 'Calibri',
        }),
      ],
    }),
    labelValue('Assureur : ', bordereau.assuranceNom),
    labelValue('Factures : ', String(bordereau.factures.length)),
  )

  if (bordereau.dateDepot) {
    headerRows.push(labelValue('Date de dépôt : ', formatDateFr(bordereau.dateDepot)))
  }
  if (bordereau.datePaiement) {
    const pay = [
      formatDateFr(bordereau.datePaiement),
      bordereau.refVirement ? `· ${bordereau.refVirement}` : null,
    ]
      .filter(Boolean)
      .join(' ')
    headerRows.push(labelValue('Paiement : ', pay))
  }

  const colW = [1800, 4200, 2200, 2200] as const

  const tableRows = [
    new TableRow({
      children: [
        cell('N° facture', { bold: true, width: colW[0], shade: 'F9FAFB' }),
        cell('Patient', { bold: true, width: colW[1], shade: 'F9FAFB' }),
        cell('Date visite', { bold: true, width: colW[2], shade: 'F9FAFB' }),
        cell('Part assurance', {
          bold: true,
          width: colW[3],
          shade: 'F9FAFB',
          align: AlignmentType.RIGHT,
        }),
      ],
    }),
    ...bordereau.factures.map(
      (f) =>
        new TableRow({
          children: [
            cell(formatFactureNumero(f.factureNumero), { width: colW[0] }),
            cell(f.patientLabel ?? `#${f.patientId}`, { width: colW[1] }),
            cell(formatDateFr(f.dateVisite), { width: colW[2] }),
            cell(formatCurrency(f.montantAssurance), {
              width: colW[3],
              align: AlignmentType.RIGHT,
            }),
          ],
        }),
    ),
  ]

  const children: Paragraph[] = [
    ...headerRows,
    new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),
  ]

  const table = new Table({
    width: { size: 10400, type: WidthType.DXA },
    columnWidths: [...colW],
    rows: tableRows,
  })

  const totalTable = new Table({
    width: { size: 5000, type: WidthType.DXA },
    columnWidths: [2800, 2200],
    rows: [
      new TableRow({
        children: [
          cell('Total à recouvrer', {
            bold: true,
            width: 2800,
            borders: {
              ...NO_BORDER,
              top: { style: BorderStyle.SINGLE, size: 12, color: '1F2937' },
            },
          }),
          cell(formatCurrency(bordereau.montantTotal), {
            bold: true,
            width: 2200,
            align: AlignmentType.RIGHT,
            borders: {
              ...NO_BORDER,
              top: { style: BorderStyle.SINGLE, size: 12, color: '1F2937' },
            },
          }),
        ],
      }),
    ],
  })

  const footer: Paragraph[] = []
  if (bordereau.noteDepot) {
    footer.push(
      new Paragraph({
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: 'Note de dépôt : ',
            size: 18,
            color: '6B7280',
            font: 'Calibri',
          }),
          new TextRun({
            text: bordereau.noteDepot,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
    )
  }
  if (parametres?.noteBasPage1) {
    footer.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
        children: [
          new TextRun({
            text: parametres.noteBasPage1,
            size: 16,
            color: '6B7280',
            font: 'Calibri',
          }),
        ],
      }),
    )
  }
  if (parametres?.noteBasPage2) {
    footer.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40 },
        children: [
          new TextRun({
            text: parametres.noteBasPage2,
            size: 16,
            color: '6B7280',
            font: 'Calibri',
          }),
        ],
      }),
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: [
          ...children,
          table,
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          totalTable,
          ...footer,
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}

export async function downloadBordereauDocx(
  bordereau: BordereauDetail,
  parametres?: BordereauDocxParametres,
) {
  const blob = await buildBordereauDocxBlob(bordereau, parametres)
  const filename = `bordereau-${bordereau.numero.replace(/\s+/g, '-')}.docx`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
