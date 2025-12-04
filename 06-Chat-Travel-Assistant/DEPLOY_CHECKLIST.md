# ✅ Vercel 部署检查清单

在部署前，请确认以下项目：

## 📋 部署前检查

### 1. 代码准备
- [ ] 代码已提交到 Git
- [ ] 已推送到 GitHub/GitLab/Bitbucket
- [ ] 没有未提交的更改

### 2. 配置文件
- [ ] `vercel.json` 文件存在且配置正确
- [ ] `package.json` 包含构建脚本：`"build": "vite build"`
- [ ] `vite.config.ts` 配置正确

### 3. 环境变量准备
- [ ] 已获取 DeepSeek API Key
- [ ] 准备好以下环境变量：
  - [ ] `VITE_AI_API_KEY`（必需）
  - [ ] `VITE_AI_API_BASE_URL`（可选，默认：https://api.deepseek.com）
  - [ ] `VITE_APP_TITLE`（可选）
  - [ ] `VITE_APP_DEBUG`（可选，默认：false）

### 4. 本地测试
- [ ] 本地运行 `npm run build` 成功
- [ ] 本地运行 `npm run preview` 正常
- [ ] 应用功能正常

## 🚀 部署步骤

### 方式一：GitHub 集成（推荐）

1. [ ] 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. [ ] 点击 "Add New Project"
3. [ ] 选择 GitHub 仓库
4. [ ] 配置项目：
   - [ ] Root Directory: `06-Chat-Travel-Assistant`
   - [ ] Framework: Vite（自动检测）
   - [ ] Build Command: `npm run build`（自动检测）
   - [ ] Output Directory: `dist`（自动检测）
5. [ ] 添加环境变量（见下方）
6. [ ] 点击 "Deploy"
7. [ ] 等待部署完成
8. [ ] 测试部署的应用

### 方式二：Vercel CLI

1. [ ] 安装 Vercel CLI: `npm i -g vercel`
2. [ ] 登录: `vercel login`
3. [ ] 进入项目目录: `cd 06-Chat-Travel-Assistant`
4. [ ] 首次部署: `vercel`
5. [ ] 添加环境变量（见下方）
6. [ ] 部署到生产: `vercel --prod`
7. [ ] 测试部署的应用

## 🔐 环境变量配置

在 Vercel Dashboard 或通过 CLI 添加以下环境变量：

### 必需环境变量
- [ ] `VITE_AI_API_KEY` = `你的 DeepSeek API Key`

### 可选环境变量
- [ ] `VITE_AI_API_BASE_URL` = `https://api.deepseek.com`
- [ ] `VITE_APP_TITLE` = `个人旅行助手`
- [ ] `VITE_APP_DEBUG` = `false`

**注意**：确保环境变量应用到所有环境（Production, Preview, Development）

## ✅ 部署后验证

- [ ] 应用可以正常访问
- [ ] 页面加载正常
- [ ] API 调用正常（需要配置 API Key）
- [ ] 路由跳转正常（SPA 路由）
- [ ] 任务规划面板显示正常
- [ ] 工具执行日志显示正常
- [ ] 简洁模式切换正常

## 🐛 问题排查

如果遇到问题，检查：

- [ ] 构建日志是否有错误
- [ ] 环境变量是否正确设置
- [ ] API Key 是否有效
- [ ] 浏览器控制台是否有错误
- [ ] 网络请求是否正常

## 📚 相关文档

- 详细部署指南：查看 [DEPLOY.md](./DEPLOY.md)
- Vercel 文档：https://vercel.com/docs
- 项目 README：查看 [README.md](./README.md)

---

**部署完成后，记得更新 README 中的部署链接！** 🎉

