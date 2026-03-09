// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectInputFiles: () => ipcRenderer.invoke('select-input-files'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  compressPDFBuffer: (inputFile, outputFolder) => ipcRenderer.invoke('compress-pdf-buffer', inputFile, outputFolder),
  mergePDFBuffer: (inputFiles, outputFolder) => ipcRenderer.invoke('merge-pdf-buffer', inputFiles, outputFolder),
});