"use client"

const MM_TO_PX = 96 / 25.4

type DownloadPagesPdfOptions = {
  root: HTMLElement
  pageSelector: string
  filename: string
  orientation?: "landscape" | "portrait"
  pageWidthMm?: number
}

function fitImageOnPage(
  canvas: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
): { x: number; y: number; w: number; h: number } {
  let w = pageWidth
  let h = (canvas.height * pageWidth) / canvas.width
  if (h > pageHeight) {
    h = pageHeight
    w = (canvas.width * pageHeight) / canvas.height
  }
  return {
    x: (pageWidth - w) / 2,
    y: 0,
    w,
    h,
  }
}

/** Capture des pages HTML et export en un seul PDF multi-pages (navigateur uniquement). */
export async function downloadPagesPdf({
  root,
  pageSelector,
  filename,
  orientation = "portrait",
  pageWidthMm,
}: DownloadPagesPdfOptions): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Le PDF ne peut être généré que dans le navigateur.")
  }

  const pages = root.querySelectorAll<HTMLElement>(pageSelector)
  if (pages.length === 0) {
    throw new Error("Aucune page à exporter.")
  }

  const [{ domToCanvas }, { jsPDF }] = await Promise.all([
    import("modern-screenshot"),
    import("jspdf/dist/jspdf.es.min.js"),
  ])

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pageWidthMm ?? (orientation === "landscape" ? 297 : 210)
  const pageHeight = orientation === "landscape" ? 210 : 297
  const captureWidthPx = Math.round(pageWidth * MM_TO_PX)

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage("a4", orientation)

    const page = pages[i]
    page.style.width = `${pageWidth}mm`

    const canvas = await domToCanvas(page, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: captureWidthPx,
    })

    const imgData = canvas.toDataURL("image/jpeg", 0.92)
    const { x, y, w, h } = fitImageOnPage(canvas, pageWidth, pageHeight)
    pdf.addImage(imgData, "JPEG", x, y, w, h)
  }

  pdf.save(filename)
}
