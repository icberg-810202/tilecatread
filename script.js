// 作者数据库（只读）
const authorDatabase = [
    { id: 1, book: '人间失格', author: '太宰治', quote: '我的不幸恰恰在于我缺乏拒绝的能力，我害怕一旦拒绝别人，便会在彼此心里留下永远无法愈合的裂痕。' },
    { id: 2, book: '小王子', author: '安托万·德·圣-埃克苏佩里', quote: '所有的大人都曾经是小孩，虽然，只有少数的人记得。' },
    { id: 3, book: '活着', author: '余华', quote: '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。' },
    { id: 4, book: '百年孤独', author: '加西亚·马尔克斯', quote: '过去都是假的，回忆是一条没有归途的路。' },
    { id: 5, book: '围城', author: '钱钟书', quote: '婚姻是一座围城，城外的人想进去，城里的人想出来。' }
];

// 用户数据库结构（健壮解析，防止本地存储损坏导致崩溃）
let userDatabase = {};
try {
    const storedUserDb = localStorage.getItem('userDatabase');
    userDatabase = storedUserDb ? JSON.parse(storedUserDb) : {};
} catch (error) {
    console.warn('本地用户数据损坏，已重置。', error);
    localStorage.removeItem('userDatabase');
    userDatabase = {};
}

// 当前用户信息
let currentUser = null;
let countdown = 5;
let timer = null;
let currentBookIndex = null;

// 页面切换 - 修复关键函数
function showPage(pageId) {
    console.log('切换到页面:', pageId);
    
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.add('hidden');
    });
    
    // 显示指定页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error('找不到页面:', pageId);
    }
}

// 启动页逻辑
function startCountdown() {
    console.log('启动倒计时');
    showRandomQuote();
    
    document.getElementById('countdown').textContent = countdown;
    
    timer = setInterval(() => {
        countdown--;
        document.getElementById('countdown').textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(timer);
            goToLoginPage();
        }
    }, 1000);
}

function showRandomQuote() {
    // 检查是否有登录记录
    const lastUser = localStorage.getItem('lastLoginUser');
    
    if (lastUser && userDatabase[lastUser]) {
        // 获取用户选中的书籍
        const userBooks = userDatabase[lastUser].books;
        const selectedBooks = userBooks.filter(book => book.selected);
        const allQuotes = [];
        
        // 只从选中的书籍中获取语录
        selectedBooks.forEach(book => {
            book.quotes.forEach(quote => {
                allQuotes.push({
                    quote: quote,
                    book: book.name,
                    author: book.author
                });
            });
        });
        
        if (allQuotes.length > 0) {
            // 从选中的书籍语录中随机选择
            const randomIndex = Math.floor(Math.random() * allQuotes.length);
            const randomQuote = allQuotes[randomIndex];
            document.getElementById('splashQuoteContent').textContent = `"${randomQuote.quote}"`;
            document.getElementById('splashQuoteSource').textContent = `——《${randomQuote.book}》`;
            console.log('显示用户选中书籍的语录:', randomQuote.book);
            return;
        }
        
        // 如果没有选中的书籍，但从所有书籍中获取语录
        userBooks.forEach(book => {
            book.quotes.forEach(quote => {
                allQuotes.push({
                    quote: quote,
                    book: book.name,
                    author: book.author
                });
            });
        });
        
        if (allQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * allQuotes.length);
            const randomQuote = allQuotes[randomIndex];
            document.getElementById('splashQuoteContent').textContent = `"${randomQuote.quote}"`;
            document.getElementById('splashQuoteSource').textContent = `——《${randomQuote.book}》`;
            console.log('显示用户所有书籍的语录:', randomQuote.book);
            return;
        }
    }
    
    // 显示作者数据库语录（第一次登录或用户无语录）
    const randomIndex = Math.floor(Math.random() * authorDatabase.length);
    const randomQuote = authorDatabase[randomIndex];
    document.getElementById('splashQuoteContent').textContent = `"${randomQuote.quote}"`;
    document.getElementById('splashQuoteSource').textContent = `——《${randomQuote.book}》`;
    console.log('显示作者数据库语录:', randomQuote.book);
}

function goToLoginPage() {
    console.log('跳转到登录页');
    showPage('loginPage');
}

// 用户登录
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    if (userDatabase[username] && userDatabase[username].password === password) {
        currentUser = username;
        localStorage.setItem('lastLoginUser', username);
        document.getElementById('currentUser').textContent = username;
        showPage('mainPage');
        renderBooksGrid();
        updateSelectionInfo();
    } else {
        alert('用户名或密码错误');
    }
}

// 用户注册
function showRegister() {
    showPage('registerPage');
}

function backToLogin() {
    showPage('loginPage');
}

function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    if (userDatabase[username]) {
        alert('用户名已存在');
        return;
    }
    
    // 创建新用户
    userDatabase[username] = {
        password: password,
        books: []
    };
    
    saveUserDatabase();
    alert('注册成功！');
    backToLogin();
}

// 退出登录
function logout() {
    currentUser = null;
    showPage('loginPage');
    // 清空表单
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// 返回书库函数
function backToLibrary() {
    // 清空搜索框
    document.getElementById('searchInput').value = '';
    
    // 显示全部书籍
    renderBooksGrid();
    
    console.log('已返回书库，显示全部书籍');
}

// 搜索功能
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
    
    // 显示搜索结果的书籍数量
    const totalBooks = userBooks.length;
    const foundBooks = filteredBooks.length;
    
    if (foundBooks === 0) {
        alert(`搜索 "${searchTerm}" 没有找到相关书籍\n\n共 ${totalBooks} 本书籍`);
    } else {
        console.log(`搜索完成：找到 ${foundBooks} 本书籍`);
    }
}

// 更新选择信息提示
function updateSelectionInfo() {
    const userBooks = userDatabase[currentUser].books;
    const selectedBooks = userBooks.filter(book => book.selected);
    const infoElement = document.getElementById('selectionInfo');
    
    if (selectedBooks.length > 0) {
        const selectedBookNames = selectedBooks.map(book => `《${book.name}》`).join('、');
        infoElement.innerHTML = `✅ 已选择 ${selectedBooks.length} 本书籍：${selectedBookNames}<br><small>启动页将显示选中书籍的随机语录</small>`;
    } else {
        infoElement.innerHTML = `📚 共 ${userBooks.length} 本书籍<br><small>勾选书籍，启动页将显示选中书籍的语录</small>`;
    }
}

// 切换书籍选择状态
function toggleBookSelection(bookIndex, event) {
    event.stopPropagation();
    
    const userBooks = userDatabase[currentUser].books;
    userBooks[bookIndex].selected = !userBooks[bookIndex].selected;
    
    saveUserDatabase();
    renderBooksGrid();
    updateSelectionInfo();
}

// 书籍管理
function renderBooksGrid(filteredBooks = null) {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';
    
    const userBooks = userDatabase[currentUser].books;
    const booksToRender = filteredBooks || userBooks;
    const isSearching = filteredBooks !== null;
    
    // 添加搜索状态提示
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
        bookCard.innerHTML = `
            <input type="checkbox" class="book-selection" ${book.selected ? 'checked' : ''} 
                   onclick="toggleBookSelection(${actualIndex}, event)">
            <div class="book-actions">
                <button class="delete-book-btn" onclick="deleteBook(${actualIndex}, event)">×</button>
            </div>
            <div class="book-content">
                <div class="book-icon">📚</div>
                <div class="book-title">${book.name}</div>
                <div class="book-author">${book.author}</div>
                <div class="quote-count">${book.quotes.length} 条语录</div>
            </div>
        `;
        
        bookCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-book-btn') && 
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

function backToMain() {
    showPage('mainPage');
    renderBooksGrid();
    updateSelectionInfo();
}

// 添加书籍
function showAddBookModal() {
    document.getElementById('addBookModal').classList.remove('hidden');
}

function closeAddBookModal() {
    document.getElementById('addBookModal').classList.add('hidden');
    document.getElementById('newBookName').value = '';
    document.getElementById('newBookAuthor').value = '';
}

function addNewBook() {
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
        selected: false // 新添加的书籍默认不选中
    };
    
    userDatabase[currentUser].books.push(newBook);
    saveUserDatabase();
    closeAddBookModal();
    renderBooksGrid();
    updateSelectionInfo();
}

// 删除书籍
function deleteBook(bookIndex, event) {
    event.stopPropagation();
    
    const book = userDatabase[currentUser].books[bookIndex];
    if (confirm(`确定要删除《${book.name}》吗？`)) {
        userDatabase[currentUser].books.splice(bookIndex, 1);
        saveUserDatabase();
        renderBooksGrid();
        updateSelectionInfo();
    }
}

// 语录管理
function renderQuotesList() {
    const list = document.getElementById('quotesList');
    const book = userDatabase[currentUser].books[currentBookIndex];
    
    list.innerHTML = '';
    
    if (book.quotes.length === 0) {
        list.innerHTML = '<div class="quote-item">暂无语录</div>';
        return;
    }
    
    book.quotes.forEach((quote, index) => {
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-item';
        quoteItem.innerHTML = `
            <div class="quote-text">"${quote}"</div>
            <div class="quote-actions">
                <button class="delete-quote-btn" onclick="deleteQuote(${index})">删除</button>
            </div>
        `;
        list.appendChild(quoteItem);
    });
}

function showAddQuoteModal() {
    document.getElementById('addQuoteModal').classList.remove('hidden');
}

function closeAddQuoteModal() {
    document.getElementById('addQuoteModal').classList.add('hidden');
    document.getElementById('newQuoteText').value = '';
}

function addNewQuote() {
    const text = document.getElementById('newQuoteText').value.trim();
    
    if (!text) {
        alert('请输入语录内容');
        return;
    }
    
    userDatabase[currentUser].books[currentBookIndex].quotes.push(text);
    saveUserDatabase();
    closeAddQuoteModal();
    renderQuotesList();
}

function deleteQuote(quoteIndex) {
    if (confirm('确定要删除这条语录吗？')) {
        userDatabase[currentUser].books[currentBookIndex].quotes.splice(quoteIndex, 1);
        saveUserDatabase();
        renderQuotesList();
    }
}

// 数据存储
function saveUserDatabase() {
    localStorage.setItem('userDatabase', JSON.stringify(userDatabase));
}

// 初始化 - 修复关键部分
window.onload = function() {
    console.log('页面加载完成，初始化应用');
    
    // 确保只显示启动页
    showPage('splashPage');
    
    // 开始倒计时
    startCountdown();
    
    // 添加跳过功能
    const quoteCard = document.querySelector('.quote-card');
    if (quoteCard) {
        quoteCard.addEventListener('click', function() {
            console.log('用户点击跳过');
            clearInterval(timer);
            goToLoginPage();
        });
    }
    
    // 搜索回车键支持
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
};