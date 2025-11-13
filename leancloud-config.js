// LeanCloud 配置文件
// 替换为你的实际配置

// LeanCloud SDK 已在 index.html 中引入

// 检查是否为本地开发环境
function isLocalDevelopment() {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

// 延迟初始化函数
function initLeanCloud() {
  // 检查 AV 是否已定义
  if (typeof AV === 'undefined') {
    console.error('❌ LeanCloud SDK 未正确加载');
    return false;
  }
  
  const LEANCLOUD_CONFIG = {
    appId: 'EeNvUrhhjnQRJoRfMxqE8Qxh-MdYXbMMI',
    appKey: 'R3oHn9jLLOt88EgFqk9lSAc9',
    serverURL: 'https://eenvurhh.api.lncldglobal.com'
  };

  try {
    // 检查是否启用了跟踪防护（某些浏览器会阻止第三方存储访问）
    let storageAvailable = true;
    try {
      const testKey = '__leancloud_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (e) {
      console.warn('⚠️ 浏览器跟踪防护限制了存储访问，将使用内存存储');
      storageAvailable = false;
    }
    
    // 初始化 LeanCloud
    AV.init({
      appId: LEANCLOUD_CONFIG.appId,
      appKey: LEANCLOUD_CONFIG.appKey,
      serverURL: LEANCLOUD_CONFIG.serverURL,
      // 为本地开发环境启用跨域支持
      production: !isLocalDevelopment(),
      // 禁用缓存以避免跟踪防护问题
      disableCache: !storageAvailable
    });
    
    // 导出供其他文件使用
    window.LEANCLOUD_CONFIG = {
      AV: AV,
      storageAvailable: storageAvailable
    };
    
    console.log('✅ LeanCloud 初始化成功');
    console.log('开发环境:', isLocalDevelopment() ? '本地开发' : '生产环境');
    if (!storageAvailable) {
      console.warn('⚠️ 存储限制已启用，将仅使用内存存储');
    }
    
    return true;
  } catch (error) {
    console.error('❌ LeanCloud 初始化失败:', error);
    return false;
  }
}

// 尝试初始化
if (initLeanCloud()) {
  console.log('LeanCloud 已成功初始化');
} else {
  console.error('LeanCloud 初始化失败');
}

// 显示随机语录
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

// 页面加载完成后显示随机语录
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded 事件已触发 ===');
    
    // 显示随机语录
    console.log('准备显示随机语录...');
    displayRandomQuote();
    console.log('随机语录已显示');
    
    // 检查语录内容是否被正确填充
    const quoteContent = document.getElementById('splashQuoteContent');
    const quoteSource = document.getElementById('splashQuoteSource');
    console.log('splashQuoteContent 当前文本:', quoteContent?.textContent || '空');
    console.log('splashQuoteSource 当前文本:', quoteSource?.textContent || '空');
    
    // 如果语录为空，设置默认语录
    if (!quoteContent?.textContent || quoteContent.textContent.trim() === '') {
        console.log('没有语录内容，设置默认语录');
        if (quoteContent) {
            quoteContent.textContent = '阅读是一座随身携带的避难所。';
        }
        if (quoteSource) {
            quoteSource.textContent = '——  毛姆';
        }
    }
    
    // 如果用户点击启动页，可以立即跳过
    const splashPage = document.getElementById('splashPage');
    if (splashPage) {
        splashPage.addEventListener('click', function() {
            // 跳转到登录页的功能由script.js处理
        });
    }
    
    // 直接启动倒计时（作为备用）
    // 检查用户是否已登录
    const savedUsername = sessionStorage.getItem('username');
    if (!savedUsername) {
        console.log('用户未登录，准备启动倒计时...');
        // 延迟启动倒计时，确保所有脚本都已加载
        setTimeout(function() {
            if (typeof startCountdown === 'function') {
                console.log('执行 startCountdown 函数');
                startCountdown();
            } else {
                console.warn('startCountdown 函数未定义，可能还未加载');
            }
        }, 500);
    }
});
