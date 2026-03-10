export {}

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'
type PdfFileData = { name: string; buffer: ArrayBuffer }
type PdfBinaryPayload = { name: string; buffer: Uint8Array }
type SplitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: string }

declare global {
  interface Window {
    electronAPI: {
      selectOutputFolder: () => Promise<string | null>
      selectInputFiles: (multiple?: boolean) => Promise<PdfFileData[]>
      compressPDFBuffer: (inputFiles: PdfBinaryPayload[], outputFolder: string, level: CompressionLevel) => Promise<{ success: boolean; error?: string }>
      mergePDFBuffer: (inputFiles: PdfBinaryPayload[], outputFolder: string) => Promise<{ success: boolean; error?: string; outputPath?: string }>
      getPDFPageCount: (inputFile: PdfBinaryPayload) => Promise<{ success: boolean; pageCount?: number; error?: string }>
      splitPDFBuffer: (inputFile: PdfBinaryPayload, outputFolder: string, options: SplitOptions) => Promise<{ success: boolean; error?: string; outputFiles?: string[]; pageCount?: number }>
    }
  }
}
