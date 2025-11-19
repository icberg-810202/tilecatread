// ==========================================
// 数据管理层 - dataManager.js
// 负责数据操作、缓存管理和错误处理
// ==========================================

console.log('📦 dataManager.js 已加载');

// ==========================================
// 安全的 LocalStorage 包装器（防止浏览器扩展干扰）
// ==========================================

const safeLocalStorage = {
    setItem: function(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn('⚠️ localStorage 不可用，使用内存存储:', error.message);
            // 使用内存作为后备
            this._memoryStorage = this._memoryStorage || {};
            this._memoryStorage[key] = value;
            return false;
        }
    },
    getItem: function(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn('⚠️ localStorage 不可用，使用内存读取:', error.message);
            this._memoryStorage = this._memoryStorage || {};
            return this._memoryStorage[key] || null;
        }
    },
    removeItem: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            this._memoryStorage = this._memoryStorage || {};
            delete this._memoryStorage[key];
        }
    },
    _memoryStorage: {}
};

class DataManager {
    constructor() {
        this.cacheKey = 'tilecatread_user_data';
        this.currentUser = null;
        this.initialized = false;
    }

    /**
     * 初始化数据管理器 - 增强版
     */
    async initialize() {
        console.log('🔧 初始化 DataManager...');
        
        try {
            // 验证 JSONbin 配置
            if (typeof validateJSONBinConfig !== 'function' || !validateJSONBinConfig()) {
                throw new Error('JSONbin 配置验证失败');
            }
            
            // 尝试恢复用户会话
            await this.restoreSession();
            
            this.initialized = true;
            console.log('✅ DataManager 初始化成功');
            return true;
        } catch (error) {
            console.error('❌ DataManager 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 恢复用户会话
     */
    async restoreSession() {
        console.log('🔍 尝试恢复用户会话...');
        
        try {
            // 获取本地缓存
            const cachedSession = this.getLocalCache();
            
            if (!cachedSession || !cachedSession.username) {
                console.log('⚠️ 没有有效的会话缓存');
                return false;
            }
            
            console.log('📄 找到缓存会话，恢复用户:', cachedSession.username);
            
            // 设置当前用户
            this.currentUser = {
                username: cachedSession.username,
                id: cachedSession.username // 北市结构源自用户名
            };
            
            console.log('✅ 用户会话已恢复:', cachedSession.username);
            return true;
        } catch (error) {
            console.warn('⚠️ 会话恢复失败:', error);
            this.currentUser = null;
            return false;
        }
    }

    /**
     * 用户注册
     */
    async registerUser(username, password) {
        console.log('📝 注册用户:', username);
        
        try {
            if (!username || !password) {
                throw new Error('用户名和密码不能为空');
            }

            // 调用 JSONbin API 注册（已包含保存完整用户数据）
            const result = await jsonbinRegister(username, password);
            
            // 加载刚注册的用户数据（从 JSONbin 读取）
            const userData = await jsonbinLoadUserData(username);
            
            // 保存到本地缓存
            this.saveLocalCache(username, userData);

            console.log('✅ 用户注册成功');
            return {
                success: true,
                user: result
            };
        } catch (error) {
            console.error('❌ 用户注册失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 用户登录
     */
    async authenticateUser(username, password) {
        console.log('🔐 验证用户:', username);
        
        try {
            if (!username || !password) {
                throw new Error('用户名和密码不能为空');
            }

            // 调用 JSONbin API 登录
            const result = await jsonbinLogin(username, password);
            
            // 加载用户数据
            const userData = await jsonbinLoadUserData(username);
            
            // 保存到本地缓存
            this.currentUser = result;
            this.saveLocalCache(username, userData);

            console.log('✅ 用户登录成功');
            return {
                success: true,
                user: result
            };
        } catch (error) {
            console.error('❌ 用户登录失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 用户登出
     */
    async logoutUser() {
        console.log('👋 用户登出');
        
        try {
            await jsonbinLogout();
            this.currentUser = null;
            this.clearLocalCache();
            
            console.log('✅ 用户已登出');
            return { success: true };
        } catch (error) {
            console.error('❌ 登出失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取用户书籍列表
     */
    async getUserBooks(userId) {
        console.log('📚 加载用户书籍:', userId);
        
        try {
            const userData = await jsonbinLoadUserData(userId);
            return userData.books || [];
        } catch (error) {
            console.error('❌ 加载书籍失败:', error);
            return [];
        }
    }

    /**
     * 添加新书籍
     */
    async addBook(userId, bookData) {
        console.log('➕ 添加书籍:', bookData.name);
        
        try {
            const userData = await jsonbinLoadUserData(userId);
            
            if (!userData.books) {
                userData.books = [];
            }

            // 创建新书籍对象
            const newBook = {
                id: `book_${Date.now()}`,
                name: bookData.name,
                author: bookData.author || '未知作者',
                quotes: [],
                selected: false,
                createdAt: new Date().toISOString()
            };

            userData.books.push(newBook);

            // 保存到 JSONbin
            await jsonbinSaveUserData(userId, userData);
            
            // 更新本地缓存
            this.saveLocalCache(userId, userData);

            console.log('✅ 书籍添加成功');
            return { success: true, book: newBook };
        } catch (error) {
            console.error('❌ 添加书籍失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取书籍语录
     */
    async getBookQuotes(bookId) {
        console.log('💬 加载语录:', bookId);
        
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const userData = await jsonbinLoadUserData(this.currentUser.id);
            const book = userData.books.find(b => b.id === bookId);
            
            return book ? (book.quotes || []) : [];
        } catch (error) {
            console.error('❌ 加载语录失败:', error);
            return [];
        }
    }

    /**
     * 添加语录
     */
    async addQuote(bookId, quoteData) {
        console.log('✍️ 添加语录');
        console.log('   书籍ID:', bookId);
        console.log('   当前用户:', this.currentUser);
        
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const userData = await jsonbinLoadUserData(this.currentUser.id);
            console.log('   按美数据已加载，用户书籍数:', userData.books ? userData.books.length : 0);
            console.log('   用户所有书籍ID:', userData.books.map(b => b.id));
            
            const book = userData.books.find(b => b.id === bookId);
            console.log('   查找结果:', book ? '✅ 找到' : '❌ 找不到');
            
            if (book) {
                console.log('   书籍信息:', { id: book.id, name: book.name, quotesCount: book.quotes ? book.quotes.length : 0 });
            }
            
            if (!book) {
                throw new Error('书籍不存在');
            }

            if (!book.quotes) {
                book.quotes = [];
            }

            const newQuote = {
                id: `quote_${Date.now()}`,
                text: quoteData.text,
                page: quoteData.page || '',
                tags: quoteData.tags || [],
                createdAt: new Date().toISOString()
            };

            book.quotes.push(newQuote);
            console.log('   语录已添加到书籍，始数量:', book.quotes.length);

            // 保存到 JSONbin
            await jsonbinSaveUserData(this.currentUser.id, userData);
            
            // 更新本地缓存
            this.saveLocalCache(this.currentUser.id, userData);

            console.log('✅ 语录添加成功');
            return { success: true, quote: newQuote };
        } catch (error) {
            console.error('❌ 添加语录失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 删除书籍
     */
    async deleteBook(bookId) {
        console.log('🗑️ 删除书籍:', bookId);
        
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const userData = await jsonbinLoadUserData(this.currentUser.id);
            userData.books = userData.books.filter(b => b.id !== bookId);

            await jsonbinSaveUserData(this.currentUser.id, userData);
            this.saveLocalCache(this.currentUser.id, userData);

            console.log('✅ 书籍已删除');
            return { success: true };
        } catch (error) {
            console.error('❌ 删除失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 更新书籍信息
     */
    async updateBook(bookId, bookData) {
        console.log('✏️ 更新书籍:', bookId);
        
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const userData = await jsonbinLoadUserData(this.currentUser.id);
            const book = userData.books.find(b => b.id === bookId);
            
            if (!book) {
                throw new Error('书籍不存在');
            }

            // 更新书籍信息
            if (bookData.name !== undefined) {
                book.name = bookData.name;
            }
            if (bookData.author !== undefined) {
                book.author = bookData.author;
            }
            book.updatedAt = new Date().toISOString();

            await jsonbinSaveUserData(this.currentUser.id, userData);
            this.saveLocalCache(this.currentUser.id, userData);

            console.log('✅ 书籍更新成功');
            return { success: true, book: book };
        } catch (error) {
            console.error('❌ 更新书籍失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 保存用户在某设备上的勾选书籍
     */
    async saveSelectedBooksForDevice(deviceId, selectedBookIds) {
        console.log('📱 保存设备选择:', deviceId);
        
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const userData = await jsonbinLoadUserData(this.currentUser.id);
            
            // 初始化设备选择记录
            if (!userData.deviceSelections) {
                userData.deviceSelections = {};
            }
            
            // 保存该设备上的选择
            userData.deviceSelections[deviceId] = {
                selectedBookIds: selectedBookIds,
                updatedAt: new Date().toISOString()
            };
            
            await jsonbinSaveUserData(this.currentUser.id, userData);
            console.log('✅ 设备选择已保存');
            return { success: true };
        } catch (error) {
            console.error('❌ 保存设备选择失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取用户在某设备上的勾选书籍
     * @param {string} deviceId - 设备ID
     * @param {string} userId - 用户ID（可选，如果不提供则使用当前登录用户）
     */
    async getSelectedBooksForDevice(deviceId, userId = null) {
        console.log('📱 获取设备选择:', deviceId, '用户ID:', userId);
        
        try {
            // 如果没有提供userId，使用当前登录的用户
            const targetUserId = userId || (this.currentUser ? this.currentUser.id : null);
            
            if (!targetUserId) {
                console.warn('⚠️ 没有指定用户ID且用户未登录，返回空选择');
                return [];
            }

            const userData = await jsonbinLoadUserData(targetUserId);
            console.log('📊 用户数据加载成功，userData.deviceSelections:', userData.deviceSelections);
            
            if (userData.deviceSelections && userData.deviceSelections[deviceId]) {
                const selectedIds = userData.deviceSelections[deviceId].selectedBookIds || [];
                console.log(`✅ 设备 ${deviceId} 的勾选书籍ID:`, selectedIds);
                return selectedIds;
            }
            
            console.log(`⚠️ 设备 ${deviceId} 没有保存的勾选记录`);
            return [];
        } catch (error) {
            console.error('❌ 获取设备选择失败:', error);
            return [];
        }
    }

    /**
     * 删除语录
     */
    async deleteQuote(bookId, quoteId) {
        console.log('🗑️ 删除语录:', quoteId);
        
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const userData = await jsonbinLoadUserData(this.currentUser.id);
            const book = userData.books.find(b => b.id === bookId);
            
            if (!book) {
                throw new Error('书籍不存在');
            }

            book.quotes = book.quotes.filter(q => q.id !== quoteId);

            await jsonbinSaveUserData(this.currentUser.id, userData);
            this.saveLocalCache(this.currentUser.id, userData);

            console.log('✅ 语录已删除');
            return { success: true };
        } catch (error) {
            console.error('❌ 删除失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 更新语录
     */
    async updateQuote(bookId, quoteId, quoteData) {
        console.log('✏️ 更新语录:', quoteId);
        
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const userData = await jsonbinLoadUserData(this.currentUser.id);
            const book = userData.books.find(b => b.id === bookId);
            
            if (!book) {
                throw new Error('书籍不存在');
            }

            const quoteIndex = book.quotes.findIndex(q => q.id === quoteId);
            if (quoteIndex === -1) {
                throw new Error('语录不存在');
            }

            // 更新语录内容
            book.quotes[quoteIndex] = {
                ...book.quotes[quoteIndex],
                text: quoteData.text,
                page: quoteData.page || '',
                tags: quoteData.tags || []
            };

            await jsonbinSaveUserData(this.currentUser.id, userData);
            this.saveLocalCache(this.currentUser.id, userData);

            console.log('✅ 语录已更新');
            return { success: true, quote: book.quotes[quoteIndex] };
        } catch (error) {
            console.error('❌ 更新失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 导出用户数据
     */
    async exportData() {
        console.log('💾 导出数据');
        
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const userData = await jsonbinLoadUserData(this.currentUser.id);
            const exportData = {
                username: this.currentUser.username,
                exportDate: new Date().toISOString(),
                data: userData
            };

            const jsonStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tilecatread_backup_${this.currentUser.username}_${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('✅ 数据已导出');
            return { success: true };
        } catch (error) {
            console.error('❌ 导出失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 导入用户数据
     */
    async importData(file) {
        console.log('📥 导入数据');
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (!importedData.data || !importedData.username) {
                        throw new Error('数据格式不正确');
                    }

                    if (!this.currentUser) {
                        throw new Error('用户未登录');
                    }

                    // 保存到 JSONbin
                    await jsonbinSaveUserData(this.currentUser.id, importedData.data);
                    
                    // 更新本地缓存
                    this.saveLocalCache(this.currentUser.id, importedData.data);

                    console.log('✅ 数据已导入');
                    resolve({ success: true });
                } catch (error) {
                    console.error('❌ 导入失败:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * 保存到本地缓存
     */
    saveLocalCache(username, userData) {
        try {
            const cacheData = {
                username: username,
                data: userData,
                timestamp: Date.now()
            };
            safeLocalStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
            console.log('💾 已保存本地缓存');
        } catch (error) {
            console.warn('⚠️ 本地缓存保存失败:', error);
        }
    }

    /**
     * 清除本地缓存
     */
    clearLocalCache() {
        try {
            safeLocalStorage.removeItem(this.cacheKey);
            console.log('🧹 本地缓存已清除');
        } catch (error) {
            console.warn('⚠️ 清除缓存失败:', error);
        }
    }

    /**
     * 获取本地缓存
     */
    getLocalCache() {
        try {
            const cached = safeLocalStorage.getItem(this.cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('⚠️ 读取缓存失败:', error);
            return null;
        }
    }
}

// 创建全局实例
const dataManager = new DataManager();

console.log('✅ dataManager.js 配置完成');
