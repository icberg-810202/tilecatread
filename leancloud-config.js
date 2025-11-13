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
    // 初始化 LeanCloud
    AV.init({
      appId: LEANCLOUD_CONFIG.appId,
      appKey: LEANCLOUD_CONFIG.appKey,
      serverURL: LEANCLOUD_CONFIG.serverURL,
      // 为本地开发环境启用跨域支持
      production: !isLocalDevelopment()
    });
    
    // 导出供其他文件使用
    window.LEANCLOUD_CONFIG = {
      AV: AV
    };
    
    console.log('✅ LeanCloud 初始化成功');
    console.log('开发环境:', isLocalDevelopment() ? '本地开发' : '生产环境');
    
    // 添加详细的CORS错误处理
    AV.on('error', function(error) {
      console.error('LeanCloud SDK 错误:', error);
      if (error.code === 'CORS') {
        console.error('CORS错误: 请检查LeanCloud安全域名配置是否正确');
        console.error('应在LeanCloud控制台添加以下安全域名:');
        console.error('- http://localhost:8000');
        console.error('- http://127.0.0.1:8000');
      }
    });
    
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
async function displayRandomQuote() {
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
        const quoteContent = document.getElementById('splashQuoteContent');
        const quoteSource = document.getElementById('splashQuoteSource');
        
        if (quoteContent) {
            quoteContent.textContent = randomQuote.content;
        }
        if (quoteSource) {
            quoteSource.textContent = `—— ${randomQuote.source}`;
        }
    } catch (error) {
        console.warn('获取随机语录失败，使用默认语录:', error);
        // 出错时使用默认语录
        const quoteContent = document.getElementById('splashQuoteContent');
        const quoteSource = document.getElementById('splashQuoteSource');
        
        if (quoteContent) {
            quoteContent.textContent = "阅读是一座随身携带的避难所。";
        }
        if (quoteSource) {
            quoteSource.textContent = "—— 毛姆";
        }
    }
}

// 页面加载完成后显示随机语录
document.addEventListener('DOMContentLoaded', function() {
    // 显示随机语录
    displayRandomQuote();
    
    // 如果用户点击启动页，可以立即跳过
    const splashPage = document.getElementById('splashPage');
    if (splashPage) {
        splashPage.addEventListener('click', function() {
            // 跳转到登录页的功能由script.js处理
        });
    }
});
