// DOM 元素
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const logoutBtn = document.getElementById('logout-btn');
const usernameSpan = document.getElementById('username');
const roomsBtn = document.getElementById('rooms-btn');
const roomsList = document.getElementById('rooms');
const globalChatBtn = document.getElementById('global-chat');
const createRoomBtn = document.getElementById('create-room-btn');
const createRoomModal = document.getElementById('create-room-modal');
const closeCreateModal = document.getElementById('close-create-modal');
const createRoomForm = document.getElementById('create-room-form');
// 已移除 deleteRoomBtn
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const closeDeleteModal = document.getElementById('close-delete-modal');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');
const currentRoomName = document.getElementById('current-room-name');

// 帮助函数：安全添加事件监听器
function safeAddEventListener(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
        return true;
    } else {
        return false;
    }
}

// 全局变量
let currentRoomId = null;

// 检查用户是否已登录
const token = localStorage.getItem('token');
const username = localStorage.getItem('username');

if (!token || !username) {
    // 如果没有登录，重定向到登录页面
    window.location.href = '/';
} else {
    // 显示用户名
    if (usernameSpan) {
        usernameSpan.textContent = username;
    }
}

// 格式化日期
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
        return dateString; // 出错时返回原始日期字符串
    }
}

// 加载房间列表
function loadRooms() {
    const timestamp = new Date().getTime(); // 添加时间戳防止缓存
    
    // 显示加载状态
    if (!roomsList) {
        return;
    }

    // 保留现有的房间列表，只需显示加载中状态而不清空列表
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-rooms';
    loadingIndicator.textContent = '正在更新房间列表...';
    
    // 如果列表为空才完全替换，否则只添加加载指示器
    if (!roomsList.hasChildNodes() || (roomsList.childNodes.length === 1 && roomsList.querySelector('.no-room-message'))) {
        roomsList.innerHTML = '';
        roomsList.appendChild(loadingIndicator);
    } else {
        // 添加加载指示器但保留现有房间
        roomsList.appendChild(loadingIndicator);
    }
    
    // 确保有token
    const currToken = localStorage.getItem('token');
    if (!currToken) {
        roomsList.innerHTML = '<div class="error-message">请先登录</div>';
        return;
    }
    
    fetch('/api/rooms', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${currToken}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API请求失败: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        // 移除加载指示器
        const loadingElement = roomsList.querySelector('.loading-rooms');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        if (data.success) {
            // 只有在确定获取了有效数据后才清空房间列表
            // 获取当前活动的房间，以便保持其激活状态
            const activeRoomId = currentRoomId;
            
            roomsList.innerHTML = '';
            
            // 添加房间到列表
            if (data.rooms && data.rooms.length > 0) {
                console.log('加载到房间列表:', data.rooms);
                
                data.rooms.forEach(room => {
                    // 在这里记录房间是否是当前用户创建的
                    console.log(`房间ID ${room.id}, 名称: ${room.name}, 创建者: ${room.creator}, 是否为创建者: ${room.is_creator}`);
                    
                    const roomItem = document.createElement('div');
                    roomItem.className = `room-item ${room.is_creator ? 'is-creator' : ''}`;
                    if (room.id == activeRoomId) {
                        roomItem.classList.add('active');
                    }
                    roomItem.dataset.id = room.id;
                    roomItem.dataset.name = room.name;
                    roomItem.dataset.description = room.description;
                    roomItem.dataset.creator = room.creator;
                    roomItem.dataset.isCreator = room.is_creator;
                    
                    const roomName = document.createElement('div');
                    roomName.className = 'room-name';
                    roomName.textContent = room.name;
                    
                    const roomDescription = document.createElement('div');
                    roomDescription.className = 'room-description';
                    roomDescription.textContent = room.description;
                    
                    const roomCreator = document.createElement('div');
                    roomCreator.className = 'room-creator';
                    roomCreator.textContent = `创建者: ${room.creator} · ${formatDate(room.created_at)}`;
                    
                    roomItem.appendChild(roomName);
                    roomItem.appendChild(roomDescription);
                    roomItem.appendChild(roomCreator);
                    
                    // 点击房间切换到该房间
                    roomItem.addEventListener('click', () => {
                        // 确保将is_creator作为布尔值传递，而不是字符串
                        const isCreator = room.is_creator === true || room.is_creator === "true";
                        console.log(`点击切换房间，房间ID: ${room.id}, 是否为创建者: ${isCreator}`);
                        switchRoom(room.id, room.name, room.description, isCreator);
                    });
                    
                    roomsList.appendChild(roomItem);
                });
            } else {
                // 没有房间，显示提示
                roomsList.innerHTML = '<div class="no-room-message">没有可用聊天室，点击"创建房间"按钮创建一个吧！</div>';
            }
        } else {
            // 加载房间列表失败
            roomsList.innerHTML = '<div class="error-message">加载房间失败: ' + (data.message || '未知错误') + '</div>';
        }
    })
    .catch(error => {
        // 处理错误
        roomsList.innerHTML = '<div class="error-message">加载房间失败: ' + error.message + '</div>';
    });
}

// 切换到选中的房间
function switchRoom(roomId, roomName, roomDescription, isCreator) {
    console.log('switchRoom被调用:', {
        roomId, 
        roomName, 
        roomDescription, 
        isCreator,
        isCreatorType: typeof isCreator
    });
    
    // 取消之前选中的房间
    const activeRoom = document.querySelector('.room-item.active');
    if (activeRoom) {
        activeRoom.classList.remove('active');
    }
    
    // 选中当前房间
    const roomItem = document.querySelector(`.room-item[data-id="${roomId}"]`);
    if (roomItem) {
        roomItem.classList.add('active');
    }
    
    // 更新全局变量和显示
    currentRoomId = roomId;
    currentRoomName.textContent = roomName;
    
    // 如果有房间描述，显示在房间名下方
    const roomDescElem = document.getElementById('current-room-description');
    if (roomDescElem) {
        roomDescElem.textContent = roomDescription || '';
    }
    
    // 控制静态删除按钮
    const staticDeleteBtn = document.getElementById('static-delete-btn');
    
    // 确保isCreator是布尔值
    const isCreatorBool = Boolean(isCreator);
    console.log('检测用户是否是创建者:', isCreatorBool);
    
    if (staticDeleteBtn) {
        if (isCreatorBool) {
            console.log('用户是房间创建者，显示删除按钮');
            staticDeleteBtn.style.display = 'inline-block';
        } else {
            console.log('用户不是房间创建者，隐藏删除按钮');
            staticDeleteBtn.style.display = 'none';
        }
    } else {
        console.error('无法找到静态删除按钮!');
    }
    
    // 清空消息容器并显示加载状态
    messagesContainer.innerHTML = '<div class="loading-messages">正在加载聊天记录...</div>';
    
    // 加载房间消息
    loadRoomMessages();
}

// 加载房间消息
function loadRoomMessages() {
    if (!currentRoomId) return;
    
    // 显示加载状态
    messagesContainer.innerHTML = '<div class="loading-messages">加载消息中...</div>';
    
    fetch('/api/rooms/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            room_id: currentRoomId
        })
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // 清空消息容器
            messagesContainer.innerHTML = '';
            
            // 添加消息到容器
            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(message => {
                    appendMessage(message.username, message.content, message.timestamp);
                });
                // 滚动到底部
                scrollToBottom();
            } else {
                // 无消息时显示提示
                messagesContainer.innerHTML = '<div class="no-messages">暂无消息记录</div>';
            }
        } else {
            console.error('加载房间消息失败:', data.message);
            messagesContainer.innerHTML = `<div class="error-message">加载失败: ${data.message || '未知错误'}</div>`;
        }
    })
    .catch(error => {
        console.error('加载房间消息请求错误:', error);
        messagesContainer.innerHTML = '<div class="error-message">加载消息出错，请稍后重试</div>';
    });
}

// 加载历史消息
function loadMessages() {
    fetch('/api/messages', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 清空消息容器
            messagesContainer.innerHTML = '';
            
            // 添加消息到容器
            data.messages.forEach(message => {
                appendMessage(message.username, message.content, message.timestamp);
            });
            
            // 滚动到底部
            scrollToBottom();
        } else {
            console.error('加载消息失败:', data.message);
        }
    })
    .catch(error => {
        console.error('加载消息请求错误:', error);
    });
}

// 添加消息到聊天界面
function appendMessage(sender, content, timestamp) {
    const messageItem = document.createElement('div');
    messageItem.className = `message-item ${sender === username ? 'self' : 'other'}`;
    
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'message-sender';
    senderSpan.textContent = sender;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = timestamp;
    
    messageHeader.appendChild(senderSpan);
    messageHeader.appendChild(timeSpan);
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageItem.appendChild(messageHeader);
    messageItem.appendChild(messageContent);
    
    messagesContainer.appendChild(messageItem);
}

// 滚动到底部
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 发送消息
messageForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    // 检查是否有选中的房间
    if (currentRoomId) {
        // 发送房间消息
        fetch('/api/rooms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                room_id: currentRoomId,
                message: message
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 清空输入框
                messageInput.value = '';
                
                // 重新加载消息
                loadRoomMessages();
            } else {
                console.error('发送消息失败:', data.message);
            }
        })
        .catch(error => {
            console.error('发送消息请求错误:', error);
        });
    } else {
        // 发送全局消息
        fetch('/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: message
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 清空输入框
                messageInput.value = '';
                
                // 重新加载消息
                loadMessages();
            } else {
                console.error('发送消息失败:', data.message);
            }
        })
        .catch(error => {
            console.error('发送消息请求错误:', error);
        });
    }
});

// 创建房间
function setupCreateRoomButton() {
    // 保存最后创建的房间ID，避免重复创建
    window._lastCreatedRoomId = null;
    
    const createBtn = document.getElementById('create-room-btn');
    if (createBtn) {
        // 先清除旧的事件监听器
        const newCreateBtn = createBtn.cloneNode(true);
        createBtn.parentNode.replaceChild(newCreateBtn, createBtn);
        
        // 创建房间按钮点击事件 - 打开模态框
        newCreateBtn.addEventListener('click', function() {
            const modal = document.getElementById('create-room-modal');
            if (modal) modal.style.display = 'block';
        });
        
        // 创建房间表单
        const form = document.getElementById('create-room-form');
        if (form) {
            // 移除可能存在的旧事件监听器
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // 添加新的表单提交事件
            newForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const roomNameInput = document.getElementById('room-name');
                const roomDescInput = document.getElementById('room-description');
                
                if (!roomNameInput || !roomDescInput) {
                    return;
                }
                
                const roomName = roomNameInput.value.trim();
                const roomDescription = roomDescInput.value.trim();
                
                if(!roomName || !roomDescription) {
                    alert('请填写所有必填字段');
                    return;
                }
                
                // 防止重复提交
                if (window.isSubmittingRoom) {
                    return;
                }
                
                window.isSubmittingRoom = true;
                
                // 保存创建的房间信息供后续使用
                window._lastRoomName = roomName;
                window._lastRoomDescription = roomDescription;
                
                fetch('/api/rooms/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: roomName,
                        description: roomDescription
                    })
                })
                .then(response => {
                    window.isSubmittingRoom = false;
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // 关闭模态框
                        const modal = document.getElementById('create-room-modal');
                        if(modal) {
                            modal.style.display = 'none';
                        }
                        
                        // 检查是否是重复创建的房间
                        if (window._lastCreatedRoomId === data.room_id) {
                            return; // 如果是重复的房间ID，不再继续处理
                        }
                        
                        // 记录本次创建的房间ID
                        window._lastCreatedRoomId = data.room_id;
                        
                        // 清空表单
                        roomNameInput.value = '';
                        roomDescInput.value = '';
                        
                        // 显示成功提示
                        alert('创建房间成功');
                        
                        // 创建自定义事件通知
                        const roomCreatedEvent = new CustomEvent('roomCreated', { 
                            detail: { 
                                roomData: data,
                                roomName: window._lastRoomName,
                                roomDescription: window._lastRoomDescription
                            } 
                        });
                        document.dispatchEvent(roomCreatedEvent);
                    } else {
                        alert('创建房间失败: ' + data.message);
                    }
                })
                .catch(error => {
                    window.isSubmittingRoom = false;
                    alert('创建房间时发生错误: ' + error.message);
                });
            });
        }
    }
}

// 设置删除房间功能
function setupDeleteRoomButton() {
    console.log('setupDeleteRoomButton 被调用');
    
    // 用setTimeout确保DOM完全加载
    setTimeout(() => {
        const confirmModal = document.getElementById('delete-confirm-modal');
        console.log('确认模态框元素:', confirmModal);
        
        if (confirmModal) {
            // 设置模态框按钮事件
            const closeBtn = document.getElementById('close-delete-modal');
            const cancelBtn = document.getElementById('cancel-delete');
            const confirmBtn = document.getElementById('confirm-delete');
            
            console.log('获取的删除相关按钮:', {
                closeBtn: Boolean(closeBtn),
                cancelBtn: Boolean(cancelBtn),
                confirmBtn: Boolean(confirmBtn)
            });
            
            // 克隆并替换按钮，移除旧事件处理器
            if (closeBtn) {
                const newCloseBtn = closeBtn.cloneNode(true);
                closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
                
                newCloseBtn.addEventListener('click', function() {
                    console.log('关闭删除模态框');
                    confirmModal.style.display = 'none';
                });
            }
            
            if (cancelBtn) {
                const newCancelBtn = cancelBtn.cloneNode(true);
                cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
                
                newCancelBtn.addEventListener('click', function() {
                    console.log('取消删除');
                    confirmModal.style.display = 'none';
                });
            }
            
            if (confirmBtn) {
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                newConfirmBtn.addEventListener('click', function() {
                    if (!currentRoomId) {
                        console.log('没有选中的房间ID，无法删除');
                        return;
                    }
                    
                    console.log('确认删除房间，ID:', currentRoomId);
                    
                    fetch('/api/rooms/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            room_id: currentRoomId
                        })
                    })
                    .then(response => {
                        console.log('删除请求响应状态:', response.status);
                        return response.json();
                    })
                    .then(data => {
                        console.log('删除请求响应数据:', data);
                        
                        if (data.success) {
                            // 关闭模态框
                            confirmModal.style.display = 'none';
                            
                            // 立即从DOM中删除该房间
                            const roomElement = document.querySelector(`.room-item[data-id="${currentRoomId}"]`);
                            if (roomElement) {
                                roomElement.remove();
                                console.log('从DOM中移除房间元素');
                            } else {
                                console.log('未找到房间DOM元素');
                            }
                            
                            // 重置UI到欢迎状态
                            currentRoomId = null;
                            currentRoomName.textContent = '欢迎使用聊天室';
                            
                            // 隐藏静态删除按钮
                            const staticDeleteBtn = document.getElementById('static-delete-btn');
                            if (staticDeleteBtn) {
                                staticDeleteBtn.style.display = 'none';
                            }
                            
                            messagesContainer.innerHTML = '<div class="welcome-message">请选择一个房间或创建新房间开始聊天</div>';
                            
                            // 重新加载房间列表
                            loadRooms();
                        } else {
                            console.error('删除房间失败:', data.message);
                            
                            const errorMsg = document.createElement('div');
                            errorMsg.className = 'error-message';
                            errorMsg.style.color = '#ff3333';
                            errorMsg.style.marginTop = '10px';
                            errorMsg.style.textAlign = 'center';
                            errorMsg.textContent = '删除失败: ' + data.message;
                            
                            // 查找模态框内容并添加错误信息
                            const modalContent = document.querySelector('#delete-confirm-modal .modal-content');
                            // 移除之前可能存在的错误信息
                            const oldError = modalContent.querySelector('.error-message');
                            if (oldError) {
                                oldError.remove();
                            }
                            
                            // 在按钮前插入错误信息
                            const buttonGroup = modalContent.querySelector('.form-group');
                            if (buttonGroup) {
                                modalContent.insertBefore(errorMsg, buttonGroup);
                            } else {
                                modalContent.appendChild(errorMsg);
                            }
                        }
                    })
                    .catch(error => {
                        console.error('删除房间请求错误:', error);
                        alert('删除房间时发生错误: ' + error.message);
                    });
                });
            }
        } else {
            console.warn('确认模态框不存在');
        }
    }, 500); // 等待500ms确保DOM加载完成
}

// 设置退出按钮
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        // 移除旧的事件监听器
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', function() {
            // 显示确认对话框
            if (confirm('您确定要退出吗？')) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/';
            }
        });
    }
}

// 设置模态框关闭事件
function setupModalCloseEvents() {
    // 关闭按钮
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        // 克隆并替换按钮，移除旧事件处理器
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function() {
            // 获取父模态框
            const modal = this.closest('.modal');
            if(modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 移除旧的点击事件监听器
    window.removeEventListener('click', modalOutsideClickHandler);
    
    // 添加新的点击事件监听器
    window.addEventListener('click', modalOutsideClickHandler);
}

// 处理模态框外部点击事件的函数
function modalOutsideClickHandler(event) {
    if(event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// 设置消息自动刷新
function setupMessageRefresh() {
    // 清除可能存在的旧定时器
    if (window.messageRefreshTimer) {
        clearInterval(window.messageRefreshTimer);
    }
    
    if (window.roomsRefreshTimer) {
        clearInterval(window.roomsRefreshTimer);
    }
    
    // 每30秒刷新一次消息
    window.messageRefreshTimer = setInterval(function() {
        if(currentRoomId) {
            loadRoomMessages(currentRoomId);
        }
    }, 30000);
    
    // 每60秒刷新一次房间列表
    window.roomsRefreshTimer = setInterval(function() {
        loadRooms();
    }, 60000);
}

// 紧急添加删除按钮的修复函数
// 不再需要这个函数，因为我们移除了相关按钮
function emergencyAddDeleteButton() {
    console.log('emergencyAddDeleteButton 已被禁用，不再需要此功能');
    return null;
}

// 删除房间的函数
function deleteRoom(roomId) {
    if (!roomId) return;
    
    console.log('执行删除房间操作，房间ID:', roomId);
    
    fetch('/api/rooms/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            room_id: roomId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 从DOM中移除该房间
            const roomElement = document.querySelector(`.room-item[data-id="${roomId}"]`);
            if (roomElement) {
                roomElement.remove();
            }
            
            // 重置UI到欢迎状态
            currentRoomId = null;
            currentRoomName.textContent = '欢迎使用聊天室';
            
            // 隐藏删除按钮
            const deleteBtn = document.getElementById('static-delete-btn');
            if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }
            
            messagesContainer.innerHTML = '<div class="welcome-message">请选择一个房间或创建新房间开始聊天</div>';
            
            // 重新加载房间列表
            loadRooms();
            
            alert('房间已成功删除');
        } else {
            alert('删除房间失败: ' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        alert('删除房间时发生错误: ' + error.message);
    });
}

// 添加一个新的删除房间按钮到页面顶部
function addVisibleDeleteButton() {
    // 创建删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.id = 'visible-delete-room-btn';
    deleteButton.textContent = '删除当前房间';
    deleteButton.style.backgroundColor = '#e74c3c';
    deleteButton.style.color = 'white';
    deleteButton.style.border = 'none';
    deleteButton.style.borderRadius = '4px';
    deleteButton.style.padding = '5px 10px';
    deleteButton.style.marginRight = '10px';
    deleteButton.style.fontWeight = 'bold';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.display = 'none'; // 默认隐藏，直到选择了房间

    // 找到退出按钮
    const logoutBtn = document.getElementById('logout-btn');
    
    // 如果找到退出按钮，将删除按钮插入到它前面
    if (logoutBtn && logoutBtn.parentNode) {
        console.log('找到退出按钮，将删除按钮插入到它前面');
        logoutBtn.parentNode.insertBefore(deleteButton, logoutBtn);
    } else {
        // 如果找不到退出按钮，则尝试找到用户信息区域
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            console.log('找到用户信息区域，将删除按钮添加到开头');
            userInfo.insertBefore(deleteButton, userInfo.firstChild);
        } else {
            // 如果还是找不到合适的位置，就添加到body
            console.log('未找到合适位置，将删除按钮添加到body');
            document.body.appendChild(deleteButton);
        }
    }

    // 添加点击事件
    deleteButton.addEventListener('click', function() {
        if (!currentRoomId) {
            alert('请先选择一个房间');
            return;
        }
        
        if (confirm('确定要删除此房间吗？此操作不可撤销。')) {
            console.log('执行删除房间操作，房间ID:', currentRoomId);
            
            fetch('/api/rooms/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    room_id: currentRoomId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 从DOM中移除该房间
                    const roomElement = document.querySelector(`.room-item[data-id="${currentRoomId}"]`);
                    if (roomElement) {
                        roomElement.remove();
                    }
                    
                    // 重置UI到欢迎状态
                    currentRoomId = null;
                    currentRoomName.textContent = '欢迎使用聊天室';
                    
                    // 隐藏删除按钮
                    deleteButton.style.display = 'none';
                    
                    messagesContainer.innerHTML = '<div class="welcome-message">请选择一个房间或创建新房间开始聊天</div>';
                    
                    // 重新加载房间列表
                    loadRooms();
                    
                    alert('房间已成功删除');
                } else {
                    alert('删除房间失败: ' + (data.message || '未知错误'));
                }
            })
            .catch(error => {
                alert('删除房间时发生错误: ' + error.message);
            });
        }
    });
    
    return deleteButton;
}

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查令牌是否有效
    if (!token || !username) {
        window.location.href = '/';
        return;
    }
    
    console.log('页面加载完成，设置静态删除按钮点击事件');
    
    // 设置静态删除按钮点击事件
    const staticDeleteBtn = document.getElementById('static-delete-btn');
    if (staticDeleteBtn) {
        staticDeleteBtn.addEventListener('click', function() {
            if (!currentRoomId) {
                alert('请先选择一个房间');
                return;
            }
            
            console.log('删除按钮被点击，当前房间ID:', currentRoomId);
            
            // 打开确认模态框
            const confirmModal = document.getElementById('delete-confirm-modal');
            if (confirmModal) {
                confirmModal.style.display = 'block';
            } else {
                // 如果没有模态框，直接确认删除
                if (confirm('确定要删除此房间吗？删除后将无法恢复。')) {
                    deleteRoom(currentRoomId);
                }
            }
        });
        
        console.log('静态删除按钮事件设置成功');
    } else {
        console.error('未找到静态删除按钮!');
    }
    
    // 设置初始界面
    if (currentRoomName) {
        currentRoomName.textContent = '欢迎使用聊天室';
    }
    if (messagesContainer) {
        messagesContainer.innerHTML = '<div class="welcome-message">请选择一个房间或创建新房间开始聊天</div>';
    }
    
    // 移除可能存在的自定义房间事件监听器
    const oldHandler = window._roomCreatedHandler;
    if (oldHandler) {
        document.removeEventListener('roomCreated', oldHandler);
    }
    
    // 监听自定义的房间创建事件，用于处理房间创建成功后的页面更新
    const roomCreatedHandler = function(event) {
        const data = event.detail.roomData;
        const roomName = event.detail.roomName;
        const roomDescription = event.detail.roomDescription;
        
        if (!data || !data.success) {
            return;
        }
        
        // 防止重复处理相同的房间创建事件
        if (window._processedRoomIds && window._processedRoomIds.includes(data.room_id)) {
            return;
        }
        
        // 记录已处理过的房间ID
        if (!window._processedRoomIds) {
            window._processedRoomIds = [];
        }
        window._processedRoomIds.push(data.room_id);
        
        // 立即将新房间添加到UI
        const roomsList = document.getElementById('rooms');
        if (!roomsList) {
            return;
        }
        
        // 获取房间创建信息
        const roomId = data.room_id;
        const currentUser = localStorage.getItem('username') || '未知用户';
        
        // 移除"无房间"提示，如果存在
        const noRoomMsg = roomsList.querySelector('.no-room-message');
        if (noRoomMsg) {
            noRoomMsg.remove();
        }
        
        // 取消激活其他房间
        const activeRooms = document.querySelectorAll('.room-item.active');
        activeRooms.forEach(room => room.classList.remove('active'));
        
        // 创建房间DOM元素
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item is-creator active'; // 标记为活动且创建者
        roomItem.dataset.id = roomId;
        roomItem.dataset.name = roomName;
        roomItem.dataset.description = roomDescription;
        roomItem.dataset.creator = currentUser;
        roomItem.dataset.isCreator = "true";
        
        const roomNameDiv = document.createElement('div');
        roomNameDiv.className = 'room-name';
        roomNameDiv.textContent = roomName;
        
        const roomDescDiv = document.createElement('div');
        roomDescDiv.className = 'room-description';
        roomDescDiv.textContent = roomDescription;
        
        const roomCreator = document.createElement('div');
        roomCreator.className = 'room-creator';
        const now = new Date();
        roomCreator.textContent = `创建者: ${currentUser} · ${formatDate(now)}`;
        
        roomItem.appendChild(roomNameDiv);
        roomItem.appendChild(roomDescDiv);
        roomItem.appendChild(roomCreator);
        
        // 添加点击事件
        roomItem.addEventListener('click', function() {
            switchRoom(roomId, roomName, roomDescription, true);
        });
        
        // 添加到列表的顶部
        if (roomsList.firstChild) {
            roomsList.insertBefore(roomItem, roomsList.firstChild);
        } else {
            roomsList.appendChild(roomItem);
        }
        
        // 自动切换到新房间
        switchRoom(roomId, roomName, roomDescription, true);
    };
    
    // 保存当前的事件处理器，以便将来移除
    window._roomCreatedHandler = roomCreatedHandler;
    document.addEventListener('roomCreated', roomCreatedHandler);
    
    // 初始化页面
    loadRooms();
    setupMessageRefresh();
    setupCreateRoomButton();
    setupLogoutButton();
    setupModalCloseEvents();
    
    // 设置确认删除按钮点击事件
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (!currentRoomId) {
                return;
            }
            
            deleteRoom(currentRoomId);
            
            // 关闭模态框
            const modal = document.getElementById('delete-confirm-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // 设置取消删除按钮点击事件
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            const modal = document.getElementById('delete-confirm-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
}); 