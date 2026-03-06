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
export function compressPDF(buffer: Buffer, outputFile: string, level = "ebook") {
  console.log(buffer, outputFile, level);
  return new Promise((resolve, reject) => {
    // 创建临时文件
    const tempFile = path.join(os.tmpdir(), `temp_${Date.now()}.pdf`);
    fs.writeFileSync(tempFile, buffer); // 写入 Buffer

    const gs = getGSCommand();
    const cmd = `"${gs}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${level} -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${outputFile}" "${tempFile}"`;

    exec(cmd, (err, stdout, stderr) => {
      // 压缩完成后删除临时文件
      fs.unlinkSync(tempFile);

      if (err) {
        console.error(stderr);
        return reject(err);
      }
      resolve(true);
    });
  });
}