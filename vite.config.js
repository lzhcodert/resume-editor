import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对路径：适配 GitHub Pages 项目站点 https://<用户名>.github.io/<仓库名>/ 子路径
  base: './',
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173
  }
})
