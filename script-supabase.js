// ============================================
// Bwhisper - Supabase 集成版本
// ============================================

// Supabase 客户端实例（在 supabase-config.js 中初始化）
let supabase = null;
let useSupabase = false;

// 当前用户信息
let currentUser = null;
let currentUserUid = null;
let currentUserToken = null;

// 本地数据缓存
let userDatabase = {};
let registeredUsers = {};

// 页面状态
let currentBookIndex = null;
let countdown = 10;
let timer = null;

// 验证码相关
let verificationCodes = {}; // 存储验证码 {phone: {code, expireTime}}
let sendCodeTimer = null;
let sendCodeCountdown = 0;

// 作者数据库（只读，用于启动页展示）
const authorDatabase = [
    { id: 1, book: '人间失格', author: '太宰治', quote: '我的不幸恰恰在于我缺乏拒绝的能力，我害怕一旦拒绝别人，便会在彼此心里留下永远无法愈合的裂痕。' },
    { id: 2, book: '小王子', author: '安托万·德·圣-埃克苏佩里', quote: '所有的大人都曾经是小孩，虽然，只有少数的人记得。' },
    { id: 3, book: '活着', author: '余华', quote: '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。' },
    { id: 4, book: '百年孤独', author: '加西亚·马尔克斯', quote: '过去都是假的,回忆是一条没有归途的路。' },
    { id: 5, book: '围城', author: '钱钟书', quote: '婚姻是一座围城，城外的人想进去，城里的人想出来。' }
];

// ============================================
// Supabase 数据库操作函数
// ============================================

/**
 * 用户注册（Supabase版本）
 */
async function supabaseRegister(username, password) {
    try {
        // 1. 检查用户名是否已存在
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (existingUser) {
            throw new Error('用户名已存在');
        }
        
        // 2. 创建用户（密码需要哈希处理）
        const passwordHash = await hashPassword(password);
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{ 
                username: username, 
                password_hash: passwordHash 
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('✅ Supabase 用户注册成功:', username);
        return newUser;
    } catch (error) {
        console.error('❌ Supabase 注册失败:', error);
        throw error;
    }
}

/**
 * 用户登录（Supabase版本）
 */
async function supabaseLogin(username, password) {
    try {
        // 1. 查询用户
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error || !user) {
            throw new Error('用户名或密码错误');
        }
        
        // 2. 验证密码
        const passwordHash = await hashPassword(password);
        if (user.password_hash !== passwordHash) {
            throw new Error('用户名或密码错误');
        }
        
        console.log('✅ Supabase 用户登录成功:', username);
        return user;
    } catch (error) {
        console.error('❌ Supabase 登录失败:', error);
        throw error;
    }
}

/**
 * 加载用户的所有书籍和语录
 */
async function supabaseLoadUserData(userId) {
    try {
        // 1. 加载书籍
        const { data: books, error: booksError } = await supabase
            .from('books')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (booksError) throw booksError;
        
        // 2. 加载所有语录
        const bookIds = books.map(b => b.id);
        let quotes = [];
        
        if (bookIds.length > 0) {
            const { data: quotesData, error: quotesError } = await supabase
                .from('quotes')
                .select('*')
                .in('book_id', bookIds)
                .order('created_at', { ascending: true });
            
            if (quotesError) throw quotesError;
            quotes = quotesData || [];
        }
        
        // 3. 组装数据结构
        const userData = {
            books: books.map(book => ({
                id: book.id,
                name: book.name,
                author: book.author,
                selected: book.selected,
                quotes: quotes
                    .filter(q => q.book_id === book.id)
                    .map(q => ({
                        id: q.id,
                        text: q.text,
                        page: q.page,
                        tags: q.tags
                    }))
            }))
        };
        
        console.log('✅ 从 Supabase 加载用户数据成功，书籍数:', userData.books.length);
        return userData;
    } catch (error) {
        console.error('❌ 从 Supabase 加载数据失败:', error);
        throw error;
    }
}

/**
 * 保存书籍到 Supabase
 */
async function supabaseSaveBook(userId, book) {
    try {
        const bookData = {
            user_id: userId,
            name: book.name,
            author: book.author,
            selected: book.selected || false
        };
        
        let savedBook;
        
        if (book.id) {
            // 更新现有书籍
            const { data, error } = await supabase
                .from('books')
                .update(bookData)
                .eq('id', book.id)
                .select()
                .single();
            
            if (error) throw error;
            savedBook = data;
        } else {
            // 创建新书籍
            const { data, error } = await supabase
                .from('books')
                .insert([bookData])
                .select()
                .single();
            
            if (error) throw error;
            savedBook = data;
        }
        
        console.log('✅ 书籍已保存到 Supabase:', savedBook.name);
        return savedBook;
    } catch (error) {
        console.error('❌ 保存书籍到 Supabase 失败:', error);
        throw error;
    }
}

/**
 * 删除书籍（会级联删除相关语录）
 */
async function supabaseDeleteBook(bookId) {
    try {
        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId);
        
        if (error) throw error;
        
        console.log('✅ 书籍已从 Supabase 删除');
        return true;
    } catch (error) {
        console.error('❌ 删除书籍失败:', error);
        throw error;
    }
}

/**
 * 保存语录到 Supabase
 */
async function supabaseSaveQuote(bookId, quote) {
    try {
        const quoteData = {
            book_id: bookId,
            text: quote.text,
            page: quote.page || null,
            tags: quote.tags || null
        };
        
        let savedQuote;
        
        if (quote.id) {
            // 更新现有语录
            const { data, error } = await supabase
                .from('quotes')
                .update(quoteData)
                .eq('id', quote.id)
                .select()
                .single();
            
            if (error) throw error;
            savedQuote = data;
        } else {
            // 创建新语录
            const { data, error } = await supabase
                .from('quotes')
                .insert([quoteData])
                .select()
                .single();
            
            if (error) throw error;
            savedQuote = data;
        }
        
        console.log('✅ 语录已保存到 Supabase');
        return savedQuote;
    } catch (error) {
        console.error('❌ 保存语录到 Supabase 失败:', error);
        throw error;
    }
}

/**
 * 删除语录
 */
async function supabaseDeleteQuote(quoteId) {
    try {
        const { error } = await supabase
            .from('quotes')
            .delete()
            .eq('id', quoteId);
        
        if (error) throw error;
        
        console.log('✅ 语录已从 Supabase 删除');
        return true;
    } catch (error) {
        console.error('❌ 删除语录失败:', error);
        throw error;
    }
}

// ============================================
// 本地存储操作函数
// ============================================

/**
 * 从本地存储加载已注册用户
 */
function loadLocalUsers() {
    try {
        const saved = localStorage.getItem('registeredUsers');
        registeredUsers = saved ? JSON.parse(saved) : {};
        console.log('📦 已加载本地用户信息');
    } catch (e) {
        console.error('加载本地用户失败:', e);
        registeredUsers = {};
    }
}

/**
 * 从本地存储加载用户数据
 */
function loadLocalUserData(username) {
    try {
        const saved = localStorage.getItem('userDatabase_' + username);
        if (saved) {
            const data = JSON.parse(saved);
            userDatabase[username] = data;
            console.log('📦 已从本地加载用户数据:', username);
            return data;
        }
        return null;
    } catch (e) {
        console.error('加载本地用户数据失败:', e);
        return null;
    }
}

/**
 * 保存用户数据到本地存储
 */
function saveLocalUserData(username, data) {
    try {
        localStorage.setItem('userDatabase_' + username, JSON.stringify(data));
        console.log('💾 用户数据已保存到本地');
    } catch (e) {
        console.error('保存到本地失败:', e);
    }
}

/**
 * 保存注册用户信息到本地
 */
function saveLocalUser(username, password) {
    try {
        registeredUsers[username] = password;
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        console.log('💾 用户信息已保存到本地');
    } catch (e) {
        console.error('保存用户信息失败:', e);
    }
}

// ============================================
// 密码哈希函数（简单实现）
// ============================================

async function hashPassword(password) {
    // 实际项目建议使用更安全的哈希算法，如 bcrypt
    // 这里为了兼容性使用简单的哈希
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hashed_' + Math.abs(hash).toString(16);
}

/**
 * 验证手机号格式
 */
function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

/**
 * 生成随机验证码
 */
function generateVerifyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 发送验证码（模拟）
 * 实际项目中需要集成真实的短信服务，如：
 * - 阿里云短信服务
 * - 腾讯云短信
 * - Twilio
 */
async function sendSMS(phone, code) {
    // 这里仅为演示，实际中需要调用短信API
    console.log(`📧 模拟发送短信到 ${phone}，验证码: ${code}`);
    
    // 模拟网络延迟
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ success: true });
        }, 500);
    });
}

/**
 * 检查密码强度
 */
function checkPasswordStrength(password) {
    const meetsRequirements = password.length >= 6 && 
                             /[a-zA-Z]/.test(password) && 
                             /[0-9]/.test(password);
    
    if (!meetsRequirements) return 0;
    
    let strength = 2;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

/**
 * 显示密码强度
 */
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
    
    strengthBar.className = '';
    
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

/**
 * 显示重置密码强度
 */
function displayResetPasswordStrength(password) {
    const strengthBar = document.getElementById('resetStrengthBar');
    const strengthText = document.getElementById('resetStrengthText');
    const strengthContainer = document.getElementById('resetPasswordStrength');
    
    if (!password) {
        strengthContainer.style.display = 'none';
        strengthText.textContent = '';
        return;
    }
    
    strengthContainer.style.display = 'block';
    const strength = checkPasswordStrength(password);
    
    strengthBar.className = '';
    
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

// ============================================
// 页面导航函数
// ============================================

function showPage(pageId) {
    console.log('切换到页面:', pageId);
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error('找不到页面:', pageId);
    }
}

function goToLoginPage() {
    console.log('跳转到登录页');
    showPage('loginPage');
}

function showRegister() {
    showPage('registerPage');
}

function showForgotPassword() {
    showPage('forgotPasswordStep1');
    // 重置第一步表单
    document.getElementById('resetPhone').value = '';
    document.getElementById('verifyCode').value = '';
    // 重置发送按钮
    const sendBtn = document.getElementById('sendCodeBtn');
    sendBtn.disabled = false;
    sendBtn.textContent = '获取验证码';
    if (sendCodeTimer) {
        clearInterval(sendCodeTimer);
        sendCodeTimer = null;
    }
}

function backToStep1() {
    showPage('forgotPasswordStep1');
    // 清空第二步表单
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    // 隐藏密码强度指示器
    const strengthContainer = document.getElementById('resetPasswordStrength');
    if (strengthContainer) {
        strengthContainer.querySelector('.strength-bar').className = 'strength-bar';
        strengthContainer.querySelector('.strength-text').textContent = '';
    }
}

function backToLogin() {
    showPage('loginPage');
}

function backToMain() {
    showPage('mainPage');
    renderBooksGrid();
    updateSelectionInfo();
}

function backToLibrary() {
    document.getElementById('searchInput').value = '';
    renderBooksGrid();
    console.log('已返回书库');
}

// ============================================
// 用户认证函数
// ============================================

/**
 * 用户注册
 */
async function register() {
    const phone = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    
    // 验证手机号
    if (!validatePhone(phone)) {
        alert('请输入正确的手机号');
        return;
    }
    
    // 验证输入
    if (!password) {
        alert('请输入密码');
        return;
    }
    
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
    
    try {
        if (useSupabase) {
            // 使用 Supabase 注册
            await supabaseRegister(phone, password);
            // 同时保存到本地作为备份
            saveLocalUser(phone, password);
            alert('✅ 注册成功！数据已同步到云端。');
        } else {
            // 使用本地存储注册
            if (registeredUsers[phone]) {
                alert('该手机号已注册');
                return;
            }
            saveLocalUser(phone, password);
            // 创建空的用户数据
            const emptyData = { books: [] };
            userDatabase[phone] = emptyData;
            saveLocalUserData(phone, emptyData);
            alert('✅ 注册成功！（本地模式）');
        }
        
        backToLogin();
        
    } catch (error) {
        console.error('注册失败:', error);
        
        // Supabase 失败时回退到本地
        if (useSupabase && error.message.includes('用户名已存在')) {
            alert('该手机号已注册，请换一个手机号');
        } else if (useSupabase) {
            // 网络错误，使用本地注册
            console.log('切换到本地注册模式');
            if (registeredUsers[phone]) {
                alert('该手机号已注册');
                return;
            }
            saveLocalUser(phone, password);
            const emptyData = { books: [] };
            userDatabase[phone] = emptyData;
            saveLocalUserData(phone, emptyData);
            alert('✅ 注册成功！（云端不可用，使用本地模式）');
            backToLogin();
        } else {
            alert('注册失败: ' + error.message);
        }
    }
}

/**
 * 用户登录
 */
async function login() {
    const phone = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // 验证手机号
    if (!validatePhone(phone)) {
        alert('请输入正确的手机号');
        return;
    }
    
    if (!password) {
        alert('请输入密码');
        return;
    }
    
    try {
        let userData = null;
        
        if (useSupabase) {
            // 使用 Supabase 登录
            const user = await supabaseLogin(phone, password);
            currentUserUid = user.id;
            currentUserToken = 'supabase_' + user.id;
            
            // 加载用户数据
            userData = await supabaseLoadUserData(user.id);
            
            // 缓存到本地
            saveLocalUser(phone, password);
            saveLocalUserData(phone, userData);
            
            console.log('✅ 使用 Supabase 登录成功，用户ID:', user.id);
        } else {
            // 使用本地存储登录
            if (registeredUsers[phone] !== password) {
                alert('手机号或密码错误');
                return;
            }
            
            currentUserUid = phone;
            currentUserToken = 'local_' + Date.now();
            
            // 加载本地数据
            userData = loadLocalUserData(phone);
            if (!userData) {
                userData = { books: [] };
                saveLocalUserData(phone, userData);
            }
            
            console.log('✅ 使用本地存储登录成功');
        }
        
        // 设置当前用户
        currentUser = phone;
        userDatabase[phone] = userData;
        
        // 保存会话（确保保存正确的 userId）
        sessionStorage.setItem('username', phone);
        sessionStorage.setItem('userToken', currentUserToken);
        sessionStorage.setItem('userId', currentUserUid);
        
        // ✨ 保存最后登录用户到localStorage，用于刷新后显示个性化启动页
        localStorage.setItem('lastLoginUser', phone);
        
        console.log('💾 会话已保存，userId:', currentUserUid);
        
        // 更新UI
        document.getElementById('currentUser').textContent = phone;
        showPage('mainPage');
        renderBooksGrid();
        updateSelectionInfo();
        
        alert('登录成功！');
        
    } catch (error) {
        console.error('登录失败:', error);
        
        // Supabase 失败时回退到本地
        if (useSupabase) {
            console.log('⚠️ Supabase 登录失败，切换到本地登录模式');
            if (registeredUsers[phone] !== password) {
                alert('手机号或密码错误');
                return;
            }
            
            currentUser = phone;
            currentUserUid = 'local_' + phone; // 本地模式标记
            currentUserToken = 'local_' + Date.now();
            
            const userData = loadLocalUserData(phone) || { books: [] };
            userDatabase[phone] = userData;
            
            sessionStorage.setItem('username', phone);
            sessionStorage.setItem('userToken', currentUserToken);
            sessionStorage.setItem('userId', currentUserUid);
            sessionStorage.setItem('localMode', 'true'); // 标记本地模式
            
            document.getElementById('currentUser').textContent = phone;
            showPage('mainPage');
            renderBooksGrid();
            updateSelectionInfo();
            
            alert('登录成功！（云端不可用，使用本地模式）');
        } else {
            alert('登录失败: ' + error.message);
        }
    }
}

/**
 * 退出登录
 */
function logout() {
    // 保存当前用户到lastLoginUser，以便下次显示个性化启动页
    if (currentUser) {
        localStorage.setItem('lastLoginUser', currentUser);
    }
    
    currentUser = null;
    currentUserUid = null;
    currentUserToken = null;
    
    sessionStorage.clear();
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    showPage('loginPage');
    console.log('用户已退出登录，已保存lastLoginUser用于下次启动');
}

// ============================================
// 忘记密码 & 验证码功能
// ============================================

/**
 * 验证验证码并进入下一步
 */
function verifyCodeAndNext() {
    const phone = document.getElementById('resetPhone').value.trim();
    const code = document.getElementById('verifyCode').value.trim();
    
    // 验证手机号
    if (!validatePhone(phone)) {
        alert('请输入正确的手机号');
        return;
    }
    
    // 验证验证码
    if (!code || code.length !== 6) {
        alert('请输入6位验证码');
        return;
    }
    
    // 检查验证码是否存在和是否过期
    const savedCode = verificationCodes[phone];
    if (!savedCode) {
        alert('请先获取验证码');
        return;
    }
    
    if (Date.now() > savedCode.expireTime) {
        alert('验证码已过期，请重新获取');
        delete verificationCodes[phone];
        return;
    }
    
    if (savedCode.code !== code) {
        alert('验证码错误');
        return;
    }
    
    // 验证通过，进入第二步
    showPage('forgotPasswordStep2');
    // 清空第二步表单
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
}

/**
 * 发送验证码
 */
async function sendVerifyCode() {
    const phone = document.getElementById('resetPhone').value.trim();
    
    // 验证手机号
    if (!validatePhone(phone)) {
        alert('请输入正确的手机号');
        return;
    }
    
    // 检查用户是否存在
    if (!registeredUsers[phone]) {
        alert('该手机号未注册');
        return;
    }
    
    try {
        // 生成验证码
        const code = generateVerifyCode();
        
        // 保存验证码，设置5分钟过期
        const expireTime = Date.now() + 5 * 60 * 1000;
        verificationCodes[phone] = {
            code: code,
            expireTime: expireTime
        };
        
        // 发送短信
        await sendSMS(phone, code);
        
        // 提示用户（在测试环境中显示验证码）
        alert(`验证码已发送！\n\n【测试模式】验证码：${code}\n有效期5分钟`);
        
        // 启动倒计时（60秒后可重新发送
        startSendCodeCountdown();
        
    } catch (error) {
        console.error('发送验证码失败:', error);
        alert('发送验证码失败，请稍后重试');
    }
}

/**
 * 启动发送验证码倒计时
 */
function startSendCodeCountdown() {
    const sendBtn = document.getElementById('sendCodeBtn');
    sendCodeCountdown = 60;
    sendBtn.disabled = true;
    sendBtn.textContent = `${sendCodeCountdown}s 后重试`;
    
    if (sendCodeTimer) {
        clearInterval(sendCodeTimer);
    }
    
    sendCodeTimer = setInterval(() => {
        sendCodeCountdown--;
        
        if (sendCodeCountdown <= 0) {
            clearInterval(sendCodeTimer);
            sendCodeTimer = null;
            sendBtn.disabled = false;
            sendBtn.textContent = '获取验证码';
        } else {
            sendBtn.textContent = `${sendCodeCountdown}s 后重试`;
        }
    }, 1000);
}

/**
 * 重置密码（第二步）
 */
async function resetPassword() {
    const phone = document.getElementById('resetPhone').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmNewPassword').value.trim();
    
    // 验证新密码
    if (!newPassword) {
        alert('请输入新密码');
        return;
    }
    
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        alert('密码必须同时包含字母和数字');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('密码长度必须至少为6位');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    try {
        if (useSupabase) {
            // 使用 Supabase 更新密码
            const passwordHash = await hashPassword(newPassword);
            const { error } = await supabase
                .from('users')
                .update({ password_hash: passwordHash })
                .eq('username', phone);
            
            if (error) throw error;
            
            console.log('✅ 密码已在 Supabase 中更新');
        }
        
        // 更新本地存储
        registeredUsers[phone] = newPassword;
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        
        // 清除已使用的验证码
        delete verificationCodes[phone];
        
        alert('✅ 密码重置成功！请使用新密码登录');
        backToLogin();
        
    } catch (error) {
        console.error('重置密码失败:', error);
        
        // 即使 Supabase 失败，也更新本地密码
        if (useSupabase) {
            console.log('⚠️ Supabase 更新失败，但本地密码已更新');
            registeredUsers[phone] = newPassword;
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
            delete verificationCodes[phone];
            alert('✅ 密码重置成功！（本地模式）');
            backToLogin();
        } else {
            alert('重置密码失败: ' + error.message);
        }
    }
}

// ============================================
// 书籍管理函数
// ============================================

/**
 * 渲染书籍列表
 */
function renderBooksGrid(filteredBooks = null) {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const userBooks = userDatabase[currentUser].books;
    const booksToRender = filteredBooks || userBooks;
    const isSearching = filteredBooks !== null;
    
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
    
    booksToRender.forEach((book, index) => {
        const actualIndex = isSearching ? 
            userBooks.findIndex(b => b.name === book.name && b.author === book.author) : 
            index;
            
        const bookCard = document.createElement('div');
        bookCard.className = `book-card ${book.selected ? 'selected' : ''}`;
        
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
                <div class="book-title">${book.name}</div>
                <div class="book-author">${book.author}</div>
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
    currentBookIndex = bookIndex;
    const book = userDatabase[currentUser].books[bookIndex];
    document.getElementById('currentBookTitle').textContent = book.name;
    showPage('quotesPage');
    renderQuotesList();
}

function updateSelectionInfo() {
    const userBooks = userDatabase[currentUser].books;
    const selectedBooks = userBooks.filter(book => book.selected);
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

function toggleBookSelection(bookIndex, event) {
    event.stopPropagation();
    
    const book = userDatabase[currentUser].books[bookIndex];
    book.selected = !book.selected;
    
    // 保存更改
    saveUserDatabase();
    renderBooksGrid();
    updateSelectionInfo();
}

function showAddBookModal() {
    document.getElementById('addBookModal').classList.remove('hidden');
}

function closeAddBookModal() {
    document.getElementById('addBookModal').classList.add('hidden');
    document.getElementById('newBookName').value = '';
    document.getElementById('newBookAuthor').value = '';
}

async function addNewBook() {
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
    
    try {
        // 检查是否在本地模式
        const isLocalMode = sessionStorage.getItem('localMode') === 'true' || 
                           (currentUserUid && currentUserUid.toString().startsWith('local_'));
        
        if (useSupabase && currentUserUid && !isLocalMode) {
            // 保存到 Supabase（仅当不是本地模式时）
            console.log('📤 正在保存书籍到 Supabase，userId:', currentUserUid);
            const savedBook = await supabaseSaveBook(currentUserUid, newBook);
            newBook.id = savedBook.id;
        } else if (isLocalMode) {
            console.log('💾 本地模式：仅保存到 localStorage');
        }
        
        // 添加到本地数据
        userDatabase[currentUser].books.push(newBook);
        saveLocalUserData(currentUser, userDatabase[currentUser]);
        
        closeAddBookModal();
        renderBooksGrid();
        updateSelectionInfo();
        
    } catch (error) {
        console.error('添加书籍失败:', error);
        alert('添加书籍失败: ' + error.message);
    }
}

function showEditBookModal(bookIndex, event) {
    if (event) event.stopPropagation();
    
    const book = userDatabase[currentUser].books[bookIndex];
    document.getElementById('editBookIndex').value = bookIndex;
    document.getElementById('editBookName').value = book.name;
    document.getElementById('editBookAuthor').value = book.author;
    document.getElementById('editBookModal').classList.remove('hidden');
}

function closeEditBookModal() {
    document.getElementById('editBookModal').classList.add('hidden');
}

async function saveBookEdit() {
    const index = parseInt(document.getElementById('editBookIndex').value);
    const name = document.getElementById('editBookName').value.trim();
    const author = document.getElementById('editBookAuthor').value.trim();
    
    if (!name) {
        alert('请输入书籍名称');
        return;
    }
    
    const book = userDatabase[currentUser].books[index];
    book.name = name;
    book.author = author || '未知作者';
    
    try {
        // 检查是否在本地模式
        const isLocalMode = sessionStorage.getItem('localMode') === 'true' || 
                           (currentUserUid && currentUserUid.toString().startsWith('local_'));
        
        if (useSupabase && book.id && !isLocalMode) {
            // 更新到 Supabase（仅当不是本地模式时）
            await supabaseSaveBook(currentUserUid, book);
        }
        
        // 保存到本地
        saveLocalUserData(currentUser, userDatabase[currentUser]);
        
        closeEditBookModal();
        renderBooksGrid();
        updateSelectionInfo();
        
    } catch (error) {
        console.error('更新书籍失败:', error);
        alert('更新书籍失败: ' + error.message);
    }
}

async function deleteBook(bookIndex, event) {
    event.stopPropagation();
    
    const book = userDatabase[currentUser].books[bookIndex];
    if (!confirm(`确定要删除《${book.name}》吗？`)) {
        return;
    }
    
    try {
        // 检查是否在本地模式
        const isLocalMode = sessionStorage.getItem('localMode') === 'true' || 
                           (currentUserUid && currentUserUid.toString().startsWith('local_'));
        
        if (useSupabase && book.id && !isLocalMode) {
            // 从 Supabase 删除（仅当不是本地模式时）
            await supabaseDeleteBook(book.id);
        }
        
        // 从本地数据删除
        userDatabase[currentUser].books.splice(bookIndex, 1);
        saveLocalUserData(currentUser, userDatabase[currentUser]);
        
        renderBooksGrid();
        updateSelectionInfo();
        
    } catch (error) {
        console.error('删除书籍失败:', error);
        alert('删除书籍失败: ' + error.message);
    }
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const userBooks = userDatabase[currentUser].books;
    
    if (!searchTerm) {
        alert('请输入搜索内容');
        return;
    }
    
    const filteredBooks = userBooks.filter(book => 
        book.name.toLowerCase().includes(searchTerm) || 
        book.author.toLowerCase().includes(searchTerm)
    );
    
    renderBooksGrid(filteredBooks);
    
    if (filteredBooks.length === 0) {
        alert(`搜索 "${searchTerm}" 没有找到相关书籍`);
    }
}

// ============================================
// 语录管理函数
// ============================================

function renderQuotesList() {
    const list = document.getElementById('quotesList');
    const book = userDatabase[currentUser].books[currentBookIndex];
    
    list.innerHTML = '';
    
    if (!book.quotes || book.quotes.length === 0) {
        list.innerHTML = '<div class="quote-item">暂无语录</div>';
        // 初始化播放控制器
        if (typeof initPlaybackController === 'function') {
            initPlaybackController();
        }
        return;
    }
    
    // 获取播放设置
    const settings = typeof loadPlaybackSettings === 'function' ? 
        loadPlaybackSettings(currentUser) : { mode: 'random', selectedQuotes: [] };
    const isSingleMode = settings.mode === 'single';
    const hasSelected = settings.selectedQuotes.some(
        q => q.bookIndex === currentBookIndex
    );
    
    book.quotes.forEach((quote, index) => {
        const quoteObj = typeof quote === 'string' ? 
            { text: quote, page: null, tags: null } : quote;
        
        // 检查语录是否被选中
        const isSelected = typeof isQuoteSelected === 'function' ? 
            isQuoteSelected(currentBookIndex, index) : false;
        
        // 在单条重复模式下，如果已经有选中的语录，禁用其他复选框
        const isDisabled = isSingleMode && hasSelected && !isSelected;
            
        const quoteItem = document.createElement('div');
        quoteItem.className = `quote-item${isSelected ? ' selected' : ''}`;
        
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
            <input type="checkbox" class="quote-checkbox" 
                   ${isSelected ? 'checked' : ''} 
                   ${isDisabled ? 'disabled' : ''}
                   onclick="toggleQuoteSelection(${currentBookIndex}, ${index})">
            <div class="quote-number">${index + 1}</div>
            <div class="quote-content-wrapper">
                <div class="quote-text">"${quoteObj.text}"</div>
                ${metadataHTML}
            </div>
            <div class="quote-actions">
                <button class="edit-quote-btn" onclick="showEditQuoteModal(${currentBookIndex}, ${index}, event)">编辑</button>
                <button class="delete-quote-btn" onclick="deleteQuote(${index})">删除</button>
            </div>
        `;
        list.appendChild(quoteItem);
    });
    
    // 初始化播放控制器
    if (typeof initPlaybackController === 'function') {
        initPlaybackController();
    }
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

async function addNewQuote() {
    const text = document.getElementById('newQuoteText').value.trim();
    const page = document.getElementById('newQuotePage').value.trim();
    const tagsInput = document.getElementById('newQuoteTag').value.trim();
    
    if (!text) {
        alert('请输入语录内容');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag) : [];
    
    const newQuote = {
        text: text,
        page: page || null,
        tags: tags.length > 0 ? tags : null
    };
    
    try {
        const book = userDatabase[currentUser].books[currentBookIndex];
        
        // 检查是否在本地模式
        const isLocalMode = sessionStorage.getItem('localMode') === 'true' || 
                           (currentUserUid && currentUserUid.toString().startsWith('local_'));
        
        if (useSupabase && book.id && !isLocalMode) {
            // 保存到 Supabase（仅当不是本地模式时）
            const savedQuote = await supabaseSaveQuote(book.id, newQuote);
            newQuote.id = savedQuote.id;
        }
        
        // 添加到本地数据
        if (!book.quotes) {
            book.quotes = [];
        }
        book.quotes.push(newQuote);
        saveLocalUserData(currentUser, userDatabase[currentUser]);
        
        closeAddQuoteModal();
        renderQuotesList();
        
    } catch (error) {
        console.error('添加语录失败:', error);
        alert('添加语录失败: ' + error.message);
    }
}

function showEditQuoteModal(bookIndex, quoteIndex, event) {
    if (event) event.stopPropagation();
    
    const book = userDatabase[currentUser].books[bookIndex];
    const quote = book.quotes[quoteIndex];
    
    const quoteObj = typeof quote === 'string' ? 
        { text: quote, page: null, tags: null } : quote;
    
    document.getElementById('editQuoteIndex').value = quoteIndex;
    document.getElementById('editQuoteText').value = quoteObj.text;
    document.getElementById('editQuotePage').value = quoteObj.page || '';
    document.getElementById('editQuoteTag').value = (quoteObj.tags && quoteObj.tags.join(', ')) || '';
    
    document.getElementById('editQuoteModal').classList.remove('hidden');
}

function closeEditQuoteModal() {
    document.getElementById('editQuoteModal').classList.add('hidden');
}

async function saveQuoteEdit() {
    const quoteIndex = parseInt(document.getElementById('editQuoteIndex').value);
    const text = document.getElementById('editQuoteText').value.trim();
    const page = document.getElementById('editQuotePage').value.trim();
    const tagsInput = document.getElementById('editQuoteTag').value.trim();
    
    if (!text) {
        alert('请输入语录内容');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag) : [];
    
    const updatedQuote = {
        text: text,
        page: page || null,
        tags: tags.length > 0 ? tags : null
    };
    
    try {
        const book = userDatabase[currentUser].books[currentBookIndex];
        const oldQuote = book.quotes[quoteIndex];
        
        // 检查是否在本地模式
        const isLocalMode = sessionStorage.getItem('localMode') === 'true' || 
                           (currentUserUid && currentUserUid.toString().startsWith('local_'));
        
        if (useSupabase && oldQuote.id && !isLocalMode) {
            // 更新到 Supabase（仅当不是本地模式时）
            updatedQuote.id = oldQuote.id;
            await supabaseSaveQuote(book.id, updatedQuote);
        }
        
        // 更新本地数据
        book.quotes[quoteIndex] = updatedQuote;
        saveLocalUserData(currentUser, userDatabase[currentUser]);
        
        closeEditQuoteModal();
        renderQuotesList();
        
    } catch (error) {
        console.error('更新语录失败:', error);
        alert('更新语录失败: ' + error.message);
    }
}

async function deleteQuote(quoteIndex) {
    if (!confirm('确定要删除这条语录吗？')) {
        return;
    }
    
    try {
        const book = userDatabase[currentUser].books[currentBookIndex];
        const quote = book.quotes[quoteIndex];
        
        // 棆查是否在本地模式
        const isLocalMode = sessionStorage.getItem('localMode') === 'true' || 
                           (currentUserUid && currentUserUid.toString().startsWith('local_'));
        
        if (useSupabase && quote.id && !isLocalMode) {
            // 从 Supabase 删除（仅当不是本地模式时）
            await supabaseDeleteQuote(quote.id);
        }
        
        // 从本地数据删除
        book.quotes.splice(quoteIndex, 1);
        saveLocalUserData(currentUser, userDatabase[currentUser]);
        
        renderQuotesList();
        
    } catch (error) {
        console.error('删除语录失败:', error);
        alert('删除语录失败: ' + error.message);
    }
}

// ============================================
// 数据持久化函数
// ============================================

function saveUserDatabase() {
    if (!currentUser) {
        console.log('用户未登录，无法保存数据');
        return;
    }
    
    const userData = userDatabase[currentUser];
    
    // 总是保存到本地
    saveLocalUserData(currentUser, userData);
    
    // 如果使用 Supabase，在后台同步
    // 注意：单个操作已经在各自函数中同步，这里不需要再次同步整个数据库
}

// ============================================
// 启动页和倒计时
// ============================================

function showRandomQuote() {
    console.log('显示随机语录');
    
    // 优先从localStorage读取最后登录用户（跨浏览器会话持久化）
    const lastUser = localStorage.getItem('lastLoginUser') || sessionStorage.getItem('username');
    
    if (lastUser) {
        // 尝试加载该用户的数据
        if (!userDatabase[lastUser]) {
            const userData = loadLocalUserData(lastUser);
            if (userData) {
                userDatabase[lastUser] = userData;
            }
        }
    }
    
    if (lastUser && userDatabase[lastUser]) {
        console.log('为用户显示个性化语录:', lastUser);
        
        // 加载用户的播放设置
        const savedSettings = typeof loadPlaybackSettings === 'function' ? 
            loadPlaybackSettings(lastUser) : null;
        
        // 如果有播放设置，根据播放模式显示
        if (savedSettings && savedSettings.mode) {
            const userBooks = userDatabase[lastUser].books;
            let quoteToShow = null;
            
            // 确定要播放的语录列表
            let quotesToPlay = [];
            
            if (savedSettings.selectedQuotes && savedSettings.selectedQuotes.length > 0) {
                // 有选中的语录，使用选中的语录列表
                quotesToPlay = savedSettings.selectedQuotes;
                console.log('使用选中的语录列表，共', quotesToPlay.length, '条');
            } else {
                // 没有选中语录，从所有书籍的语录中按顺序创建列表
                userBooks.forEach((book, bookIndex) => {
                    if (book.quotes && book.quotes.length > 0) {
                        book.quotes.forEach((quote, quoteIndex) => {
                            quotesToPlay.push({ bookIndex, quoteIndex });
                        });
                    }
                });
                console.log('未选中语录，使用所有书籍的语录，共', quotesToPlay.length, '条');
            }
            
            // 如果有可播放的语录，根据模式显示
            if (quotesToPlay.length > 0) {
                switch (savedSettings.mode) {
                    case 'sequential': // 顺序播放
                        console.log('=== 顺序播放模式 ===');
                        console.log('原始 currentIndex 值:', savedSettings.currentIndex);
                        console.log('可播放语录总数:', quotesToPlay.length);
                        
                        // 确保currentIndex是有效数字
                        let currentIndex = savedSettings.currentIndex;
                        if (typeof currentIndex !== 'number' || currentIndex < 0) {
                            console.warn('⚠️ 索引无效，重置为0. 原始值:', currentIndex);
                            currentIndex = 0;
                        }
                        
                        // 确保索引不超出范围
                        if (currentIndex >= quotesToPlay.length) {
                            console.warn('⚠️ 索引超出范围，重置为0. 索引:', currentIndex, '总数:', quotesToPlay.length);
                            currentIndex = 0;
                        }
                        
                        const selectedQuote = quotesToPlay[currentIndex];
                        
                        console.log(`准备显示第${currentIndex + 1}条语录:`, JSON.stringify(selectedQuote));
                        
                        if (selectedQuote && userBooks[selectedQuote.bookIndex] && 
                            userBooks[selectedQuote.bookIndex].quotes[selectedQuote.quoteIndex]) {
                            const book = userBooks[selectedQuote.bookIndex];
                            const quote = book.quotes[selectedQuote.quoteIndex];
                            quoteToShow = {
                                quote: typeof quote === 'string' ? quote : quote.text,
                                book: book.name,
                                author: book.author
                            };
                            
                            // 重要：更新下次的索引（仅在启动页显示时更新）
                            const nextIndex = (currentIndex + 1) % quotesToPlay.length;
                            savedSettings.currentIndex = nextIndex;
                            if (typeof savePlaybackSettings === 'function') {
                                savePlaybackSettings(lastUser, savedSettings);
                                console.log(`✅ 顺序播放：显示第${currentIndex + 1}条，下次将显示第${nextIndex + 1}条`);
                                console.log('已保存的 nextIndex:', nextIndex);
                            }
                        } else {
                            console.error('❌ 语录数据无效:', selectedQuote);
                        }
                        break;
                        
                    case 'random': // 随机播放
                        const randomIndex = Math.floor(Math.random() * quotesToPlay.length);
                        const randomSelectedQuote = quotesToPlay[randomIndex];
                        if (randomSelectedQuote && userBooks[randomSelectedQuote.bookIndex] && 
                            userBooks[randomSelectedQuote.bookIndex].quotes[randomSelectedQuote.quoteIndex]) {
                            const book = userBooks[randomSelectedQuote.bookIndex];
                            const quote = book.quotes[randomSelectedQuote.quoteIndex];
                            quoteToShow = {
                                quote: typeof quote === 'string' ? quote : quote.text,
                                book: book.name,
                                author: book.author
                            };
                            console.log('✅ 随机播放：显示第', randomIndex + 1, '条语录');
                        }
                        break;
                        
                    case 'single': // 单条重复
                        // 只显示第一条选中的语录（如果有选中），否则显示第一条语录
                        const singleQuote = quotesToPlay[0];
                        if (singleQuote && userBooks[singleQuote.bookIndex] && 
                            userBooks[singleQuote.bookIndex].quotes[singleQuote.quoteIndex]) {
                            const book = userBooks[singleQuote.bookIndex];
                            const quote = book.quotes[singleQuote.quoteIndex];
                            quoteToShow = {
                                quote: typeof quote === 'string' ? quote : quote.text,
                                book: book.name,
                                author: book.author
                            };
                            console.log('✅ 单条重复：显示固定语录');
                        }
                        break;
                }
                
                if (quoteToShow) {
                    document.getElementById('splashQuoteContent').textContent = `"${quoteToShow.quote}"`;
                    document.getElementById('splashQuoteSource').textContent = `——《${quoteToShow.book}》`;
                    console.log('✅ 显示语录:', quoteToShow.book, '模式:', savedSettings.mode);
                    return;
                }
            }
        }
        
        // 如果没有选中的语录，使用原有逻辑：优先从选中的书籍中获取语录
        const userBooks = userDatabase[lastUser].books;
        const selectedBooks = userBooks.filter(book => book.selected);
        const allQuotes = [];
        
        // 优先从选中的书籍中获取语录
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
            const randomIndex = Math.floor(Math.random() * allQuotes.length);
            const randomQuote = allQuotes[randomIndex];
            document.getElementById('splashQuoteContent').textContent = `"${randomQuote.quote}"`;
            document.getElementById('splashQuoteSource').textContent = `——《${randomQuote.book}》`;
            console.log('✅ 显示用户选中书籍的语录:', randomQuote.book);
            return;
        }
        
        // 如果没有选中的书籍，从所有书籍中获取
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
            console.log('✅ 显示用户所有书籍的语录:', randomQuote.book);
            return;
        }
    }
    
    // 首次访问或用户无语录，显示默认语录
    const randomIndex = Math.floor(Math.random() * authorDatabase.length);
    const randomQuote = authorDatabase[randomIndex];
    document.getElementById('splashQuoteContent').textContent = `"${randomQuote.quote}"`;
    document.getElementById('splashQuoteSource').textContent = `——《${randomQuote.book}》`;
    console.log('显示默认语录（首次访问或无个人语录）:', randomQuote.book);
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    let seconds = 10;
    
    if (countdownElement) {
        countdownElement.textContent = seconds.toString();
    }
    
    function updateCountdown() {
        seconds--;
        if (countdownElement) {
            countdownElement.textContent = seconds.toString();
        }
        
        if (seconds <= 0) {
            goToLoginPage();
        } else {
            timer = setTimeout(updateCountdown, 1000);
        }
    }
    
    setTimeout(updateCountdown, 1000);
    setTimeout(goToLoginPage, 10500); // 安全保障
}

// ============================================
// 初始化函数
// ============================================

window.onload = async function() {
    console.log('页面加载完成，开始初始化');
    
    // 1. 初始化 Supabase
    if (typeof window.initSupabase === 'function') {
        useSupabase = window.initSupabase();
        if (useSupabase && window.supabase) {
            supabase = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey,
                window.SUPABASE_CONFIG.options
            );
        }
    }
    
    // 2. 加载本地用户信息
    loadLocalUsers();
    
    // 3. 检查会话
    const savedUsername = sessionStorage.getItem('username');
    const savedToken = sessionStorage.getItem('userToken');
    const savedUserId = sessionStorage.getItem('userId');
    
    if (savedUsername && savedToken) {
        // 用户已登录
        console.log('检测到已登录用户:', savedUsername);
        console.log('恢复的 userId:', savedUserId);
        currentUser = savedUsername;
        currentUserToken = savedToken;
        currentUserUid = savedUserId || savedUsername;
        
        // 先从本地加载数据
        let userData = loadLocalUserData(savedUsername);
        if (!userData) {
            userData = { books: [] };
        }
        userDatabase[savedUsername] = userData;
        
        // 更新UI
        document.getElementById('currentUser').textContent = savedUsername;
        showPage('mainPage');
        renderBooksGrid();
        updateSelectionInfo();
        
        // 如果使用 Supabase，异步同步数据
        if (useSupabase && savedUserId) {
            setTimeout(async () => {
                try {
                    const cloudData = await supabaseLoadUserData(savedUserId);
                    if (cloudData && currentUser === savedUsername) {
                        userDatabase[savedUsername] = cloudData;
                        saveLocalUserData(savedUsername, cloudData);
                        renderBooksGrid();
                        updateSelectionInfo();
                        console.log('✅ 已从云端同步数据');
                    }
                } catch (error) {
                    console.log('云端同步失败，继续使用本地数据:', error);
                }
            }, 1000);
        }
    } else {
        // 用户未登录，显示启动页
        console.log('用户未登录，显示启动页');
        showPage('splashPage');
        showRandomQuote();
        startCountdown();
        
        // 点击跳过功能
        const quoteCard = document.querySelector('.quote-card');
        if (quoteCard) {
            quoteCard.addEventListener('click', function(e) {
                e.stopPropagation();
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                goToLoginPage();
            });
        }
    }
    
    // 4. 添加事件监听
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // 注册页密码强度监听
    const regPasswordInput = document.getElementById('regPassword');
    if (regPasswordInput) {
        regPasswordInput.addEventListener('input', function() {
            displayPasswordStrength(this.value);
        });
    }
    
    // 重置密码页密码强度监听
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            displayResetPasswordStrength(this.value);
        });
    }
};

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
});
