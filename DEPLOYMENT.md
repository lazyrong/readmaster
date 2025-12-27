# ReadMaster 部署指南

## 📋 当前状态

### ✅ 已完成
- ✅ 项目初始化和开发环境配置
- ✅ 核心功能实现（三栏布局、信息源、分析师）
- ✅ 本地开发服务器运行正常
- ✅ Git 仓库初始化
- ✅ **代码已推送到 GitHub**: https://github.com/lazyrong/readmaster

### ⏳ 待完成
- ⏳ Cloudflare Pages 生产部署
- ⏳ 生产数据库配置

---

## 🌐 访问地址

### 开发环境
- **开发服务器**: https://3000-ihgrui7rdoday4th0xm9d-5c13a017.sandbox.novita.ai
- **状态**: ✅ 运行中

### GitHub 仓库
- **地址**: https://github.com/lazyrong/readmaster
- **状态**: ✅ 已推送
- **分支**: main

### 生产环境
- **状态**: ⏳ 待部署
- **原因**: 需要配置 Cloudflare API Token

---

## 🚀 生产部署步骤

### 前置条件
1. **Cloudflare 账号**
2. **Cloudflare API Token** (需要 Cloudflare Pages 权限)

### 步骤 1: 配置 Cloudflare API Token

#### 创建 API Token
1. 访问 Cloudflare Dashboard: https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token"
3. 选择 "Edit Cloudflare Workers" 模板或自定义权限：
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Account** → **D1** → **Edit**
4. 复制生成的 Token

#### 在 GenSpark Deploy 标签页配置
1. 打开侧边栏的 **Deploy** 标签
2. 输入 Cloudflare API Token
3. 保存配置

### 步骤 2: 创建生产数据库

```bash
# 1. 创建 D1 数据库
cd /home/user/readmaster
npx wrangler d1 create readmaster-production

# 2. 复制输出的 database_id
# 输出类似:
# [[d1_databases]]
# binding = "DB"
# database_name = "readmaster-production"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 步骤 3: 更新配置文件

编辑 `wrangler.jsonc`，取消注释并更新 D1 配置：

```jsonc
{
  "name": "readmaster",
  "compatibility_date": "2025-12-26",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "readmaster-production",
      "database_id": "YOUR_DATABASE_ID_HERE"  // 替换为实际 ID
    }
  ]
}
```

### 步骤 4: 运行数据库迁移

```bash
# 应用数据库迁移
npx wrangler d1 migrations apply readmaster-production

# 插入种子数据（可选）
npx wrangler d1 execute readmaster-production --file=./seed.sql
```

### 步骤 5: 创建 Cloudflare Pages 项目

```bash
# 创建项目
npx wrangler pages project create readmaster \
  --production-branch main \
  --compatibility-date 2025-12-26
```

### 步骤 6: 构建和部署

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name readmaster
```

### 步骤 7: 配置环境变量

```bash
# 设置 OpenAI API Key
npx wrangler pages secret put OPENAI_API_KEY --project-name readmaster
# 输入: 70cd6be1-02d9-4bed-badb-b24bdfa99ec0

# 设置 OpenAI Base URL
npx wrangler pages secret put OPENAI_BASE_URL --project-name readmaster
# 输入: https://www.genspark.ai/api/llm_proxy/v1
```

### 步骤 8: 初始化生产数据库

部署完成后，访问以下 URL 初始化数据库：

```bash
# 替换为你的生产域名
curl -X POST https://readmaster.pages.dev/api/admin/init-schema
curl -X POST https://readmaster.pages.dev/api/admin/seed
```

---

## 🧪 验证部署

### 检查健康状态
```bash
curl https://readmaster.pages.dev/api/health
```

### 检查环境变量
```bash
curl https://readmaster.pages.dev/api/admin/env-check
```

### 测试核心功能
1. 访问首页：https://readmaster.pages.dev
2. 检查脉络列表
3. 添加信息源（测试 RSS）
4. 同步内容
5. 测试 AI 分析功能

---

## 🔧 常见问题

### Q1: Cloudflare API Token 权限不足
**解决方案**: 确保 Token 包含以下权限：
- Account → Cloudflare Pages → Edit
- Account → D1 → Edit

### Q2: 部署后 AI 分析不工作
**原因**: 环境变量未配置或 Cloudflare 拦截
**解决方案**: 
1. 检查环境变量配置
2. 使用前端直接调用（当前方案）

### Q3: 数据库迁移失败
**解决方案**: 
```bash
# 重置数据库
npx wrangler d1 execute readmaster-production --file=./migrations/0001_initial_schema.sql
```

---

## 📊 部署检查清单

- [ ] Cloudflare API Token 已配置
- [ ] D1 数据库已创建
- [ ] wrangler.jsonc 已更新
- [ ] 数据库迁移已执行
- [ ] Pages 项目已创建
- [ ] 代码已构建和部署
- [ ] 环境变量已配置
- [ ] 生产数据库已初始化
- [ ] 核心功能已验证

---

## 🎯 下一步行动

### 立即可做（无需部署）
1. **本地测试**: 访问开发服务器测试所有功能
2. **添加信息源**: 测试 RSS 同步和内容抓取
3. **测试 AI 分析**: 配置 API Key 后测试分析功能
4. **代码优化**: 根据测试结果改进功能

### 需要部署后
1. **生产测试**: 在 Cloudflare Pages 测试性能
2. **域名绑定**: 绑定自定义域名
3. **监控配置**: 设置日志和错误追踪
4. **用户测试**: 邀请种子用户测试

---

## 📈 性能优化建议

### 部署后优化
1. **CDN 缓存**: 配置静态资源缓存策略
2. **API 限流**: 添加 API 请求限制
3. **数据库索引**: 优化查询性能
4. **图片 CDN**: 使用 Cloudflare Images

### 功能扩展
1. **用户认证**: 添加登录注册系统
2. **更多信息源**: 实现 YouTube、Figma MCP 等适配器
3. **分析师市场**: 构建 UGC 社区
4. **移动端**: 开发响应式移动版本

---

**更新时间**: 2025-12-26  
**状态**: GitHub ✅ | 生产环境 ⏳
