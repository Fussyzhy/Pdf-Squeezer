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

export type PdfConvertMode = 'pdf-to-image'
export type PdfImageFormat = 'png' | 'jpeg'

export type PdfConvertOptions = {
  mode: 'pdf-to-image'
  imageFormat: PdfImageFormat
  dpi: number
}

export interface PdfConvertResult {
  sourceName: string
  mode: PdfConvertMode
  outputDirectory: string
  outputFiles: string[]
}

const imageRendererMap: Record<PdfImageFormat, { device: string; extension: string; extraArgs: string[] }> = {
  png: {
    device: 'png16m',
    extension: 'png',
    extraArgs: ['-dTextAlphaBits=4', '-dGraphicsAlphaBits=4'],
  },
  jpeg: {
    device: 'jpeg',
    extension: 'jpg',
    extraArgs: ['-dJPEGQ=90'],
  },
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

function getBaseName(fileName: string) {
  const parsed = path.parse(fileName)
  return parsed.name || 'pdf'
}

function sanitizeFileNamePart(value: string) {
  return value
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '') || 'pdf'
}

function createOutputDirectory(outputFolder: string, fileName: string, suffix: string) {
  const safeBaseName = sanitizeFileNamePart(getBaseName(fileName))
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const outputDirectory = path.join(outputFolder, `${safeBaseName}-${suffix}-${uniqueSuffix}`)

  fs.mkdirSync(outputDirectory, { recursive: true })

  return outputDirectory
}

function getSortedOutputFiles(outputDirectory: string, extension: string) {
  return fs.readdirSync(outputDirectory)
    .filter((fileName) => fileName.toLowerCase().endsWith(`.${extension}`))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map((fileName) => path.join(outputDirectory, fileName))
}

async function convertPdfToImages(
  file: PdfFile,
  outputFolder: string,
  options: Extract<PdfConvertOptions, { mode: 'pdf-to-image' }>,
): Promise<PdfConvertResult> {
  const dpi = Math.trunc(options.dpi)

  if (!Number.isInteger(dpi) || dpi < 72) {
    throw new Error('DPI must be an integer greater than or equal to 72')
  }

  const renderer = imageRendererMap[options.imageFormat]

  if (!renderer) {
    throw new Error(`Unsupported image format: ${options.imageFormat}`)
  }

  const tempFile = createTempPdfPath('pdf_convert')
  let outputDirectory = ''

  fs.writeFileSync(tempFile, file.buffer)

  try {
    outputDirectory = createOutputDirectory(outputFolder, file.name, 'images')
    const outputPattern = path.join(outputDirectory, `page-%03d.${renderer.extension}`)

    await execFileAsync(getGhostscriptCommand(), [
      '-dSAFER',
      '-dBATCH',
      '-dNOPAUSE',
      '-dQUIET',
      `-sDEVICE=${renderer.device}`,
      `-r${dpi}`,
      ...renderer.extraArgs,
      `-sOutputFile=${outputPattern}`,
      tempFile,
    ], {
      env: getGhostscriptEnv(),
    })

    const outputFiles = getSortedOutputFiles(outputDirectory, renderer.extension)

    if (!outputFiles.length) {
      throw new Error(`No output images were generated for ${file.name}`)
    }

    return {
      sourceName: file.name,
      mode: 'pdf-to-image',
      outputDirectory,
      outputFiles,
    }
  } catch (error) {
    if (outputDirectory) {
      cleanupDirectory(outputDirectory)
    }

    throw error
  } finally {
    cleanupFile(tempFile)
  }
}

const pdfConverters = {
  'pdf-to-image': convertPdfToImages,
} satisfies {
  [K in PdfConvertOptions['mode']]: (
    file: PdfFile,
    outputFolder: string,
    options: Extract<PdfConvertOptions, { mode: K }>,
  ) => Promise<PdfConvertResult>
}

export async function convertPDF(
  files: PdfFile[],
  outputFolder: string,
  options: PdfConvertOptions,
): Promise<PdfConvertResult[]> {
  if (!files.length) {
    throw new Error('No PDF files to convert')
  }

  const results: PdfConvertResult[] = []

  for (const file of files) {
    switch (options.mode) {
      case 'pdf-to-image':
        results.push(await pdfConverters['pdf-to-image'](file, outputFolder, options))
        break
      default:
        throw new Error('Unsupported conversion mode')
    }
  }

  return results
}