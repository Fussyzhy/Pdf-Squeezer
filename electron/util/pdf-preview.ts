import { execFile } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import { getGhostscriptCommand, getGhostscriptEnv } from './ghostscript-runtime.ts'
import type { PdfFile } from './pdf-split.ts'

const execFileAsync = promisify(execFile)

export type PdfPreviewOptions = {
  dpi?: number
}

export type PdfPreviewPage = {
  pageNumber: number
  image: Uint8Array
}

export type PdfPreviewResult = {
  pageCount: number
  pages: PdfPreviewPage[]
}

function createTempPdfPath(prefix: string) {
  return path.join(os.tmpdir(), `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`)
}

function cleanupFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function cleanupDirectory(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { recursive: true, force: true })
  }
}

function getSortedPreviewFiles(outputDirectory: string) {
  return fs.readdirSync(outputDirectory)
    .filter((fileName) => fileName.toLowerCase().endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map((fileName) => path.join(outputDirectory, fileName))
}

export async function renderPdfPreview(file: PdfFile, options: PdfPreviewOptions = {}): Promise<PdfPreviewResult> {
  const dpi = Math.trunc(options.dpi ?? 110)

  if (!Number.isInteger(dpi) || dpi < 72) {
    throw new Error('Preview DPI must be an integer greater than or equal to 72')
  }

  const tempPdfPath = createTempPdfPath('pdf_preview')
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf_preview_images_'))

  fs.writeFileSync(tempPdfPath, file.buffer)

  try {
    const outputPattern = path.join(outputDirectory, 'page-%03d.png')

    await execFileAsync(getGhostscriptCommand(), [
      '-dSAFER',
      '-dBATCH',
      '-dNOPAUSE',
      '-dQUIET',
      '-sDEVICE=png16m',
      `-r${dpi}`,
      '-dTextAlphaBits=4',
      '-dGraphicsAlphaBits=4',
      `-sOutputFile=${outputPattern}`,
      tempPdfPath,
    ], {
      env: getGhostscriptEnv(),
    })

    const previewFiles = getSortedPreviewFiles(outputDirectory)

    if (!previewFiles.length) {
      throw new Error(`No preview images were generated for ${file.name}`)
    }

    return {
      pageCount: previewFiles.length,
      pages: previewFiles.map((previewFile, index) => ({
        pageNumber: index + 1,
        image: new Uint8Array(fs.readFileSync(previewFile)),
      })),
    }
  } finally {
    cleanupFile(tempPdfPath)
    cleanupDirectory(outputDirectory)
  }
}
