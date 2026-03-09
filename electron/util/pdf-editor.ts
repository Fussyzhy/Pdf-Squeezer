// index.js 或 src/compress.js
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import os from 'os';
import fs from 'fs';

// 取当前文件夹路径（ESM 下替代 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGSCommand() {
  const base = path.resolve(__dirname, "../../core/bin/gswin64c.exe"); // bin 文件夹路径
  return base;
}

// 示例：压缩 PDF
export function compressPDF(
  filesToCompress: { name: string; buffer: Buffer; outputFile: string }[],
  level: 'screen' | 'ebook' | 'printer' | 'prepress' | 'default' = 'ebook'
) {
  return new Promise((resolve, reject) => {
    if (!filesToCompress.length) return resolve([])

    const gs = getGSCommand()
    const results: { name: string; success: boolean }[] = []

    // 定义一个递归处理函数，保证顺序压缩
    const compressNext = (index: number) => {
      if (index >= filesToCompress.length) {
        return resolve(results) // 全部完成
      }

      const { buffer, outputFile, name } = filesToCompress[index]

      // 创建临时文件
      const tempFile = path.join(os.tmpdir(), `temp_${Date.now()}_${index}.pdf`)
      fs.writeFileSync(tempFile, buffer)

      const cmd = `"${gs}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${level} -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${outputFile}" "${tempFile}"`

      exec(cmd, (err, stdout, stderr) => {
        // 删除临时文件
        fs.unlinkSync(tempFile)

        if (err) {
          console.error(`Compress failed for ${name}:`, stderr)
          results.push({ name, success: false })
        } else {
          results.push({ name, success: true })
        }

        // 处理下一个文件
        compressNext(index + 1)
      })
    }

    compressNext(0)
  })
}

export function mergePDF(files: PdfFile[], outputFile: string): Promise<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    if (!files.length) return reject(new Error('没有文件可合并'))

    // 生成临时文件路径
    const tempFiles = files.map((file, idx) => {
      const tempPath = path.join(os.tmpdir(), `merge_temp_${Date.now()}_${idx}.pdf`)
      fs.writeFileSync(tempPath, file.buffer)
      return tempPath
    })

    const gs = getGSCommand()

    // Ghostscript 合并命令
    const cmd = `"${gs}" -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile="${outputFile}" ${tempFiles.map(f => `"${f}"`).join(' ')}`

    exec(cmd, (err, stdout, stderr) => {
      // 删除临时文件
      tempFiles.forEach(f => fs.existsSync(f) && fs.unlinkSync(f))

      if (err) {
        console.error('Ghostscript 合并错误:', stderr)
        return reject(err)
      }

      resolve({ success: true })
    })
  })
}