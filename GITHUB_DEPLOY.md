# GitHub 部署指南

## 📋 部署前准备

### 1. 数据备份（可选但建议）

建议导出本地数据作为备份：

```javascript
// 在浏览器控制台运行以下代码导出数据
const exportedData = localStorage.getItem('tilecatread_user_data');
console.log('导出的用户数据:', exportedData);
```

### 2. 检查敏感信息

确保 JSONbin 的 Master Key 已在 `jsonbin-config.js` 中正确配置：

```javascript
const JSONBIN_CONFIG = {
    binId: 'YOUR_BIN_ID',
    masterKey: 'YOUR_MASTER_KEY',
    baseUrl: 'https://api.jsonbin.io/v3'
};
```

## 🚀 上传到 GitHub

### 步骤 1：初始化 Git 仓库

```bash
cd e:\我的应用\tilecatread-main
git init
git add .
git commit -m "Initial commit: TileCatRead应用"
```

### 步骤 2：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 输入仓库名称（如：`tilecatread`）
3. 选择 **Private**（私有仓库，保护 JSONbin Key）
4. 不要勾选 "Add a README file"
5. 点击 "Create repository"

### 步骤 3：推送代码

```bash
git remote add origin https://github.com/你的用户名/tilecatread.git
git branch -M main
git push -u origin main
```

## 🔐 安全配置

### JSONbin 配置管理

1. **本地开发**：`jsonbin-config.js` 包含真实密钥
2. **生产部署**：建议在部署平台设置环境变量

**重要提示**：
- ✅ 使用私有仓库保护 JSONbin 密钥
- ✅ 不要在公开仓库中暴露 Master Key
- ✅ 定期轮换 JSONbin 密钥

## 📊 数据管理说明

### JSONbin 数据（云端）

**✅ 完全保留，无需操作**

- 数据存储在 JSONbin 云端
- 不受 GitHub 上传影响
- 从任何地方克隆代码后都能访问
- 通过 dataManager.js 和 script-jsonbin.js 管理

### 本地数据（localStorage）

**❌ 不会上传到 GitHub**

本地浏览器缓存数据不会被 Git 追踪。

## 🌐 从 GitHub 克隆后的设置

### 其他人克隆你的仓库：

1. **克隆代码**
   ```bash
   git clone https://github.com/你的用户名/tilecatread.git
   cd tilecatread
   ```

2. **配置 JSONbin**
   - 编辑 `jsonbin-config.js`
   - 填入自己的 JSONbin Bin ID 和 Master Key
   - （或使用相同的 Bin ID 共享数据）

3. **启动应用**
   ```bash
   # Windows
   powershell -File start-server.ps1
   
   # 或使用 Python
   python -m http.server 8000
   ```

4. **连接到 JSONbin**
   - 应用自动连接到 JSONbin
   - 会看到相同的用户数据和语录（如果使用同一 Bin ID）

## ⚠️ 重要提示

### 数据隔离

| 数据类型 | 存储位置 | 是否上传 GitHub | 是否共享 |
|---------|---------|----------------|---------|
| 代码文件 | 本地 → GitHub | ✅ 是 | ✅ 是 |
| JSONbin 数据 | JSONbin 云端 | ❌ 否 | ✅ 是（同一 Bin ID）|
| localStorage | 浏览器本地 | ❌ 否 | ❌ 否 |
| API Keys | `jsonbin-config.js` | ❌ 否（私有仓库）| ❌ 否 |

### 安全建议

1. **使用私有仓库**
   - 保护 JSONbin Master Key
   - 限制仓库访问权限

2. **定期轮换密钥**
   - 在 JSONbin 控制台重新生成密钥
   - 更新本地配置文件

3. **不要提交敏感信息**
   - 使用 `.gitignore` 忽略敏感文件
   - 检查 `git status` 确认

## 🔍 验证部署

### 检查清单

```bash
# 1. 查看将要上传的文件
git ls-files

# 2. 确认敏感文件被正确处理
# jsonbin-config.js 应该在私有仓库中受到保护
```

### 测试连接

1. 在新设备/浏览器访问应用
2. 配置 JSONbin 连接（如需要）
3. 注册/登录
4. 验证数据是否同步

## 📝 常见问题

### Q1: 上传后数据会丢失吗？
**A:** 不会。JSONbin 数据在云端，完全独立。

### Q2: 其他人克隆后能看到我的数据吗？
**A:** 取决于 JSONbin Bin ID 的配置：
- 使用相同 Bin ID：能看到数据
- 使用不同 Bin ID：各自独立

### Q3: 如何保护我的数据？
**A:** 
- 使用私有仓库保护 Master Key
- 为不同用户创建不同的 Bin ID
- 或只分享 Bin ID，不分享 Master Key

### Q4: localStorage 数据会上传吗？
**A:** 不会。localStorage 存在浏览器本地，不会被 Git 追踪。

### Q5: 我可以公开仓库吗?
**A:** 可以，但需要：
- 不在代码中暴露 JSONbin Master Key
- 提供配置说明，让用户填入自己的密钥
- 使用环境变量管理敏感信息

## 📚 相关资源

- [JSONbin 官网](https://jsonbin.io)
- [GitHub 私有仓库指南](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
- [Git 安全最佳实践](https://git-scm.com/docs/gitignore)