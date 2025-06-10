// 调试工具脚本

// 切换调试面板显示/隐藏
function toggleDebugPanel() {
    const panel = document.getElementById('debug-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// 输出调试信息
function debugLog(message) {
    const output = document.getElementById('debug-output');
    if (output) {
        const time = new Date().toLocaleTimeString();
        output.innerHTML += `<div>[${time}] ${message}</div>`;
        output.scrollTop = output.scrollHeight;
    }
    console.log(message);
}

// 调试房间列表
function debugRooms() {
    const rooms = document.getElementById('rooms');
    const items = rooms ? rooms.querySelectorAll('.room-item') : [];
    debugLog(`房间数量: ${items.length}`);
    
    // 获取当前房间ID
    const activeRoom = document.querySelector('.room-item.active');
    const activeRoomId = activeRoom ? activeRoom.dataset.id : 'none';
    debugLog(`当前选中房间ID: ${activeRoomId}`);
    
    // 检查localStorage中的token
    const token = localStorage.getItem('token');
    debugLog(`Token存在: ${!!token}`);
    
    // 手动检查API响应
    fetch('/api/rooms', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Debug': 'true',
            'Cache-Control': 'no-cache'
        }
    })
    .then(response => response.json())
    .then(data => {
        debugLog(`API返回房间数: ${data.rooms ? data.rooms.length : 0}`);
        
        // 比较DOM和API数据
        const domIds = Array.from(items).map(item => item.dataset.id);
        const apiIds = data.rooms ? data.rooms.map(room => room.id.toString()) : [];
        
        const missingInDom = apiIds.filter(id => !domIds.includes(id));
        const missingInApi = domIds.filter(id => !apiIds.includes(id));
        
        if (missingInDom.length > 0) {
            debugLog(`API中有但DOM中没有的房间ID: ${missingInDom.join(', ')}`);
            debugLog('这些房间应该显示但未显示！');
        }
        
        if (missingInApi.length > 0) {
            debugLog(`DOM中有但API中没有的房间ID: ${missingInApi.join(', ')}`);
        }
        
        if (missingInDom.length === 0 && missingInApi.length === 0 && apiIds.length > 0) {
            debugLog('DOM和API数据一致');
        }
        
        // 显示完整的房间数据
        if (data.rooms && data.rooms.length > 0) {
            debugLog('API返回的房间列表:');
            data.rooms.forEach(room => {
                debugLog(`ID: ${room.id}, 名称: ${room.name}, 创建者: ${room.creator}`);
            });
        }
    })
    .catch(error => {
        debugLog(`API请求错误: ${error.message}`);
    });
}

// 强制刷新页面和本地数据
function forceRefresh() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    // 记住验证信息
    sessionStorage.setItem('refresh_token', token);
    sessionStorage.setItem('refresh_username', username);
    
    // 清除可能的缓存
    fetch('/api/rooms', {
        method: 'GET', 
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(() => {
        debugLog('缓存清除请求已发送');
        // 强制刷新页面，忽略缓存
        window.location.reload(true);
    })
    .catch(() => {
        // 如果API请求失败也刷新页面
        window.location.reload(true);
    });
}

// 检查API状态
function checkApiStatus() {
    const token = localStorage.getItem('token');
    debugLog('正在检查API状态...');
    
    // 构建测试请求
    const requests = [
        { url: '/api/rooms', method: 'GET' },
        { url: '/api/verify', method: 'GET' }
    ];
    
    // 执行所有请求
    Promise.all(requests.map(req => 
        fetch(req.url, {
            method: req.method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Debug': 'true',
                'Cache-Control': 'no-cache'
            }
        })
        .then(response => ({ 
            url: req.url, 
            status: response.status,
            ok: response.ok
        }))
        .catch(error => ({ 
            url: req.url, 
            error: error.message 
        }))
    ))
    .then(results => {
        results.forEach(result => {
            if (result.error) {
                debugLog(`${result.url}: 请求错误 - ${result.error}`);
            } else {
                debugLog(`${result.url}: ${result.status} ${result.ok ? '(成功)' : '(失败)'}`);
            }
        });
        
        // 检查是否所有API都正常
        const allOk = results.every(r => r.ok);
        debugLog(`API总体状态: ${allOk ? '正常' : '有错误'}`);
        
        // 尝试加载房间列表
        if (allOk && typeof loadRooms === 'function') {
            setTimeout(loadRooms, 500);
        }
    })
    .catch(error => {
        debugLog(`API状态检查错误: ${error.message}`);
    });
}

// 直接从数据库手动添加房间
function syncRooms() {
    debugLog('正在尝试同步房间...');
    const token = localStorage.getItem('token');
    
    // 发送特殊的同步请求
    fetch('/api/rooms?sync=true&force=true', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Force-Sync': 'true',
            'Cache-Control': 'no-cache, no-store'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.rooms) {
            debugLog(`同步成功，获取到 ${data.rooms.length} 个房间`);
            
            // 立即用最新数据更新界面
            const roomsList = document.getElementById('rooms');
            if (roomsList) {
                // 清空现有房间列表
                roomsList.innerHTML = '';
                
                // 手动填充房间
                if (data.rooms.length > 0) {
                    data.rooms.forEach(room => {
                        const roomItem = document.createElement('div');
                        roomItem.className = 'room-item';
                        if (room.is_creator) roomItem.classList.add('is-creator');
                        roomItem.dataset.id = room.id;
                        roomItem.dataset.name = room.name;
                        roomItem.dataset.description = room.description;
                        roomItem.dataset.creator = room.creator;
                        
                        const roomName = document.createElement('div');
                        roomName.className = 'room-name';
                        roomName.textContent = room.name;
                        
                        const roomDesc = document.createElement('div');
                        roomDesc.className = 'room-description';
                        roomDesc.textContent = room.description;
                        
                        const roomCreator = document.createElement('div');
                        roomCreator.className = 'room-creator';
                        roomCreator.textContent = `创建者: ${room.creator} · ${formatDate ? formatDate(room.created_at) : room.created_at}`;
                        
                        roomItem.appendChild(roomName);
                        roomItem.appendChild(roomDesc);
                        roomItem.appendChild(roomCreator);
                        
                        roomItem.addEventListener('click', function() {
                            if (typeof switchRoom === 'function') {
                                switchRoom(room.id, room.name, room.description, room.is_creator);
                            } else {
                                debugLog('警告: switchRoom函数未定义');
                                // 备用处理逻辑
                                document.querySelectorAll('.room-item.active').forEach(r => r.classList.remove('active'));
                                roomItem.classList.add('active');
                                
                                const roomNameElem = document.getElementById('current-room-name');
                                if (roomNameElem) roomNameElem.textContent = room.name;
                                
                                const roomDescElem = document.getElementById('current-room-description');
                                if (roomDescElem) roomDescElem.textContent = room.description;
                            }
                        });
                        
                        roomsList.appendChild(roomItem);
                    });
                    
                    debugLog('房间列表已手动更新');
                } else {
                    roomsList.innerHTML = '<div class="no-room-message">暂无可用房间，请创建一个新房间</div>';
                }
            } else {
                debugLog('错误: 找不到房间列表元素');
            }
        } else {
            debugLog('同步失败: ' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        debugLog(`同步请求错误: ${error.message}`);
    });
}

// 格式化日期的辅助函数
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.error('日期格式化错误:', e);
        return dateString;
    }
}

// 初始化调试面板
function initDebugPanel() {
    // 如果已经存在调试面板，则不重复创建
    if (document.getElementById('debug-panel')) return;
    
    // 创建调试面板
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = 'display: block; z-index: 9999; position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-size: 12px;';
    
    panel.innerHTML = `
        <h4 style="margin: 0 0 5px 0; color: #fff; font-size: 14px;">房间列表调试工具</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 5px;">
            <button onclick="debugRooms()">检查房间列表</button>
            <button onclick="loadRooms()">重新加载房间</button>
            <button onclick="forceRefresh()">强制刷新页面</button>
            <button onclick="checkApiStatus()">检查API状态</button>
            <button onclick="syncRooms()">强制同步房间</button>
            <button onclick="toggleDebugPanel()">隐藏面板</button>
        </div>
        <div id="debug-output" style="margin-top: 5px; max-height: 150px; overflow-y: auto; font-size: 11px; background: rgba(0,0,0,0.5); padding: 5px; border-radius: 3px;"></div>
    `;
    
    // 添加到页面
    document.body.appendChild(panel);
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        #debug-panel button {
            background: #444;
            color: white;
            border: 1px solid #555;
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }
        #debug-panel button:hover {
            background: #666;
        }
    `;
    document.head.appendChild(style);
    
    // 初始日志
    debugLog('调试面板已初始化，可以开始诊断房间列表问题');
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化调试面板
    setTimeout(initDebugPanel, 1000);
}); 