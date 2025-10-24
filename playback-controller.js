// 播放模式控制器
// 此文件处理语录播放模式相关的所有功能

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

// 更新播放UI（选中的单选按钮）
function updatePlaybackUI() {
    if (!currentUser || currentBookIndex === null) return;
    
    const settings = loadPlaybackSettings(currentUser);
    
    // 更新单选按钮状态
    const radios = document.getElementsByName('playbackMode');
    radios.forEach(radio => {
        if (radio.value === settings.mode) {
            radio.checked = true;
        }
    });
    
    // 更新选择摘要
    updateSelectionSummary();
}

// 更新选择摘要信息
function updateSelectionSummary() {
    const summaryElement = document.getElementById('selectionSummary');
    if (!summaryElement || !currentUser || currentBookIndex === null) return;
    
    const settings = loadPlaybackSettings(currentUser);
    const selectedCount = settings.selectedQuotes.filter(q => q.bookIndex === currentBookIndex).length;
    const book = userDatabase[currentUser].books[currentBookIndex];
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
    }
    
    summaryElement.innerHTML = `
        当前模式：<strong>${modeText}</strong> | 
        本书已选：<strong>${selectedCount}</strong>/${totalQuotes}条 | 
        全部已选：<strong>${settings.selectedQuotes.length}</strong>条
    `;
}

// 切换语录选中状态
function toggleQuoteSelection(bookIndex, quoteIndex) {
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
    renderQuotesList();
    updatePlaybackHint(settings.mode, settings.selectedQuotes.length);
}

// 检查语录是否被选中
function isQuoteSelected(bookIndex, quoteIndex) {
    if (!currentUser) return false;
    
    const settings = loadPlaybackSettings(currentUser);
    return settings.selectedQuotes.some(
        q => q.bookIndex === bookIndex && q.quoteIndex === quoteIndex
    );
}

// 切换播放模式
function changePlaybackMode(newMode) {
    if (!currentUser) {
        console.error('用户未登录');
        return;
    }
    
    console.log('=== 切换播放模式 ===');
    const settings = loadPlaybackSettings(currentUser);
    const oldMode = settings.mode;
    console.log('旧模式:', oldMode, '新模式:', newMode);
    console.log('切换前的索引:', settings.currentIndex);
    
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
    
    console.log('准备保存的设置:', JSON.stringify(settings));
    
    // 保存设置
    const saved = savePlaybackSettings(currentUser, settings);
    
    // 验证是否保存成功
    if (saved) {
        const verified = loadPlaybackSettings(currentUser);
        console.log('✅ 保存后验证 - 模式:', verified.mode, '索引:', verified.currentIndex);
        if (newMode === 'sequential' && verified.currentIndex !== 0) {
            console.error('❌ 警告：索引未正确重置！实际值:', verified.currentIndex);
        }
    }
    
    // 更新UI
    updatePlaybackHint(newMode, settings.selectedQuotes.length);
    updateSelectionSummary();
    
    // 重要：无论切换到什么模式，都重新渲染列表以更新复选框状态
    // 从单条重复切换到其他模式时，需要启用所有复选框
    // 切换到单条重复时，需要禁用其他复选框
    if (typeof renderQuotesList === 'function') {
        renderQuotesList();
        console.log('已重新渲染语录列表，复选框状态已更新');
    }
    
    console.log(`播放模式已切换: ${oldMode} → ${newMode}`);
}

// 初始化播放控制面板
function initPlaybackController() {
    if (!currentUser || currentBookIndex === null) return;
    
    const settings = loadPlaybackSettings(currentUser);
    
    // 更新单选按钮状态
    const radios = document.getElementsByName('playbackMode');
    radios.forEach(radio => {
        if (radio.value === settings.mode) {
            radio.checked = true;
        }
    });
    
    // 更新提示信息
    updatePlaybackHint(settings.mode, settings.selectedQuotes.length);
    
    // 更新选择摘要
    updateSelectionSummary();
    
    console.log('播放控制面板已初始化');
}
