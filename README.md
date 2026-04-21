# API Credit Monitor

A pure frontend application to monitor your AI service balances in one place.

## Features
- **Dashboard Grid**: Monitor multiple API accounts simultaneously.
- **Auto-refresh**: Automatically updates balances every 5 minutes.
- **LocalStorage Persistence**: Your API keys and configurations stay in your browser.
- **Privacy First**: No server involved. API keys are only sent to the provider's official endpoints.
- **Dark Mode Support**: Adapts to your system theme.

## Supported Providers
- OpenAI
- DeepSeek
- OpenRouter
- (Base template for others like Anthropic included)

## How to Run locally

### 1. Ready-to-use Build
If you just want to use the monitor, you can find the build in the `dist/` directory.
Due to browser security (CORS), you usually need to serve these files or use a browser extension.

To serve quickly:
```bash
npx serve dist
```

### 2. Development
```bash
npm install
npm run dev
```

### 3. Build
```bash
npm run build
```

## Important Note on CORS
Most AI providers (OpenAI, etc.) block direct browser requests to their API for security reasons (CORS). To use this tool as a "pure frontend" app:
1.  Use a browser extension like "Allow CORS: Access-Control-Allow-Origin" (not recommended for production use).
2.  Or use a local proxy.
3.  Or run your browser with security checks disabled (at your own risk).

This tool is designed to demonstrate a local-first management interface for API usage.
