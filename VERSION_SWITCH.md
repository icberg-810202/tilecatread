# 📦 版本切换指南

本应用现在有两个版本的 JavaScript 文件，你可以根据需要选择使用：

---

## 📁 文件说明

### 1. `script.js` - 纯本地版本（原版）
- ✅ 数据存储在浏览器 localStorage
- ✅ 无需网络连接
- ✅ 无需配置，开箱即用
- ❌ 不支持多设备同步
- ❌ 清除浏览器数据会丢失

### 2. `script-supabase.js` - Supabase 云端版本（新版）
- ✅ 数据存储在 Supabase 云端数据库
- ✅ 支持多设备自动同步
- ✅ 数据持久化，不会丢失
- ✅ 网络异常时自动降级到本地模式
- ⚙️ 需要配置 Supabase 项目

---

## 🔄 如何切换版本

### 切换到 Supabase 版本

1. **备份当前数据**（重要！）
   - 打开应用，导出你的语录数据
   - 或者备份浏览器的 localStorage 数据

2. **修改 index.html**
   找到文件末尾的这两行：
   ```html
   <script src="supabase-config.js"></script>
   <script src="script.js"></script>
   ```
   
   改为：
   ```html
   <script src="supabase-config.js"></script>
   <script src="script-supabase.js"></script>
   ```

3. **配置 Supabase**
   - 按照 [QUICKSTART.md](./QUICKSTART.md) 完成配置
   - 填写 `supabase-config.js` 中的项目信息

4. **重新打开应用**
   - 刷新浏览器
   - 注册新用户或使用现有用户登录
   - 手动重新添加书籍和语录（或导入备份）

### 切换回本地版本

1. **修改 index.html**
   找到：
   ```html
   <script src="supabase-config.js"></script>
   <script src="script-supabase.js"></script>
   ```
   
   改回：
   ```html
   <script src="supabase-config.js"></script>
   <script src="script.js"></script>
   ```

2. **刷新浏览器**
   - 原来的本地数据应该还在
   - 如果数据丢失，从备份中恢复

---

## 🎯 推荐使用场景

### 使用本地版本（script.js）

适合以下情况：
- 🏠 只在一台设备上使用
- 🔒 对隐私要求高，不想数据上云
- 📴 经常在离线环境使用
- ⚡ 想要最快的响应速度

### 使用 Supabase 版本（script-supabase.js）

适合以下情况：
- 📱 在多台设备上使用（手机、电脑等）
- ☁️ 希望数据云端备份，不怕丢失
- 👥 未来可能需要数据分享功能
- 🔄 需要数据同步功能

---

## ⚠️ 重要提示

### 数据迁移注意事项

1. **从本地迁移到 Supabase**
   - 本地版本的数据不会自动迁移到 Supabase
   - 需要手动重新添加或编写迁移脚本
   - 建议先导出数据，再在新版本中导入

2. **从 Supabase 迁移到本地**
   - Supabase 的数据可以继续在云端保存
   - 切换到本地版本后，会创建新的本地数据
   - 原云端数据不受影响

### 混合使用（不推荐）

虽然两个版本可以切换，但**不建议频繁切换**，因为：
- 数据存储位置不同
- 可能导致数据不一致
- 容易产生混淆

**建议**：选择一个版本长期使用。

---

## 🛠️ 高级：数据导出/导入（开发中）

### 导出本地数据（script.js）

在浏览器控制台执行：
```javascript
// 导出当前用户的所有数据
const userData = JSON.parse(localStorage.getItem('userDatabase_' + currentUser));
const dataStr = JSON.stringify(userData, null, 2);
const blob = new Blob([dataStr], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-quotes-backup.json';
a.click();
```

### 导入数据（未来功能）

计划添加导入功能，可以：
- 从 JSON 文件导入数据
- 从本地版本迁移到 Supabase 版本
- 合并多个备份文件

---

## 📝 版本历史

- **v1.0** - 纯本地版本 (script.js)
- **v2.0** - Supabase 云端版本 (script-supabase.js)
  - 新增云端数据同步
  - 新增多设备支持
  - 保留本地缓存机制

---

## 💡 问题反馈

如果在版本切换过程中遇到问题：

1. 检查浏览器控制台的错误信息
2. 确认 HTML 文件中的脚本引用正确
3. 清除浏览器缓存后重试
4. 查看 [QUICKSTART.md](./QUICKSTART.md) 和 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

**选择最适合你的版本，享受阅读和记录的乐趣！** 📚✨
