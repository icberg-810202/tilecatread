// ==========================================
// 应用逻辑层 - script-jsonbin.js
// 负责应用初始化、页面导航和用户交互
// ==========================================

console.log('🚀 script-jsonbin.js 已加载');

let currentUser = null;
let currentBookId = null;
let currentBookIndex = null;  // 供 playback-controller.js 使用

/**
 * 应用初始化
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 初始化 TileCatRead 应用');
    
    try {
        // 验证 JSONbin 配置
        if (typeof validateJSONBinConfig !== 'function' || !validateJSONBinConfig()) {
            alert('配置错误，请检查 JSONbin 配置');
            return;
        }
        
        // 初始化数据管理器
        await dataManager.initialize();
        
        // 检查本地缓存
        const cachedData = dataManager.getLocalCache();
        if (cachedData && cachedData.username) {
            console.log('✅ 发现本地缓存用户:', cachedData.username);
            currentUser = { id: cachedData.username, username: cachedData.username };
            // 这里可以添加自动登录逻辑
        }
        
        // 显示启动页
        showSplashPage();
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
function showSplashPage() {
    showPage('splashPage');
    
    // 启动倒计时
    let countdown = 5;
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
function renderBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;
    
    if (!books || books.length === 0) {
        booksGrid.innerHTML = '<div class="empty-state">暂无书籍，点击"添加新书"开始记录</div>';
        return;
    }

    booksGrid.innerHTML = '';
    books.forEach((book, index) => {
        const quoteCount = book.quotes ? book.quotes.length : 0;
        
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
            <div class="book-icon">📚</div>
            <div class="book-info">
                <h3>${book.name}</h3>
                <p>${book.author}</p>
                <div class="book-stats">${quoteCount} 条语录</div>
            </div>
            <div class="book-actions">
                <button onclick="manageQuotes('${book.id}')" class="btn-primary">管理语录</button>
                <button onclick="editBook('${book.id}')" class="btn-secondary">编辑</button>
                <button onclick="deleteBook('${book.id}')" class="btn-danger">删除</button>
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
 * 编辑书籍（预留）
 */
function editBook(bookId) {
    alert('编辑功能开发中...');
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
    
    // 🎵 初始化播放控制器
    if (typeof initPlaybackController === 'function') {
        console.log('🎵 初始化播放控制器...');
        const initialized = initPlaybackController();
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
            quotesList.innerHTML = '<div class="empty-state">暂无语录，点击"添加语录"开始记录</div>';
            return;
        }

        quotesList.innerHTML = '';
        quotes.forEach((quote) => {
            const quoteItem = document.createElement('div');
            quoteItem.className = 'quote-item';
            quoteItem.innerHTML = `
                <div class="quote-content">"${quote.text}"</div>
                <div class="quote-meta">
                    ${quote.page ? `<span>页码: ${quote.page}</span>` : ''}
                    ${quote.tags && quote.tags.length > 0 ? `<span>标签: ${quote.tags.join(', ')}</span>` : ''}
                </div>
                <div class="quote-actions">
                    <button onclick="editQuote('${quote.id}')" class="btn-secondary">编辑</button>
                    <button onclick="deleteQuote('${quote.id}')" class="btn-danger">删除</button>
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
 * 编辑语录（预留）
 */
function editQuote(quoteId) {
    alert('编辑功能开发中...');
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
function changePlaybackMode(mode) {
    console.log('🎥 切换播放模式:', mode);
    
    try {
        // 直接将事件处理委托给 playback-controller.js 中的同名函数
        // 注意：需要在 HTML 的 script 标签加载顺序中确保 playback-controller.js 在 script-jsonbin.js 之前加载
        
        // 方式1：如果已重命名为其他函数（推荐）
        if (typeof handlePlaybackModeChange === 'function') {
            handlePlaybackModeChange(mode);
            console.log('✅ 播放模式已交由 playback-controller 处理');
            return;
        }
        
        // 方式2：直接通过事件参数访问
        const playbackModeFunctions = {
            'sequential': () => {
                console.log('📊 顺序播放模式已激活');
                if (window.playbackController && typeof window.playbackController.setSequentialMode === 'function') {
                    window.playbackController.setSequentialMode();
                }
            },
            'random': () => {
                console.log('🎲 随机播放模式已激活');
                if (window.playbackController && typeof window.playbackController.setRandomMode === 'function') {
                    window.playbackController.setRandomMode();
                }
            },
            'single': () => {
                console.log('🔂 单条重复模式已激活');
                if (window.playbackController && typeof window.playbackController.setSingleMode === 'function') {
                    window.playbackController.setSingleMode();
                }
            }
        };
        
        if (playbackModeFunctions[mode]) {
            playbackModeFunctions[mode]();
        } else {
            console.warn('⚠️ 未知的播放模式:', mode);
        }
        
    } catch (error) {
        console.error('切换播放模式失败:', error);
    }
}

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
function saveQuoteEdit() {
    alert('编辑程序开发中...');
}

/**
 * 关閼语录编辑模态框
 */
function closeEditQuoteModal() {
    const modal = document.getElementById('editQuoteModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

console.log('✅ script-jsonbin.js 配置完成');
