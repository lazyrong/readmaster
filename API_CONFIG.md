# OpenAI API 配置指南

## ✅ 已配置内容

### 1. 环境变量配置

已在 `.dev.vars` 文件中配置了 GenSpark LLM API：

```bash
OPENAI_API_KEY=gsk-eyJjb2dlbl9pZCI6ICI4ODEwOWU2ZC01NGQ5LTRkZjItYWJhNS1kNjg3OTRkOWQ1Y2UiLCAia2V5X2lkIjogIjcwY2Q2YmUxLTAyZDktNGJlZC1iYWRiLWIyNGJkZmE5OWVjMCJ9fOGAcxk7cSsN-VaSZanhY9TkH07s3kljk4FusBOSTPoq
OPENAI_BASE_URL=https://www.genspark.ai/api/llm_proxy/v1
```

### 2. 模型映射

已自动将常用模型映射到 GenSpark 支持的模型：
- `gpt-4` / `gpt-4-turbo` → `gpt-5`
- `gpt-3.5-turbo` → `gpt-5-mini`

### 3. API 集成

已在 `src/routes/analysts.ts` 中集成了 OpenAI 兼容 API。

## 🐛 当前问题

### Cloudflare Bot 保护

从 Cloudflare Workers (wrangler dev) 发起的请求会触发 GenSpark 的 Cloudflare 保护，导致 403 错误。

**错误信息**:
```
API error (403): <!DOCTYPE html><html lang="en-US">...
Just a moment...Enable JavaScript and cookies to continue
```

这是因为：
1. GenSpark API 使用 Cloudflare 保护
2. Workers 发起的请求被识别为可疑流量
3. 触发了 JavaScript 挑战页面

## 🔧 解决方案

### 方案 1：直接从浏览器调用 (推荐临时方案)

由于这是一个前后端分离的应用，可以将 AI 分析功能改为从浏览器直接调用 API：

**优点**:
- 不会触发 bot 检测
- 用户可见分析过程
- 可以实现流式响应

**缺点**:
- API Key 暴露在前端（需要用户自行配置）
- 无法在服务端缓存结果

**实现方式**:
```javascript
// 在前端 app.js 中
async function analyzeContent(contentId) {
  const apiKey = localStorage.getItem('openai_api_key');
  const baseUrl = 'https://www.genspark.ai/api/llm_proxy/v1';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: analyst.system_prompt },
        { role: 'user', content: contentText }
      ]
    })
  });
}
```

### 方案 2：使用代理服务器

在 Node.js 环境（非 Workers）中运行代理服务，避免 Cloudflare 检测。

### 方案 3：联系 GenSpark 白名单

请求将 Cloudflare Workers IP 范围加入白名单。

### 方案 4：部署到生产环境测试

生产环境的 Cloudflare Pages 可能不会触发相同的保护机制。

## 📝 验证环境变量

可以通过以下 endpoint 检查 API 配置是否正确：

```bash
curl http://localhost:3000/api/admin/env-check
```

**预期输出**:
```json
{
  "has_api_key": true,
  "has_base_url": true,
  "api_key_preview": "gsk-eyJjb2dlbl9pZCI6...",
  "base_url": "https://www.genspark.ai/api/llm_proxy/v1"
}
```

## 🚀 下一步

### 短期方案 (今天)

1. **实现前端直接调用**:
   - 修改前端代码，直接从浏览器调用 GenSpark API
   - 添加 API Key 配置页面
   - 用户自行输入并保存到 localStorage

2. **测试分析功能**:
   - 在浏览器中测试 AI 分析
   - 验证所有5个内置分析师

### 中期方案 (本周)

1. **优化用户体验**:
   - 添加 API Key 配置引导
   - 显示分析进度
   - 实现流式响应显示

2. **生产环境测试**:
   - 部署到 Cloudflare Pages
   - 测试生产环境是否有相同问题

### 长期方案 (下周)

1. **代理服务**:
   - 如果生产环境也有问题，考虑建立代理
   - 或使用 Cloudflare Workers AI Binding

2. **多 LLM 支持**:
   - 支持用户配置其他 LLM 提供商
   - OpenAI、Anthropic、本地模型等

## 💡 临时测试方法

如果你想立即测试 AI 功能，可以：

1. **使用浏览器控制台**:
```javascript
// 打开浏览器控制台 (F12)
const response = await fetch('https://www.genspark.ai/api/llm_proxy/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer gsk-eyJjb2dlbl9pZCI6ICI4ODEwOWU2ZC01NGQ5LTRkZjItYWJhNS1kNjg3OTRkOWQ1Y2UiLCAia2V5X2lkIjogIjcwY2Q2YmUxLTAyZDktNGJlZC1iYWRiLWIyNGJkZmE5OWVjMCJ9fOGAcxk7cSsN-VaSZanhY9TkH07s3kljk4FusBOSTPoq'
  },
  body: JSON.stringify({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: '你好' }
    ]
  })
});
const data = await response.json();
console.log(data);
```

2. **检查响应**:
   - 如果成功，说明浏览器可以正常调用
   - 可以实现前端直接调用方案

---

**当前状态**: 
- ✅ API Key 已配置
- ✅ 环境变量正确加载
- ⚠️ Cloudflare 保护导致 Workers 无法调用
- 🔄 需要实现前端直接调用方案

**推荐优先级**:
1. 今天：实现前端直接调用（1小时工作量）
2. 明天：部署生产环境测试
3. 下周：根据测试结果决定长期方案
