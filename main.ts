import { createRequire } from 'module';
const require = createRequire(import.meta.url);
 
const { app, BrowserWindow } = require('electron');
const path = require('path');
 
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成（安全考虑）
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(import.meta.dirname, 'preload.js'), // 预加载脚本
    },
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
 
// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
 
// macOS 点击 Dock 图标时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});