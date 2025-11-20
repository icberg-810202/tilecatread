// 播放模式控制器
// 此文件处理语录播放模式相关的所有功能

// ==========================================
// 依赖检查和安全访问函数
// ==========================================

/**
 * 检查依赖是否可用
 */
function checkDependencies() {
    const required = ['dataManager', 'currentUser'];
    const missing = required.filter(item => typeof window[item] === 'undefined');
    
    if (missing.length > 0) {
        console.warn('⚠️ 播放控制器依赖缺失:', missing);
        return false;
    }
    return true;
}

/**
 * 安全地获取当前用户
 */
function getCurrentUserSafe() {
    if (typeof dataManager !== 'undefined' && dataManager.currentUser) {
        return dataManager.currentUser.username || currentUser;
    }
    return currentUser;
}

/**
 * 安全地获取用户书籍
 */
async function getUserBooksSafe(username) {
    try {
        if (typeof dataManager !== 'undefined' && dataManager.getUserBooks) {
            return await dataManager.getUserBooks(username);
        }
        
        // 回退到原来的逻辑
        if (typeof userDatabase !== 'undefined' && userDatabase[username]) {
            return userDatabase[username].books || [];
        }
        
        return [];
    } catch (error) {
        console.error('获取用户书籍失败:', error);
        return [];
    }
}

/**
 * 获取当前书籍
 */
function getCurrentBook() {
    try {
        const user = getCurrentUserSafe();
        if (!user || currentBookIndex === null) return null;
        
        // 尝试从 userDatabase 获取
        if (typeof userDatabase !== 'undefined' && userDatabase[user] && userDatabase[user].books) {
            return userDatabase[user].books[currentBookIndex];
        }
        
        // 如果 userDatabase 不可用，稍后可以优化处理
        return null;
    } catch (error) {
        console.error('获取当前书籍失败:', error);
        return null;
    }
}

// ==========================================
// 加载用户的播放设置
function loadPlaybackSettings(username) {
    try {
        const savedSettings = localStorage.getItem('playbackSettings_' + username);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            console.log('已加载播放设置:', settings);
            return settings;
        }
    } catch (e) {
        console.error('加载播放设置失败:', e);
    }
    
    // 返回默认设置
    return {
        mode: 'sequential', // 默认顺序播放
        selectedQuotes: [],
        currentIndex: 0
    };
}

// 保存用户的播放设置
function savePlaybackSettings(username, settings) {
    try {
        localStorage.setItem('playbackSettings_' + username, JSON.stringify(settings));
        console.log('已保存播放设置:', settings);
        return true;
    } catch (e) {
        console.error('保存播放设置失败:', e);
        return false;
    }
}

// 更新播放提示信息
function updatePlaybackHint(mode, count) {
    const mainHintElement = document.getElementById('mainPlaybackHint');
    
    let hint = '';
    switch (mode) {
        case 'sequential':
            if (count > 0) {
                hint = `已选择${count}条语录，将按顺序在启动页显示`;
            } else {
                hint = `顺序播放模式：将按顺序显示所有书籍的语录`;
            }
            break;
        case 'random':
            if (count > 0) {
                hint = `已选择${count}条语录，将随机在启动页显示`;
            } else {
                hint = `随机播放模式：将随机显示所有书籍的语录`;
            }
            break;
        case 'single':
            if (count === 1) {
                hint = `已选择1条语录，每次启动都显示这条语录`;
            } else if (count > 1) {
                hint = `单条重复模式只支持选择1条语录，当前选中${count}条`;
            } else {
                hint = `单条重复模式：将显示第一条语录`;
            }
            break;
    }
    if (mainHintElement) mainHintElement.textContent = hint;
}

/**
 * 获取启动页应该显示的语录
 * @param {string} username - 用户名
 * @param {string} deviceId - 设备ID
 * @returns {Promise<Object|null>} 语录对象或null
 */
async function getSplashQuote(username, deviceId) {
    try {
        console.log('📚 获取启动页语录 - 用户:', username, '设备:', deviceId);
        
        // 1. 检查是否有勾选的书籍
        if (typeof dataManager === 'undefined' || !dataManager.getSelectedBooksForDevice) {
            console.warn('⚠️ dataManager 不可用，跳过勾选书籍检查');
            return null;
        }
        
        // 传递用户ID作为第二个参数，以便在未登录状态也能获取
        const selectedBookIds = await dataManager.getSelectedBooksForDevice(deviceId, username);
        console.log('📚 设备勾选的书籍ID:', selectedBookIds);
        
        if (!selectedBookIds || selectedBookIds.length === 0) {
            console.log('⚠️ 没有勾选任何书籍，清除语录选择并使用默认语录');
            
            // 清除用户的语录选择
            const settings = loadPlaybackSettings(username);
            if (settings.selectedQuotes && settings.selectedQuotes.length > 0) {
                console.log('🧹 清除已选中的语录');
                settings.selectedQuotes = [];
                settings.currentIndex = 0;
                savePlaybackSettings(username, settings);
            }
            
            return null;
        }
        
        // 2. 获取用户的所有书籍
        const userBooks = await dataManager.getUserBooks(username);
        console.log('📚 用户书籍总数:', userBooks.length);
        
        // 3. 获取播放设置（提前获取，用于判断是否有选中的语录）
        const settings = loadPlaybackSettings(username);
        console.log('🎵 播放模式:', settings.mode);
        console.log('📝 已选中的语录:', settings.selectedQuotes);
        
        // 4. 收集语录：如果有选中的语录，只收集选中的；否则收集所有勾选书籍的语录
        const allQuotes = [];
        
        if (settings.selectedQuotes && settings.selectedQuotes.length > 0) {
            // 有选中的语录，只收集选中的语录
            console.log('🎯 检测到用户选中的语录，优先使用');
            settings.selectedQuotes.forEach(sq => {
                const book = userBooks.find(b => b.id === sq.bookId);
                if (book && book.quotes) {
                    const quote = book.quotes.find(q => q.id === sq.quoteId);
                    if (quote) {
                        allQuotes.push({
                            text: quote.text,
                            bookName: book.name,
                            author: book.author,
                            page: quote.page || '',
                            bookId: book.id,
                            quoteId: quote.id
                        });
                        console.log(`✅ 添加选中语录: 《${book.name}》 - "${quote.text.substring(0, 20)}..."`);
                    }
                }
            });
        } else {
            // 没有选中的语录，收集所有勾选书籍的所有语录
            console.log('📚 没有选中的语录，收集所有勾选书籍的语录');
            
            // 按照书籍添加顺序（userBooks 中的顺序）遍历
            // 只收集被勾选的书籍
            userBooks.forEach(book => {
                // 检查该书籍是否被勾选
                if (selectedBookIds.includes(book.id)) {
                    if (book.quotes && book.quotes.length > 0) {
                        console.log(`📖 书籍 "${book.name}" 包含 ${book.quotes.length} 条语录`);
                        book.quotes.forEach(quote => {
                            allQuotes.push({
                                text: quote.text,
                                bookName: book.name,
                                author: book.author,
                                page: quote.page || '',
                                bookId: book.id,
                                quoteId: quote.id
                            });
                        });
                    }
                }
            });
        }
        
        console.log('📊 总计收集到 ' + allQuotes.length + ' 条语录');
        
        if (allQuotes.length === 0) {
            console.log('⚠️ 勾选的书籍中没有语录，将使用默认语录');
            return null;
        }
        
        // 5. 根据播放模式选择语录
        let selectedQuote = null;
        
        switch (settings.mode) {
            case 'sequential':
                // 顺序播放：使用上次的索引，按顺序循环
                const currentIndex = settings.currentIndex || 0;
                const nextIndex = currentIndex % allQuotes.length;
                selectedQuote = allQuotes[nextIndex];
                
                // 更新索引以便下次使用
                settings.currentIndex = (nextIndex + 1) % allQuotes.length;
                savePlaybackSettings(username, settings);
                console.log(`▶️ 顺序播放: 第 ${nextIndex + 1}/${allQuotes.length} 条`);
                break;
                
            case 'random':
                // 随机播放
                const randomIndex = Math.floor(Math.random() * allQuotes.length);
                selectedQuote = allQuotes[randomIndex];
                console.log(`🔀 随机播放: 第 ${randomIndex + 1}/${allQuotes.length} 条`);
                break;
                
            case 'single':
                // 单条重复：总是显示第一条
                selectedQuote = allQuotes[0];
                console.log('🔂 单条重复: 第 1 条');
                break;
                
            default:
                // 默认使用第一条
                selectedQuote = allQuotes[0];
        }
        
        console.log('✅ 已选择语录:', selectedQuote.bookName);
        return selectedQuote;
        
    } catch (error) {
        console.error('❗ 获取启动页语录失败:', error);
        return null;
    }
}

// 更新播放UI（选中的单选按钮和.checked类）
async function updatePlaybackUI() {
    if (!currentUser) return;
    
    const settings = loadPlaybackSettings(currentUser);
    
    // 更新主页面的单选按钮状态
    const mainRadios = document.getElementsByName('mainPlaybackMode');
    mainRadios.forEach(radio => {
        const option = radio.closest('.playback-mode-option');
        if (radio.value === settings.mode) {
            radio.checked = true;
            if (option) {
                option.classList.add('checked');
            }
        } else {
            radio.checked = false;
            if (option) {
                option.classList.remove('checked');
            }
        }
    });
    
    // 更新选择摘要
    await updateSelectionSummary();
}

// 更新选择摘要信息 - 简化版（只显示播放模式）
async function updateSelectionSummary() {
    // 此函数已简化，不再统计语录数量
    // 仅保留函数以兼容其他代码调用
    console.log('✅ 选择摘要更新完成（已简化）');
}

// 切换语录选中状态
function toggleQuoteSelection(bookIndex, quoteIndex) {
    try {
        if (!currentUser) {
            console.error('用户未登录');
            return;
        }
        
        const settings = loadPlaybackSettings(currentUser);
        const quoteId = { bookIndex, quoteIndex };
        
        // 查找是否已选中
        const existingIndex = settings.selectedQuotes.findIndex(
            q => q.bookIndex === bookIndex && q.quoteIndex === quoteIndex
        );
        
        if (existingIndex >= 0) {
            // 已选中，取消选中
            settings.selectedQuotes.splice(existingIndex, 1);
            console.log('取消选中语录:', bookIndex, quoteIndex);
        } else {
            // 未选中，添加选中
            
            // 如果是单条重复模式，清空其他选中的语录
            if (settings.mode === 'single') {
                settings.selectedQuotes = [quoteId];
                console.log('单条重复模式：清空其他选中，仅选中当前语录:', bookIndex, quoteIndex);
            } else {
                settings.selectedQuotes.push(quoteId);
                console.log('选中语录:', bookIndex, quoteIndex);
            }
        }
        
        // 保存设置
        savePlaybackSettings(currentUser, settings);
        
        // 更新UI
        if (typeof renderQuotesList === 'function') {
            renderQuotesList();
        }
        updatePlaybackHint(settings.mode, settings.selectedQuotes.length);
    } catch (error) {
        console.error('切换语录选中失败:', error);
    }
}

// 检查语录是否被选中
function isQuoteSelected(bookIndex, quoteIndex) {
    try {
        if (!currentUser) return false;
        
        const settings = loadPlaybackSettings(currentUser);
        return settings.selectedQuotes.some(
            q => q.bookIndex === bookIndex && q.quoteIndex === quoteIndex
        );
    } catch (error) {
        console.error('检查选中状态失败:', error);
        return false;
    }
}

// 切换播放模式 - 增强版
async function changePlaybackMode(newMode) {
    console.log('=== 切换播放模式 ===');
    
    try {
        const user = getCurrentUserSafe();
        if (!user) {
            console.error('❌ 用户未登录');
            alert('请先登录');
            return;
        }
        
        const settings = loadPlaybackSettings(user.username || user.id || user);
        const oldMode = settings.mode;
        
        console.log('旧模式:', oldMode, '新模式:', newMode);
        
        // 如果从其他模式切换到顺序播放，重置播放索引为0
        if (oldMode !== 'sequential' && newMode === 'sequential') {
            settings.currentIndex = 0;
            console.log('✅ 切换到顺序播放模式，播放索引已重置为0');
        }
        
        // 更新播放模式
        settings.mode = newMode;
        
        // 如果是单条重复模式且选中了多条语录，只保留第一条
        if (newMode === 'single' && settings.selectedQuotes.length > 1) {
            settings.selectedQuotes = [settings.selectedQuotes[0]];
            console.log('切换到单条重复模式，只保留第一条选中的语录');
        }
        
        // 保存设置
        const saved = savePlaybackSettings(user.username || user.id || user, settings);
        
        if (saved) {
            console.log('✅ 播放模式已保存');
        } else {
            console.error('❌ 播放模式保存失败');
        }
        
        // 更新单选按钮状态 - 添加/移除 .checked 类
        const mainRadios = document.getElementsByName('mainPlaybackMode');
        mainRadios.forEach(radio => {
            const option = radio.closest('.playback-mode-option');
            if (radio.value === newMode) {
                radio.checked = true;
                if (option) {
                    option.classList.add('checked');
                }
            } else {
                radio.checked = false;
                if (option) {
                    option.classList.remove('checked');
                }
            }
        });
        console.log('✅ 单选按钮状态已更新');
        
        // 更新UI
        updatePlaybackHint(newMode, settings.selectedQuotes.length);
        await updateSelectionSummary();
        
        // 重新渲染书籍列表，以更新勾选框的禁用状态
        if (typeof loadUserData === 'function') {
            await loadUserData();
            console.log('✅ 书籍列表已重新渲染');
        }
        
        // 如果当前在语录页面，也要重新渲染
        if (typeof renderQuotes === 'function' && typeof currentBookId !== 'undefined' && currentBookId) {
            await renderQuotes();
            console.log('✅ 语录页面已重新渲染');
        }
        
        console.log(`播放模式已切换: ${oldMode} → ${newMode}`);
    } catch (error) {
        console.error('切换播放模式失败:', error);
    }
}

// 初始化播放控制面板 - 增强版
async function initPlaybackController() {
    console.log('🔧 初始化播放控制器...');
    
    try {
        // 检查依赖
        if (!checkDependencies()) {
            console.warn('⚠️ 播放控制器初始化失败：依赖缺失');
            return false;
        }
        
        // 获取当前用户
        const user = getCurrentUserSafe();
        if (!user) {
            console.warn('⚠️ 播放控制器初始化失败：用户未登录');
            return false;
        }
        
        // 书籍是可选的（包容会示书籍选择页面）
        // if (currentBookIndex === null) {
        //     console.warn('⚠️ 播放控制器初始化警告：未选择书籍');
        //     // 不是致命错误，继续初始化
        // }
        
        const settings = loadPlaybackSettings(user.username || user.id || user);
        
        // 更新主页面的单选按钮状态
        const mainRadios = document.getElementsByName('mainPlaybackMode');
        if (mainRadios.length > 0) {
            mainRadios.forEach(radio => {
                const option = radio.closest('.playback-mode-option');
                if (radio.value === settings.mode) {
                    radio.checked = true;
                    if (option) {
                        option.classList.add('checked');
                    }
                } else {
                    radio.checked = false;
                    if (option) {
                        option.classList.remove('checked');
                    }
                }
            });
            console.log('✅ 主页面播放模式单选按钮已更新');
        }
        
        // 更新提示信息
        updatePlaybackHint(settings.mode, settings.selectedQuotes.length);
        console.log('✅ 提示信息已更新');
        
        // 更新选择摘要（异步）
        await updateSelectionSummary();
        console.log('✅ 选择摘要已更新');
        
        console.log('✅ 播放控制面板已初始化');
        return true;
    } catch (error) {
        console.error('初始化播放控制器失败:', error);
        return false;
    }
}
