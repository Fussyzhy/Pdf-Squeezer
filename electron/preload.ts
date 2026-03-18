const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectInputFiles: (multiple = true) => ipcRenderer.invoke('select-input-files', multiple),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  renderPdfPreview: (inputFile, options) => ipcRenderer.invoke('render-pdf-preview', inputFile, options),
  compressPDFBuffer: (inputFiles, outputFolder, level) => ipcRenderer.invoke('compress-pdf-buffer', inputFiles, outputFolder, level),
  mergePDFBuffer: (inputFiles, outputFolder) => ipcRenderer.invoke('merge-pdf-buffer', inputFiles, outputFolder),
  convertPDFBuffer: (inputFiles, outputFolder, options) => ipcRenderer.invoke('convert-pdf-buffer', inputFiles, outputFolder, options),
  getPDFPageCount: (inputFile) => ipcRenderer.invoke('get-pdf-page-count', inputFile),
  splitPDFBuffer: (inputFile, outputFolder, options) => ipcRenderer.invoke('split-pdf-buffer', inputFile, outputFolder, options),
  watermarkPDFBuffer: (inputFiles, outputFolder, options) => ipcRenderer.invoke('watermark-pdf-buffer', inputFiles, outputFolder, options),
  windowMiniSize: () => ipcRenderer.invoke('window-minimize'),
  windowClose: () => ipcRenderer.invoke('window-close')
})
