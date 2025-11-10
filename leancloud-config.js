// LeanCloud 配置文件
// 替换为你的实际配置

// LeanCloud SDK 已在 index.html 中引入

const LEANCLOUD_CONFIG = {
  appId: 'oHZ2QKJRrp64Yn7idBPU1pXwd4GPTbPU29lKbQGE81s57YPwZqZo7izIUPywVcGd',
  appKey: '-cn-n1',
  serverURL: 'https://ohz2qkjr.lc-cn-n1-shared.com'
};

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