import { execFile } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import { getGhostscriptCommand, getGhostscriptEnv } from './ghostscript-runtime.ts'

const execFileAsync = promisify(execFile)

export interface PdfFile {
  name: string
  buffer: Buffer
}

export interface SplitPageRange {
  startPage: number
  endPage: number
}

export type SplitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: SplitPageRange[] }

export interface SplitResult {
  outputFiles: string[]
  pageCount: number
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
  const { stdout } = await execFileAsync(getGhostscriptCommand(), ['-q', '-dNOSAFER', '-dNODISPLAY', '-c', command], {
    env: getGhostscriptEnv(),
  })
  const pageCountText = `${stdout}`.trim().split(/\s+/).pop() ?? ''
  const pageCount = Number.parseInt(pageCountText, 10)

  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error('Unable to read PDF page count')
  }

  return pageCount
}

function normalizeCustomPageRanges(pageRanges: SplitPageRange[], pageCount: number) {
  if (!Array.isArray(pageRanges) || !pageRanges.length) {
    throw new Error('Page ranges are required')
  }

  return pageRanges.map((range, index) => {
    const start = Math.trunc(range.startPage)
    const end = Math.trunc(range.endPage)

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      throw new Error(`Invalid page range at row ${index + 1}`)
    }

    if (start < 1 || end < 1 || start > end) {
      throw new Error(`Invalid page range at row ${index + 1}`)
    }

    if (end > pageCount) {
      throw new Error(`Page range ${start}-${end} is outside the document range`)
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
  const gsEnv = getGhostscriptEnv()
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

        await execFileAsync(getGhostscriptCommand(), [
          '-sDEVICE=pdfwrite',
          `-dFirstPage=${startPage}`,
          `-dLastPage=${endPage}`,
          '-o',
          outputFile,
          tempFile,
        ], {
          env: gsEnv,
        })

        outputFiles.push(outputFile)
        part += 1
      }

      return { outputFiles, pageCount }
    }

    const normalizedPageRanges = normalizeCustomPageRanges(options.pageRanges, pageCount)
    const outputFile = path.join(
      outputFolder,
      `${baseName}-pages-${sanitizeFileNamePart(normalizedPageRanges)}-${timestamp}.pdf`,
    )

    await execFileAsync(getGhostscriptCommand(), [
      '-sDEVICE=pdfwrite',
      `-sPageList=${normalizedPageRanges}`,
      '-o',
      outputFile,
      tempFile,
    ], {
      env: gsEnv,
    })

    return { outputFiles: [outputFile], pageCount }
  } finally {
    cleanupFile(tempFile)
  }
}
