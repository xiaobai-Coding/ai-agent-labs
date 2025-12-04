import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 确保构建输出正确
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})