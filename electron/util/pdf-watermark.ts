import fs from 'fs'
import path from 'path'
import { PDFDocument, degrees } from 'pdf-lib'

export type WatermarkPlacement = 'center' | 'tile'

export type WatermarkImage = {
  data: Buffer
  width: number
  height: number
  format: 'png' | 'jpeg'
}

export type WatermarkOptions = {
  placement: WatermarkPlacement
  opacity: number
  rotation: number
  size: number
  tileGap: number
  offsetX: number
  offsetY: number
}

type PdfFile = {
  name: string
  buffer: Buffer
}

type OutputResult = {
  outputFiles: string[]
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const getBaseName = (fileName: string) => {
  const extension = path.extname(fileName)
  return extension ? fileName.slice(0, -extension.length) : fileName
}

const sanitizeFileNamePart = (value: string) => {
  return value
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/[\s,]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '') || 'watermark'
}

const resolveScale = (
  pageWidth: number,
  pageHeight: number,
  imageWidth: number,
  imageHeight: number,
  size: number,
) => {
  const safeSize = clamp(size, 0.05, 0.95)
  const targetWidth = pageWidth * safeSize
  const targetHeight = pageHeight * safeSize
  const widthScale = targetWidth / imageWidth
  const heightScale = targetHeight / imageHeight
  const scale = Math.min(widthScale, heightScale)

  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
  }
}

const resolveDrawPosition = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotationDegrees: number,
) => {
  const radians = (rotationDegrees * Math.PI) / 180
  const halfWidth = width / 2
  const halfHeight = height / 2
  const rotatedX = halfWidth * Math.cos(radians) - halfHeight * Math.sin(radians)
  const rotatedY = halfWidth * Math.sin(radians) + halfHeight * Math.cos(radians)

  return {
    x: centerX - rotatedX,
    y: centerY - rotatedY,
  }
}

const ensureOutputFolder = (outputFolder: string) => {
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true })
  }
}

export async function addWatermark(
  files: PdfFile[],
  outputFolder: string,
  watermark: WatermarkImage,
  options: WatermarkOptions,
): Promise<OutputResult> {
  if (!files.length) {
    throw new Error('No PDF files to watermark')
  }

  ensureOutputFolder(outputFolder)

  const outputFiles: string[] = []
  const opacity = clamp(options.opacity ?? 0.2, 0.05, 1)
  const rotation = Number.isFinite(options.rotation) ? options.rotation : -30
  const size = clamp(options.size ?? 0.35, 0.05, 0.95)
  const tileGap = Math.max(0, Math.trunc(options.tileGap ?? 48))
  const offsetX = Number.isFinite(options.offsetX) ? options.offsetX : 0
  const offsetY = Number.isFinite(options.offsetY) ? options.offsetY : 0

  for (const [index, file] of files.entries()) {
    const pdfDoc = await PDFDocument.load(file.buffer, {
      ignoreEncryption: true
    })
    const embeddedImage = watermark.format === 'png'
      ? await pdfDoc.embedPng(watermark.data)
      : await pdfDoc.embedJpg(watermark.data)

    const pages = pdfDoc.getPages()

    for (const page of pages) {
      const { width: pageWidth, height: pageHeight } = page.getSize()
      const { width, height } = resolveScale(pageWidth, pageHeight, watermark.width, watermark.height, size)

      const drawImageAtCenter = (centerX: number, centerY: number) => {
        const { x, y } = resolveDrawPosition(centerX, centerY, width, height, rotation)
        page.drawImage(embeddedImage, {
          x,
          y,
          width,
          height,
          rotate: degrees(rotation),
          opacity,
        })
      }

      if (options.placement === 'tile') {
        const stepX = width + tileGap
        const stepY = height + tileGap
        const startX = -width
        const startY = -height
        const endX = pageWidth + width
        const endY = pageHeight + height

        for (let x = startX; x <= endX; x += stepX) {
          for (let y = startY; y <= endY; y += stepY) {
            drawImageAtCenter(x + width / 2 + offsetX, y + height / 2 + offsetY)
          }
        }
      } else {
        drawImageAtCenter(pageWidth / 2 + offsetX, pageHeight / 2 + offsetY)
      }
    }

    const baseName = sanitizeFileNamePart(getBaseName(file.name))
    const outputPath = path.join(outputFolder, `${baseName}-watermark-${Date.now()}-${index}.pdf`)
    const pdfBytes = await pdfDoc.save()

    fs.writeFileSync(outputPath, pdfBytes)
    outputFiles.push(outputPath)
  }

  return { outputFiles }
}
