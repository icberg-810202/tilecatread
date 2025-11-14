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
        mode: 'random', // 默认随机播放
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
    const hintElement = document.getElementById('playbackHint');
    if (!hintElement) return;
    
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
    hintElement.textContent = hint;
}

// 更新播放UI（选中的单选按钮和.checked类）- 增强版
function updatePlaybackUI() {
    if (!currentUser || currentBookIndex === null) return;
    
    const settings = loadPlaybackSettings(currentUser);
    
    // 更新单选按钮状态
    const radios = document.getElementsByName('playbackMode');
    radios.forEach(radio => {
        const option = radio.closest('.playback-mode-option');
        if (radio.value === settings.mode) {
            radio.checked = true;
            // 为兼容性，添加 .checked 类（:has() 选择器不被所有浏览器支持）
            if (option) {
                option.classList.add('checked');
            }
            console.log('✅ 已选中模式:', settings.mode);
        } else {
            radio.checked = false;
            // 移除其他选项的 .checked 类
            if (option) {
                option.classList.remove('checked');
            }
        }
    });
    
    // 更新选择摘要
    updateSelectionSummary();
}

// 更新选择摘要信息 - 修复版
function updateSelectionSummary() {
    const summaryElement = document.getElementById('selectionSummary');
    if (!summaryElement) {
        console.warn('⚠️ 选择摘要元素未找到');
        return;
    }
    
    try {
        const user = getCurrentUserSafe();
        if (!user || currentBookIndex === null) {
            summaryElement.innerHTML = '请先选择书籍';
            return;
        }
        
        const settings = loadPlaybackSettings(user.username || user.id || user);
        const book = getCurrentBook();
        
        if (!book) {
            summaryElement.innerHTML = '书籍数据加载失败';
            return;
        }
        
        const selectedCount = settings.selectedQuotes.filter(q => q.bookIndex === currentBookIndex).length;
        const totalQuotes = book.quotes ? book.quotes.length : 0;
        
        let modeText = '';
        switch (settings.mode) {
            case 'sequential':
                modeText = '顺序播放';
                break;
            case 'random':
                modeText = '随机播放';
                break;
            case 'single':
                modeText = '单条重复';
                break;
            default:
                modeText = '未知模式';
        }
        
        summaryElement.innerHTML = `
            当前模式：<strong>${modeText}</strong> | 
            本书已选：<strong>${selectedCount}</strong>/${totalQuotes}条 | 
            全部已选：<strong>${settings.selectedQuotes.length}</strong>条
        `;
    } catch (error) {
        console.error('更新选择摘要信息失败:', error);
        summaryElement.innerHTML = '数据处理错误';
    }
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
function changePlaybackMode(newMode) {
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
        const radios = document.getElementsByName('playbackMode');
        radios.forEach(radio => {
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
        updateSelectionSummary();
        
        // 重新渲染语录列表（如果函数存在）
        if (typeof renderQuotesList === 'function') {
            renderQuotesList();
            console.log('语录列表已重新渲染');
        }
        
        console.log(`播放模式已切换: ${oldMode} → ${newMode}`);
    } catch (error) {
        console.error('切换播放模式失败:', error);
    }
}

// 初始化播放控制面板 - 增强版
function initPlaybackController() {
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
        
        // 更新单选按钮状态 - 包含 .checked 类（兼容性）
        const radios = document.getElementsByName('playbackMode');
        if (radios.length > 0) {
            radios.forEach(radio => {
                const option = radio.closest('.playback-mode-option');
                if (radio.value === settings.mode) {
                    radio.checked = true;
                    // 为兼容性，添加 .checked 类（:has() 选择器不被所有浏览器支持）
                    if (option) {
                        option.classList.add('checked');
                    }
                } else {
                    radio.checked = false;
                    // 移除其他选项的 .checked 类
                    if (option) {
                        option.classList.remove('checked');
                    }
                }
            });
            console.log('✅ 播放模式单选按钮已更新》.checked类深接填充成功');
        } else {
            console.warn('⚠️ 播放模式单选按钮未找到');
        }
        
        // 更新提示信息
        updatePlaybackHint(settings.mode, settings.selectedQuotes.length);
        console.log('✅ 提示信息已更新');
        
        // 更新选择摘要
        updateSelectionSummary();
        console.log('✅ 选择摘要已更新');
        
        console.log('✅ 播放控制面板已初始化');
        return true;
    } catch (error) {
        console.error('初始化播放控制器失败:', error);
        return false;
    }
}
