-- ============================================
-- 阅随心动应用 - Supabase 数据库初始化脚本
-- ============================================
-- 说明：请在 Supabase 控制台的 SQL Editor 中执行此脚本
-- 路径：Supabase Dashboard -> SQL Editor -> New Query
-- ============================================

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

COMMENT ON TABLE users IS '用户信息表';
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.username IS '用户名（唯一）';
COMMENT ON COLUMN users.password_hash IS '密码哈希值';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';

-- ============================================

-- 2. 创建书籍表
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  author TEXT DEFAULT '未知作者',
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_selected ON books(selected);

COMMENT ON TABLE books IS '书籍信息表';
COMMENT ON COLUMN books.id IS '书籍唯一标识';
COMMENT ON COLUMN books.user_id IS '所属用户ID';
COMMENT ON COLUMN books.name IS '书籍名称';
COMMENT ON COLUMN books.author IS '作者';
COMMENT ON COLUMN books.selected IS '是否在启动页显示';
COMMENT ON COLUMN books.created_at IS '创建时间';
COMMENT ON COLUMN books.updated_at IS '更新时间';

-- ============================================

-- 3. 创建语录表
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  page TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_quotes_book_id ON quotes(book_id);

COMMENT ON TABLE quotes IS '语录信息表';
COMMENT ON COLUMN quotes.id IS '语录唯一标识';
COMMENT ON COLUMN quotes.book_id IS '所属书籍ID';
COMMENT ON COLUMN quotes.text IS '语录内容';
COMMENT ON COLUMN quotes.page IS '页码';
COMMENT ON COLUMN quotes.tags IS '标签数组';
COMMENT ON COLUMN quotes.created_at IS '创建时间';
COMMENT ON COLUMN quotes.updated_at IS '更新时间';

-- ============================================

-- 4. 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- ============================================

-- 5. 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at 
  BEFORE UPDATE ON books
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at 
  BEFORE UPDATE ON quotes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 6. 创建 RLS 策略（暂时允许公开访问，因为我们使用简单的密码验证）
-- 注意：实际生产环境建议使用 Supabase Auth

-- users 表策略
DROP POLICY IF EXISTS "Allow public read access" ON users;
CREATE POLICY "Allow public read access" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON users;
CREATE POLICY "Allow public insert access" ON users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON users;
CREATE POLICY "Allow public update access" ON users
  FOR UPDATE USING (true);

-- books 表策略
DROP POLICY IF EXISTS "Allow public read access" ON books;
CREATE POLICY "Allow public read access" ON books
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON books;
CREATE POLICY "Allow public insert access" ON books
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON books;
CREATE POLICY "Allow public update access" ON books
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access" ON books;
CREATE POLICY "Allow public delete access" ON books
  FOR DELETE USING (true);

-- quotes 表策略
DROP POLICY IF EXISTS "Allow public read access" ON quotes;
CREATE POLICY "Allow public read access" ON quotes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON quotes;
CREATE POLICY "Allow public insert access" ON quotes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON quotes;
CREATE POLICY "Allow public update access" ON quotes
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access" ON quotes;
CREATE POLICY "Allow public delete access" ON quotes
  FOR DELETE USING (true);

-- ============================================

-- 7. 创建一些辅助视图（可选）

-- 用户书籍统计视图
CREATE OR REPLACE VIEW user_book_stats AS
SELECT 
  u.id AS user_id,
  u.username,
  COUNT(DISTINCT b.id) AS total_books,
  COUNT(DISTINCT CASE WHEN b.selected THEN b.id END) AS selected_books,
  COUNT(q.id) AS total_quotes
FROM users u
LEFT JOIN books b ON u.id = b.user_id
LEFT JOIN quotes q ON b.id = q.book_id
GROUP BY u.id, u.username;

COMMENT ON VIEW user_book_stats IS '用户书籍和语录统计视图';

-- ============================================

-- 8. 插入测试数据（可选 - 仅用于测试）
-- 如果你想要插入一些测试数据，取消下面的注释

/*
-- 插入测试用户
INSERT INTO users (username, password_hash) VALUES 
  ('testuser', 'hashed_5f4dcc3b5aa765d61d8327deb882cf99');

-- 获取测试用户ID
DO $$
DECLARE
  test_user_id UUID;
  test_book_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM users WHERE username = 'testuser';
  
  -- 插入测试书籍
  INSERT INTO books (user_id, name, author, selected) VALUES 
    (test_user_id, '活着', '余华', true),
    (test_user_id, '百年孤独', '加西亚·马尔克斯', false)
  RETURNING id INTO test_book_id;
  
  -- 插入测试语录
  INSERT INTO quotes (book_id, text, page, tags) VALUES 
    (test_book_id, '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。', '第3页', ARRAY['人生', '哲理']);
END $$;
*/

-- ============================================
-- 初始化完成!
-- ============================================
-- 下一步：
-- 1. 在 supabase-config.js 中填写你的项目配置
-- 2. 在浏览器中打开 index.html
-- 3. 注册一个新用户开始使用
-- ============================================

SELECT '✅ 数据库初始化成功！' AS status;
