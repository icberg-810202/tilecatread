// Netlify 部署专用配置文件
// 此文件将被上传到 GitHub，用于 Netlify 部署

const SUPABASE_CONFIG = {
    // Supabase 项目 URL
    url: 'https://kbdkorfekqvhfvcezwnj.supabase.co',
    
    // Supabase 匿名密钥（anon public key）
    // 注意：这是公开密钥，可以安全地包含在前端代码中
    // Supabase 的安全性由 Row Level Security (RLS) 策略保护
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZGtvcmZla3F2aGZ2Y2V6d25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NjkyNDMsImV4cCI6MjA3NjM0NTI0M30.dxAMSjA0dwxmNmtG0abJQYYGogMVF_TpJvL_mzy1mkw',
    
    // 可选配置
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

// 初始化函数
function initSupabase() {
    try {
        // 检查配置是否已填写
        if (SUPABASE_CONFIG.url === 'https://your-project-id.supabase.co' || 
            SUPABASE_CONFIG.anonKey === 'your-anon-key-here') {
            console.warn('⚠️ Supabase 配置未完成，将使用本地存储模式');
            console.warn('请在 supabase-config.js 中填写你的 Supabase 项目信息');
            return false;
        }
        
        // 检查 Supabase SDK 是否加载
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase SDK 未加载，请检查网络连接');
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

// 导出配置和客户端
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.initSupabase = initSupabase;
