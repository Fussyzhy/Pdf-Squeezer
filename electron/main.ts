import { createRequire } from 'module';
import fs from 'fs';
import { compressPDF, mergePDF } from './util/pdf-editor.ts';

const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default';

const compressionLevels: CompressionLevel[] = ['screen', 'ebook', 'printer', 'prepress', 'default'];

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(import.meta.dirname, 'preload.ts'),
    },
    icon: path.join(import.meta.dirname, 'icon.ico')
  });

  win.setMenu(null);

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.cwd() + '/resources/vue/index.html'));
  }
}

app.whenReady().then(createWindow);

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  const outputFolder = result.canceled ? null : result.filePaths[0];
  return outputFolder;
});

ipcMain.handle('select-input-files', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择 PDF 文件',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'PDF 文件', extensions: ['pdf'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) return [];

  const files = result.filePaths.map((filePath: string) => {
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    return { name: fileName, buffer };
  });

  return files;
});

ipcMain.handle('compress-pdf-buffer', async (event: any, files: any[], outputFolder: any, level?: CompressionLevel) => {
  const compressionLevel = compressionLevels.includes(level as CompressionLevel)
    ? (level as CompressionLevel)
    : 'ebook';

  const filesToCompress = files.map((file, index) => {
    const [name, ext] = file.name.split('.');

    return {
      name: file.name,
      buffer: Buffer.from(file.buffer),
      outputFile: path.join(outputFolder, name + '-' + Date.now() + index + '.' + ext),
    };
  });

  try {
    await compressPDF(filesToCompress, compressionLevel);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('merge-pdf-buffer', async (event: any, files: any[], outputFolder: any) => {
  const filesToMerge = files.map((file) => {
    return {
      name: file.name,
      buffer: Buffer.from(file.buffer),
    };
  });

  try {
    const outputPath = path.join(outputFolder, `合并文件-${Date.now()}.pdf`);
    await mergePDF(filesToMerge, outputPath);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});
