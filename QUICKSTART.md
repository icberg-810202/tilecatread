# 🚀 快速开始指南

欢迎使用 **Bwhisper** Supabase 版本！按照以下步骤，几分钟内即可启用云端数据同步功能。

---

## ⚡ 5分钟快速配置

### 第一步：注册 Supabase

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 **Start your project** 注册账号（可以使用 GitHub 账号）
3. 创建一个新项目：
   - **项目名称**: `quote-app` (或任意名称)
   - **数据库密码**: 设置一个强密码并**保存好**
   - **区域**: 选择 `Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)`

⏱️ 项目创建需要约 1-2 分钟，请耐心等待。

---

### 第二步：初始化数据库

1. 在 Supabase 项目控制台中，点击左侧菜单的 **SQL Editor**
2. 点击 **New query** 创建新查询
3. 打开本项目的 `supabase-init.sql` 文件
4. **复制全部内容** 并粘贴到 SQL Editor 中
5. 点击右下角的 **Run** 按钮执行
6. 看到 `✅ 数据库初始化成功！` 表示完成

---

### 第三步：获取项目配置

1. 在 Supabase 控制台，点击左下角的 **Settings** ⚙️
2. 点击 **API** 选项
3. 找到并复制以下两个值：

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 第四步：配置应用

1. 打开 `supabase-config.js` 文件
2. 找到以下两行并替换为你的配置：

```javascript
url: 'https://your-project-id.supabase.co',  // ← 替换为你的 Project URL
anonKey: 'your-anon-key-here',                // ← 替换为你的 anon public key
```

3. 保存文件

---

### 第五步：测试应用

1. 在浏览器中打开 `index.html`
2. 注册一个新用户
3. 添加一本书和语录
4. 打开浏览器控制台（F12），查看日志：
   - 如果看到 `✅ Supabase 客户端初始化成功`，说明配置正确
   - 如果看到 `✅ 书籍已保存到 Supabase`，说明数据同步成功

---

## 🎯 验证数据同步

### 方法一：查看数据库
1. 在 Supabase 控制台，点击 **Table Editor**
2. 查看 `users`、`books`、`quotes` 表
3. 应该能看到你刚才添加的数据

### 方法二：多设备测试
1. 在另一台设备或浏览器隐身模式中打开应用
2. 用相同账号登录
3. 数据应该自动同步

---

## 🔧 常见问题

### ❓ 初始化后仍提示"未配置"？

检查 `supabase-config.js` 中的 URL 和 Key 是否正确替换，不要留下示例值。

### ❓ 注册失败？

1. 打开浏览器控制台（F12）查看错误信息
2. 检查网络连接
3. 确认数据库初始化成功（在 Table Editor 中应该能看到表）

### ❓ 数据没有同步到云端？

1. 查看控制台是否有错误信息
2. 检查 Supabase 项目是否正常运行（在控制台查看项目状态）
3. 尝试刷新页面重新登录

### ❓ 想要清空所有数据重新开始？

在 SQL Editor 中执行：
```sql
TRUNCATE users, books, quotes CASCADE;
```

---

## 🎨 功能对比

### 使用 Supabase 后的优势：

| 功能 | 本地版本 | Supabase版本 |
|------|---------|-------------|
| 数据存储 | 仅本地浏览器 | ✅ 云端 + 本地双备份 |
| 多设备同步 | ❌ 不支持 | ✅ 自动同步 |
| 数据安全 | 清除浏览器数据会丢失 | ✅ 云端持久化 |
| 离线使用 | ✅ 支持 | ✅ 支持（有本地缓存） |
| 用户认证 | 简单本地验证 | ✅ 数据库验证 |

---

## 📚 下一步

- 📖 查看 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 了解详细配置
- 🔐 了解如何使用 Supabase Auth（更安全的认证方式）
- 📊 探索 Supabase 的实时订阅功能
- 🎨 自定义数据库表结构

---

## 💡 提示

- **本地模式**：如果不配置 Supabase，应用仍可正常使用本地存储
- **自动降级**：网络异常时，应用会自动切换到本地模式
- **数据安全**：Supabase 免费计划提供 500MB 数据库存储，对个人使用完全够用

---

## 📞 需要帮助？

- Supabase 官方文档: https://supabase.com/docs
- Supabase 中文社区: https://supabase.com/docs/guides/resources/community

---

**祝使用愉快！** 📚✨
