import { exec } from 'child_process'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { getGhostscriptCommand, getGhostscriptEnv } from './ghostscript-runtime.ts'

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'

interface PdfFile {
  name: string
  buffer: Buffer
}

interface CompressPdfFile extends PdfFile {
  outputFile: string
}

export function compressPDF(
  filesToCompress: CompressPdfFile[],
  level: CompressionLevel = 'ebook',
) {
  return new Promise<{ name: string; success: boolean }[]>((resolve) => {
    if (!filesToCompress.length) {
      resolve([])
      return
    }

    const gs = getGhostscriptCommand()
    const gsEnv = getGhostscriptEnv()
    const results: { name: string; success: boolean }[] = []

    const compressNext = (index: number) => {
      if (index >= filesToCompress.length) {
        resolve(results)
        return
      }

      const { buffer, outputFile, name } = filesToCompress[index]
      const tempFile = path.join(os.tmpdir(), `temp_${Date.now()}_${index}.pdf`)
      fs.writeFileSync(tempFile, buffer)

      const command = `"${gs}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${level} -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${outputFile}" "${tempFile}"`

      exec(command, { env: gsEnv }, (err, _stdout, stderr) => {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile)
        }

        if (err) {
          console.error(`Compress failed for ${name}:`, stderr)
          results.push({ name, success: false })
        } else {
          results.push({ name, success: true })
        }

        compressNext(index + 1)
      })
    }

    compressNext(0)
  })
}

export function mergePDF(files: PdfFile[], outputFile: string): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    if (!files.length) {
      reject(new Error('No PDF files to merge'))
      return
    }

    const tempFiles = files.map((file, index) => {
      const tempPath = path.join(os.tmpdir(), `merge_temp_${Date.now()}_${index}.pdf`)
      fs.writeFileSync(tempPath, file.buffer)
      return tempPath
    })

    const gs = getGhostscriptCommand()
    const gsEnv = getGhostscriptEnv()
    const command = `"${gs}" -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile="${outputFile}" ${tempFiles.map((filePath) => `"${filePath}"`).join(' ')}`

    exec(command, { env: gsEnv }, (err, _stdout, stderr) => {
      tempFiles.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      })

      if (err) {
        console.error('Ghostscript merge failed:', stderr)
        reject(err)
        return
      }

      resolve({ success: true })
    })
  })
}
