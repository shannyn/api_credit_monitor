# API Credit Monitor | API 余额监控助手

[English](#english) | [简体中文](#简体中文)

---

<a name="简体中文"></a>
## 简体中文

API Credit Monitor 是一个纯前端的 API 余额监控工具，旨在帮助开发者在一个地方集中查看多个 AI 服务提供商的余额和使用情况。

### ✨ 特性
- **多平台支持**：内置支持 DeepSeek、OpenRouter、Moonshot (Kimi) 等，支持自定义 API 节点。
- **隐私保护**：**API Key 仅保存在您的浏览器 LocalStorage 中**，直接与服务商 API 通信，不经过任何中转服务器。
- **自动刷新**：默认每 5 分钟自动更新一次余额。
- **美观耐看**：现代化的 UI 设计，支持深色模式 (Dark Mode)。
- **完全开源**：纯前端实现，易于部署和二次开发。

### 🚀 快速开始

#### 本地开发
1. 克隆仓库：
   ```bash
   git clone https://github.com/your-username/api-credit-monitor.git
   cd api-credit-monitor
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```

#### 生产构建
```bash
npm run build
```
构建后的文件将位于 `dist` 目录，您可以将其部署到 GitHub Pages、Vercel、Netlify 等任何静态文件托管服务。

### ⚠️ 重要提示：关于 CORS（跨域）问题
由于大多数 AI 服务商（如 OpenAI）的 API 为了安全禁用了浏览器的直接跨域请求，使用此纯前端工具时可能会遇到 `Failed to fetch` 错误。

**解决方案**：
1. **浏览器扩展**：安装如 "Allow CORS: Access-Control-Allow-Origin" 类的插件并开启。
2. **本地代理**：通过设置本地代理转发请求。
3. **禁用浏览器安全策略**（仅限测试）：以 `--disable-web-security` 模式启动浏览器。

### 🛠 自定义添加
您可以在 `src/App.tsx` 中的 `PROVIDERS` 对象中轻松添加新的服务商配置。

---

<a name="english"></a>
## English

API Credit Monitor is a pure frontend utility designed to help developers track their AI service balances and usage across multiple providers in one centralized dashboard.

### ✨ Features
- **Multi-Provider Support**: Built-in support for DeepSeek, OpenRouter, Moonshot (Kimi), and more. Includes support for custom API endpoints.
- **Privacy First**: **Your API keys are stored only in your browser's LocalStorage**. Requests are sent directly to the providers without any middleman server.
- **Auto-Refresh**: Automatically updates balances every 5 minutes by default.
- **Elegant UI**: Modern design with full Dark Mode support.
- **Fully Open Source**: Pure frontend implementation, easy to deploy and customize.

### 🚀 Getting Started

#### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/api-credit-monitor.git
   cd api-credit-monitor
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

#### Production Build
```bash
npm run build
```
The build artifacts will be in the `dist` directory, ready to be deployed to GitHub Pages, Vercel, Netlify, or any static hosting service.

### ⚠️ Important: About CORS Issues
Most AI providers (like OpenAI) disable direct browser-based cross-origin requests for security reasons (CORS). As a pure frontend app, you might encounter `Failed to fetch` errors.

**Solutions**:
1. **Browser Extension**: Use an extension like "Allow CORS: Access-Control-Allow-Origin" and enable it.
2. **Local Proxy**: Use a local proxy server to forward your requests.
3. **Disable Security** (For testing only): Run your browser with the `--disable-web-security` flag.

### 🛠 Customization
You can easily add new providers by extending the `PROVIDERS` object in `src/App.tsx`.

---

### 📄 License
MIT License. Feel free to use and contribute!
