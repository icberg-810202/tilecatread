// LeanCloud 数据访问层

// 检查 LeanCloud 是否已初始化
function checkLeanCloudInitialized() {
  if (typeof LEANCLOUD_CONFIG === 'undefined' || typeof LEANCLOUD_CONFIG.AV === 'undefined') {
    console.error('❌ LeanCloud 未初始化，请检查 SDK 是否正确加载');
    return false;
  }
  return true;
}

// 用户注册
async function registerUser(phone, password) {
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    return {
      success: false,
      message: '系统初始化失败，请刷新页面重试'
    };
  }
  try {
    // 检查手机号是否已存在
    const query = new LEANCLOUD_CONFIG.AV.Query('_User');
    query.equalTo('mobilePhoneNumber', phone);
    const users = await query.find();
    
    if (users.length > 0) {
      throw new Error('手机号已注册');
    }
    
    // 创建用户
    const user = new LEANCLOUD_CONFIG.AV.User();
    user.setUsername(phone);
    user.setPassword(password);
    user.setMobilePhoneNumber(phone);
    
    await user.signUp();
    
    return {
      success: true,
      message: '注册成功',
      data: {
        phone: phone,
        id: user.id
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
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    return {
      success: false,
      message: '系统初始化失败，请刷新页面重试'
    };
  }
  try {
    const user = await LEANCLOUD_CONFIG.AV.User.logIn(phone, password);
    
    return {
      success: true,
      message: '登录成功',
      data: {
        phone: user.get('mobilePhoneNumber'),
        id: user.id
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
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    return {
      success: false,
      message: '系统初始化失败，请刷新页面重试'
    };
  }
  try {
    // 获取当前用户
    const user = LEANCLOUD_CONFIG.AV.User.current();
    if (!user) {
      throw new Error('请先登录');
    }
    
    // 创建书籍对象
    const Book = LEANCLOUD_CONFIG.AV.Object.extend('Book');
    const book = new Book();
    book.set('title', title);
    book.set('author', author);
    book.set('user', user);
    
    const result = await book.save();
    
    return {
      success: true,
      message: '书籍添加成功',
      data: {
        id: result.id,
        title: title,
        author: author,
        createdAt: result.createdAt
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
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    return {
      success: false,
      message: '系统初始化失败，请刷新页面重试'
    };
  }
  try {
    // 获取当前用户
    const user = LEANCLOUD_CONFIG.AV.User.current();
    if (!user) {
      throw new Error('请先登录');
    }
    
    // 查询书籍
    const Book = LEANCLOUD_CONFIG.AV.Object.extend('Book');
    const bookQuery = new LEANCLOUD_CONFIG.AV.Query(Book);
    bookQuery.equalTo('objectId', bookId);
    const book = await bookQuery.first();
    
    if (!book) {
      throw new Error('书籍不存在');
    }
    
    // 创建语录对象
    const Quote = LEANCLOUD_CONFIG.AV.Object.extend('Quote');
    const quote = new Quote();
    quote.set('content', content);
    quote.set('page', page);
    quote.set('tags', tags);
    quote.set('book', book);
    quote.set('user', user);
    
    const result = await quote.save();
    
    return {
      success: true,
      message: '语录添加成功',
      data: {
        id: result.id,
        content: content,
        page: page,
        tags: tags,
        createdAt: result.createdAt
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
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    return {
      success: false,
      message: '系统初始化失败，请刷新页面重试'
    };
  }
  try {
    // 获取当前用户
    const user = LEANCLOUD_CONFIG.AV.User.current();
    if (!user) {
      throw new Error('请先登录');
    }
    
    // 查询书籍
    const Book = LEANCLOUD_CONFIG.AV.Object.extend('Book');
    const query = new LEANCLOUD_CONFIG.AV.Query(Book);
    query.equalTo('user', user);
    query.descending('createdAt');
    
    const books = await query.find();
    
    const result = books.map(book => ({
      id: book.id,
      title: book.get('title'),
      author: book.get('author'),
      createdAt: book.createdAt
    }));
    
    return {
      success: true,
      data: result
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
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    return {
      success: false,
      message: '系统初始化失败，请刷新页面重试'
    };
  }
  try {
    // 获取当前用户
    const user = LEANCLOUD_CONFIG.AV.User.current();
    if (!user) {
      throw new Error('请先登录');
    }
    
    // 查询书籍
    const Book = LEANCLOUD_CONFIG.AV.Object.extend('Book');
    const bookQuery = new LEANCLOUD_CONFIG.AV.Query(Book);
    bookQuery.equalTo('objectId', bookId);
    const book = await bookQuery.first();
    
    if (!book) {
      throw new Error('书籍不存在');
    }
    
    // 查询语录
    const Quote = LEANCLOUD_CONFIG.AV.Object.extend('Quote');
    const query = new LEANCLOUD_CONFIG.AV.Query(Quote);
    query.equalTo('book', book);
    query.equalTo('user', user);
    query.descending('createdAt');
    
    const quotes = await query.find();
    
    const result = quotes.map(quote => ({
      id: quote.id,
      content: quote.get('content'),
      page: quote.get('page'),
      tags: quote.get('tags'),
      createdAt: quote.createdAt
    }));
    
    return {
      success: true,
      data: result
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
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    // 返回空数组而不是错误，以保持启动页正常工作
    return {
      success: true,
      data: []
    };
  }
  try {
    // 获取当前用户
    const user = LEANCLOUD_CONFIG.AV.User.current();
    if (!user) {
      // 未登录用户返回空数组
      return {
        success: true,
        data: []
      };
    }
    
    // 查询语录
    const Quote = LEANCLOUD_CONFIG.AV.Object.extend('Quote');
    const query = new LEANCLOUD_CONFIG.AV.Query(Quote);
    query.equalTo('user', user);
    query.limit(limit * 2); // 多获取一些用于随机选择
    
    const quotes = await query.find();
    
    // 随机选择
    const shuffled = quotes.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);
    
    const result = selected.map(quote => ({
      id: quote.id,
      content: quote.get('content'),
      page: quote.get('page'),
      tags: quote.get('tags'),
      createdAt: quote.createdAt
    }));
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取随机语录失败'
    };
  }
}

// 更新播放模式
async function updatePlaybackMode(userId, mode) {
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    return {
      success: false,
      message: '系统初始化失败，请刷新页面重试'
    };
  }
  try {
    // 获取当前用户
    const user = LEANCLOUD_CONFIG.AV.User.current();
    if (!user) {
      throw new Error('请先登录');
    }
    
    // 更新用户播放模式
    user.set('playbackMode', mode);
    await user.save();
    
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
  // 检查初始化
  if (!checkLeanCloudInitialized()) {
    // 返回默认模式而不是错误，以保持功能正常
    return {
      success: true,
      data: 'random'
    };
  }
  try {
    // 获取当前用户
    const user = LEANCLOUD_CONFIG.AV.User.current();
    if (!user) {
      return {
        success: true,
        data: 'random' // 默认返回随机模式
      };
    }
    
    const mode = user.get('playbackMode') || 'random';
    
    return {
      success: true,
      data: mode
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '获取播放模式失败'
    };
  }
}