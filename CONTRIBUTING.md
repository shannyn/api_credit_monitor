# Contributing to API Credit Monitor | 贡献指南

[English](#english) | [简体中文](#简体中文)

---

<a name="简体中文"></a>
## 简体中文

感谢您有兴趣为本项目做贡献！

### 如何添加新的服务商 (Provider)

本项目的设计初衷是易于扩展。要添加一个新的 API 服务提供商，您只需要修改 `src/App.tsx` 中的 `PROVIDERS` 对象。

#### 步骤：
1. 打开 `src/App.tsx`。
2. 在 `PROVIDERS` 常量中添加一个新的键值对：

```typescript
const PROVIDERS: Record<string, Provider> = {
  // ... 现有提供商
  your_provider_id: {
    id: 'your_provider_id',
    name: '服务商名称',
    baseUrl: 'API 查询余额的完整地址',
    docsUrl: '官方余额查询页面（用于跳转）',
    // 可选：自定义请求头（默认使用 Bearer Token）
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
    // 关键：将 API 返回的 JSON 转换为统一格式
    transform: (data) => ({
      balance: data.your_balance_field,
      currency: 'USD' // 或 'CNY'
    })
  }
};
```

3. 如果 API 请求需要 `POST` 方法或特定的 `body`，可以在配置中指定 `method` 和 `body` 函数。

---

<a name="english"></a>
## English

Thank you for your interest in contributing to the API Credit Monitor!

### How to Add a New Provider

This project is designed to be easily extensible. To add a new API provider, you only need to modify the `PROVIDERS` object in `src/App.tsx`.

#### Steps:
1. Open `src/App.tsx`.
2. Add a new entry to the `PROVIDERS` constant:

```typescript
const PROVIDERS: Record<string, Provider> = {
  // ... existing providers
  your_provider_id: {
    id: 'your_provider_id',
    name: 'Provider Name',
    baseUrl: 'Full API endpoint for balance check',
    docsUrl: 'Official balance dashboard URL (for links)',
    // Optional: Custom headers (defaults to Bearer Token)
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
    // Critical: Transform the API JSON response to our unified format
    transform: (data) => ({
      balance: data.your_balance_field,
      currency: 'USD' // or 'CNY'
    })
  }
};
```

3. If the API requires a `POST` method or a specific request `body`, you can specify the `method` and `body` function in the config as well.

### Development Workflow
1. Fork the repo and create your branch.
2. Run `npm install` and `npm run dev`.
3. Submit a Pull Request!
