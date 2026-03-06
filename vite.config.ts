//vite.config.ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from "unplugin-vue-components/vite"; 

export default defineConfig({
  base: "./",
  server: {
    port: 5173,
  },
  plugins: [
    vue(),
    Components({
      dirs: ["src/components"], // 自动扫描的组件目录
      extensions: ["vue"],      // 扫描的文件类型
      deep: true,               // 是否递归扫描子目录
      dts: "src/components.d.ts", // 自动生成类型声明
      resolvers: [
        // 如果你用 UI 库，可以加上对应解析器
        // NaiveUiResolver()
      ]
    })
  ],
  build: {
    assetsDir: "static",
    rollupOptions: {
      output: {
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})