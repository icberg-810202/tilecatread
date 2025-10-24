# GitHub 部署指南

## 📋 部署前准备

### 1. 数据备份（可选但建议）

虽然 Supabase 数据不会受影响，但建议备份本地数据：

```javascript
// 在浏览器控制台运行以下代码导出数据
const backup = {
    userData: {},
    playbackSettings: {}
};

// 导出所有用户数据
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('userData_') || key.startsWith('playbackSettings_')) {
        backup[key] = localStorage.getItem(key);
    }
}

// 下载备份
console.log(JSON.stringify(backup, null, 2));
```

### 2. 检查敏感信息

确保以下文件在 `.gitignore` 中：

```
✅ supabase-config.js
✅ supabase url and apikeys/
```

## 🚀 上传到 GitHub

### 步骤 1：初始化 Git 仓库

```bash
cd "f:\1.个人资料\我的应用\我的语录应用"
git init
git add .
git commit -m "Initial commit: 语录应用"
```

### 步骤 2：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 输入仓库名称（如：`quote-app`）
3. 选择 **Private**（私有仓库，保护 API Key）
4. 不要勾选 "Add a README file"
5. 点击 "Create repository"

### 步骤 3：推送代码

```bash
git remote add origin https://github.com/你的用户名/quote-app.git
git branch -M main
git push -u origin main
```

## 🔐 安全配置

### 方案A：使用环境变量（推荐）

如果部署到 Netlify/Vercel：

1. 在部署平台设置环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

2. 修改代码读取环境变量：
   ```javascript
   const SUPABASE_CONFIG = {
       url: process.env.SUPABASE_URL || 'YOUR_URL',
       anonKey: process.env.SUPABASE_ANON_KEY || 'YOUR_KEY'
   };
   ```

### 方案B：使用 .gitignore（当前方案）

1. ✅ 已创建 `.gitignore`
2. ✅ 已添加 `supabase-config.js`
3. ✅ 已创建 `supabase-config.template.js`

**使用说明：**
- `supabase-config.js` - 包含真实密钥，不上传
- `supabase-config.template.js` - 模板文件，上传到 GitHub

## 📊 数据迁移说明

### Supabase 数据（云端）

**✅ 完全保留，无需操作**

- 数据存储在 Supabase 云端
- 不受 GitHub 上传影响
- 从任何地方克隆代码后都能访问

### 本地数据（localStorage）

**❌ 不会上传到 GitHub**

如果需要在新设备上恢复：

1. 导出数据（见上方备份代码）
2. 在新设备上导入：
   ```javascript
   // 粘贴备份的 JSON 数据
   const backup = { ... };
   
   // 导入到 localStorage
   for (const [key, value] of Object.entries(backup)) {
       localStorage.setItem(key, value);
   }
   ```

## 🌐 从 GitHub 克隆后的设置

### 其他人克隆你的仓库：

1. **克隆代码**
   ```bash
   git clone https://github.com/你的用户名/quote-app.git
   cd quote-app
   ```

2. **配置 Supabase**
   ```bash
   # 复制模板文件
   cp supabase-config.template.js supabase-config.js
   
   # 编辑 supabase-config.js，填入密钥
   ```

3. **启动应用**
   ```bash
   # Windows
   powershell -File start-server.ps1
   
   # 或使用 Python
   python -m http.server 8080
   ```

4. **连接到 Supabase**
   - 自动连接到你的 Supabase 数据库
   - 看到相同的用户数据和语录

## ⚠️ 重要提示

### 数据隔离

| 数据类型 | 存储位置 | 是否上传 GitHub | 是否共享 |
|---------|---------|----------------|---------|
| 代码文件 | 本地 → GitHub | ✅ 是 | ✅ 是 |
| Supabase 数据 | Supabase 云端 | ❌ 否 | ✅ 是（同一数据库）|
| localStorage | 浏览器本地 | ❌ 否 | ❌ 否 |
| API Keys | `supabase-config.js` | ❌ 否（.gitignore）| ❌ 否 |

### 安全建议

1. **使用私有仓库**
   - 即使使用 `.gitignore`，建议设为 Private

2. **定期轮换 API Key**
   - 在 Supabase 控制台重新生成密钥
   - 更新本地配置文件

3. **使用 RLS（Row Level Security）**
   - ✅ 已启用（见 `supabase-init.sql`）
   - 确保数据安全隔离

4. **不要提交敏感信息**
   - 检查 `.gitignore` 是否生效
   - 使用 `git status` 确认

## 🔍 验证部署

### 检查清单

```bash
# 1. 确认 .gitignore 生效
git status
# 不应该看到 supabase-config.js

# 2. 查看将要上传的文件
git ls-files

# 3. 确认敏感文件被忽略
git check-ignore supabase-config.js
# 应该输出: supabase-config.js
```

### 测试连接

1. 在新设备/浏览器访问应用
2. 配置 Supabase 连接
3. 注册/登录
4. 验证数据是否同步

## 📝 常见问题

### Q1: 上传后数据会丢失吗？
**A:** 不会。Supabase 数据在云端，完全独立。

### Q2: 其他人克隆后能看到我的数据吗？
**A:** 能，如果他们有正确的 API Key 并连接到同一个 Supabase 项目。

### Q3: 如何阻止他人访问我的数据？
**A:** 
- 使用私有仓库
- 不分享 API Key
- 或创建新的 Supabase 项目

### Q4: localStorage 数据会上传吗？
**A:** 不会。localStorage 存在浏览器本地，不会被 Git 追踪。

### Q5: 我可以公开仓库吗？
**A:** 可以，但需要：
- 确保 `.gitignore` 正确配置
- 使用环境变量存储密钥
- 或提供配置模板，让用户填入自己的密钥

## 📚 相关文档

- [Supabase 安全最佳实践](https://supabase.com/docs/guides/auth/row-level-security)
- [Git .gitignore 文档](https://git-scm.com/docs/gitignore)
- [GitHub 私有仓库指南](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
