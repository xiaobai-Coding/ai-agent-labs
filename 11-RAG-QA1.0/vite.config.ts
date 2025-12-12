import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/ali-embed": {
        target: "https://dashscope.aliyuncs.com",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/ali-embed/, ""),
      },
    },
  },
});