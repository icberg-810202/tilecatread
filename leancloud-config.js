// LeanCloud 配置文件
// 替换为你的实际配置

// LeanCloud SDK 已在 index.html 中引入

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
      serverURL: LEANCLOUD_CONFIG.serverURL
    });
    
    // 导出供其他文件使用
    window.LEANCLOUD_CONFIG = {
      AV: AV
    };
    
    console.log('✅ LeanCloud 初始化成功');
    return true;
  } catch (error) {
    console.error('❌ LeanCloud 初始化失败:', error);
    return false;
  }
}

// 尝试初始化
initLeanCloud();