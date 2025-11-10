// Firebase 数据访问层

// 用户注册
async function registerUser(phone, password) {
  try {
    // 检查手机号是否已存在
    const userRef = FIREBASE_CONFIG.database.ref('users/' + phone);
    const snapshot = await userRef.once('value');
    
    if (snapshot.exists()) {
      throw new Error('手机号已注册');
    }
    
    // 创建用户
    const userData = {
      phone: phone,
      password: password, // 注意：实际应用中应该哈希密码
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    await userRef.set(userData);
    
    return {
      success: true,
      message: '注册成功',
      data: {
        phone: phone,
        id: phone
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '注册失败'
    };
  }
}

// 用户登录
async function loginUser(phone, password) {
  try {
    const userRef = FIREBASE_CONFIG.database.ref('users/' + phone);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
      throw new Error('用户不存在');
    }
    
    const userData = snapshot.val();
    
    if (userData.password !== password) {
      throw new Error('密码错误');
    }
    
    return {
      success: true,
      message: '登录成功',
      data: {
        phone: phone,
        id: phone
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '登录失败'
    };
  }
}

// 添加书籍
async function addBook(userId, title, author) {
  try {
    // 生成唯一ID
    const bookRef = FIREBASE_CONFIG.database.ref('books').push();
    const bookId = bookRef.key;
    
    const bookData = {
      userId: userId,
      title: title,
      author: author,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    await bookRef.set(bookData);
    
    return {
      success: true,
      message: '书籍添加成功',
      data: {
        id: bookId,
        ...bookData
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '添加书籍失败'
    };
  }
}

// 添加语录
async function addQuote(bookId, content, page, tags) {
  try {
    // 生成唯一ID
    const quoteRef = FIREBASE_CONFIG.database.ref('quotes').push();
    const quoteId = quoteRef.key;
    
    const quoteData = {
      bookId: bookId,
      content: content,
      page: page,
      tags: tags,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    await quoteRef.set(quoteData);
    
    return {
      success: true,
      message: '语录添加成功',
      data: {
        id: quoteId,
        ...quoteData
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '添加语录失败'
    };
  }
}

// 获取用户书籍
async function getUserBooks(userId) {
  try {
    const booksRef = FIREBASE_CONFIG.database.ref('books');
    const snapshot = await booksRef.orderByChild('userId').equalTo(userId).once('value');
    
    const books = [];
    snapshot.forEach(childSnapshot => {
      books.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    return {
      success: true,
      data: books
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取书籍失败'
    };
  }
}

// 获取书籍语录
async function getBookQuotes(bookId) {
  try {
    const quotesRef = FIREBASE_CONFIG.database.ref('quotes');
    const snapshot = await quotesRef.orderByChild('bookId').equalTo(bookId).once('value');
    
    const quotes = [];
    snapshot.forEach(childSnapshot => {
      quotes.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    return {
      success: true,
      data: quotes
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取语录失败'
    };
  }
}

// 获取随机语录（用于启动页）
async function getRandomQuotes(limit = 5) {
  try {
    const quotesRef = FIREBASE_CONFIG.database.ref('quotes');
    const snapshot = await quotesRef.limitToLast(limit).once('value');
    
    const quotes = [];
    snapshot.forEach(childSnapshot => {
      quotes.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // 随机打乱数组
    for (let i = quotes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [quotes[i], quotes[j]] = [quotes[j], quotes[i]];
    }
    
    return {
      success: true,
      data: quotes
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取随机语录失败'
    };
  }
}

// 获取顺序播放的语录
async function getSequentialQuotes(limit = 10) {
  try {
    const quotesRef = FIREBASE_CONFIG.database.ref('quotes');
    const snapshot = await quotesRef.limitToFirst(limit).once('value');
    
    const quotes = [];
    snapshot.forEach(childSnapshot => {
      quotes.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    return {
      success: true,
      data: quotes
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取顺序语录失败'
    };
  }
}

// 更新播放模式
function updatePlaybackMode(userId, mode) {
  try {
    const modeRef = FIREBASE_CONFIG.database.ref('user_settings/' + userId + '/playbackMode');
    modeRef.set(mode);
    return {
      success: true,
      message: '播放模式更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '更新播放模式失败'
    };
  }
}

// 获取用户播放模式
async function getUserPlaybackMode(userId) {
  try {
    const modeRef = FIREBASE_CONFIG.database.ref('user_settings/' + userId + '/playbackMode');
    const snapshot = await modeRef.once('value');
    
    if (snapshot.exists()) {
      return {
        success: true,
        data: snapshot.val()
      };
    } else {
      // 默认返回随机模式
      return {
        success: true,
        data: 'random'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取播放模式失败'
    };
  }
}