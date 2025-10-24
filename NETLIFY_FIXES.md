# Netlify 部署修复说明

## 修复的问题

### 1. ✅ 启动页背景图片无法显示

**问题原因**：
- 使用了相对路径 `./images/background.jpg`
- Netlify 部署后，相对路径可能无法正确解析

**解决方案**：
- 将背景图片URL改为网床绝对路径：`https://s21.ax1x.com/2025/01/09/pVHAcp8.jpg`
- 修改文件：`style.css`
- 修改位置：
  - `#splashPage` 背景
  - `#loginPage, #registerPage` 背景

### 2. ✅ 用户刷新后启动页语录未个性化显示

**问题原因**：
- `showRandomQuote()` 函数优先读取 `sessionStorage.getItem('username')`
- 用户退出登录或刷新浏览器后，sessionStorage 被清空
- 导致无法识别之前登录过的用户，只显示默认语录

**期望效果**：
- **首次访问**（从未登录过）→ 显示默认语录（作者数据库）
- **已登录用户刷新**页面 → 显示该用户选中书籍的个性化语录
- **5个不同用户**分别登录 → 各自看到自己选中书籍的语录

**解决方案**：

#### 修改1：登录时保存 lastLoginUser
```javascript
// 在 login() 函数中添加
localStorage.setItem('lastLoginUser', username);
```

#### 修改2：退出登录时保存 lastLoginUser
```javascript
function logout() {
    // 保存当前用户到lastLoginUser，以便下次显示个性化启动页
    if (currentUser) {
        localStorage.setItem('lastLoginUser', currentUser);
    }
    // ... 其他退出逻辑
}
```

#### 修改3：优化 showRandomQuote() 逻辑
```javascript
function showRandomQuote() {
    // 优先从localStorage读取最后登录用户（跨浏览器会话持久化）
    const lastUser = localStorage.getItem('lastLoginUser') || sessionStorage.getItem('username');
    
    if (lastUser) {
        // 尝试加载该用户的数据
        if (!userDatabase[lastUser]) {
            const userData = loadLocalUserData(lastUser);
            if (userData) {
                userDatabase[lastUser] = userData;
            }
        }
    }
    
    if (lastUser && userDatabase[lastUser]) {
        // 显示该用户选中书籍的语录
        // ...
    } else {
        // 首次访问，显示默认语录
        // ...
    }
}
```

## 工作流程说明

### 场景1：用户A首次访问
1. 打开 `tilecatread.netlify.app`
2. localStorage中没有 `lastLoginUser`
3. 启动页显示**默认语录**（作者数据库）
4. 注册/登录后，`lastLoginUser = "userA"` 被保存
5. 添加书籍、语录，选中书籍
6. 退出登录（`lastLoginUser = "userA"` 保持）

### 场景2：用户A再次访问（刷新或重新打开）
1. 打开 `tilecatread.netlify.app`
2. localStorage中有 `lastLoginUser = "userA"`
3. 自动加载用户A的数据：`loadLocalUserData("userA")`
4. 启动页显示**用户A选中书籍的语录**
5. 10秒后跳转登录页

### 场景3：同一浏览器，5个用户轮流登录
- 用户A登录 → lastLoginUser = "userA" → 退出
- 用户B登录 → lastLoginUser = "userB" → 退出
- 用户C登录 → lastLoginUser = "userC" → 退出
- 用户D登录 → lastLoginUser = "userD" → 退出
- 用户E登录 → lastLoginUser = "userE" → 退出

**最后刷新页面时**：显示用户E的语录（最后登录的用户）

### 场景4：5个用户分别在不同设备/浏览器
- 设备1：用户A → 看到用户A的语录
- 设备2：用户B → 看到用户B的语录
- 设备3：用户C → 看到用户C的语录
- 设备4：用户D → 看到用户D的语录
- 设备5：用户E → 看到用户E的语录

## 数据存储机制

### localStorage 存储内容
```javascript
{
  "lastLoginUser": "userA",  // 最后登录的用户名
  "userDatabase_userA": {    // 用户A的数据
    "books": [
      {
        "name": "书名",
        "author": "作者",
        "selected": true,     // 是否在启动页显示
        "quotes": [...]
      }
    ]
  },
  "registeredUsers": {       // 所有注册用户
    "userA": "password_hash",
    "userB": "password_hash"
  }
}
```

### sessionStorage 存储内容（登录会话）
```javascript
{
  "username": "userA",
  "userToken": "xxx",
  "userId": "xxx"
}
```

## 测试步骤

### 本地测试
1. 启动本地HTTP服务器：
   ```powershell
   .\start-server.ps1
   ```

2. 注册用户A，添加书籍和语录，选中书籍

3. 退出登录

4. **刷新页面** → 应该看到用户A选中书籍的语录

5. 注册用户B，添加不同的书籍和语录，选中书籍

6. 退出登录

7. **刷新页面** → 应该看到用户B选中书籍的语录（而非用户A的）

### Netlify 部署测试
1. 上传修改后的文件到 GitHub

2. Netlify 自动部署

3. 访问 `https://tilecatread.netlify.app`

4. 重复上述本地测试步骤

5. 验证：
   - ✅ 背景图片正常显示
   - ✅ 首次访问显示默认语录
   - ✅ 登录后选中书籍，退出，刷新 → 显示个人语录
   - ✅ 多个用户各自看到自己的语录

## 技术要点

### 为什么使用 localStorage 而非 sessionStorage？
- **sessionStorage**：仅在当前浏览器标签页/会话有效，关闭标签页就清空
- **localStorage**：持久化存储，除非用户手动清除浏览器数据
- **选择原因**：需要跨会话记住用户，实现"上次登录用户"功能

### 为什么要加载用户数据？
```javascript
if (!userDatabase[lastUser]) {
    const userData = loadLocalUserData(lastUser);
    if (userData) {
        userDatabase[lastUser] = userData;
    }
}
```
- 启动页显示时，用户尚未登录，内存中没有用户数据
- 需要从 localStorage 读取用户数据到内存，才能显示个性化语录
- 这是一个**预加载**过程，不影响后续登录流程

### 隐私和安全说明
- 每个浏览器的 localStorage 是独立的
- 用户A在设备1登录，不会影响用户B在设备2的数据
- 如果使用公共电脑，建议退出登录并清除浏览器数据

## 文件修改清单

| 文件 | 修改内容 | 行数 |
|------|---------|------|
| `style.css` | 背景图片URL改为网床 | L32, L79 |
| `script-supabase.js` | 登录时保存 lastLoginUser | L606 |
| `script-supabase.js` | 退出时保存 lastLoginUser | L651-658 |
| `script-supabase.js` | 优化 showRandomQuote() | L1169-1253 |

## 版本信息

- 修复日期：2025-01-22
- 修复版本：v1.1
- 测试环境：Windows 11 + Chrome 120
- 部署平台：Netlify

---

**祝使用愉快！📚✨**
