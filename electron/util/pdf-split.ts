import { execFile } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface PdfFile {
  name: string
  buffer: Buffer
}

export type SplitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: string }

export interface SplitResult {
  outputFiles: string[]
  pageCount: number
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getGSCommand() {
  return path.resolve(__dirname, '../../core/bin/gswin64c.exe')
}

function createTempPdfPath(prefix: string) {
  return path.join(os.tmpdir(), `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`)
}

function cleanupFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function getBaseName(fileName: string) {
  const extension = path.extname(fileName)
  return extension ? fileName.slice(0, -extension.length) : fileName
}

function escapePostScriptPath(filePath: string) {
  return filePath
    .replace(/\\/g, '/')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

async function getPDFPageCountFromPath(filePath: string) {
  const command = `(${escapePostScriptPath(filePath)}) (r) file runpdfbegin pdfpagecount = quit`
  const { stdout } = await execFileAsync(getGSCommand(), ['-q', '-dNOSAFER', '-dNODISPLAY', '-c', command])
  const pageCountText = `${stdout}`.trim().split(/\s+/).pop() ?? ''
  const pageCount = Number.parseInt(pageCountText, 10)

  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error('Unable to read PDF page count')
  }

  return pageCount
}

function parseCustomPageRanges(pageRanges: string, pageCount: number) {
  const normalizedInput = pageRanges.replace(/\s+/g, '')

  if (!normalizedInput) {
    throw new Error('Page ranges are required')
  }

  const segments = normalizedInput.split(',').filter(Boolean)

  if (!segments.length) {
    throw new Error('Page ranges are required')
  }

  return segments.map((segment) => {
    const singlePageMatch = /^(\d+)$/.exec(segment)

    if (singlePageMatch) {
      const page = Number.parseInt(singlePageMatch[1], 10)

      if (page < 1 || page > pageCount) {
        throw new Error(`Page ${page} is outside the document range`)
      }

      return `${page}`
    }

    const rangeMatch = /^(\d+)-(\d+)$/.exec(segment)

    if (!rangeMatch) {
      throw new Error(`Invalid page range: ${segment}`)
    }

    const start = Number.parseInt(rangeMatch[1], 10)
    const end = Number.parseInt(rangeMatch[2], 10)

    if (start < 1 || end < 1 || start > end) {
      throw new Error(`Invalid page range: ${segment}`)
    }

    if (end > pageCount) {
      throw new Error(`Page range ${segment} is outside the document range`)
    }

    return `${start}-${end}`
  }).join(',')
}

function sanitizeFileNamePart(value: string) {
  return value
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/[\s,]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '') || 'pages'
}

export async function getPDFPageCount(file: PdfFile) {
  const tempFile = createTempPdfPath('pdf_page_count')
  fs.writeFileSync(tempFile, file.buffer)

  try {
    return await getPDFPageCountFromPath(tempFile)
  } finally {
    cleanupFile(tempFile)
  }
}

export async function splitPDF(file: PdfFile, outputFolder: string, options: SplitOptions): Promise<SplitResult> {
  const tempFile = createTempPdfPath('pdf_split')
  fs.writeFileSync(tempFile, file.buffer)

  try {
    const pageCount = await getPDFPageCountFromPath(tempFile)
    const baseName = getBaseName(file.name)
    const timestamp = Date.now()

    if (options.mode === 'interval') {
      const pagesPerFile = Math.trunc(options.pagesPerFile)

      if (!Number.isInteger(pagesPerFile) || pagesPerFile < 1) {
        throw new Error('pagesPerFile must be a positive integer')
      }

      const outputFiles: string[] = []
      let part = 1

      for (let startPage = 1; startPage <= pageCount; startPage += pagesPerFile) {
        const endPage = Math.min(pageCount, startPage + pagesPerFile - 1)
        const outputFile = path.join(outputFolder, `${baseName}-part-${String(part).padStart(2, '0')}-${timestamp}.pdf`)

        await execFileAsync(getGSCommand(), [
          '-sDEVICE=pdfwrite',
          `-dFirstPage=${startPage}`,
          `-dLastPage=${endPage}`,
          '-o',
          outputFile,
          tempFile,
        ])

        outputFiles.push(outputFile)
        part += 1
      }

      return { outputFiles, pageCount }
    }

    const normalizedPageRanges = parseCustomPageRanges(options.pageRanges, pageCount)
    const outputFile = path.join(
      outputFolder,
      `${baseName}-pages-${sanitizeFileNamePart(normalizedPageRanges)}-${timestamp}.pdf`,
    )

    await execFileAsync(getGSCommand(), [
      '-sDEVICE=pdfwrite',
      `-sPageList=${normalizedPageRanges}`,
      '-o',
      outputFile,
      tempFile,
    ])

    return { outputFiles: [outputFile], pageCount }
  } finally {
    cleanupFile(tempFile)
  }
}
