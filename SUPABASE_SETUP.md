# Supabase 后台数据库集成指南

## 📋 目录
1. [前期准备](#前期准备)
2. [数据库设计](#数据库设计)
3. [配置步骤](#配置步骤)
4. [代码集成](#代码集成)
5. [功能说明](#功能说明)

---

## 🚀 前期准备

### 1. 注册 Supabase 账号
1. 访问 [Supabase官网](https://supabase.com)
2. 点击 "Start your project" 注册账号
3. 创建一个新项目（选择最近的区域，推荐选择新加坡或东京）
4. 设置项目名称和数据库密码（请记住这个密码）

### 2. 获取项目凭证
创建项目后，在项目设置中找到以下信息：
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

这两个信息将用于配置应用。

---

## 🗄️ 数据库设计

### 表结构

#### 1. users 表（用户信息）
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引提升查询性能
CREATE INDEX idx_users_username ON users(username);
```

#### 2. books 表（书籍信息）
```sql
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  author TEXT DEFAULT '未知作者',
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_selected ON books(selected);
```

#### 3. quotes 表（语录信息）
```sql
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  page TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_quotes_book_id ON quotes(book_id);
```

---

## ⚙️ 配置步骤

### 1. 在 Supabase 控制台创建表

1. 登录 Supabase 控制台
2. 进入 SQL Editor
3. 依次执行上述三个 CREATE TABLE 语句
4. 验证表已创建成功（在 Table Editor 中查看）

### 2. 配置行级安全策略（RLS）

为了保证数据安全，需要启用 RLS：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- users 表策略：用户可以查看和更新自己的信息
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- books 表策略：用户只能操作自己的书籍
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE id = auth.uid()
  ));

-- quotes 表策略：用户只能操作自己书籍的语录
CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (book_id IN (
    SELECT id FROM books WHERE user_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert own quotes" ON quotes
  FOR INSERT WITH CHECK (book_id IN (
    SELECT id FROM books WHERE user_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can update own quotes" ON quotes
  FOR UPDATE USING (book_id IN (
    SELECT id FROM books WHERE user_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete own quotes" ON quotes
  FOR DELETE USING (book_id IN (
    SELECT id FROM books WHERE user_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
  ));
```

### 3. 创建辅助函数

```sql
-- 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 💻 代码集成

### 1. 在 HTML 中引入 Supabase SDK

在 `index.html` 的 `<head>` 标签中添加：

```html
<!-- Supabase 客户端库 -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 2. 创建配置文件

创建 `supabase-config.js` 文件（见下一步）

### 3. 使用新的 `script-supabase.js`

用提供的新版 JavaScript 文件替换现有的 `script.js`

---

## 🎯 功能说明

### 主要功能
1. **用户认证**：使用 Supabase Auth 进行用户注册和登录
2. **数据同步**：所有数据自动同步到云端
3. **离线支持**：保留 localStorage 作为缓存，离线时也能使用
4. **实时更新**：可选择性启用实时数据同步

### 数据流程
1. 用户操作（添加/编辑/删除）
2. 先更新本地缓存（快速响应）
3. 异步同步到 Supabase（可靠存储）
4. 同步失败时回滚本地数据

### 优势
- ✅ 多设备数据同步
- ✅ 云端备份，数据不丢失
- ✅ 支持离线使用
- ✅ 安全的用户认证
- ✅ 可扩展的数据库设计

---

## 🔧 故障排除

### 常见问题

**Q: 无法连接到 Supabase？**
- 检查 Project URL 和 anon key 是否正确
- 确认网络连接正常
- 查看浏览器控制台的错误信息

**Q: 数据无法保存？**
- 检查 RLS 策略是否正确配置
- 确认用户已登录
- 查看 Supabase 控制台的日志

**Q: 想要清空数据重新开始？**
```sql
-- 在 SQL Editor 中执行
TRUNCATE users, books, quotes CASCADE;
```

---

## 📞 技术支持

- Supabase 官方文档: https://supabase.com/docs
- 项目 GitHub Issues: [创建你的仓库]
