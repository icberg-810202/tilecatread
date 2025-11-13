// ============================================
// Bwhisper - LeanCloud 集成版本
// ============================================

// LeanCloud 客户端实例
let leancloud = null;
let useLeanCloud = true;

// 当前用户信息
let currentUser = null;
let currentUserUid = null;
let currentUserToken = null;

// 本地数据缓存
let userDatabase = {};
let registeredUsers = {};

// 页面状态
let currentBookIndex = null;

// 验证码相关
let verificationCodes = {}; // 存储验证码 {phone: {code, expireTime}}
let sendCodeTimer = null;
let sendCodeCountdown = 0;

// 作者数据库（只读，用于启动页展示）
const authorDatabase = [
    { id: 1, book: '人间失格', author: '太宰治', quote: '我的不幸恰恰在于我缺乏拒绝的能力，我害怕一旦拒绝别人，便会在彼此心里留下永远无法愈合的裂痕。' },
    { id: 2, book: '小王子', author: '安托万·德·圣-埃克苏佩里', quote: '所有的大人都曾经是小孩，虽然，只有少数的人记得。' },
    { id: 3, book: '活着', author: '余华', quote: '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。' },
    { id: 4, book: '百年孤独', author: '加西亚·马尔克斯', quote: '过去都是假的，回忆是一条没有归途的路。' },
    { id: 5, book: '围城', author: '钱钟书', quote: '婚姻是一座围城，城外的人想进去，城里的人想出来。' }
];

// ============================================
// LeanCloud 数据库操作函数
// ============================================

/**
 * 检查LeanCloud是否可用
 */
function isLeanCloudAvailable() {
    return typeof AV !== 'undefined' && useLeanCloud;
}

/**
 * 用户注册（LeanCloud版本）
 */
async function leancloudRegister(username, password) {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        // 创建新用户
        const user = new AV.User();
        user.setUsername(username);
        user.setPassword(password);
        
        await user.signUp();
        
        console.log('✅ LeanCloud 用户注册成功:', username);
        return {
            id: user.id,
            username: user.getUsername()
        };
    } catch (error) {
        console.error('❌ LeanCloud 注册失败:', error);
        // 如果是用户名已存在的错误
        if (error.code === 202) {
            throw new Error('用户名已存在');
        }
        throw error;
    }
}

/**
 * 用户登录（LeanCloud版本）
 */
async function leancloudLogin(username, password) {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        const user = await AV.User.logIn(username, password);
        
        console.log('✅ LeanCloud 用户登录成功:', username);
        
        // 保存用户信息到 sessionStorage
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('userToken', user.getSessionToken());
        sessionStorage.setItem('userId', user.id);
        
        return {
            id: user.id,
            username: user.getUsername(),
            sessionToken: user.getSessionToken()
        };
    } catch (error) {
        console.error('❌ LeanCloud 登录失败:', error);
        throw error;
    }
}

/**
 * 用户登出（LeanCloud版本）
 */
async function leancloudLogout() {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        await AV.User.logOut();
        
        // 清除会话存储
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('userId');
        
        console.log('✅ LeanCloud 用户登出成功');
    } catch (error) {
        console.error('❌ LeanCloud 登出失败:', error);
        throw error;
    }
}

/**
 * 获取当前登录用户
 */
function getCurrentLeanCloudUser() {
    try {
        if (!isLeanCloudAvailable()) {
            return null;
        }
        
        return AV.User.current();
    } catch (error) {
        console.error('❌ 获取当前用户失败:', error);
        return null;
    }
}

/**
 * 保存书籍到 LeanCloud
 */
async function leancloudSaveBook(userId, book) {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        const Book = AV.Object.extend('Book');
        let bookObj;

        if (book.id) {
            // 更新现有书籍
            bookObj = AV.Object.createWithoutData('Book', book.id);
            bookObj.set('name', book.name);
            bookObj.set('author', book.author);
            bookObj.set('selected', book.selected || false);
            bookObj.set('userId', userId);
        } else {
            // 创建新书籍
            bookObj = new Book();
            bookObj.set('name', book.name);
            bookObj.set('author', book.author);
            bookObj.set('selected', book.selected || false);
            bookObj.set('userId', userId);
        }

        await bookObj.save();
        
        console.log('✅ 书籍已保存到 LeanCloud:', book.name);
        return {
            id: bookObj.id,
            ...bookObj.toJSON()
        };
    } catch (error) {
        console.error('❌ 保存书籍失败:', error);
        throw error;
    }
}

/**
 * 删除书籍（LeanCloud版本）
 */
async function leancloudDeleteBook(bookId) {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        const bookObj = AV.Object.createWithoutData('Book', bookId);
        await bookObj.destroy();
        
        console.log('✅ 书籍已从 LeanCloud 删除');
    } catch (error) {
        console.error('❌ 删除书籍失败:', error);
        throw error;
    }
}

/**
 * 保存语录到 LeanCloud
 */
async function leancloudSaveQuote(bookId, quote) {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        const Quote = AV.Object.extend('Quote');
        let quoteObj;

        if (quote.id) {
            // 更新现有语录
            quoteObj = AV.Object.createWithoutData('Quote', quote.id);
            quoteObj.set('text', quote.text);
            quoteObj.set('page', quote.page);
            quoteObj.set('tags', quote.tags);
            quoteObj.set('bookId', bookId);
        } else {
            // 创建新语录
            quoteObj = new Quote();
            quoteObj.set('text', quote.text);
            quoteObj.set('page', quote.page);
            quoteObj.set('tags', quote.tags);
            quoteObj.set('bookId', bookId);
        }

        await quoteObj.save();
        
        console.log('✅ 语录已保存到 LeanCloud');
        return {
            id: quoteObj.id,
            ...quoteObj.toJSON()
        };
    } catch (error) {
        console.error('❌ 保存语录失败:', error);
        throw error;
    }
}

/**
 * 删除语录（LeanCloud版本）
 */
async function leancloudDeleteQuote(quoteId) {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        const quoteObj = AV.Object.createWithoutData('Quote', quoteId);
        await quoteObj.destroy();
        
        console.log('✅ 语录已从 LeanCloud 删除');
    } catch (error) {
        console.error('❌ 删除语录失败:', error);
        throw error;
    }
}

/**
 * 从 LeanCloud 加载用户的所有书籍和语录
 */
async function leancloudLoadUserData(userId) {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        // 加载该用户的所有书籍
        const bookQuery = new AV.Query('Book');
        bookQuery.equalTo('userId', userId);
        const books = await bookQuery.find();

        // 加载所有语录
        const bookIds = books.map(b => b.id);
        let quotes = [];

        if (bookIds.length > 0) {
            const quoteQuery = new AV.Query('Quote');
            quoteQuery.containedIn('bookId', bookIds);
            quotes = await quoteQuery.find();
        }

        // 组装数据结构
        const userData = {
            books: books.map(book => ({
                id: book.id,
                name: book.get('name'),
                author: book.get('author'),
                selected: book.get('selected'),
                quotes: quotes
                    .filter(q => q.get('bookId') === book.id)
                    .map(q => ({
                        id: q.id,
                        text: q.get('text'),
                        page: q.get('page'),
                        tags: q.get('tags')
                    }))
            }))
        };

        console.log('✅ 从 LeanCloud 加载用户数据成功，书籍数:', userData.books.length);
        return userData;
    } catch (error) {
        console.error('❌ 从 LeanCloud 加载数据失败:', error);
        throw error;
    }
}

/**
 * 重置密码（LeanCloud版本）
 */
async function leancloudResetPassword(username, newPassword) {
    try {
        if (!isLeanCloudAvailable()) {
            throw new Error('LeanCloud 不可用');
        }

        // 查询用户
        const userQuery = new AV.Query(AV.User);
        userQuery.equalTo('username', username);
        const user = await userQuery.first();

        if (!user) {
            throw new Error('用户不存在');
        }

        // 更新密码
        user.setPassword(newPassword);
        await user.save();

        console.log('✅ 密码已重置');
        return true;
    } catch (error) {
        console.error('❌ 重置密码失败:', error);
        throw error;
    }
}

// ============================================
// 初始化检查
// ============================================

// 将useLeanCloud的判断程序支持到initLeanCloud函数中执行
if (typeof window !== 'undefined') {
    // ♥♥♥ 改进：待LeanCloud的initLeanCloud完成后，就会useLeanCloud设置为true
    // 客户端应用一上来就是默认按照useLeanCloud = true来启动（第7行）
    console.log('[script-leancloud.js] 当前 useLeanCloud =', useLeanCloud);
}
