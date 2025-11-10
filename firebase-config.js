// Firebase 配置文件
// 替换为你的实际 Firebase 配置

const firebaseConfig = {
  // 在 Firebase 控制台获取这些配置信息
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 获取数据库实例
const database = firebase.database();

// 导出供其他文件使用
window.FIREBASE_CONFIG = {
  database: database
};