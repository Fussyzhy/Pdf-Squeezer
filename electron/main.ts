import { createRequire } from 'module';
import fs from 'fs';
import { compressPDF, mergePDF } from './util/pdf-editor.ts';
const require = createRequire(import.meta.url);
 
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
 
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    // resizable: false,
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成（安全考虑）
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(import.meta.dirname, 'preload.ts'), // 预加载脚本
    },
    icon: path.join(import.meta.dirname, 'icon.ico') // 这里放你的图标
  });

  // 完全移除菜单栏
  win.setMenu(null);

  // 开发环境加载 Vite 开发服务器
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools(); // 打开 DevTools（可选）
  } else {
    // 生产环境加载打包后的 Vue3 应用
    win.loadFile(path.join(process.cwd() + '/resources/vue/index.html'));
  }
}
 
// Electron 初始化完成后创建窗口
app.whenReady().then(createWindow);

// 选择输出文件夹
ipcMain.handle("select-output-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  const outputFolder = result.canceled ? null : result.filePaths[0];
  return outputFolder;
});

ipcMain.handle('select-input-files', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择 PDF 文件',
    properties: ['openFile', 'multiSelections'], // <-- 允许多选
    filters: [
      { name: 'PDF 文件', extensions: ['pdf'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) return [];

  // 读取所有文件
  const files = result.filePaths.map((filePath) => {
    const buffer = fs.readFileSync(filePath); // 读取文件内容
    const fileName = path.basename(filePath);
    return { name: fileName, buffer };
  });

  return files; // 返回文件数组
});

// 压缩文件夹内所有 PDF
ipcMain.handle("compress-pdf-buffer", async (event: any, files: any[], outputFolder: any) => {
  const filesToCompress = files.map((file, index) => {
    const [name, ext] = file.name.split('.');
    return {
      name: file.name,
      buffer: Buffer.from(file.buffer),
      outputFile: path.join(outputFolder, name + '-' + Date.now() + index + '.' + ext),
    }
  });
  
  try {
    await compressPDF(filesToCompress, "ebook");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// 合并文件夹内所有 PDF
ipcMain.handle("merge-pdf-buffer", async (event: any, files: any[], outputFolder: any) => {
  const filesToMerge = files.map((file, index) => {
    return {
      name: file.name,
      buffer: Buffer.from(file.buffer),
    }
  });
  
  try {
    const outputPath = path.join(outputFolder, `合并文件-${Date.now()}.pdf`)
    await mergePDF(filesToMerge, outputPath);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});