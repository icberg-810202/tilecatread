// ==========================================
// 应用逻辑层 - script-jsonbin.js
// 负责应用初始化、页面导航和用户交互
// ==========================================

console.log('🚀 script-jsonbin.js 已加载');

let currentUser = null;
let currentBookId = null;
let currentBookIndex = null;  // 供 playback-controller.js 使用

/**
 * 应用初始化 - 增强版（包含完整的依赖检查）
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 初始化 TileCatRead 应用');
    
    try {
        // 第一步：检查 JSONbin 配置
        console.log('🔍 检查 JSONbin 配置...');
        if (typeof validateJSONBinConfig !== 'function') {
            throw new Error('validateJSONBinConfig 函数未找到，请检查 jsonbin-config.js 是否正常加载');
        }
        
        if (!validateJSONBinConfig()) {
            throw new Error('JSONbin 配置验证失败，请检查 Bin ID 和 Master Key 是否正确');
        }
        console.log('✅ JSONbin 配置验证成功');
        
        // 第二步：检查 dataManager 是否存在
        console.log('🔍 检查 dataManager 依赖...');
        if (typeof dataManager === 'undefined') {
            throw new Error('dataManager 未定义，请确保 dataManager.js 在 script-jsonbin.js 之前加载');
        }
        
        if (typeof dataManager.initialize !== 'function') {
            throw new Error('dataManager.initialize 方法未找到，一些必要的方法不存在');
        }
        console.log('✅ dataManager 依赖检查成功');
        
        // 第三步：初始化数据管理器
        console.log('🔧 初始化 dataManager...');
        await dataManager.initialize();
        console.log('✅ dataManager 初始化成功');
        
        // 第四步：检查本地缓存并恢复会话
        console.log('🔍 检查本地缓存...');
        const cachedData = dataManager.getLocalCache();
        if (cachedData && cachedData.username) {
            console.log('✅ 发现本地缓存用户:', cachedData.username);
            currentUser = { id: cachedData.username, username: cachedData.username };
            // 这里可以添加自动登录逻辑
        } else {
            console.log('⚠️ 没有本地缓存');
        }
        
        // 第五步：显示启动页
        console.log('🚀 显示启动页');
        showSplashPage();
        console.log('✅ 应用初始化完成');
        
        // 第六步：绑定登录页 Enter 键事件
        setupLoginEnterKey();
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        alert('应用初始化失败: ' + error.message);
    }
});

// ==========================================
// 页面导航函数
// ==========================================

/**
 * 显示指定页面
 */
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        console.log('📄 切换到页面:', pageId);
    } else {
        console.warn('⚠️ 找不到页面:', pageId);
    }
}

/**
 * 显示启动页
 */
async function showSplashPage() {
    showPage('splashPage');
    
    // 📚 显示语录（智能选择）
    await displaySplashQuote();
    
    // 启动倒计时（10秒）
    let countdown = 10;
    const countdownElement = document.getElementById('countdown');
    
    if (countdownElement) {
        countdownElement.textContent = countdown;
    }
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            showLoginPage();
        }
    }, 1000);
}

/**
 * 显示启动页语录（智能选择：用户勾选的语录 or 默认语录）
 */
async function displaySplashQuote() {
    console.log('📚 正在显示启动页语录...');
    
    const quoteContentElement = document.getElementById('splashQuoteContent');
    const quoteSourceElement = document.getElementById('splashQuoteSource');
    
    if (!quoteContentElement || !quoteSourceElement) {
        console.warn('⚠️ 找不到语录元素');
        return;
    }
    
    try {
        // 尝试获取用户信息
        const lastUser = localStorage.getItem('lastLoggedInUser');
        const deviceId = getDeviceId ? getDeviceId() : null;
        
        console.log('👤 上次登录的用户:', lastUser);
        console.log('📱 设备ID:', deviceId);
        
        let userQuote = null;
        
        // 如果有用户和设备ID，尝试获取用户勾选的语录
        if (lastUser && deviceId) {
            // 等待 getSplashQuote 函数加载（最多等待2秒）
            let attempts = 0;
            while (typeof getSplashQuote !== 'function' && attempts < 20) {
                console.log('⏳ 等待 playback-controller.js 加载...');
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (typeof getSplashQuote === 'function') {
                try {
                    console.log('✅ getSplashQuote 函数已加载，开始获取用户语录');
                    userQuote = await getSplashQuote(lastUser, deviceId);
                } catch (error) {
                    console.error('⚠️ 获取用户语录失败:', error);
                }
            } else {
                console.warn('⚠️ getSplashQuote 函数未加载，跳过用户语录获取');
            }
        }
        
        // 如果获取到用户语录，显示用户语录
        if (userQuote) {
            console.log('✅ 显示用户勾选的语录');
            quoteContentElement.textContent = userQuote.text;
            
            let sourceText = `—— 《${userQuote.bookName}》`;
            if (userQuote.author) {
                sourceText += ` ${userQuote.author}`;
            }
            if (userQuote.page) {
                sourceText += ` P${userQuote.page}`;
            }
            quoteSourceElement.textContent = sourceText;
            
            console.log('✅ 已显示用户语录:', userQuote.bookName);
            return;
        }
        
        // 否则显示默认语录
        console.log('📚 显示默认语录...');
        displayDefaultQuote();
        
    } catch (error) {
        console.error('⚠️ 显示语录失败:', error);
        // 失败时显示默认语录
        displayDefaultQuote();
    }
}

/**
 * 显示默认语录（用于启动页）
 */
function displayDefaultQuote() {
    console.log('📚 正在显示默认语录...');
    
    // 检查是否加载了默认语录库
    if (typeof getRandomDefaultQuote === 'function') {
        const quote = getRandomDefaultQuote();
        const quoteContentElement = document.getElementById('splashQuoteContent');
        const quoteSourceElement = document.getElementById('splashQuoteSource');
        
        if (quoteContentElement && quoteSourceElement) {
            quoteContentElement.textContent = quote.text;
            quoteSourceElement.textContent = `—— ${quote.author}`;
            console.log('✅ 已显示默认语录：', quote.author);
        } else {
            console.warn('⚠️ 找不到语录元素');
        }
    } else {
        console.warn('⚠️ 默认语录库未加载，跳过显示语录');
        // 显示默认文本
        const quoteContentElement = document.getElementById('splashQuoteContent');
        const quoteSourceElement = document.getElementById('splashQuoteSource');
        if (quoteContentElement && quoteSourceElement) {
            quoteContentElement.textContent = '欢迎使用 Bwhisper';
            quoteSourceElement.textContent = '—— 你的阅读笔记助手';
        }
    }
}

/**
 * 显示登录页
 */
function showLoginPage() {
    showPage('loginPage');
    clearLoginForm();
}

/**
 * 显示注册页
 */
function showRegisterPage() {
    showPage('registerPage');
    clearRegisterForm();
}

/**
 * 显示主页
 */
function showMainPage() {
    showPage('mainPage');
    if (currentUser) {
        const userElement = document.getElementById('currentUser');
        if (userElement) {
            userElement.textContent = currentUser.username;
        }
        
        // 初始化播放控制器（异步）
        if (typeof initPlaybackController === 'function') {
            initPlaybackController();
        }
    }
}

/**
 * 返回登录页
 */
function backToLogin() {
    showLoginPage();
}

/**
 * 返回主页
 */
function backToMain() {
    showPage('mainPage');
}

/**
 * 返回书籍管理
 */
function backToQuotes() {
    showPage('quotesPage');
}

/**
 * 显示注册页面
 */
function showRegister() {
    showRegisterPage();
}

/**
 * 显示忘记密码页面
 */
function showForgotPassword() {
    showPage('forgotPasswordStep1');
    clearForgotPasswordForm();
}

/**
 * 返回忘记密码第一步
 */
function backToStep1() {
    showPage('forgotPasswordStep1');
    clearForgotPasswordForm();
}

/**
 * 返回书库
 */
function backToLibrary() {
    showMainPage();
    clearSearchInput();
}

// ==========================================
// 用户认证函数
// ==========================================

/**
 * 用户登录
 */
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('请输入手机号和密码');
        return;
    }

    try {
        const result = await dataManager.authenticateUser(username, password);
        
        if (result.success) {
            currentUser = result.user;
            
            // 保存最后登录的用户名，用于启动页显示用户语录
            localStorage.setItem('lastLoggedInUser', currentUser.username || currentUser.id);
            console.log('✅ 已保存最后登录用户:', currentUser.username || currentUser.id);
            
            alert('登录成功！');
            await loadUserData();
            showMainPage();
        } else {
            alert(result.error || '登录失败');
        }
    } catch (error) {
        console.error('❌ 登录异常:', error);
        alert('登录失败: ' + error.message);
    }
}

/**
 * 用户注册
 */
async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (!username || !password || !confirmPassword) {
        alert('请填写所有字段');
        return;
    }

    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }

    if (!validatePassword(password)) {
        alert('密码必须至少6位，包含字母和数字');
        return;
    }

    try {
        const result = await dataManager.registerUser(username, password);
        
        if (result.success) {
            alert('注册成功！请登录');
            showLoginPage();
        } else {
            alert(result.error || '注册失败');
        }
    } catch (error) {
        console.error('❌ 注册异常:', error);
        alert('注册失败: ' + error.message);
    }
}

/**
 * 用户登出
 */
async function logout() {
    try {
        await dataManager.logoutUser();
        currentUser = null;
        alert('已退出登录');
        showLoginPage();
    } catch (error) {
        console.error('❌ 登出异常:', error);
        alert('登出失败: ' + error.message);
    }
}

// ==========================================
// 数据加载和显示
// ==========================================

/**
 * 加载用户数据
 */
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const books = await dataManager.getUserBooks(currentUser.id);
        renderBooks(books);
    } catch (error) {
        console.error('❌ 加载用户数据失败:', error);
    }
}

/**
 * 渲染书籍列表
 */
async function renderBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;
    
    if (!books || books.length === 0) {
        booksGrid.innerHTML = '<div class="empty-state">暂无书籍，点击“添加新书”开始记录</div>';
        return;
    }

    // 获取当前用户的勾选书籍列表
    const selectedBooks = await getSelectedBooks();
    
    // 获取播放设置，检查是否为单条重复模式
    const username = currentUser ? (currentUser.username || currentUser.id || currentUser) : null;
    console.log('👤 当前用户:', username);
    
    const settings = username && typeof loadPlaybackSettings === 'function' ? loadPlaybackSettings(username) : { mode: 'sequential', selectedQuotes: [] };
    console.log('🎵 播放设置:', settings);
    
    const isSingleMode = settings.mode === 'single';
    // 单条重复模式下，禁用所有书籍勾选框
    const disableAllBooks = isSingleMode;
    console.log(`📚 是否禁用书籍勾选框: ${disableAllBooks} (模式: ${settings.mode})`);
    
    booksGrid.innerHTML = '';
    books.forEach((book, index) => {
        const quoteCount = book.quotes ? book.quotes.length : 0;
        const isSelected = selectedBooks.includes(book.id);
        
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.style.cursor = 'pointer';
        // 点击书籍卡片进入语录管理
        bookCard.onclick = () => manageQuotes(book.id);
        bookCard.innerHTML = `
            <div class="book-checkbox" onclick="event.stopPropagation()">
                <input type="checkbox" 
                       id="book-${book.id}" 
                       ${isSelected ? 'checked' : ''} 
                       ${disableAllBooks ? 'disabled' : ''}
                       onchange="toggleBookSelection('${book.id}')">
            </div>
            <div class="book-icon">📚</div>
            <div class="book-info">
                <h3>${book.name}</h3>
                <p>${book.author}</p>
                <div class="book-stats">${quoteCount} 条语录</div>
            </div>
            <div class="book-actions">
                <button onclick="event.stopPropagation(); editBook('${book.id}')" class="btn-secondary">编辑</button>
                <button onclick="event.stopPropagation(); deleteBook('${book.id}')" class="btn-danger">删除</button>
            </div>
        `;
        booksGrid.appendChild(bookCard);
    });
}

// ==========================================
// 书籍管理函数
// ==========================================

/**
 * 添加新书籍
 */
async function addNewBook() {
    const name = document.getElementById('newBookName').value;
    const author = document.getElementById('newBookAuthor').value;

    if (!name || !author) {
        alert('请填写书籍名称和作者');
        return;
    }

    try {
        const result = await dataManager.addBook(currentUser.id, { name, author });
        
        if (result.success) {
            await loadUserData();
            closeAddBookModal();
            alert('书籍添加成功！');
        } else {
            alert(result.error || '添加失败');
        }
    } catch (error) {
        console.error('❌ 添加书籍失败:', error);
        alert('添加书籍失败: ' + error.message);
    }
}

/**
 * 删除书籍
 */
async function deleteBook(bookId) {
    if (!confirm('确定要删除这本书吗？')) {
        return;
    }

    try {
        const result = await dataManager.deleteBook(bookId);
        
        if (result.success) {
            await loadUserData();
            alert('书籍已删除');
        } else {
            alert(result.error || '删除失败');
        }
    } catch (error) {
        console.error('❌ 删除失败:', error);
        alert('删除失败: ' + error.message);
    }
}

/**
 * 编辑书籍
 */
async function editBook(bookId) {
    try {
        const books = await dataManager.getUserBooks(currentUser.id);
        const book = books.find(b => b.id === bookId);
        
        if (!book) {
            alert('未找到该书籍');
            return;
        }
        
        // 填充编辑模态框
        document.getElementById('editBookId').value = bookId;
        document.getElementById('editBookName').value = book.name || '';
        document.getElementById('editBookAuthor').value = book.author || '';
        
        // 显示编辑模态框
        const modal = document.getElementById('editBookModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('获取书籍信息失败:', error);
        alert('获取书籍信息失败: ' + error.message);
    }
}

/**
 * 显示模态框
 */
function showAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * 关闭模态框
 */
function closeAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    clearBookForm();
}

// ==========================================
// 书籍选择功能（用于启动页语录）
// ==========================================

/**
 * 生成设备ID（基于浏览器+OS+屏幕分辨率的唯一标识）
 */
function getDeviceId() {
    // 如果已经缓存了设备ID，直接返回
    const cachedId = localStorage.getItem('deviceId');
    if (cachedId) {
        return cachedId;
    }
    
    // 生成新的设备ID
    const userAgent = navigator.userAgent;
    const screenRes = `${screen.width}x${screen.height}`;
    const deviceId = 'device_' + Math.random().toString(36).substring(2, 11);
    
    // 缓存设备ID
    localStorage.setItem('deviceId', deviceId);
    console.log('📱 设备ID:', deviceId);
    return deviceId;
}

/**
 * 获取当前用户已勾选的书籍列表（多设备支持）
 */
async function getSelectedBooks() {
    try {
        if (!currentUser) {
            console.warn('⚠️ 没有登录用户');
            return [];
        }
        
        const deviceId = getDeviceId();
        console.log('📱 获取设备勾选书籍，设备ID:', deviceId, '用户ID:', currentUser.id);
        const selectedIds = await dataManager.getSelectedBooksForDevice(deviceId);
        console.log('📚 设备上的勾选书籍ID列表:', selectedIds);
        return selectedIds || [];
    } catch (error) {
        console.error('❗ 获取勾选书籍失败:', error);
        return [];
    }
}

/**
 * 保存用户勾选的书籍到云端（设备级别）
 */
async function saveSelectedBooks(bookIds) {
    try {
        if (!currentUser) {
            console.warn('⚠️ 用户未登录，无法保存到云端');
            return false;
        }
        
        const deviceId = getDeviceId();
        console.log('💾 保存勾选书籍到云端，用户:', currentUser.id, '设备:', deviceId);
        
        const result = await dataManager.saveSelectedBooksForDevice(deviceId, bookIds);
        
        if (result.success) {
            console.log('✅ 已保存勾选的书籍到云端:', bookIds);
            return true;
        } else {
            console.error('❗ 保存失败:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❗ 保存勾选书籍失败:', error);
        return false;
    }
}

/**
 * 切换书籍选择状态（修复版，防止数据覆盖）
 */
async function toggleBookSelection(bookId) {
    try {
        // 立即更新复选框状态，给用户即时反馈
        const checkbox = document.getElementById(`book-${bookId}`);
        const newCheckedState = checkbox ? checkbox.checked : false;
        
        console.log(newCheckedState ? '✅ 勾选书籍:' : '📖 取消勾选书籍:', bookId);
        
        // 重新从云端获取最新的勾选列表，避免使用过期缓存
        const deviceId = getDeviceId();
        const latestSelectedIds = await dataManager.getSelectedBooksForDevice(deviceId);
        const selectedBooks = [...(latestSelectedIds || [])];
        
        console.log('📚 当前最新勾选列表:', selectedBooks);
        
        const index = selectedBooks.indexOf(bookId);
        
        if (index > -1) {
            // 取消勾选
            selectedBooks.splice(index, 1);
            console.log('🔄 取消勾选后的列表:', selectedBooks);
        } else {
            // 勾选
            selectedBooks.push(bookId);
            console.log('🔄 勾选后的列表:', selectedBooks);
        }
        
        // 保存到云端（异步，不阻塞UI）
        const saveSuccess = await saveSelectedBooks(selectedBooks);
        
        if (!saveSuccess) {
            alert('保存失败，请检查网络连接');
            // 恢复复选框状态
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
            }
        } else {
            // 立即更新播放控制器的摘要信息（使用最新数据）
            if (typeof updateSelectionSummary === 'function') {
                updateSelectionSummary();
            }
        }
    } catch (error) {
        console.error('❗ 切换书籍选择失败:', error);
        alert('操作失败: ' + error.message);
    }
}

// ==========================================
// 语录管理函数
// ==========================================

/**
 * 管理书籍语录
 */
/**
 * 管理语录 - 增强版（集成播放控制器初始化）
 */
async function manageQuotes(bookId) {
    currentBookId = bookId;
    const books = await dataManager.getUserBooks(currentUser.id);
    const book = books.find(b => b.id === bookId);
    
    if (book) {
        const titleElement = document.getElementById('currentBookTitle');
        if (titleElement) {
            titleElement.textContent = `《${book.name}》 - 语录管理`;
        }
        
        // 🎯 设置 currentBookIndex 供播放控制器使用
        // playback-controller.js 需要这个全局变量
        currentBookIndex = books.findIndex(b => b.id === bookId);
        console.log('📖 设置 currentBookIndex:', currentBookIndex, '书籍ID:', bookId);
    }
    
    showPage('quotesPage');
    await renderQuotes();
    
    // 🎵 初始化播放控制器（异步）
    if (typeof initPlaybackController === 'function') {
        console.log('🎵 初始化播放控制器...');
        const initialized = await initPlaybackController();
        if (initialized) {
            console.log('✅ 播放控制器初始化成功');
        } else {
            console.warn('⚠️ 播放控制器初始化失败或跳过');
        }
    } else {
        console.warn('⚠️ initPlaybackController 函数未找到');
    }
}

/**
 * 渲染语录列表
 */
async function renderQuotes() {
    const quotesList = document.getElementById('quotesList');
    if (!quotesList) return;

    try {
        const quotes = await dataManager.getBookQuotes(currentBookId);
        
        if (!quotes || quotes.length === 0) {
            quotesList.innerHTML = '<div class="empty-state">暂无语录，点击“添加语录”开始记录</div>';
            return;
        }

        // 获取当前播放设置
        const settings = typeof loadPlaybackSettings === 'function' ? loadPlaybackSettings(currentUser.username || currentUser.id || currentUser) : { mode: 'sequential', selectedQuotes: [] };
        const isSingleMode = settings.mode === 'single';
        
        // 获取当前书籍已选中的语录ID列表
        const selectedQuoteIds = new Set();
        if (settings.selectedQuotes && Array.isArray(settings.selectedQuotes)) {
            settings.selectedQuotes.forEach(sq => {
                if (sq.bookId === currentBookId) {
                    selectedQuoteIds.add(sq.quoteId);
                }
            });
        }
        
        const hasSelected = selectedQuoteIds.size > 0;

        quotesList.innerHTML = '';
        quotes.forEach((quote) => {
            const isSelected = selectedQuoteIds.has(quote.id);
            
            // 简化逻辑：
            // 1. 非单条重复模式：所有语录勾选框禁用
            // 2. 单条重复模式 + 已选中其他语录 + 当前语录未选中：禁用
            const isDisabled = !isSingleMode || (isSingleMode && hasSelected && !isSelected);
            
            const quoteItem = document.createElement('div');
            quoteItem.className = 'quote-item';
            quoteItem.innerHTML = `
                <div class="quote-checkbox-container">
                    <input type="checkbox" 
                           class="quote-checkbox" 
                           id="quote-check-${quote.id}" 
                           ${isSelected ? 'checked' : ''}
                           ${isDisabled ? 'disabled' : ''}
                           onchange="toggleQuoteForPlayback('${quote.id}')">
                </div>
                <div class="quote-content-main">
                    <div class="quote-text">"${quote.text}"</div>
                    <div class="quote-meta">
                        ${quote.page ? `<span class="quote-page">📖 页码: ${quote.page}</span>` : ''}
                        ${quote.tags && quote.tags.length > 0 ? `<span class="quote-tags">🏷️ 标签: ${quote.tags.join(', ')}</span>` : ''}
                    </div>
                </div>
                <div class="quote-actions-bottom">
                    <button onclick="editQuote('${quote.id}')" class="btn-edit">✏️ 编辑</button>
                    <button onclick="deleteQuote('${quote.id}')" class="btn-delete">🗑️ 删除</button>
                </div>
            `;
            quotesList.appendChild(quoteItem);
        });
    } catch (error) {
        console.error('❌ 渲染语录失败:', error);
        quotesList.innerHTML = '<div class="empty-state">加载语录失败</div>';
    }
}

/**
 * 添加新语录
 */
async function addNewQuote() {
    const text = document.getElementById('newQuoteText').value;
    const page = document.getElementById('newQuotePage').value;
    const tag = document.getElementById('newQuoteTag').value;

    if (!text) {
        alert('请输入语录内容');
        return;
    }

    try {
        const result = await dataManager.addQuote(currentBookId, {
            text,
            page: page || '',
            tags: tag ? tag.split(',').map(t => t.trim()) : []
        });
        
        if (result.success) {
            await renderQuotes();
            closeAddQuoteModal();
            
            // 更新语录统计
            if (typeof updateSelectionSummary === 'function') {
                await updateSelectionSummary();
            }
            
            alert('语录添加成功！');
        } else {
            alert(result.error || '添加失败');
        }
    } catch (error) {
        console.error('❌ 添加语录失败:', error);
        alert('添加语录失败: ' + error.message);
    }
}

/**
 * 删除语录
 */
async function deleteQuote(quoteId) {
    if (!confirm('确定要删除这条语录吗？')) {
        return;
    }

    try {
        const result = await dataManager.deleteQuote(currentBookId, quoteId);
        
        if (result.success) {
            await renderQuotes();
            
            // 更新语录统计
            if (typeof updateSelectionSummary === 'function') {
                await updateSelectionSummary();
            }
            
            alert('语录已删除');
        } else {
            alert(result.error || '删除失败');
        }
    } catch (error) {
        console.error('❌ 删除失败:', error);
        alert('删除失败: ' + error.message);
    }
}

/**
 * 切换语录的播放选中状态
 */
async function toggleQuoteForPlayback(quoteId) {
    try {
        if (!currentUser || !currentBookId) {
            console.error('用户未登录或未选择书籍');
            return;
        }
        
        const username = currentUser.username || currentUser.id || currentUser;
        const settings = typeof loadPlaybackSettings === 'function' ? loadPlaybackSettings(username) : { mode: 'sequential', selectedQuotes: [] };
        
        if (!settings.selectedQuotes) {
            settings.selectedQuotes = [];
        }
        
        // 查找是否已选中
        const existingIndex = settings.selectedQuotes.findIndex(
            sq => sq.bookId === currentBookId && sq.quoteId === quoteId
        );
        
        if (existingIndex >= 0) {
            // 取消选中语录
            settings.selectedQuotes.splice(existingIndex, 1);
            console.log('✅ 取消选中语录:', quoteId);
        } else {
            // 选中语录
            const quoteSelection = {
                bookId: currentBookId,
                quoteId: quoteId
            };
            
            // 如果是单条重复模式，清空其他选中的语录
            if (settings.mode === 'single') {
                // 只保留当前书籍的一条语录
                settings.selectedQuotes = settings.selectedQuotes.filter(sq => sq.bookId !== currentBookId);
                settings.selectedQuotes.push(quoteSelection);
                console.log('🔂 单条重复模式：只选中当前语录:', quoteId);
            } else {
                settings.selectedQuotes.push(quoteSelection);
                console.log('✅ 选中语录:', quoteId);
            }
        }
        
        // 保存设置到 localStorage
        if (typeof savePlaybackSettings === 'function') {
            savePlaybackSettings(username, settings);
            console.log('💾 已保存语录选择设置');
        }
        
        // 重新渲染语录列表以更新勾选框状态
        await renderQuotes();
        
    } catch (error) {
        console.error('切换语录选中状态失败:', error);
    }
}

/**
 * 编辑语录
 */
async function editQuote(quoteId) {
    try {
        const quotes = await dataManager.getBookQuotes(currentBookId);
        const quote = quotes.find(q => q.id === quoteId);
        
        if (!quote) {
            alert('未找到该语录');
            return;
        }
        
        // 填充编辑模态框
        document.getElementById('editQuoteIndex').value = quoteId;
        document.getElementById('editQuoteText').value = quote.text || '';
        document.getElementById('editQuotePage').value = quote.page || '';
        document.getElementById('editQuoteTag').value = quote.tags ? quote.tags.join(', ') : '';
        
        // 显示编辑模态框
        const modal = document.getElementById('editQuoteModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('获取语录信息失败:', error);
        alert('获取语录信息失败: ' + error.message);
    }
}

/**
 * 显示添加语录模态框
 */
function showAddQuoteModal() {
    const modal = document.getElementById('addQuoteModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * 关闭添加语录模态框
 */
function closeAddQuoteModal() {
    const modal = document.getElementById('addQuoteModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    clearQuoteForm();
}

// ==========================================
// 数据备份和恢复
// ==========================================

/**
 * 导出数据
 */
async function exportData() {
    try {
        const result = await dataManager.exportData();
        if (result.success) {
            alert('数据已导出！');
        } else {
            alert(result.error || '导出失败');
        }
    } catch (error) {
        console.error('❌ 导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

/**
 * 导入数据
 */
function importData() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput) {
        alert('找不到文件输入框');
        return;
    }
    
    fileInput.click();
    fileInput.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            await dataManager.importData(file);
            alert('数据导入成功！');
            if (currentUser) {
                await loadUserData();
            }
        } catch (error) {
            console.error('❌ 导入失败:', error);
            alert('导入失败: ' + error.message);
        }
    };
}

// ==========================================
// 工具函数
// ==========================================

/**
 * 验证密码格式
 */
function validatePassword(password) {
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/**
 * 清空登录表单
 */
function clearLoginForm() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
}

/**
 * 清空注册表单
 */
function clearRegisterForm() {
    const usernameInput = document.getElementById('regUsername');
    const passwordInput = document.getElementById('regPassword');
    const confirmInput = document.getElementById('regConfirmPassword');
    
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (confirmInput) confirmInput.value = '';
}

/**
 * 清空书籍表单
 */
function clearBookForm() {
    const nameInput = document.getElementById('newBookName');
    const authorInput = document.getElementById('newBookAuthor');
    
    if (nameInput) nameInput.value = '';
    if (authorInput) authorInput.value = '';
}

/**
 * 清空语录表单
 */
function clearQuoteForm() {
    const textInput = document.getElementById('newQuoteText');
    const pageInput = document.getElementById('newQuotePage');
    const tagInput = document.getElementById('newQuoteTag');
    
    if (textInput) textInput.value = '';
    if (pageInput) pageInput.value = '';
    if (tagInput) tagInput.value = '';
}

/**
 * 清空忘记密码表单
 */
function clearForgotPasswordForm() {
    const phoneInput = document.getElementById('resetPhone');
    const codeInput = document.getElementById('verifyCode');
    
    if (phoneInput) phoneInput.value = '';
    if (codeInput) codeInput.value = '';
}

/**
 * 清空搜索框
 */
function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
}

/**
 * 发送验证码
 */
function sendVerifyCode() {
    alert('验证码功能开发中...');
}

/**
 * 验证验证码并下一步
 */
function verifyCodeAndNext() {
    alert('验证码功能开发中...');
}

/**
 * 重置密码
 */
function resetPassword() {
    alert('重置密码功能开发中...');
}

/**
 * 执行搜索
 */
function performSearch() {
    alert('搜索功能开发中...');
}

/**
 * 切换播放模式 - 与 playback-controller.js 集成
 */
// changePlaybackMode 函数已移至 playback-controller.js
// HTML 中直接调用 playback-controller.js 中的函数

/**
 * 保存书籍编辑
 */
function saveBookEdit() {
    alert('编辑程序开发中...');
}

/**
 * 关闭el书籍编辑模态框
 */
function closeEditBookModal() {
    const modal = document.getElementById('editBookModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * 保存语录编辑
 */
async function saveQuoteEdit() {
    const quoteId = document.getElementById('editQuoteIndex').value;
    const text = document.getElementById('editQuoteText').value;
    const page = document.getElementById('editQuotePage').value;
    const tag = document.getElementById('editQuoteTag').value;
    
    if (!text) {
        alert('请输入语录内容');
        return;
    }
    
    try {
        const result = await dataManager.updateQuote(currentBookId, quoteId, {
            text: text,
            page: page || '',
            tags: tag ? tag.split(',').map(t => t.trim()) : []
        });
        
        if (result.success) {
            await renderQuotes();
            closeEditQuoteModal();
            
            // 更新语录统计
            if (typeof updateSelectionSummary === 'function') {
                await updateSelectionSummary();
            }
            
            alert('语录更新成功！');
        } else {
            alert(result.error || '更新失败');
        }
    } catch (error) {
        console.error('更新语录异常:', error);
        alert('更新语录失败: ' + error.message);
    }
}

/**
 * 关闭语录编辑模态框
 */
function closeEditQuoteModal() {
    const modal = document.getElementById('editQuoteModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ==========================================
// 书籍编辑相关函数
// ==========================================

/**
 * 保存书籍编辑
 */
async function saveBookEdit() {
    const bookId = document.getElementById('editBookId').value;
    const name = document.getElementById('editBookName').value;
    const author = document.getElementById('editBookAuthor').value;
    
    if (!name || !author) {
        alert('请填写书籍名称和作者');
        return;
    }
    
    try {
        const result = await dataManager.updateBook(bookId, {
            name: name,
            author: author
        });
        
        if (result.success) {
            await loadUserData();
            closeEditBookModal();
            alert('书籍信息更新成功！');
        } else {
            alert(result.error || '更新失败');
        }
    } catch (error) {
        console.error('更新书籍异常:', error);
        alert('更新书籍失败: ' + error.message);
    }
}

/**
 * 关闭书籍编辑模态框
 */
function closeEditBookModal() {
    const modal = document.getElementById('editBookModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ==========================================
// 键盘事件绑定
// ==========================================

/**
 * 设置登录页 Enter 键快捷键
 */
function setupLoginEnterKey() {
    // 登录页密码输入框
    const loginPasswordInput = document.getElementById('password');
    if (loginPasswordInput) {
        loginPasswordInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                login();
            }
        });
    }
    
    // 登录页用户名输入框也支持 Enter
    const loginUsernameInput = document.getElementById('username');
    if (loginUsernameInput) {
        loginUsernameInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                login();
            }
        });
    }
    
    console.log('✅ 登录页 Enter 键快捷键已启用');
}

console.log('✅ script-jsonbin.js 配置完成');
