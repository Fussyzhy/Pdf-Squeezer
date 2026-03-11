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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    throw new Error('DPI 必须是不小于 72 的整数')
  }

  const renderer = imageRendererMap[options.imageFormat]

  if (!renderer) {
    throw new Error(`不支持的图片格式：${options.imageFormat}`)
  }

  const tempFile = createTempPdfPath('pdf_convert')
  let outputDirectory = ''

  fs.writeFileSync(tempFile, file.buffer)

  try {
    outputDirectory = createOutputDirectory(outputFolder, file.name, 'images')
    const outputPattern = path.join(outputDirectory, `page-%03d.${renderer.extension}`)

    await execFileAsync(getGSCommand(), [
      '-dSAFER',
      '-dBATCH',
      '-dNOPAUSE',
      '-dQUIET',
      `-sDEVICE=${renderer.device}`,
      `-r${dpi}`,
      ...renderer.extraArgs,
      `-sOutputFile=${outputPattern}`,
      tempFile,
    ])

    const outputFiles = getSortedOutputFiles(outputDirectory, renderer.extension)

    if (!outputFiles.length) {
      throw new Error(`未能为 ${file.name} 生成图片文件`)
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
    throw new Error('没有可转换的 PDF 文件')
  }

  const results: PdfConvertResult[] = []

  for (const file of files) {
    switch (options.mode) {
      case 'pdf-to-image':
        results.push(await pdfConverters['pdf-to-image'](file, outputFolder, options))
        break
      default: {
        const unsupportedMode: never = options
        void unsupportedMode
        throw new Error('不支持的转换方式')
      }
    }
  }

  return results
}