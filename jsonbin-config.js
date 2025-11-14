// ==========================================
// JSONbin.io 配置和初始化
// ==========================================

console.log('📝 jsonbin-config.js 已加载');

// ==========================================
// 密码哈希和验证函数
// ==========================================

/**
 * 简单的密码哈希函数
 * 注意：这是前端哈希方案，仅作为临时安全措施
 * 后续应迁移至后端进行密码加密，以获得更高的安全性
 */
function hashPassword(password) {
    // 使用 Base64 编码 + 盐值
    // 实际应用中应该使用后端的 bcrypt 或其他安全哈希算法
    const salt = 'tilecatread_salt_2024';
    const combined = password + salt;
    return btoa(unescape(encodeURIComponent(combined)));
}

/**
 * 验证密码
 */
function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

// JSONbin API 配置
const JSONBIN_CONFIG = {
    binId: '69168b8e43b1c97be9ac38f5',
    masterKey: '$2a$10$kOW7CBSxLf1xgZe/51Edk.Rrnr1fGu7FLPSiIVLF0eqY5IhuLhQr6',
    baseUrl: 'https://api.jsonbin.io/v3'
};

/**
 * 验证 JSONBin 配置
 */
function validateJSONBinConfig() {
    console.log('🔍 验证 JSONBin 配置...');
    
    if (!JSONBIN_CONFIG.binId || JSONBIN_CONFIG.binId === 'YOUR_BIN_ID_HERE') {
        console.error('❌ 请先配置 JSONBin Bin ID');
        return false;
    }
    
    if (!JSONBIN_CONFIG.masterKey || JSONBIN_CONFIG.masterKey === 'YOUR_MASTER_KEY_HERE') {
        console.error('❌ 请先配置 JSONBin Master Key');
        return false;
    }
    
    console.log('✅ JSONBin 配置验证通过');
    console.log('   Bin ID:', JSONBIN_CONFIG.binId.substring(0, 8) + '...');
    return true;
}

// 初始化 JSONbin
function initJSONbin() {
    console.log('🔧 开始初始化 JSONbin...');
    
    // 验证配置
    if (!validateJSONBinConfig()) {
        console.error('💥 JSONBin 配置验证失败，请检查配置');
        return false;
    }
    
    console.log('✅ JSONbin 已初始化成功');
    console.log('🔐 Bin ID:', JSONBIN_CONFIG.binId);
    return true;
}

/**
 * 用户注册（JSONbin 版本）
 */
async function jsonbinRegister(username, password) {
    try {
        console.log('📝 开始 JSONbin 注册，用户名:', username);
        
        const existingData = await jsonbinGetData();
        
        // 检查用户是否已存在（嵌套式结构）
        if (existingData.users && existingData.users[username]) {
            throw new Error('用户名已存在');
        }
        
        // 创建用户数据（嵌套式结构）
        const userData = {
            username: username,
            password: hashPassword(password), // 加密密码
            createdAt: new Date().toISOString(),
            books: []
        };
        
        // 初始化数据结构
        if (!existingData.users) existingData.users = {};
        
        existingData.users[username] = userData;
        existingData.metadata = {
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        
        // 使用 jsonbinSaveFullData 保存完整数据
        await jsonbinSaveFullData(existingData);
        
        console.log('✅ JSONbin 用户注册成功:', username);
        return {
            id: username,
            username: username
        };
    } catch (error) {
        console.error('❌ JSONbin 注册失败:', error);
        throw error;
    }
}

/**
 * 用户登录（JSONbin 版本）
 */
async function jsonbinLogin(username, password) {
    try {
        console.log('📝 开始 JSONbin 登录，用户名:', username);
        
        const data = await jsonbinGetData();
        
        // 在嵌套式结构中查找用户
        const user = data.users && data.users[username];
        if (!user) {
            throw new Error('用户不存在');
        }
        
        // 验证密码
        if (!verifyPassword(password, user.password)) {
            throw new Error('密码错误');
        }
        
        console.log('✅ JSONbin 用户登录成功:', username);
        
        // 保存到 sessionStorage
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('userId', username);
        
        return {
            id: username,
            username: username
        };
    } catch (error) {
        console.error('❌ JSONbin 登录失败:', error);
        throw error;
    }
}

/**
 * 获取 JSONbin 数据
 */
async function jsonbinGetData() {
    try {
        const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.masterKey
            }
        });
        
        if (!response.ok) {
            console.warn('⚠️ 获取 JSONbin 数据失败，返回空数据结构');
            return { users: {}, metadata: { version: '1.0' } };
        }
        
        const result = await response.json();
        const data = result.record || { users: {}, metadata: { version: '1.0' } };
        
        // 🔍 调试：显示获取到的数据结构
        console.log('📊 JSONbin 数据结构:', {
            hasUsers: !!data.users,
            userCount: data.users ? Object.keys(data.users).length : 0,
            usernames: data.users ? Object.keys(data.users) : []
        });
        console.log('🔍 完整数据:', JSON.stringify(data, null, 2));
        
        return data;
    } catch (error) {
        console.error('❌ JSONbin 获取数据失败:', error);
        return { users: {}, metadata: { version: '1.0' } };
    }
}

/**
 * 保存完整数据到 JSONbin
 */
async function jsonbinSaveFullData(data) {
    try {
        console.log('💾 保存完整数据到 JSONbin');
        
        // 🔍 调试：显示将要保存的数据结构
        console.log('📊 将要俟存的数据结构:', {
            hasUsers: !!data.users,
            userCount: data.users ? Object.keys(data.users).length : 0,
            usernames: data.users ? Object.keys(data.users) : [],
            fullData: data  // 显示完整数据
        });
        console.log('🔍 将要保存的完整JSON:', JSON.stringify(data, null, 2));
        
        const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.masterKey
            },
            body: JSON.stringify(data)
        });
        
        console.log('📡 JSONbin 响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ JSONbin API 错误响应:', errorText);
            throw new Error(`JSONbin 保存失败: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ 数据已保存到 JSONbin，响应:', result);
        return result;
    } catch (error) {
        console.error('❌ JSONbin 保存失败:', error);
        throw error;
    }
}

/**
 * 保存用户书籍数据到 JSONbin
 */
async function jsonbinSaveUserData(username, userData) {
    try {
        console.log('💾 保存用户数据到 JSONbin:', username);
        
        // 获取现有数据
        const existingData = await jsonbinGetData();
        
        // 更新用户数据
        if (!existingData.users) {
            existingData.users = {};
        }
        
        if (!existingData.users[username]) {
            existingData.users[username] = {};
        }
        
        // 合并数据：保留原有的 password 字段，更新其他字段
        const preservedPassword = existingData.users[username].password;
        existingData.users[username] = {
            ...existingData.users[username],
            ...userData,
            username: username, // 确保 username 始终存在
            password: preservedPassword, // 保留原有密码
            lastUpdated: new Date().toISOString()
        };
        
        existingData.metadata = existingData.metadata || {};
        existingData.metadata.lastUpdated = new Date().toISOString();
        
        // 更新 JSONbin
        const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.masterKey
            },
            body: JSON.stringify(existingData)
        });
        
        if (!response.ok) {
            throw new Error(`JSONbin 更新失败: ${response.status}`);
        }
        
        console.log('✅ 用户数据已保存到 JSONbin');
        return true;
    } catch (error) {
        console.error('❌ JSONbin 保存数据失败:', error);
        throw error;
    }
}

/**
 * 加载用户数据从 JSONbin
 */
async function jsonbinLoadUserData(username) {
    try {
        console.log('📖 加载用户数据从 JSONbin:', username);
        
        const data = await jsonbinGetData();
        
        if (data.users && data.users[username]) {
            console.log('✅ 已加载用户数据');
            return data.users[username];
        } else {
            console.log('⚠️ 用户数据不存在，创建新数据');
            return {
                username: username,
                books: [],
                createdAt: new Date().toISOString()
            };
        }
    } catch (error) {
        console.error('❌ JSONbin 加载数据失败:', error);
        throw error;
    }
}

/**
 * 用户登出（JSONbin 版本）
 */
async function jsonbinLogout() {
    try {
        console.log('📋 JSONbin 用户登出');
        
        // 清除会话存储
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('userId');
        
        console.log('✅ JSONbin 用户登出成功');
    } catch (error) {
        console.error('❌ JSONbin 登出失败:', error);
        throw error;
    }
}

// 验证配置
// 此代码会在脚本加载时执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        validateJSONBinConfig();
    });
} else {
    // DOM 已经加载
    validateJSONBinConfig();
}

console.log('✅ jsonbin-config.js 配置完成');
