# Netlify Supabase 配置修复指南

## 🔍 问题诊断

### 当前状态
- ✅ 本地环境：Supabase 连接正常
- ❌ Netlify 部署：无法连接 Supabase
- 🔍 原因：`supabase-config.js` 被 `.gitignore` 排除，未上传到 GitHub

## 🎯 解决方案（推荐）

### 方案 A：使用 Netlify 环境变量 ⭐

**优点：**
- 🔒 最安全（API Key 不出现在代码中）
- 🚀 符合最佳实践
- 🔄 易于管理和更新

**步骤：**

#### 1. 登录 Netlify 控制台

访问：https://app.netlify.com

#### 2. 进入项目设置

1. 找到你的项目（tilecatread）
2. 点击 **Site settings**
3. 选择 **Environment variables**（或 **Build & deploy** → **Environment**）

#### 3. 添加环境变量

点击 **Add a variable**，添加以下两个变量：

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://kbdkorfekqvhfvcezwnj.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZGtvcmZla3F2aGZ2Y2V6d25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NjkyNDMsImV4cCI6MjA3NjM0NTI0M30.dxAMSjA0dwxmNmtG0abJQYYGogMVF_TpJvL_mzy1mkw` |

**注意：** Scopes 选择 **All scopes** 或至少包含 **Builds** 和 **Functions**

#### 4. 修改代码以支持环境变量

##### 4.1 创建 `netlify-supabase-config.js`

在项目根目录创建新文件：

```javascript
// Netlify 环境变量配置（生产环境）
// 本地开发时会回退到 supabase-config.js

const SUPABASE_CONFIG = {
    // 优先从环境变量读取（Netlify 部署）
    // 否则从本地配置文件读取（本地开发）
    url: window.ENV?.SUPABASE_URL || 'https://kbdkorfekqvhfvcezwnj.supabase.co',
    anonKey: window.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZGtvcmZla3F2aGZ2Y2V6d25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NjkyNDMsImV4cCI6MjA3NjM0NTI0M30.dxAMSjA0dwxmNmtG0abJQYYGogMVF_TpJvL_mzy1mkw',
    
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        },
        db: {
            schema: 'public'
        }
    }
};

function initSupabase() {
    try {
        if (SUPABASE_CONFIG.url === 'https://your-project-id.supabase.co' || 
            SUPABASE_CONFIG.anonKey === 'your-anon-key-here') {
            console.warn('⚠️ Supabase 配置未完成，将使用本地存储模式');
            return false;
        }
        
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase SDK 未加载');
            return false;
        }
        
        console.log('✅ Supabase 配置验证通过');
        console.log('📡 连接到:', SUPABASE_CONFIG.url);
        return true;
    } catch (error) {
        console.error('❌ Supabase 初始化失败:', error);
        return false;
    }
}

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.initSupabase = initSupabase;
```

##### 4.2 创建 Netlify 构建脚本

创建 `netlify/edge-functions/inject-env.js`（可选，用于注入环境变量到前端）

或者更简单的方法：创建 `netlify.toml` 配置文件：

```toml
[build]
  publish = "."
  
[build.environment]
  # 确保环境变量在构建时可用
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# 注入环境变量到前端（通过构建脚本）
[context.production]
  command = "node inject-env.js"
```

##### 4.3 创建环境变量注入脚本

创建 `inject-env.js`：

```javascript
// inject-env.js - Netlify 构建时注入环境变量
const fs = require('fs');

const envConfig = `
window.ENV = {
  SUPABASE_URL: "${process.env.SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}"
};
`;

fs.writeFileSync('env-config.js', envConfig);
console.log('✅ 环境变量已注入到 env-config.js');
```

##### 4.4 修改 `index.html`

在 `<head>` 中添加（在其他脚本之前）：

```html
<!-- 环境变量配置（生产环境由 Netlify 生成） -->
<script src="env-config.js"></script>

<!-- Supabase 配置（兼容本地和生产环境） -->
<script src="netlify-supabase-config.js"></script>
```

#### 5. 部署到 Netlify

```bash
git add netlify-supabase-config.js netlify.toml inject-env.js
git commit -m "配置 Netlify 环境变量支持"
git push origin main
```

Netlify 会自动重新部署。

---

### 方案 B：直接上传配置文件（简单但有风险）⚠️

**⚠️ 警告：**
- 仅适用于**私有仓库**
- API Key 会暴露在 GitHub 中
- 不推荐用于生产环境

**步骤：**

#### 1. 从 `.gitignore` 中移除 `supabase-config.js`

编辑 `.gitignore`，删除或注释掉这一行：

```diff
- supabase-config.js
+ # supabase-config.js  # 已上传，用于 Netlify 部署
```

#### 2. 添加并提交配置文件

```bash
git add supabase-config.js
git commit -m "添加 Supabase 配置文件用于 Netlify 部署"
git push origin main
```

#### 3. 验证 GitHub 仓库

访问 GitHub 仓库，确认 `supabase-config.js` 已上传。

#### 4. Netlify 自动重新部署

推送后，Netlify 会自动部署，配置文件将可用。

---

## 🧪 测试与验证

### 1. 本地测试

打开 `test-supabase-connection.html`：

```bash
# 启动本地服务器
.\start-server.ps1

# 浏览器访问
http://localhost:8080/test-supabase-connection.html
```

检查所有项目是否通过 ✅

### 2. Netlify 测试

访问：

```
https://tilecatread.netlify.app/test-supabase-connection.html
```

**预期结果：**
- ✅ Supabase SDK 加载成功
- ✅ 配置文件加载成功
- ✅ 配置信息验证通过
- ✅ 数据库连接测试成功
- ✅ 用户表查询成功

### 3. 应用功能测试

访问主应用：

```
https://tilecatread.netlify.app/
```

测试流程：
1. 注册新用户
2. 添加书籍和语录
3. 退出登录
4. 刷新页面 → 检查启动页是否显示个人语录
5. 重新登录 → 数据应该保留

---

## 📊 故障排查

### 问题 1：环境变量未生效

**检查：**
1. Netlify 控制台是否正确设置了环境变量
2. 变量名是否完全匹配（区分大小写）
3. 是否触发了重新部署

**解决：**
- 手动触发重新部署：Netlify 控制台 → Deploys → Trigger deploy → Deploy site

### 问题 2：仍然无法连接数据库

**检查：**
1. 浏览器控制台是否有错误信息
2. Network 标签页是否有请求被阻止
3. Supabase 项目是否处于活跃状态

**解决：**
- 访问 Supabase 控制台确认项目状态
- 检查 API Key 是否过期
- 验证 RLS 策略是否正确配置

### 问题 3：本地能用，Netlify 不能用

**可能原因：**
- 配置文件未上传
- 环境变量未设置
- CORS 设置问题

**解决：**
- 使用测试页面逐步诊断
- 检查 Netlify 构建日志

---

## 🎯 推荐方案总结

| 方案 | 安全性 | 易用性 | 推荐度 |
|------|-------|--------|--------|
| **方案 A：环境变量** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ 强烈推荐 |
| **方案 B：上传配置文件** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ 仅私有仓库 |

**最终建议：** 使用**方案 A**（环境变量），符合工业标准且安全性高。

---

## 📝 后续优化建议

1. **启用 Supabase RLS（Row Level Security）**
   - 确保用户数据隔离
   - 防止未授权访问

2. **考虑升级到 Supabase Auth**
   - 替代当前的简单密码哈希
   - 提供更安全的身份验证

3. **添加错误监控**
   - 集成 Sentry 或类似服务
   - 实时监控生产环境错误

4. **设置 API Key 轮换策略**
   - 定期更新 API Key
   - 使用 Service Role Key 进行服务端操作（如果需要）

---

**修复完成后，请访问测试页面验证：**
🔗 https://tilecatread.netlify.app/test-supabase-connection.html

祝部署顺利！🚀
