# 🚀 Vercel 部署指南

本指南将帮助你快速将 06-Chat-Travel-Assistant 部署到 Vercel。

## 📋 前置要求

- 一个 Vercel 账号（免费注册：https://vercel.com）
- 一个 GitHub 账号（用于代码托管）
- DeepSeek API Key（从 https://platform.deepseek.com 获取）

## 🎯 部署方式

### 方式一：通过 GitHub 集成（推荐）⭐

这是最简单的方式，支持自动部署。

#### 步骤 1: 推送代码到 GitHub

```bash
# 确保代码已提交
git add .
git commit -m "准备部署到 Vercel"
git push origin main
```

#### 步骤 2: 在 Vercel 中导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New Project"** 或 **"Import Project"**
3. 选择 **"Import Git Repository"**
4. 选择你的 GitHub 仓库
5. 如果仓库在子目录，配置如下：
   - **Root Directory**: 选择 `06-Chat-Travel-Assistant`
   - 或者直接选择整个仓库，然后在项目设置中配置

#### 步骤 3: 配置项目设置

Vercel 会自动检测 Vite 项目，但请确认以下配置：

- **Framework Preset**: `Vite`（自动检测）
- **Build Command**: `npm run build`（自动检测）
- **Output Directory**: `dist`（自动检测）
- **Install Command**: `npm install`（自动检测）

#### 步骤 4: 配置环境变量

在部署前或部署后，需要添加环境变量：

1. 在项目设置页面，点击 **"Environment Variables"**
2. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_AI_API_KEY` | 你的 DeepSeek API Key | **必需** |
| `VITE_AI_API_BASE_URL` | `https://api.deepseek.com` | 可选（有默认值） |
| `VITE_APP_TITLE` | `个人旅行助手` | 可选 |
| `VITE_APP_DEBUG` | `false` | 可选 |

3. 确保环境变量应用到所有环境（Production, Preview, Development）

#### 步骤 5: 部署

点击 **"Deploy"**，Vercel 会自动：
- 安装依赖
- 构建项目
- 部署到生产环境

#### 步骤 6: 访问应用

部署成功后，Vercel 会提供一个 URL：
```
https://your-project-name.vercel.app
```

### 方式二：通过 Vercel CLI

适合本地开发和快速部署。

#### 步骤 1: 安装 Vercel CLI

```bash
npm i -g vercel
```

#### 步骤 2: 登录 Vercel

```bash
vercel login
```

#### 步骤 3: 部署项目

```bash
cd 06-Chat-Travel-Assistant
vercel
```

首次部署会询问一些问题：
- Set up and deploy? **Yes**
- Which scope? 选择你的账号
- Link to existing project? **No**（首次部署）
- Project name? 输入项目名称（或直接回车使用默认）
- Directory? 直接回车（当前目录）
- Override settings? **No**

#### 步骤 4: 配置环境变量

```bash
# 添加环境变量
vercel env add VITE_AI_API_KEY
# 输入你的 API Key，选择环境（Production/Preview/Development）

vercel env add VITE_AI_API_BASE_URL
# 输入: https://api.deepseek.com

vercel env add VITE_APP_TITLE
# 输入: 个人旅行助手

vercel env add VITE_APP_DEBUG
# 输入: false
```

或者通过 Vercel Dashboard 添加（见方式一步骤 4）

#### 步骤 5: 部署到生产环境

```bash
vercel --prod
```

## 🔧 配置文件说明

### vercel.json

项目已包含 `vercel.json` 配置文件：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

这个配置确保：
- SPA 路由正常工作（所有路由重定向到 index.html）
- Vite 项目正确构建
- 输出目录正确

## 🔄 持续部署

### 自动部署

当你通过 GitHub 集成部署后：
- 每次推送到 `main` 分支，Vercel 会自动部署到生产环境
- 每次创建 Pull Request，Vercel 会自动创建预览部署

### 手动部署

```bash
vercel --prod
```

## 🌐 自定义域名

1. 在 Vercel 项目设置中，进入 **"Domains"**
2. 点击 **"Add Domain"**
3. 输入你的域名
4. 按照提示配置 DNS 记录：
   - 添加 CNAME 记录指向 `cname.vercel-dns.com`
   - 或添加 A 记录指向 Vercel 提供的 IP 地址

## 🐛 常见问题

### 1. 构建失败

**问题**: 构建时找不到模块或类型错误

**解决**:
- 确保 `tsconfig.app.json` 中包含了 `tools/` 目录：
  ```json
  {
    "include": [
      "src/**/*.ts",
      "src/**/*.tsx",
      "src/**/*.vue",
      "../../tools/**/*.ts"
    ]
  }
  ```

### 2. 环境变量未生效

**问题**: 部署后环境变量未生效

**解决**:
- 确保环境变量名称以 `VITE_` 开头
- 重新部署项目（环境变量更改后需要重新构建）
- 检查环境变量是否应用到正确的环境（Production/Preview/Development）

### 3. 路由 404 错误

**问题**: 直接访问路由返回 404

**解决**:
- 确保 `vercel.json` 中包含 `rewrites` 配置
- 所有路由应该重定向到 `index.html`

### 4. API 调用失败

**问题**: 前端无法调用 DeepSeek API

**解决**:
- 检查 `VITE_AI_API_KEY` 是否正确设置
- 检查 API Key 是否有效
- 查看浏览器控制台的错误信息
- 检查 CORS 设置（如果需要）

## 📊 监控和分析

### 查看部署日志

1. 在 Vercel Dashboard 中，进入项目
2. 点击 **"Deployments"**
3. 选择某个部署，查看构建日志

### 查看实时日志

```bash
vercel logs
```

### 性能监控

Vercel 提供内置的性能监控和分析工具，可以在 Dashboard 中查看。

## 🔐 安全建议

1. **不要将 API Key 提交到 Git**
   - 使用 `.env.local` 文件（本地开发）
   - 使用 Vercel 环境变量（生产环境）
   - 确保 `.env*` 文件在 `.gitignore` 中

2. **使用环境变量**
   - 所有敏感信息通过环境变量管理
   - 不同环境使用不同的 API Key（如果需要）

3. **定期更新依赖**
   ```bash
   npm update
   ```

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)

## 🎉 部署成功！

部署成功后，你可以：
- 分享应用链接给其他人
- 配置自定义域名
- 查看部署历史和日志
- 设置自动部署规则

祝你部署顺利！🚀

