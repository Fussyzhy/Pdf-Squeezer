const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectInputFiles: (multiple = true) => ipcRenderer.invoke('select-input-files', multiple),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  compressPDFBuffer: (inputFiles, outputFolder, level) => ipcRenderer.invoke('compress-pdf-buffer', inputFiles, outputFolder, level),
  mergePDFBuffer: (inputFiles, outputFolder) => ipcRenderer.invoke('merge-pdf-buffer', inputFiles, outputFolder),
  getPDFPageCount: (inputFile) => ipcRenderer.invoke('get-pdf-page-count', inputFile),
  splitPDFBuffer: (inputFile, outputFolder, options) => ipcRenderer.invoke('split-pdf-buffer', inputFile, outputFolder, options),
})
