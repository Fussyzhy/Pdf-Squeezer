import { createRequire } from 'module'
import fs from 'fs'
import { compressPDF, mergePDF } from './util/pdf-editor.ts'
import { convertPDF, type PdfConvertOptions } from './util/pdf-convert.ts'
import { getPDFPageCount, splitPDF, type PdfFile, type SplitOptions } from './util/pdf-split.ts'
import { addWatermark, type WatermarkImage, type WatermarkOptions } from './util/pdf-watermark.ts'

const require = createRequire(import.meta.url)
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'
type RendererPdfBuffer = Uint8Array | ArrayBuffer
type RendererPdfFile = { name: string; buffer: RendererPdfBuffer }
type WatermarkImagePayload = { data: RendererPdfBuffer; width: number; height: number; format: 'png' | 'jpeg' }
type WatermarkSubmitOptions = WatermarkOptions & { watermarkImage: WatermarkImagePayload }

const compressionLevels: CompressionLevel[] = ['screen', 'ebook', 'printer', 'prepress', 'default']

function createWindow() {
  const win = new BrowserWindow({
    width: 1270,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(import.meta.dirname, 'preload.ts'),
    },
    icon: path.join(import.meta.dirname, 'icon.ico'),
    resizable: false,
  })

  win.setMenu(null)

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.cwd(), 'resources/vue/index.html'))
  }
}

function toNodeBuffer(buffer: RendererPdfBuffer) {
  return buffer instanceof Uint8Array ? Buffer.from(buffer) : Buffer.from(new Uint8Array(buffer))
}

function toBufferFile(file: RendererPdfFile): PdfFile {
  return {
    name: file.name,
    buffer: toNodeBuffer(file.buffer),
  }
}

function getFileNameParts(fileName: string) {
  const parsed = path.parse(fileName)
  return {
    baseName: parsed.name || 'file',
    extension: parsed.ext ? parsed.ext.slice(1) : 'pdf',
  }
}

app.whenReady().then(createWindow)

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('select-input-files', async (_event: unknown, multiple = true) => {
  const result = await dialog.showOpenDialog({
    title: '选择 PDF 文件',
    properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: [
      { name: 'PDF 文件', extensions: ['pdf'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) return []

  return result.filePaths.map((filePath: string) => ({
    name: path.basename(filePath),
    buffer: fs.readFileSync(filePath),
  }))
})

ipcMain.handle('get-pdf-page-count', async (_event: unknown, file: RendererPdfFile) => {
  try {
    const pageCount = await getPDFPageCount(toBufferFile(file))
    return { success: true, pageCount }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('compress-pdf-buffer', async (_event: unknown, files: RendererPdfFile[], outputFolder: string, level?: CompressionLevel) => {
  const compressionLevel = compressionLevels.includes(level as CompressionLevel)
    ? (level as CompressionLevel)
    : 'ebook'

  const filesToCompress = files.map((file, index) => {
    const { baseName, extension } = getFileNameParts(file.name)

    return {
      name: file.name,
      buffer: toNodeBuffer(file.buffer),
      outputFile: path.join(outputFolder, `${baseName}-${Date.now()}-${index}.${extension}`),
    }
  })

  try {
    await compressPDF(filesToCompress, compressionLevel)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('merge-pdf-buffer', async (_event: unknown, files: RendererPdfFile[], outputFolder: string) => {
  const filesToMerge = files.map(toBufferFile)

  try {
    const outputPath = path.join(outputFolder, `merged-${Date.now()}.pdf`)
    await mergePDF(filesToMerge, outputPath)
    return { success: true, outputPath }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('convert-pdf-buffer', async (_event: unknown, files: RendererPdfFile[], outputFolder: string, options: PdfConvertOptions) => {
  try {
    const results = await convertPDF(files.map(toBufferFile), outputFolder, options)
    return { success: true, results }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('split-pdf-buffer', async (_event: unknown, file: RendererPdfFile, outputFolder: string, options: SplitOptions) => {
  try {
    const result = await splitPDF(toBufferFile(file), outputFolder, options)
    return { success: true, outputFiles: result.outputFiles, pageCount: result.pageCount }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('watermark-pdf-buffer', async (_event: unknown, files: RendererPdfFile[], outputFolder: string, options: WatermarkSubmitOptions) => {
  try {
    if (!options?.watermarkImage) {
      return { success: false, error: 'Watermark image is required' }
    }

    const watermarkImage: WatermarkImage = {
      data: toNodeBuffer(options.watermarkImage.data),
      width: options.watermarkImage.width,
      height: options.watermarkImage.height,
      format: options.watermarkImage.format,
    }

    const { watermarkImage: _ignored, ...watermarkOptions } = options
    const result = await addWatermark(files.map(toBufferFile), outputFolder, watermarkImage, watermarkOptions)

    return { success: true, outputFiles: result.outputFiles }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})
