import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error, please ensure Vercel dev server is running on port 3000');
            console.log('Run: npx vercel dev --port 3000');
          });
        }
      },
      "/ali-embed": {
        target: "https://dashscope.aliyuncs.com",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/ali-embed/, ""),
      },
    },
  },
});