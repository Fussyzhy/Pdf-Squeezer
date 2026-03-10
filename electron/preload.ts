// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectInputFiles: () => ipcRenderer.invoke('select-input-files'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  compressPDFBuffer: (inputFiles, outputFolder, level) => ipcRenderer.invoke('compress-pdf-buffer', inputFiles, outputFolder, level),
  mergePDFBuffer: (inputFiles, outputFolder) => ipcRenderer.invoke('merge-pdf-buffer', inputFiles, outputFolder),
});
