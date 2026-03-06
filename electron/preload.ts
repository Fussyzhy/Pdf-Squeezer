// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectInputFile: () => ipcRenderer.invoke('select-input-file'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  compressPDFBuffer: (inputFile, outputFolder) => ipcRenderer.invoke('compress-pdf-buffer', inputFile, outputFolder),
});