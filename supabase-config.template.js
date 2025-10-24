// Supabase 配置模板
// 使用说明：
// 1. 复制此文件并重命名为 supabase-config.js
// 2. 填入你自己的 Supabase URL 和 API Key
// 3. 不要将 supabase-config.js 上传到 GitHub

const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL',  // 例如: https://xxxxx.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY',  // 从 Supabase 项目设置中获取
    options: {
        auth: {
            persistSession: false
        }
    }
};

// 验证配置
function initSupabase() {
    if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
        console.error('❌ 请先配置 Supabase URL');
        return false;
    }
    
    if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('❌ 请先配置 Supabase API Key');
        return false;
    }
    
    console.log('✅ Supabase 配置验证通过');
    return true;
}
