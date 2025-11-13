// ==========================================
// LeanCloud 配置和初始化
// ==========================================

console.log('📝 leancloud-config.js 已加载');

// LeanCloud SDK 已在 index.html 中通过CDN引入
// 这里只做初始化和配置

const LEANCLOUD_APP_CONFIG = {
    appId: 'EeNvUrhhjnQRJoRfMxqE8Qxh-MdYXbMMI',
    appKey: 'R3oHn9jLLOt88EgFqk9lSAc9',
    serverURL: 'https://eenvurhh.api.lncldglobal.com'
};

// 延迟初始化LeanCloud
function initLeanCloud() {
    console.log('🔧 开始初始化LeanCloud...');
    
    // 检查AV是否已加载
    if (typeof AV === 'undefined') {
        console.error('❌ LeanCloud SDK未加载');
        console.error('❌ 可能原因: unpkg.com CDN被阻止或网络问题');
        console.error('💡 建议: 下载SDK到本地或使用国内CDN');
        
        // 设置useLeanCloud为false，降级到本地存储
        if (typeof useLeanCloud !== 'undefined') {
            useLeanCloud = false;
            console.warn('⚠️ 已设置 useLeanCloud = false，将使用本地存储模式');
        }
        return false;
    }
    
    console.log('✅ LeanCloud SDK已加载，AV对象存在');
    
    try {
        // 检查localStorage是否可用
        let storageAvailable = true;
        try {
            const test = '__leancloud_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
        } catch (e) {
            console.warn('⚠️ localStorage不可用，将使用内存存储');
            storageAvailable = false;
        }
        
        // 初始化AV对象
        AV.init({
            appId: LEANCLOUD_APP_CONFIG.appId,
            appKey: LEANCLOUD_APP_CONFIG.appKey,
            serverURL: LEANCLOUD_APP_CONFIG.serverURL,
            disableCache: !storageAvailable
        });
        
        console.log('✅ AV.init() 调用成功');
        console.log('📡 ServerURL:', LEANCLOUD_APP_CONFIG.serverURL);
        
        // ♥♥♥ 改进：一旦初始化成功，设置useLeanCloud为true
        if (typeof useLeanCloud !== 'undefined') {
            useLeanCloud = true;  // 清除该上次的false被设置
            console.log('🔐 已设置 useLeanCloud = true');
        }
        
        console.log('✅ LeanCloud初始化成功');
        return true;
    } catch (error) {
        console.error('❌ LeanCloud初始化失败:', error.message);
        console.error('❌ 错误详情:', error);
        
        // 设置useLeanCloud为false
        if (typeof useLeanCloud !== 'undefined') {
            useLeanCloud = false;
            console.warn('⚠️ 初始化失败，已设置 useLeanCloud = false');
        }
        return false;
    }
}

// 页面加载时执行初始化
if (document.readyState === 'loading') {
    // DOM还在加载中
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📖 DOMContentLoaded事件触发');
        
        // 等待SDK加载完成，最多等待3秒
        let retryCount = 0;
        const maxRetries = 10;
        
        function tryInit() {
            if (typeof AV !== 'undefined') {
                console.log('✅ 检测到AV对象，开始初始化');
                try {
                    initLeanCloud();
                    setupSplashPage();
                } catch (error) {
                    console.error('💥 leancloud-config.js执行失败:', error);
                }
            } else if (retryCount < maxRetries) {
                retryCount++;
                console.log(`⏳ 等待LeanCloud SDK加载... (第${retryCount}/${maxRetries}次)`);
                setTimeout(tryInit, 300); // 300ms后重试
            } else {
                console.error('❌ 等待超时，LeanCloud SDK未能加载');
                console.error('💡 应用将使用本地存储模式');
                try {
                    setupSplashPage(); // 仍然设置启动页
                } catch (error) {
                    console.error('💥 setupSplashPage失败:', error);
                }
            }
        }
        
        tryInit();
    });
} else {
    // DOM已经加载完母
    console.log('📖 DOM已加载');
    
    // 等待SDK加载
    let retryCount = 0;
    const maxRetries = 10;
    
    function tryInit() {
        if (typeof AV !== 'undefined') {
            console.log('✅ 检测到AV对象，开始初始化');
            try {
                initLeanCloud();
                setupSplashPage();
            } catch (error) {
                console.error('💥 leancloud-config.js执行失败:', error);
            }
        } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`⏳ 等待LeanCloud SDK加载... (第${retryCount}/${maxRetries}次)`);
            setTimeout(tryInit, 300);
        } else {
            console.error('❌ 等待超时，LeanCloud SDK未能加载');
            console.error('💡 应用将使用本地存储模式');
            try {
                setupSplashPage();
            } catch (error) {
                console.error('💥 setupSplashPage失败:', error);
            }
        }
    }
    
    tryInit();
}

// 设置启动页
function setupSplashPage() {
    console.log('🎨 设置启动页...');
    
    const quoteContent = document.getElementById('splashQuoteContent');
    const quoteSource = document.getElementById('splashQuoteSource');
    const countdownEl = document.getElementById('countdown');
    
    // 显示随机语录
    const quotes = [
        { text: '阅读是一座随身携带的避难所。', author: '毛姆' },
        { text: '书中自有黄金屋，书中自有颜如玉。', author: '《增广贤文》' },
        { text: '读书破万卷，下笔如有神。', author: '杜甫' },
        { text: '书籍是人类进步的阶梯。', author: '高尔基' },
        { text: '人间失格', author: '太宰治' }
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    if (quoteContent) {
        quoteContent.textContent = randomQuote.text;
    }
    if (quoteSource) {
        quoteSource.textContent = `—— ${randomQuote.author}`;
    }
    
    console.log('✅ 语录已显示:', randomQuote.text);
    
    // 启动倒计时
    if (countdownEl) {
        startCountdown();
    }
}

// 倒计时函数
function startCountdown() {
    console.log('⏱️ 开始倒计时');
    
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) {
        console.error('❌ 找不到倒计时元素');
        return;
    }
    
    let count = 10;
    countdownEl.textContent = count;
    
    const interval = setInterval(function() {
        count--;
        if (countdownEl) {
            countdownEl.textContent = count;
        }
        console.log('⏱️ 倒计时:', count);
        
        if (count <= 0) {
            clearInterval(interval);
            console.log('✅ 倒计时结束，跳转到登录页');
            
            // 延迟100ms，确保所有脚本都已加载
            setTimeout(function() {
                if (typeof goToLoginPage === 'function') {
                    console.log('✅ 调用goToLoginPage()函数');
                    goToLoginPage();
                } else {
                    console.warn('⚠️ goToLoginPage函数未定义，使用备份方案');
                    // 备份方案：直接操作DOM
                    const splashPage = document.getElementById('splashPage');
                    const loginPage = document.getElementById('loginPage');
                    if (splashPage) {
                        splashPage.classList.add('hidden');
                        console.log('✅ 隐藏启动页');
                    }
                    if (loginPage) {
                        loginPage.classList.remove('hidden');
                        console.log('✅ 显示登录页');
                    }
                }
            }, 100);
        }
    }, 1000);
}

console.log('✅ leancloud-config.js配置完成');
