export {}

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'
type PdfBufferPayload = ArrayBuffer | Uint8Array
type PdfFileData = { name: string; buffer: PdfBufferPayload }
type PdfBinaryPayload = { name: string; buffer: PdfBufferPayload }
type PdfConvertOptions = {
  mode: 'pdf-to-image'
  imageFormat: 'png' | 'jpeg'
  dpi: number
}
type PdfPreviewOptions = {
  dpi?: number
}
type PdfPreviewPagePayload = {
  pageNumber: number
  image: Uint8Array
}
type PdfPreviewResponse =
  | {
      success: true
      pageCount: number
      pages: PdfPreviewPagePayload[]
    }
  | {
      success: false
      error?: string
    }
type PdfConvertResult = {
  sourceName: string
  mode: 'pdf-to-image'
  outputDirectory: string
  outputFiles: string[]
}
type SplitPageRange = {
  startPage: number
  endPage: number
}
type SplitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: SplitPageRange[] }

type WatermarkImagePayload = {
  data: Uint8Array
  width: number
  height: number
  format: 'png' | 'jpeg'
}

type WatermarkOptions = {
  placement: 'center' | 'tile'
  opacity: number
  rotation: number
  size: number
  tileGap: number
  offsetX: number
  offsetY: number
  pdfPasswords?: string[]
}

type WatermarkSubmitOptions = WatermarkOptions & {
  watermarkImage: WatermarkImagePayload
}

type WatermarkResponse =
  | { success: true; outputFiles?: string[] }
  | {
      success: false
      error?: string
      code?: 'PASSWORD_REQUIRED' | 'INVALID_PASSWORD'
      fileIndex?: number
      fileName?: string
    }

declare global {
  interface Window {
    electronAPI: {
      selectOutputFolder: () => Promise<string | null>
      selectInputFiles: (multiple?: boolean) => Promise<PdfFileData[]>
      renderPdfPreview: (inputFile: PdfBinaryPayload, options?: PdfPreviewOptions) => Promise<PdfPreviewResponse>
      compressPDFBuffer: (inputFiles: PdfBinaryPayload[], outputFolder: string, level: CompressionLevel) => Promise<{ success: boolean; error?: string }>
      mergePDFBuffer: (inputFiles: PdfBinaryPayload[], outputFolder: string) => Promise<{ success: boolean; error?: string; outputPath?: string }>
      convertPDFBuffer: (inputFiles: PdfBinaryPayload[], outputFolder: string, options: PdfConvertOptions) => Promise<{ success: boolean; error?: string; results?: PdfConvertResult[] }>
      getPDFPageCount: (inputFile: PdfBinaryPayload) => Promise<{ success: boolean; pageCount?: number; error?: string }>
      splitPDFBuffer: (inputFile: PdfBinaryPayload, outputFolder: string, options: SplitOptions) => Promise<{ success: boolean; error?: string; outputFiles?: string[]; pageCount?: number }>
      watermarkPDFBuffer: (inputFiles: PdfBinaryPayload[], outputFolder: string, options: WatermarkSubmitOptions) => Promise<WatermarkResponse>
      windowMiniSize: () => void
      windowClose: () => void
    }
  }
}
