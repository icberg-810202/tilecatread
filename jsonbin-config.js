// ==========================================
// JSONbin.io 配置和初始化
// ==========================================

console.log('📝 jsonbin-config.js 已加载');

// JSONbin API 配置
const JSONBIN_CONFIG = {
    binId: '69168b8e43b1c97be9ac38f5',
    masterKey: '$2a$10$kOW7CBSxLf1xgZe/51Edk.Rrnr1fGu7FLPSiIVLF0eqY5IhuLhQr6',
    baseUrl: 'https://api.jsonbin.io/v3'
};

// 初始化 JSONbin
function initJSONbin() {
    console.log('✅ JSONbin 已初始化');
    console.log('🔐 Bin ID:', JSONBIN_CONFIG.binId);
    return true;
}

/**
 * 用户注册（JSONbin 版本）
 */
async function jsonbinRegister(username, password) {
    try {
        console.log('📝 开始 JSONbin 注册，用户名:', username);
        
        // 获取现有数据
        const existingData = await jsonbinGetData();
        
        // 检查用户是否已存在
        if (existingData.users && existingData.users[username]) {
            throw new Error('用户名已存在');
        }
        
        // 创建用户数据
        const userData = {
            username: username,
            password: password, // 实际应用中应该加密
            createdAt: new Date().toISOString(),
            books: []
        };
        
        // 创建新的数据结构
        const newData = {
            users: existingData.users || {},
            metadata: {
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        // 添加新用户
        newData.users[username] = userData;
        
        // 更新 JSONbin
        const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.masterKey
            },
            body: JSON.stringify(newData)
        });
        
        if (!response.ok) {
            throw new Error(`JSONbin 更新失败: ${response.status}`);
        }
        
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
        
        // 获取数据
        const data = await jsonbinGetData();
        
        // 检查用户是否存在
        const user = data.users && data.users[username];
        if (!user) {
            throw new Error('用户不存在');
        }
        
        // 验证密码
        if (user.password !== password) {
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
        return result.record || { users: {}, metadata: { version: '1.0' } };
    } catch (error) {
        console.error('❌ JSONbin 获取数据失败:', error);
        return { users: {}, metadata: { version: '1.0' } };
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
        
        // 合并数据
        existingData.users[username] = {
            ...existingData.users[username],
            ...userData,
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

console.log('✅ jsonbin-config.js 配置完成');
