// ==================== LeanCloud 初始化 ====================
// 直接在script.js中初始化LeanCloud，不依赖外部config文件
try {
    if (typeof AV !== 'undefined') {
        console.log('LeanCloud SDK 已加载');
        
        // LeanCloud 配置
        const LEANCLOUD_CONFIG = {
            appId: 'EeNvUrhhjnQRJoRfMxqE8Qxh-MdYXbMMI',
            appKey: 'R3oHn9jLLOt88EgFqk9lSAc9',
            serverURL: 'https://eenvurhh.api.lncldglobal.com'
        };
        
        try {
            // 检查存储可用性
            let storageAvailable = true;
            try {
                const testKey = '__leancloud_test__';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
            } catch (e) {
                console.warn('⚠️  浏览器跟踪防护限制了存储访问，将使用内存存储');
                storageAvailable = false;
            }
            
            // 初始化 LeanCloud
            AV.init({
                appId: LEANCLOUD_CONFIG.appId,
                appKey: LEANCLOUD_CONFIG.appKey,
                serverURL: LEANCLOUD_CONFIG.serverURL,
                // 禁用缓存以避免跟踪防护问题
                disableCache: !storageAvailable
            });
            
            console.log('✅ LeanCloud 初始化成功');
            if (!storageAvailable) {
                console.warn('⚠️  存储限制已启用，将仅使用内存存储');
            }
        } catch (error) {
            console.error('❌ LeanCloud 初始化失败:', error);
        }
    } else {
        console.warn('⚠️  LeanCloud SDK 未加载，将仅使用本地存储');
    }
} catch (error) {
    console.error('❌ LeanCloud 初始化不可预料的错误:', error);
}

// ==================== 应用数据 ====================
// 简单的密码哈希函数（实际项目中建议使用专业的加密库如bcrypt）
function hashPassword(password) {
    // 这是一个简化的哈希实现，仅用于演示
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hashed_' + Math.abs(hash).toString(16);
}

// 密码强度检测函数
function checkPasswordStrength(password) {
    // 检查是否符合要求：至少8位，必须包含字母和数字
    const meetsRequirements = password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    
    if (!meetsRequirements) {
        return 0; // 不符合要求
    }
    
    // 额外的强度评分
    let strength = 2;
    
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

// 显示密码强度
function displayPasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const strengthContainer = document.getElementById('regPasswordStrength');
    
    if (!password) {
        strengthContainer.style.display = 'none';
        strengthText.textContent = '';
        return;
    }
    
    strengthContainer.style.display = 'block';
    const strength = checkPasswordStrength(password);
    
    // 清除之前的类
    strengthBar.className = '';
    
    // 检查是否符合基本要求
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        strengthBar.className = 'strength-weak';
        strengthText.textContent = '密码必须同时包含字母和数字';
        strengthText.style.color = '#ff4d4f';
    } else if (password.length < 6) {
        strengthBar.className = 'strength-weak';
        strengthText.textContent = '密码长度必须至少为6位';
        strengthText.style.color = '#ff4d4f';
    } else if (strength === 2) {
        strengthBar.className = 'strength-medium';
        strengthText.textContent = '密码符合基本要求';
        strengthText.style.color = '#faad14';
    } else if (strength === 3) {
        strengthBar.className = 'strength-medium';
        strengthText.textContent = '密码强度：中';
        strengthText.style.color = '#faad14';
    } else {
        strengthBar.className = 'strength-strong';
        strengthText.textContent = '密码强度：强';
        strengthText.style.color = '#52c41a';
    }
}

// 作者数据库（只读）
const authorDatabase = [
    { id: 1, book: '人间失格', author: '太宰治', quote: '我的不幸恰恰在于我缺乏拒绝的能力，我害怕一旦拒绝别人，便会在彼此心里留下永远无法愈合的裂痕。' },
    { id: 2, book: '小王子', author: '安托万·德·圣-埃克苏佩里', quote: '所有的大人都曾经是小孩，虽然，只有少数的人记得。' },
    { id: 3, book: '活着', author: '余华', quote: '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。' },
    { id: 4, book: '百年孤独', author: '加西亚·马尔克斯', quote: '过去都是假的，回忆是一条没有归途的路。' },
    { id: 5, book: '围城', author: '钱钟书', quote: '婚姻是一座围城，城外的人想进去，城里的人想出来。' }
];

// 移除COZE数据库依赖，使用纯本地存储方案
// const cozeConfig = {
//     apiKey: "pat_4azi8maCPkAPhyepZ0K8HhKSXKh9rbQhZwbdiuSvwrd9mE0NNXm3JxqlZrrg5QcO",
//     baseUrl: "https://api.coze.cn/open_api/v1"
// };

// 配置标志，用于快速切换数据存储模式
const STORAGE_CONFIG = {
    useLocalStorageOnly: false, // 设置为false表示使用LeanCloud云服务
    debug: true // 启用调试日志
};

// 用户认证和会话管理
let currentUserToken = null;
let sessionStorage = window.sessionStorage;

// 本地缓存的用户数据
let userDatabase = {};
// 当前用户的Firebase UID
let currentUserUid = null;

// 当前用户信息
let currentUser = null;
let countdown = 10; // 设置为10秒倒计时
let timer = null;
let currentBookIndex = null;

// 播放模式相关变量
let playbackSettings = {
    mode: 'random', // 'sequential'(顺序), 'random'(随机), 'single'(单条重复)
    selectedQuotes: [], // 选中的语录，存储{bookIndex, quoteIndex}
    currentIndex: 0 // 当前播放索引（用于顺序播放）
};

// 本地存储的用户数据库和注册用户信息 - 作为COZE数据库的后备
let registeredUsers = {};
// 从localStorage加载已注册用户信息
if (localStorage.getItem('registeredUsers')) {
    try {
        registeredUsers = JSON.parse(localStorage.getItem('registeredUsers'));
    } catch (e) {
        console.error('加载已注册用户信息失败:', e);
        registeredUsers = {};
    }
}

// 数据同步策略：
// 1. 尝试使用COZE API进行操作
// 2. COZE API失败时，使用本地存储作为后备
// 3. 实现本地存储和云端存储的数据同步机制

// 页面切换
function showPage(pageId) {
    console.log('切换到页面:', pageId);
    
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.add('hidden');
    });
    
    // 显示指定页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error('找不到页面:', pageId);
    }
}

// 跳转到登录页的全局函数
function goToLoginPage() {
    // 清除所有可能的定时器
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    
    // 直接操作DOM跳转到登录页
    const splashPage = document.getElementById('splashPage');
    const loginPage = document.getElementById('loginPage');
    
    if (splashPage) splashPage.classList.add('hidden');
    if (loginPage) loginPage.classList.remove('hidden');
    
    // 同时调用showPage函数确保其他功能正常
    if (typeof showPage === 'function') {
        showPage('loginPage');
    }
}

function showRandomQuote() {
    console.log('显示随机语录');
    
    // 检查是否有登录记录
    const lastUser = localStorage.getItem('lastLoginUser');
    
    if (lastUser && userDatabase[lastUser]) {
        // 加载用户的播放设置
        const savedSettings = loadPlaybackSettings(lastUser);
        
        // 如果有选中的语录，根据播放模式显示
        if (savedSettings.selectedQuotes && savedSettings.selectedQuotes.length > 0) {
            const userBooks = userDatabase[lastUser].books;
            let quoteToShow = null;
            
            switch (savedSettings.mode) {
                case 'sequential': // 顺序播放
                    const currentIndex = savedSettings.currentIndex || 0;
                    const selectedQuote = savedSettings.selectedQuotes[currentIndex];
                    if (selectedQuote && userBooks[selectedQuote.bookIndex] && 
                        userBooks[selectedQuote.bookIndex].quotes[selectedQuote.quoteIndex]) {
                        const book = userBooks[selectedQuote.bookIndex];
                        const quote = book.quotes[selectedQuote.quoteIndex];
                        quoteToShow = {
                            quote: typeof quote === 'string' ? quote : quote.text,
                            book: book.name,
                            author: book.author
                        };
                        
                        // 更新下次的索引
                        savedSettings.currentIndex = (currentIndex + 1) % savedSettings.selectedQuotes.length;
                        savePlaybackSettings(lastUser, savedSettings);
                    }
                    break;
                    
                case 'random': // 随机播放
                    const randomIndex = Math.floor(Math.random() * savedSettings.selectedQuotes.length);
                    const randomSelectedQuote = savedSettings.selectedQuotes[randomIndex];
                    if (randomSelectedQuote && userBooks[randomSelectedQuote.bookIndex] && 
                        userBooks[randomSelectedQuote.bookIndex].quotes[randomSelectedQuote.quoteIndex]) {
                        const book = userBooks[randomSelectedQuote.bookIndex];
                        const quote = book.quotes[randomSelectedQuote.quoteIndex];
                        quoteToShow = {
                            quote: typeof quote === 'string' ? quote : quote.text,
                            book: book.name,
                            author: book.author
                        };
                    }
                    break;
                    
                case 'single': // 单条重复
                    // 只显示第一条选中的语录
                    const singleQuote = savedSettings.selectedQuotes[0];
                    if (singleQuote && userBooks[singleQuote.bookIndex] && 
                        userBooks[singleQuote.bookIndex].quotes[singleQuote.quoteIndex]) {
                        const book = userBooks[singleQuote.bookIndex];
                        const quote = book.quotes[singleQuote.quoteIndex];
                        quoteToShow = {
                            quote: typeof quote === 'string' ? quote : quote.text,
                            book: book.name,
                            author: book.author
                        };
                    }
                    break;
            }
            
            if (quoteToShow) {
                document.getElementById('splashQuoteContent').textContent = `"${quoteToShow.quote}"`;
                document.getElementById('splashQuoteSource').textContent = `——《${quoteToShow.book}》`;
                console.log('显示选中的语录:', quoteToShow.book, '模式:', savedSettings.mode);
                return;
            }
        }
        
        // 如果没有选中的语录，检查是否有选中的书籍
        const userBooks = userDatabase[lastUser].books;
        const selectedBooks = userBooks.filter(book => book.selected);
        const allQuotes = [];
        
        // 只从选中的书籍中获取语录
        selectedBooks.forEach(book => {
            if (book.quotes && book.quotes.length > 0) {
                book.quotes.forEach(quote => {
                    const quoteText = typeof quote === 'string' ? quote : quote.text;
                    allQuotes.push({
                        quote: quoteText,
                        book: book.name,
                        author: book.author
                    });
                });
            }
        });
        
        if (allQuotes.length > 0) {
            // 从选中的书籍语录中随机选择
            const randomIndex = Math.floor(Math.random() * allQuotes.length);
            const randomQuote = allQuotes[randomIndex];
            document.getElementById('splashQuoteContent').textContent = `"${randomQuote.quote}"`;
            document.getElementById('splashQuoteSource').textContent = `——《${randomQuote.book}》`;
            console.log('显示用户选中书籍的语录:', randomQuote.book);
            return;
        }
        
        // 如果没有选中的书籍，但从所有书籍中获取语录
        userBooks.forEach(book => {
            if (book.quotes && book.quotes.length > 0) {
                book.quotes.forEach(quote => {
                    const quoteText = typeof quote === 'string' ? quote : quote.text;
                    allQuotes.push({
                        quote: quoteText,
                        book: book.name,
                        author: book.author
                    });
                });
            }
        });
        
        if (allQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * allQuotes.length);
            const randomQuote = allQuotes[randomIndex];
            document.getElementById('splashQuoteContent').textContent = `"${randomQuote.quote}"`;
            document.getElementById('splashQuoteSource').textContent = `——《${randomQuote.book}》`;
            console.log('显示用户所有书籍的语录:', randomQuote.book);
            return;
        }
    }
    
    // 显示作者数据库语录（第一次登录或用户无语录）
    const randomIndex = Math.floor(Math.random() * authorDatabase.length);
    const randomQuote = authorDatabase[randomIndex];
    document.getElementById('splashQuoteContent').textContent = `"${randomQuote.quote}"`;
    document.getElementById('splashQuoteSource').textContent = `——《${randomQuote.book}》`;
    console.log('显示作者数据库语录:', randomQuote.book);
}

// 用户登录 - 优先使用COZE API，失败时降级到本地存储
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    // 检查是否使用本地存储模式
    if (STORAGE_CONFIG.useLocalStorageOnly) {
        console.log('使用本地登录功能');
        localLogin(username, password);
    } else {
        console.log('使用LeanCloud登录功能');
        loginUser(username, password)
            .then(result => {
                if (result.success) {
                    currentUserUid = result.data.id;
                    currentUser = username;  // 修复：将currentUser设置为用户名字符串而不是对象
                    console.log('✅ 登录成功，正在加载用户数据...');
                    
                    // 确保userDatabase对象存在并初始化当前用户数据
                    if (!userDatabase) {
                        userDatabase = {};
                    }
                    
                    // 确保当前用户数据结构存在
                    if (!userDatabase[username]) {
                        userDatabase[username] = {
                            books: []
                        };
                    }
                    
                    // 更新UI
                    document.getElementById('currentUser').textContent = username;
                    showPage('mainPage');
                    
                    // 渲染书籍列表
                    renderBooksGrid();
                    updateSelectionInfo();
                } else {
                    alert(result.message || '登录失败');
                }
            })
            .catch(error => {
                console.error('登录错误:', error);
                alert('登录过程中发生错误，请重试');
            });
    }
}

// 尝试COZE API登录，支持重试
function attemptCozeLogin(username, password, maxRetries, currentAttempt = 0) {
    return new Promise((resolve, reject) => {
        currentAttempt++;
        console.log(`尝试通过COZE API登录（第${currentAttempt}次），用户名:`, username);
        
        const loginEndpoint = `${cozeConfig.baseUrl}/auth/login`;
        
        fetch(loginEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cozeConfig.apiKey}`
            },
            body: JSON.stringify({
                username: username,
                password: password
            }),
            timeout: 10000 // 设置10秒超时
        })
        .then(response => {
            if (!response.ok) {
                const errorMessage = `COZE API请求失败，状态码: ${response.status}`;
                console.error(errorMessage);
                
                // 根据不同状态码提供更具体的错误信息
                if (response.status === 401) {
                    throw new Error('COZE API密钥无效或已过期');
                } else if (response.status === 404) {
                    throw new Error('COZE API端点不存在');
                } else if (response.status >= 500) {
                    // 服务器错误，考虑重试
                    throw new Error('COZE服务器暂时不可用');
                } else {
                    throw new Error(errorMessage);
                }
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 0 && data.data) {
                // COZE登录成功
                console.log('COZE API登录成功:', username);
                
                // 设置当前用户和token
                currentUser = username;
                currentUserUid = username;
                currentUserToken = data.data.token || 'mock_token_' + Date.now();
                
                // 从COZE数据库加载用户数据
                return loadUserDataFromCloud(username)
                    .then(cloudUserData => {
                        // 设置用户数据
                        if (cloudUserData) {
                            userDatabase[username] = cloudUserData;
                            // 同时保存到本地作为备份
                            saveUserLocalBackup(username, password, cloudUserData);
                        } else {
                            // 如果云端没有数据，尝试从本地加载
                            tryLoadUserDataFromLocal(username);
                        }
                        
                        // 保存会话信息
                        sessionStorage.setItem('username', username);
                        sessionStorage.setItem('userToken', currentUserToken);
                        
                        // 更新UI
                        document.getElementById('currentUser').textContent = username;
                        showPage('mainPage');
                        
                        // 渲染书籍列表
                        renderBooksGrid();
                        updateSelectionInfo();
                        
                        alert('登录成功！已连接到COZE云服务。');
                        resolve();
                    })
                    .catch(error => {
                        console.error('从COZE加载数据失败，尝试本地加载:', error);
                        // 失败时尝试从本地加载
                        if (tryLoadUserDataFromLocal(username)) {
                            // 保存会话信息
                            sessionStorage.setItem('username', username);
                            sessionStorage.setItem('userToken', currentUserToken);
                            
                            // 更新UI
                            document.getElementById('currentUser').textContent = username;
                            showPage('mainPage');
                            
                            // 渲染书籍列表
                            renderBooksGrid();
                            updateSelectionInfo();
                            
                            alert('登录成功，但无法同步云数据，使用本地数据。');
                            resolve();
                        } else {
                            throw new Error('无法加载用户数据');
                        }
                    });
            } else {
                // COZE返回错误
                const errorMsg = data.message || 'COZE登录失败';
                console.error('COZE登录失败:', errorMsg);
                throw new Error(errorMsg);
            }
        })
        .catch(error => {
            // 记录错误详情到控制台以便调试
            console.error(`COZE API登录错误 (尝试 ${currentAttempt}/${maxRetries}):`, error);
            
            // 如果还有重试次数且错误可能是临时性的，进行重试
            if (currentAttempt < maxRetries && 
                (error.message.includes('服务器') || 
                 error.message.includes('timeout') || 
                 error.message.includes('网络'))) {
                
                console.log(`将在1秒后重试登录...`);
                setTimeout(() => {
                    attemptCozeLogin(username, password, maxRetries, currentAttempt)
                        .then(resolve)
                        .catch(reject);
                }, 1000);
            } else {
                // 重试耗尽或错误不可能通过重试解决，降级到本地存储
                console.log(`COZE API登录最终失败，错误信息: ${error.message}，准备使用本地登录`);
                // 这里不直接调用localLogin，而是让上层处理
                reject(error);
            }
        });
    });
}

// 本地登录实现
function localLogin(username, password) {
    try {
        // 验证本地存储的用户名和密码
        if (registeredUsers && registeredUsers[username] === password) {
            console.log('本地登录验证成功');
            
            // 设置当前用户
            currentUser = username;
            currentUserUid = username;
            currentUserToken = 'local_token_' + Date.now();
            
            // 加载本地用户数据
            if (tryLoadUserDataFromLocal(username)) {
                // 保存会话信息
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('userToken', currentUserToken);
                
                // 更新UI
                document.getElementById('currentUser').textContent = username;
                showPage('mainPage');
                
                // 渲染书籍列表
                renderBooksGrid();
                updateSelectionInfo();
                
                // 提供更友好的提示，解释本地登录的原因
                alert('使用本地账号登录成功。提示：应用当前工作在离线模式，数据仅保存在本地设备上。');
            } else {
                alert('登录失败: 无法加载用户数据');
            }
        } else {
            alert('用户名或密码错误');
        }
    } catch (error) {
        console.error('本地登录过程出错:', error);
        alert('登录失败: ' + error.message);
    }
}

// 从COZE云数据库加载用户数据（支持重试）
function loadUserDataFromCloud(userId, maxRetries = 2) {
    return attemptLoadUserDataFromCloud(userId, maxRetries);
}

// 尝试从COZE云数据库加载用户数据，支持重试
function attemptLoadUserDataFromCloud(userId, maxRetries, currentAttempt = 0) {
    return new Promise((resolve, reject) => {
        currentAttempt++;
        const queryEndpoint = `${cozeConfig.baseUrl}/data/query`;
        console.log(`尝试从COZE数据库加载用户[${userId}]的数据（第${currentAttempt}次）`);
        
        // 添加AbortController支持超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn(`COZE API请求超时（${currentAttempt}/${maxRetries}）`);
        }, 10000); // 10秒超时
        
        fetch(queryEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUserToken || cozeConfig.apiKey}`
            },
            body: JSON.stringify({
                userId: userId,
                collection: 'users'
            }),
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId); // 清除超时计时器
            
            if (!response.ok) {
                const errorMessage = `COZE API请求失败，状态码: ${response.status}`;
                console.error(errorMessage);
                
                // 根据不同状态码提供更具体的错误信息
                if (response.status === 401) {
                    throw new Error('COZE API密钥无效或已过期');
                } else if (response.status === 404) {
                    throw new Error('COZE API端点不存在');
                } else if (response.status >= 500) {
                    // 服务器错误，考虑重试
                    throw new Error('COZE服务器暂时不可用');
                } else {
                    throw new Error(errorMessage);
                }
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 0 && data.data) {
                console.log(`成功从COZE数据库加载用户[${userId}]的数据`);
                resolve(data.data);
            } else {
                console.log(`COZE数据库中未找到用户[${userId}]的数据`);
                resolve(null);
            }
        })
        .catch(error => {
            clearTimeout(timeoutId); // 清除超时计时器
            
            // 记录错误详情到控制台以便调试
            console.error(`从COZE数据库加载用户[${userId}]数据失败 (尝试 ${currentAttempt}/${maxRetries}):`, error);
            
            // 处理超时错误
            if (error.name === 'AbortError') {
                error.message = '请求超时，请检查网络连接';
            }
            
            // 如果还有重试次数且错误可能是临时性的，进行重试
            if (currentAttempt < maxRetries && 
                (error.message.includes('服务器') || 
                 error.message.includes('timeout') || 
                 error.message.includes('网络') ||
                 error.message.includes('超时'))) {
                
                console.log(`将在1秒后重试加载数据...`);
                setTimeout(() => {
                    attemptLoadUserDataFromCloud(userId, maxRetries, currentAttempt)
                        .then(resolve)
                        .catch(reject);
                }, 1000);
            } else {
                // 重试耗尽或错误不可能通过重试解决
                console.log(`COZE API加载数据最终失败，错误信息: ${error.message}`);
                reject(error);
            }
        });
    });
}

// 尝试从本地加载用户数据
function tryLoadUserDataFromLocal(username) {
    try {
        const savedUserData = localStorage.getItem('userDatabase_' + username);
        if (savedUserData) {
            userDatabase[username] = JSON.parse(savedUserData);
            console.log('从本地存储加载用户数据成功');
            return true;
        } else {
            // 如果没有保存的数据，创建默认数据
            console.log('未找到保存的数据，创建默认用户数据');
            userDatabase[username] = {
                books: []
            };
            return true;
        }
    } catch (e) {
        console.error('加载用户数据失败:', e);
        // 创建默认数据作为后备
        userDatabase[username] = {
            books: []
        };
        return true;
    }
}

// 从COZE数据库加载用户数据
function loadUserData(userId) {
    fetch(`${cozeConfig.baseUrl}/data/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUserToken || cozeConfig.apiKey}`
        },
        body: JSON.stringify({
            userId: userId,
            collection: 'users'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 0 && data.data && data.data.userData) {
            // 用户数据存在
            const userData = data.data.userData;
            // 更新本地缓存
            userDatabase[currentUser] = userData;
            console.log('用户数据加载成功，包含书籍数:', userData.books ? userData.books.length : 0);
            
            // 渲染书籍列表
            renderBooksGrid();
            updateSelectionInfo();
        } else {
            // 用户数据不存在，创建默认数据
            console.log('用户数据不存在，创建默认数据');
            const defaultUserData = {
                books: []
            };
            
            // 保存默认数据到COZE数据库
            saveUserData(userId, defaultUserData)
                .then(() => {
                    userDatabase[currentUser] = defaultUserData;
                    renderBooksGrid();
                    updateSelectionInfo();
                })
                .catch((error) => {
                    console.error('创建默认数据失败:', error);
                    alert('初始化用户数据失败');
                });
        }
    })
    .catch(error => {
        console.error('加载用户数据失败:', error);
        alert('加载数据失败，请稍后重试');
    });
}

// 保存用户数据到COZE数据库的辅助函数
function saveUserData(userId, userData) {
    return fetch(`${cozeConfig.baseUrl}/data/save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUserToken || cozeConfig.apiKey}`
        },
        body: JSON.stringify({
            userId: userId,
            collection: 'users',
            data: userData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.code !== 0) {
            throw new Error(data.message || '保存数据失败');
        }
        return data;
    });
}

// 用户注册
function showRegister() {
    showPage('registerPage');
}

function backToLogin() {
    showPage('loginPage');
}

// 用户注册 - 优先使用COZE API，失败时降级到本地存储
function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    // 严格检查密码是否符合要求：必须同时包含字母和数字，且长度不少于6位
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        alert('密码必须同时包含字母和数字');
        return;
    }
    
    if (password.length < 6) {
        alert('密码长度必须至少为6位');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    // 根据配置决定使用本地存储还是LeanCloud注册
    if (!STORAGE_CONFIG.useLocalStorageOnly) {
        console.log('使用LeanCloud注册功能');
        registerUser(username, password)
            .then(user => {
                console.log('LeanCloud注册成功:', user);
                if (user.success) {
                    currentUserUid = user.data.id;
                    currentUser = username;  // 修复：将currentUser设置为用户名字符串而不是对象
                    // 初始化用户数据结构
                    if (!userDatabase) {
                        userDatabase = {};
                    }
                    userDatabase[currentUser] = {
                        books: []
                    };
                    // 保存到本地存储
                    try {
                        localStorage.setItem('userDatabase_' + currentUser, JSON.stringify(userDatabase[currentUser]));
                        console.log('用户数据已初始化并保存到本地');
                    } catch (e) {
                        console.error('保存用户数据失败:', e);
                    }
                    // 显示主界面
                    showPage('mainPage');
                } else {
                    throw new Error(user.message || '注册失败');
                }
            })
            .catch(error => {
                console.error('LeanCloud注册失败:', error);
                alert('注册失败: ' + error.message || '未知错误');
            });
    } else {
        console.log('使用本地注册功能');
        localRegister(username, password);
    }
}

// 尝试COZE API注册，支持重试
function attemptCozeRegister(username, password, maxRetries, currentAttempt = 0) {
    return new Promise((resolve, reject) => {
        currentAttempt++;
        console.log(`尝试通过COZE API注册（第${currentAttempt}次），用户名:`, username);
        
        const registerEndpoint = `${cozeConfig.baseUrl}/auth/register`;
        
        fetch(registerEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cozeConfig.apiKey}`
            },
            body: JSON.stringify({
                username: username,
                password: password
            }),
            timeout: 10000 // 设置10秒超时
        })
        .then(response => {
            if (!response.ok) {
                const errorMessage = `COZE API请求失败，状态码: ${response.status}`;
                console.error(errorMessage);
                
                // 根据不同状态码提供更具体的错误信息
                if (response.status === 401) {
                    throw new Error('COZE API密钥无效或已过期');
                } else if (response.status === 404) {
                    throw new Error('COZE API端点不存在');
                } else if (response.status === 409) {
                    throw new Error('用户名已被注册');
                } else if (response.status >= 500) {
                    // 服务器错误，考虑重试
                    throw new Error('COZE服务器暂时不可用');
                } else {
                    throw new Error(errorMessage);
                }
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 0 && data.data) {
                // COZE注册成功
                console.log('COZE API注册成功:', username);
                
                // 为新用户创建默认数据
                const newUserData = {
                    books: []
                };
                
                // 保存默认数据到COZE数据库
                return saveUserDataToCloud(username, newUserData)
                    .then(() => {
                        // 同时保存到本地作为备份
                        saveUserLocalBackup(username, password, newUserData);
                        
                        alert('注册成功！数据已同步到COZE云数据库。');
                        backToLogin();
                        resolve();
                    })
                    .catch((error) => {
                        console.error('COZE数据初始化失败，使用本地存储作为后备:', error);
                        // 失败时使用本地存储作为后备
                        saveUserLocalBackup(username, password, newUserData);
                        alert('注册成功，但无法同步云数据，数据已保存到本地。');
                        backToLogin();
                        resolve();
                    });
            } else {
                // COZE返回错误
                const errorMsg = data.message || 'COZE注册失败';
                console.error('COZE注册失败:', errorMsg);
                
                // 特殊处理用户名已存在的情况
                if (errorMsg.includes('存在') || errorMsg.includes('taken')) {
                    alert('用户名已被注册，请选择其他用户名');
                    // 用户名已存在错误不需要重试
                    reject(new Error('用户名已存在'));
                } else {
                    throw new Error(errorMsg);
                }
            }
        })
        .catch(error => {
            // 记录错误详情到控制台以便调试
            console.error(`COZE API注册错误 (尝试 ${currentAttempt}/${maxRetries}):`, error);
            
            // 如果是用户名已存在的错误，直接处理，不重试
            if (error.message.includes('已存在')) {
                alert('用户名已被注册，请选择其他用户名');
                reject(error);
                return;
            }
            
            // 如果还有重试次数且错误可能是临时性的，进行重试
            if (currentAttempt < maxRetries && 
                (error.message.includes('服务器') || 
                 error.message.includes('timeout') || 
                 error.message.includes('网络'))) {
                
                console.log(`将在1秒后重试注册...`);
                setTimeout(() => {
                    attemptCozeRegister(username, password, maxRetries, currentAttempt)
                        .then(resolve)
                        .catch(reject);
                }, 1000);
            } else {
                // 重试耗尽或错误不可能通过重试解决，降级到本地存储
                console.log(`COZE API注册最终失败，错误信息: ${error.message}，准备使用本地注册`);
                // 这里不直接调用localRegister，而是让上层处理
                reject(error);
            }
        });
    });
}

// 本地注册实现
function localRegister(username, password) {
    try {
        // 检查用户名在本地是否已存在
        if (registeredUsers && registeredUsers[username]) {
            alert('用户名已存在，请选择其他用户名');
            return;
        }
        
        // 为新用户创建默认数据
        const newUserData = {
            books: []
        };
        
        // 保存到本地存储
        saveUserLocalBackup(username, password, newUserData);
        
        // 提供更友好的提示，解释本地注册的原因
        alert('注册成功！由于网络原因，您的账号将使用本地存储模式。提示：应用当前工作在离线模式，数据仅保存在本地设备上。');
        backToLogin();
    } catch (error) {
        console.error('本地注册过程出错:', error);
        alert('注册失败: ' + error.message);
    }
}

// 将用户信息备份到本地存储
function saveUserLocalBackup(username, password, userData) {
    try {
        // 初始化存储对象
        if (!userDatabase) {
            userDatabase = {};
        }
        if (!registeredUsers) {
            registeredUsers = {};
        }
        
        // 存储用户数据
        userDatabase[username] = userData;
        registeredUsers[username] = password;
        
        // 保存到localStorage
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        localStorage.setItem('userDatabase_' + username, JSON.stringify(userData));
        
        console.log('用户信息已备份到本地存储');
    } catch (e) {
        console.error('保存用户本地备份失败:', e);
    }
}

// 保存用户数据到COZE云数据库（支持重试）
function saveUserDataToCloud(userId, userData, maxRetries = 2) {
    return attemptSaveUserDataToCloud(userId, userData, maxRetries);
}

// 尝试保存用户数据到COZE云数据库，支持重试
function attemptSaveUserDataToCloud(userId, userData, maxRetries, currentAttempt = 0) {
    return new Promise((resolve, reject) => {
        currentAttempt++;
        const saveEndpoint = `${cozeConfig.baseUrl}/data/save`;
        console.log(`尝试保存用户[${userId}]的数据到COZE数据库（第${currentAttempt}次）`);
        
        // 添加AbortController支持超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn(`COZE API保存请求超时（${currentAttempt}/${maxRetries}）`);
        }, 10000); // 10秒超时
        
        fetch(saveEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUserToken || cozeConfig.apiKey}`
            },
            body: JSON.stringify({
                userId: userId,
                collection: 'users',
                data: userData
            }),
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId); // 清除超时计时器
            
            if (!response.ok) {
                const errorMessage = `COZE API请求失败，状态码: ${response.status}`;
                console.error(errorMessage);
                
                // 根据不同状态码提供更具体的错误信息
                if (response.status === 401) {
                    throw new Error('COZE API密钥无效或已过期');
                } else if (response.status === 404) {
                    throw new Error('COZE API端点不存在');
                } else if (response.status >= 500) {
                    // 服务器错误，考虑重试
                    throw new Error('COZE服务器暂时不可用');
                } else {
                    throw new Error(errorMessage);
                }
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 0) {
                console.log(`成功保存用户[${userId}]的数据到COZE数据库`);
                resolve(data);
            } else {
                console.error(`保存用户[${userId}]数据到COZE数据库失败:`, data.message || '未知错误');
                throw new Error(data.message || '保存数据失败');
            }
        })
        .catch(error => {
            clearTimeout(timeoutId); // 清除超时计时器
            
            // 记录错误详情到控制台以便调试
            console.error(`保存用户[${userId}]数据到COZE数据库错误 (尝试 ${currentAttempt}/${maxRetries}):`, error);
            
            // 处理超时错误
            if (error.name === 'AbortError') {
                error.message = '保存请求超时，请检查网络连接';
            }
            
            // 如果还有重试次数且错误可能是临时性的，进行重试
            if (currentAttempt < maxRetries && 
                (error.message.includes('服务器') || 
                 error.message.includes('timeout') || 
                 error.message.includes('网络') ||
                 error.message.includes('超时'))) {
                
                console.log(`将在1秒后重试保存数据...`);
                setTimeout(() => {
                    attemptSaveUserDataToCloud(userId, userData, maxRetries, currentAttempt)
                        .then(resolve)
                        .catch(reject);
                }, 1000);
            } else {
                // 重试耗尽或错误不可能通过重试解决
                console.log(`COZE API保存数据最终失败，错误信息: ${error.message}`);
                reject(error);
            }
        });
    });
}

// 退出登录
function logout() {
    // 清除本地会话数据
    currentUserToken = null;
    currentUser = null;
    currentUserUid = null;
    
    // 清除会话存储
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('username');
    
    // 跳转到登录页
    showPage('loginPage');
    
    // 清空表单
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    console.log('用户已退出登录');
}

// 返回书库函数
function backToLibrary() {
    // 清空搜索框
    document.getElementById('searchInput').value = '';
    
    // 显示全部书籍
    renderBooksGrid();
    
    console.log('已返回书库，显示全部书籍');
}

// 搜索功能
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        alert('请输入搜索内容');
        return;
    }
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        alert('用户数据未初始化，请刷新页面重试');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    const filteredBooks = userBooks.filter(book => 
        book.name.toLowerCase().includes(searchTerm) || 
        book.author.toLowerCase().includes(searchTerm)
    );
    
    renderBooksGrid(filteredBooks);
    
    // 显示搜索结果的书籍数量
    const totalBooks = userBooks.length;
    const foundBooks = filteredBooks.length;
    
    if (foundBooks === 0) {
        alert(`搜索 "${searchTerm}" 没有找到相关书籍\n\n共 ${totalBooks} 本书籍`);
    } else {
        console.log(`搜索完成：找到 ${foundBooks} 本书籍`);
    }
}

// 更新选择信息提示
function updateSelectionInfo() {
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.warn('用户数据未初始化');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    const selectedBooks = userBooks.filter(book => book && book.selected);
    const infoElement = document.getElementById('selectionInfo');
    
    if (infoElement) {
        if (selectedBooks.length > 0) {
            const selectedBookNames = selectedBooks.map(book => `《${book.name}》`).join('、');
            infoElement.innerHTML = `✅ 已选择 ${selectedBooks.length} 本书籍：${selectedBookNames}<br><small>启动页将显示选中书籍的随机语录</small>`;
        } else {
            infoElement.innerHTML = `📚 共 ${userBooks.length} 本书籍<br><small>勾选书籍，启动页将显示选中书籍的语录</small>`;
        }
    }
}

// 切换书籍选择状态
function toggleBookSelection(bookIndex, event) {
    event.stopPropagation();
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    if (!userBooks[bookIndex]) {
        console.error('书籍不存在');
        return;
    }
    
    userBooks[bookIndex].selected = !userBooks[bookIndex].selected;
    
    saveUserDatabase();
    renderBooksGrid();
    updateSelectionInfo();
}

// 显示编辑书籍模态框
function showEditBookModal(bookIndex) {
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    const book = userBooks[bookIndex];
    
    if (!book) {
        console.error('书籍不存在');
        return;
    }
    
    document.getElementById('editBookIndex').value = bookIndex;
    document.getElementById('editBookName').value = book.name || '';
    document.getElementById('editBookAuthor').value = book.author || '';
    document.getElementById('editBookModal').classList.remove('hidden');
}

// 关闭编辑书籍模态框
function closeEditBookModal() {
    document.getElementById('editBookModal').classList.add('hidden');
}

// 保存书籍编辑
function saveBookEdit() {
    const index = parseInt(document.getElementById('editBookIndex').value);
    const name = document.getElementById('editBookName').value.trim();
    const author = document.getElementById('editBookAuthor').value.trim();
    
    if (!name) {
        alert('请输入书籍名称');
        return;
    }
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        alert('数据错误，请刷新页面重试');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    if (!userBooks[index]) {
        console.error('书籍不存在');
        alert('书籍数据错误，请刷新页面重试');
        return;
    }
    
    // 更新书籍信息
    const book = userBooks[index];
    book.name = name;
    book.author = author || '未知作者';
    // 移除封面URL设置
    
    saveUserDatabase();
    closeEditBookModal();
    renderBooksGrid();
    updateSelectionInfo();
}

// 书籍管理
function renderBooksGrid(filteredBooks = null) {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.warn('用户数据未初始化');
        userDatabase[currentUser] = { books: [] };
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    const booksToRender = filteredBooks || userBooks;
    const isSearching = filteredBooks !== null;
    
    // 添加搜索状态提示
    if (isSearching && booksToRender.length > 0) {
        const searchInfo = document.createElement('div');
        searchInfo.style.cssText = 'width: 100%; text-align: center; color: #666; margin-bottom: 10px; font-size: 14px;';
        searchInfo.textContent = `找到 ${booksToRender.length} 本书籍`;
        grid.appendChild(searchInfo);
    }
    
    if (booksToRender.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.style.cssText = 'text-align: center; color: #666; width: 100%; padding: 40px;';
        
        if (isSearching) {
            emptyMessage.innerHTML = `
                <div style="font-size: 3em; margin-bottom: 10px;">🔍</div>
                <p>没有找到相关书籍</p>
                <p style="font-size: 12px; margin-top: 10px;">点击"返回书库"查看全部书籍</p>
            `;
        } else {
            emptyMessage.innerHTML = `
                <div style="font-size: 3em; margin-bottom: 10px;">📚</div>
                <p>暂无书籍，点击添加第一本书</p>
            `;
        }
        
        grid.appendChild(emptyMessage);
        return;
    }
    // 修改书籍渲染逻辑，移除封面URL的使用
    booksToRender.forEach((book, index) => {
        // 确保book对象存在
        if (!book) return;
        
        const actualIndex = isSearching ? 
            userBooks.findIndex(b => b && b.name === book.name && b.author === book.author) : 
            index;
            
        const bookCard = document.createElement('div');
        bookCard.className = `book-card ${book.selected ? 'selected' : ''}`;
        
        // 统一使用默认图标，不再使用书籍封面
        const bookIcon = '<div class="book-icon">📚</div>';
            
        bookCard.innerHTML = `
            <input type="checkbox" class="book-selection" ${book.selected ? 'checked' : ''} 
                   onclick="toggleBookSelection(${actualIndex}, event)">
            <div class="book-actions">
                <button class="delete-book-btn" onclick="deleteBook(${actualIndex}, event)">×</button>
                <button class="edit-book-btn" onclick="showEditBookModal(${actualIndex}, event)">✏️</button>
            </div>
            <div class="book-content">
                ${bookIcon}
                <div class="book-title">${book.name || '未知书名'}</div>
                <div class="book-author">${book.author || '未知作者'}</div>
                <div class="quote-count">${book.quotes ? book.quotes.length : 0} 条语录</div>
            </div>
        `;
        
        bookCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-book-btn') && 
                !e.target.classList.contains('edit-book-btn') &&
                !e.target.classList.contains('book-selection')) {
                goToQuotesPage(actualIndex);
            }
        });
        
        grid.appendChild(bookCard);
    });
}

function goToQuotesPage(bookIndex) {
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    const book = userBooks[bookIndex];
    
    if (!book) {
        console.error('书籍不存在');
        return;
    }
    
    currentBookIndex = bookIndex;
    document.getElementById('currentBookTitle').textContent = book.name || '未知书名';
    showPage('quotesPage');
    renderQuotesList();
}

function backToMain() {
    showPage('mainPage');
    renderBooksGrid();
    updateSelectionInfo();
}

// 添加书籍
function showAddBookModal() {
    document.getElementById('addBookModal').classList.remove('hidden');
}

function closeAddBookModal() {
    document.getElementById('addBookModal').classList.add('hidden');
    document.getElementById('newBookName').value = '';
    document.getElementById('newBookAuthor').value = '';
    // 移除封面URL和上传相关代码
}

function addNewBook() {
    const name = document.getElementById('newBookName').value.trim();
    const author = document.getElementById('newBookAuthor').value.trim();
    
    if (!name) {
        alert('请输入书籍名称');
        return;
    }
    
    const newBook = {
        name: name,
        author: author || '未知作者',
        quotes: [],
        selected: false
    };
    
    // 确保userDatabase[currentUser]存在
    if (!userDatabase[currentUser]) {
        userDatabase[currentUser] = {
            books: []
        };
    }
    
    if (!STORAGE_CONFIG.useLocalStorageOnly && currentUserUid) {
        // 使用LeanCloud存储
        console.log('使用LeanCloud添加书籍');
        // 修复：使用正确的LeanCloud函数
        addBook(currentUserUid, name, author)
            .then(result => {
                if (result.success) {
                    console.log('书籍添加成功:', result);
                    // 更新本地数据
                    userDatabase[currentUser].books.push(newBook);
                    saveUserDatabase();
                    closeAddBookModal();
                    renderBooksGrid();
                    updateSelectionInfo();
                } else {
                    console.error('书籍添加失败:', result.message);
                    alert('添加书籍失败: ' + result.message);
                }
            })
            .catch(error => {
                console.error('书籍添加失败:', error);
                alert('添加书籍失败: ' + error.message || '未知错误');
            });
    } else {
        // 使用本地存储
        userDatabase[currentUser].books.push(newBook);
        saveUserDatabase();
        closeAddBookModal();
        renderBooksGrid();
        updateSelectionInfo();
    }
}

// 删除书籍
function deleteBook(bookIndex, event) {
    event.stopPropagation();
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    const book = userBooks[bookIndex];
    
    if (!book) {
        console.error('书籍不存在');
        return;
    }
    
    if (confirm(`确定要删除《${book.name}》吗？`)) {
        userBooks.splice(bookIndex, 1);
        saveUserDatabase();
        renderBooksGrid();
        updateSelectionInfo();
    }
}

// 显示编辑语录模态框
function showEditQuoteModal(bookIndex, quoteIndex, event) {
    if (event) event.stopPropagation();
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    const book = userBooks[bookIndex];
    
    if (!book) {
        console.error('书籍不存在');
        return;
    }
    
    const quotes = book.quotes || [];
    const quote = quotes[quoteIndex];
    
    if (!quote) {
        console.error('语录不存在');
        return;
    }
    
    // 处理可能是字符串的旧格式语录
    const quoteObj = typeof quote === 'string' ? 
        { text: quote, page: null, tags: null } : quote;
    
    document.getElementById('editQuoteIndex').value = quoteIndex;
    document.getElementById('editQuoteText').value = quoteObj.text || '';
    document.getElementById('editQuotePage').value = quoteObj.page || '';
    document.getElementById('editQuoteTag').value = (quoteObj.tags && quoteObj.tags.join(', ')) || '';
    
    document.getElementById('editQuoteModal').classList.remove('hidden');
}

// 关闭编辑语录模态框
function closeEditQuoteModal() {
    document.getElementById('editQuoteModal').classList.add('hidden');
}

// 保存语录编辑
function saveQuoteEdit() {
    const quoteIndex = parseInt(document.getElementById('editQuoteIndex').value);
    const text = document.getElementById('editQuoteText').value.trim();
    const page = document.getElementById('editQuotePage').value.trim();
    const tagsInput = document.getElementById('editQuoteTag').value.trim();
    
    if (!text) {
        alert('请输入语录内容');
        return;
    }
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        alert('数据错误，请刷新页面重试');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    if (!userBooks[currentBookIndex]) {
        console.error('书籍不存在');
        alert('书籍数据错误，请刷新页面重试');
        return;
    }
    
    const quotes = userBooks[currentBookIndex].quotes || [];
    if (!quotes[quoteIndex]) {
        console.error('语录不存在');
        alert('语录数据错误，请刷新页面重试');
        return;
    }
    
    // 处理标签
    const tags = tagsInput ? tagsInput.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag) : [];
    
    // 更新语录为对象格式
    const updatedQuote = {
        text: text,
        page: page || null,
        tags: tags.length > 0 ? tags : null
    };
    
    quotes[quoteIndex] = updatedQuote;
    saveUserDatabase();
    closeEditQuoteModal();
    renderQuotesList();
}

// 语录管理
function renderQuotesList() {
    const list = document.getElementById('quotesList');
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    const book = userBooks[currentBookIndex];
    
    if (!book) {
        console.error('书籍不存在');
        return;
    }
    
    list.innerHTML = '';
    
    const quotes = book.quotes || [];
    if (quotes.length === 0) {
        list.innerHTML = '<div class="quote-item">暂无语录</div>';
        return;
    }
    
    quotes.forEach((quote, index) => {
        // 处理可能是字符串的旧格式语录
        const quoteObj = typeof quote === 'string' ? 
            { text: quote, page: null, tags: null } : quote;
            
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-item';
        
        // 构建页码和标签HTML
        let metadataHTML = '';
        if (quoteObj.page || (quoteObj.tags && quoteObj.tags.length > 0)) {
            metadataHTML += '<div class="quote-metadata">';
            if (quoteObj.page) {
                metadataHTML += `<div class="quote-page">页码: ${quoteObj.page}</div>`;
            }
            if (quoteObj.tags && quoteObj.tags.length > 0) {
                const tagsHTML = quoteObj.tags.map(tag => 
                    `<span class="quote-tag">${tag}</span>`
                ).join(' ');
                metadataHTML += `<div class="quote-tags">${tagsHTML}</div>`;
            }
            metadataHTML += '</div>';
        }
        
        quoteItem.innerHTML = `
            <div class="quote-text">"${quoteObj.text || '无内容'}"</div>
            ${metadataHTML}
            <div class="quote-actions">
                <button class="edit-quote-btn" onclick="showEditQuoteModal(${currentBookIndex}, ${index}, event)">编辑</button>
                <button class="delete-quote-btn" onclick="deleteQuote(${index})">删除</button>
            </div>
        `;
        list.appendChild(quoteItem);
    });
}

function showAddQuoteModal() {
    document.getElementById('addQuoteModal').classList.remove('hidden');
}

function closeAddQuoteModal() {
    document.getElementById('addQuoteModal').classList.add('hidden');
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuotePage').value = '';
    document.getElementById('newQuoteTag').value = '';
}

function addNewQuote() {
    const text = document.getElementById('newQuoteText').value.trim();
    const page = document.getElementById('newQuotePage').value.trim();
    const tagsInput = document.getElementById('newQuoteTag').value.trim();
    
    if (!text) {
        alert('请输入语录内容');
        return;
    }
    
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        alert('数据错误，请刷新页面重试');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    if (!userBooks[currentBookIndex]) {
        console.error('书籍不存在');
        alert('书籍数据错误，请刷新页面重试');
        return;
    }
    
    // 处理标签
    const tags = tagsInput ? tagsInput.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag) : [];
    
    if (!userBooks[currentBookIndex].quotes) {
        userBooks[currentBookIndex].quotes = [];
    }
    
    // 创建新语录对象
    const newQuote = {
        text: text,
        page: page || null,
        tags: tags.length > 0 ? tags : null
    };
    
    if (!STORAGE_CONFIG.useLocalStorageOnly && currentUserUid) {
        // 使用LeanCloud存储
        console.log('使用LeanCloud添加语录');
        const book = userBooks[currentBookIndex];
        // 修复：使用正确的LeanCloud函数
        addQuote(book.id || 'unknown', text, page, tags)
            .then(result => {
                if (result.success) {
                    console.log('语录添加成功:', result);
                    // 更新本地数据
                    userBooks[currentBookIndex].quotes.push(newQuote);
                    saveUserDatabase();
                    closeAddQuoteModal();
                    renderQuotesList();
                } else {
                    console.error('语录添加失败:', result.message);
                    alert('添加语录失败: ' + result.message);
                }
            })
            .catch(error => {
                console.error('语录添加失败:', error);
                alert('添加语录失败: ' + error.message || '未知错误');
            });
    } else {
        // 使用本地存储
        userBooks[currentBookIndex].quotes.push(newQuote);
        saveUserDatabase();
        closeAddQuoteModal();
        renderQuotesList();
    }
}

function deleteQuote(quoteIndex) {
    // 确保用户数据存在
    if (!userDatabase || !userDatabase[currentUser]) {
        console.error('用户数据未初始化');
        return;
    }
    
    const userBooks = userDatabase[currentUser].books || [];
    if (!userBooks[currentBookIndex]) {
        console.error('书籍不存在');
        return;
    }
    
    const quotes = userBooks[currentBookIndex].quotes || [];
    
    if (confirm('确定要删除这条语录吗？')) {
        quotes.splice(quoteIndex, 1);
        saveUserDatabase();
        renderQuotesList();
    }
}

// 保存用户数据库 - 同时保存到COZE云数据库和本地存储
function saveUserDatabase() {
    if (!currentUser) {
        console.log('用户未登录，无法保存数据');
        return;
    }
    
    console.log('保存用户数据，用户名:', currentUser);
    
    // 确保userDatabase对象存在
    if (!userDatabase) {
        userDatabase = {};
    }
    
    // 确保当前用户数据存在
    if (!userDatabase[currentUser]) {
        userDatabase[currentUser] = {
            books: []
        };
    }
    
    const userData = userDatabase[currentUser];
    
    // 直接保存到本地存储
    try {
        localStorage.setItem('userDatabase_' + currentUser, JSON.stringify(userData));
        console.log('用户数据已保存到本地存储');
    } catch (error) {
        console.error('用户数据保存失败:', error);
        alert('保存数据失败，请稍后重试');
    }
}

// 全局变量，用于倒计时控制


// 跳转到登录页的全局函数
function goToLoginPage() {
    // 清除所有可能的定时器
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    
    // 直接操作DOM跳转到登录页
    const splashPage = document.getElementById('splashPage');
    const loginPage = document.getElementById('loginPage');
    
    if (splashPage) splashPage.classList.add('hidden');
    if (loginPage) loginPage.classList.remove('hidden');
    
    // 同时调用showPage函数确保其他功能正常
    if (typeof showPage === 'function') {
        showPage('loginPage');
    }
}

// 显示随机语录函数
function displayRandomQuote() {
    console.log('📖 displayRandomQuote 函数被调用');
    
    try {
        // 使用默认语录
        const defaultQuotes = [
            {
                content: "阅读是一座随身携带的避难所。",
                source: "毛姆"
            },
            {
                content: "书中自有黄金屋，书中自有颜如玉。",
                source: "《增广贤文》"
            },
            {
                content: "读书破万卷，下笔如有神。",
                source: "杜甫"
            },
            {
                content: "书籍是人类进步的阶梯。",
                source: "高尔基"
            }
        ];
        
        const randomQuote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
        console.log('📖 选中的语录:', randomQuote.content);
        
        const quoteContent = document.getElementById('splashQuoteContent');
        const quoteSource = document.getElementById('splashQuoteSource');
        
        console.log('📖 quoteContent 元素:', quoteContent ? '找到' : '未找到');
        console.log('📖 quoteSource 元素:', quoteSource ? '找到' : '未找到');
        
        if (quoteContent) {
            quoteContent.textContent = randomQuote.content;
            console.log('✅ 已设置语录内容:', randomQuote.content);
        } else {
            console.error('❌ 找不到 splashQuoteContent 元素');
        }
        
        if (quoteSource) {
            quoteSource.textContent = `—— ${randomQuote.source}`;
            console.log('✅ 已设置语录来源:', `—— ${randomQuote.source}`);
        } else {
            console.error('❌ 找不到 splashQuoteSource 元素');
        }
    } catch (error) {
        console.error('❌ displayRandomQuote 执行失败:', error);
        // 出错时使用默认语录
        const quoteContent = document.getElementById('splashQuoteContent');
        const quoteSource = document.getElementById('splashQuoteSource');
        
        if (quoteContent) {
            quoteContent.textContent = "阅读是一座随身携带的避难所。";
            console.log('✅ 已设置默认语录内容');
        }
        if (quoteSource) {
            quoteSource.textContent = "—— 毛姆";
            console.log('✅ 已设置默认语录来源');
        }
    }
}

// 最简化的倒计时函数（保留作为后备）
function startCountdown() {
    console.log('===== 开始倒计时 =====');
    console.log('当前时间:', new Date().toLocaleTimeString());
    
    // 获取倒计时元素
    const countdownElement = document.getElementById('countdown');
    console.log('倒计时元素是否存在:', countdownElement ? '存在' : '不存在');
    
    if (!countdownElement) {
        console.error('❌ 无法找到倒计时元素 #countdown');
        return;
    }
    
    // 重置倒计时变量
    countdown = 10;
    countdownElement.textContent = '10';
    console.log('✅ 初始值已设置为 10');
    
    // 使用setInterval实现倒计时
    let intervalId = setInterval(function() {
        countdown--;
        countdownElement.textContent = countdown.toString();
        console.log('⏱️  倒计时:', countdown);
        
        if (countdown <= 0) {
            // 倒计时结束，清除定时器
            clearInterval(intervalId);
            console.log('✅ 倒计时结束，跳转到登录页');
            goToLoginPage();
        }
    }, 1000);
    
    // 保存intervalId以便需要时可以清除
    window.countdownInterval = intervalId;
    console.log('✅ 倒计时已启动，间隔ID:', intervalId);
    
    // 绝对保障：无论如何，11秒后强制跳转
    setTimeout(function() {
        console.log('🔒 安全保障：11秒已过，强制跳转到登录页');
        if (window.countdownInterval) {
            clearInterval(window.countdownInterval);
        }
        goToLoginPage();
    }, 11000);
}

// 初始化 - 修复关键问题
window.onload = function() {
    console.log('=== window.onload 已调用 ===');
    console.log('页面加载完成，开始初始化');
    console.log('当前时间:', new Date().toLocaleTimeString());
    
    // 重置倒计时变量
    countdown = 10;
    timer = null; // 重置定时器变量
    
    // 初始化用户数据和注册用户信息
    if (!registeredUsers) {
        try {
            const savedUsers = localStorage.getItem('registeredUsers');
            registeredUsers = savedUsers ? JSON.parse(savedUsers) : {};
            console.log('已从本地存储加载注册用户信息');
        } catch (e) {
            console.error('加载注册用户信息失败:', e);
            registeredUsers = {};
        }
    }
    
    // 检查会话存储中是否有登录信息
    const savedUsername = sessionStorage.getItem('username');
    const savedToken = sessionStorage.getItem('userToken');
    
    if (savedUsername) {
        // 用户已登录（有会话信息）
        console.log('用户已登录（会话信息）:', savedUsername);
        currentUser = savedUsername;
        currentUserToken = savedToken;
        currentUserUid = savedUsername; // 使用用户名作为用户ID
        
        // 确保userDatabase对象存在并初始化当前用户数据
        if (!userDatabase) {
            userDatabase = {};
        }
        
        // 确保当前用户数据结构存在
        if (!userDatabase[savedUsername]) {
            userDatabase[savedUsername] = {
                books: []
            };
        }
        
        // 优化：优先从本地存储加载数据，快速启动应用
        try {
            const savedData = localStorage.getItem('userDatabase_' + savedUsername);
            if (savedData) {
                userDatabase[savedUsername] = JSON.parse(savedData);
                console.log('已从本地存储快速加载用户数据');
                
                // 立即更新UI
                if (document.getElementById('currentUser')) {
                    document.getElementById('currentUser').textContent = savedUsername;
                }
                if (typeof showPage === 'function') {
                    showPage('mainPage');
                }
                
                // 渲染书籍列表
                renderBooksGrid();
                updateSelectionInfo();
                
                // 异步尝试从COZE云服务更新数据（不阻塞UI）
                console.log('异步尝试从COZE云服务更新用户数据:', savedUsername);
                setTimeout(() => {
                    loadUserDataFromCloud(savedUsername)
                        .then(cloudUserData => {
                            if (cloudUserData && currentUser === savedUsername) { // 确保用户仍为同一用户
                                // 使用云端数据更新本地数据
                                userDatabase[savedUsername] = cloudUserData;
                                // 同时保存到本地作为备份
                                try {
                                    localStorage.setItem('userDatabase_' + savedUsername, JSON.stringify(cloudUserData));
                                    console.log('已从COZE云服务更新用户数据');
                                    // 重新渲染以显示最新数据
                                    renderBooksGrid();
                                    updateSelectionInfo();
                                } catch (e) {
                                    console.error('保存更新的用户数据到本地失败:', e);
                                }
                            }
                        })
                        // 从COZE更新数据功能已禁用
                        // .catch(error => {
                        //     console.error('从COZE更新数据失败（不影响使用）:', error);
                        //     // 忽略错误，继续使用本地数据
                        // });
                }, 1000); // 延迟1秒执行，确保UI已完全加载
            } else {
                // 本地没有数据，创建新的数据对象
                console.log('本地无数据，创建新的用户数据:', savedUsername);
                userDatabase[savedUsername] = {
                    books: []
                };
                console.log('已初始化用户数据');
                
                // 更新UI
                if (document.getElementById('currentUser')) {
                    document.getElementById('currentUser').textContent = savedUsername;
                }
                if (typeof showPage === 'function') {
                    showPage('mainPage');
                }
                
                // 渲染书籍列表
                renderBooksGrid();
                updateSelectionInfo();
            }
        } catch (error) {
            console.error('加载用户数据失败:', error);
            // 即使加载失败，也要确保UI可以正常显示
            if (document.getElementById('currentUser')) {
                document.getElementById('currentUser').textContent = savedUsername;
            }
            if (typeof showPage === 'function') {
                showPage('mainPage');
            }
            
            // 渲染书籍列表
            renderBooksGrid();
            updateSelectionInfo();
        }
    }
    
    if (!savedUsername) {
        // 用户未登录
        console.log('=== 用户未登录，准备显示启动页 ===');
        
        // 显示启动页
        console.log('显示启动页');
        
        // 直接操作DOM确保启动页显示
        const splashPage = document.getElementById('splashPage');
        const loginPage = document.getElementById('loginPage');
        const countdownElement = document.getElementById('countdown');
        const quoteContent = document.getElementById('splashQuoteContent');
        const quoteSource = document.getElementById('splashQuoteSource');
        
        // 确保显示启动页，隐藏登录页
        if (splashPage) splashPage.classList.remove('hidden');
        if (loginPage) loginPage.classList.add('hidden');
        
        // 同时调用showPage函数确保其他功能正常
        if (typeof showPage === 'function') {
            showPage('splashPage');
        }
        
        // 加载并显示随机语录
        function loadRandomQuote() {
            try {
                if (window.authorDatabase && authorDatabase.length > 0) {
                    const randomIndex = Math.floor(Math.random() * authorDatabase.length);
                    const quote = authorDatabase[randomIndex];
                    
                    if (quoteContent) {
                        quoteContent.textContent = quote.quote;
                    }
                    if (quoteSource) {
                        quoteSource.textContent = `${quote.book} - ${quote.author}`;
                    }
                    console.log('已加载语录:', quote.quote);
                } else {
                    console.error('语录数据库不存在或为空');
                    if (quoteContent) {
                        quoteContent.textContent = '书中自有黄金屋，书中自有颜如玉。';
                    }
                    if (quoteSource) {
                        quoteSource.textContent = '古训';
                    }
                }
            } catch (error) {
                console.error('加载语录失败:', error);
                if (quoteContent) {
                    quoteContent.textContent = '欢迎使用Bwhisper';
                }
                if (quoteSource) {
                    quoteSource.textContent = '——';
                }
            }
        }
        
        // 优先调用 displayRandomQuote，作为主要方案
        console.log('准备显示语录...');
        displayRandomQuote();
        console.log('语录已显示');
        
        // 如果 displayRandomQuote 没有设置内容，开始调用 loadRandomQuote 作为后备
        setTimeout(function() {
            if (!quoteContent.textContent || quoteContent.textContent.trim() === '') {
                console.log('语录内容为空，调用 loadRandomQuote...');
                loadRandomQuote();
            }
        }, 100);
        
        // 启动倒计时功能
        console.log('准备启动倒计时功能...');
        startCountdown();
        console.log('倒计时启动完毕');
    }
    
    // 添加跳过功能
    // 首先尝试使用quote-card作为点击区域
    const quoteCard = document.querySelector('.quote-card');
    if (quoteCard) {
        quoteCard.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            console.log('用户点击跳过倒计时');
            // 清除所有可能的定时器
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            goToLoginPage();
        });
    }
    
    // 同时为启动页添加点击跳过功能（作为后备）
    const splashPage = document.getElementById('splashPage');
    if (splashPage && !quoteCard) { // 只有在没有quoteCard时才添加，避免重复处理
        splashPage.addEventListener('click', function() {
            console.log('用户点击启动页跳过倒计时');
            // 清除所有可能的定时器
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            goToLoginPage();
        });
    }
    
    // 搜索回车键支持
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // 添加密码强度检测事件监听
    const regPasswordInput = document.getElementById('regPassword');
    if (regPasswordInput) {
        regPasswordInput.addEventListener('input', function() {
            displayPasswordStrength(this.value);
        });
    }
    
    // 移除封面上传相关的事件监听器
};

// 添加错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
});

