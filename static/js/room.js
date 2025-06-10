// DOM 元素
const roomList = document.getElementById('rooms');
const createRoomBtn = document.getElementById('create-room-btn');
const createRoomModal = document.getElementById('create-room-modal');
const closeCreateModal = document.getElementById('close-create-modal');
const createRoomForm = document.getElementById('create-room-form');
// 已移除 deleteRoomBtn
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const closeDeleteModal = document.getElementById('close-delete-modal');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const backBtn = document.getElementById('back-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentRoomName = document.getElementById('current-room-name');
const currentRoomDescription = document.getElementById('current-room-description');

// 全局变量
let currentRoomId = null;

// 检查用户是否已登录
const token = localStorage.getItem('token');
const username = localStorage.getItem('username');

console.log('检查登录状态:', token ? '已登录' : '未登录', username);

if (!token || !username) {
    // 如果没有登录，重定向到登录页面
    console.log('未登录，正在重定向到登录页面...');
    alert('请先登录后再访问房间列表');
    window.location.href = '/';
}

// 加载房间列表
function loadRooms() {
    console.log('正在加载房间列表...');
    console.log('当前Token:', token);
    
    fetch('/api/rooms', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('API响应状态:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API返回数据:', data);
        if (data.success) {
            // 清空房间列表
            roomList.innerHTML = '';
            
            // 添加房间到列表
            if (data.rooms && data.rooms.length > 0) {
                console.log(`加载了 ${data.rooms.length} 个房间`);
                data.rooms.forEach(room => {
                const roomItem = document.createElement('div');
                roomItem.className = `room-item ${room.is_creator ? 'is-creator' : ''}`;
                roomItem.dataset.id = room.id;
                roomItem.dataset.name = room.name;
                roomItem.dataset.description = room.description;
                roomItem.dataset.creator = room.creator;
                
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
                    switchRoom(room.id, room.name, room.description, room.is_creator);
                });
                
                roomList.appendChild(roomItem);
            });
            }
        } else {
            console.error('加载房间失败:', data.message);
        }
    })
    .catch(error => {
        console.error('加载房间请求错误:', error);
    });
}

// 切换到选中的房间
function switchRoom(roomId, roomName, roomDescription, isCreator) {
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
    currentRoomDescription.textContent = roomDescription;
    
    // 清空消息容器
    messagesContainer.innerHTML = '';
    
    // 加载房间消息
    loadRoomMessages();
}

// 加载房间消息
function loadRoomMessages() {
    if (!currentRoomId) return;
    
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
            console.error('加载房间消息失败:', data.message);
        }
    })
    .catch(error => {
        console.error('加载房间消息请求错误:', error);
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
    
    if (!currentRoomId) {
        alert('请先选择一个房间');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message) return;
    
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
});

// 创建房间
createRoomBtn.addEventListener('click', () => {
    createRoomModal.style.display = 'block';
});

closeCreateModal.addEventListener('click', () => {
    createRoomModal.style.display = 'none';
});

createRoomForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const roomName = document.getElementById('room-name').value.trim();
    const roomDescription = document.getElementById('room-description').value.trim();
    
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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 关闭模态框
            createRoomModal.style.display = 'none';
            
            // 清空表单
            document.getElementById('room-name').value = '';
            document.getElementById('room-description').value = '';
            
            // 重新加载房间列表
            loadRooms();
        } else {
            alert('创建房间失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('创建房间请求错误:', error);
    });
});

// 删除房间
deleteRoomBtn.addEventListener('click', () => {
    if (!currentRoomId) return;
    deleteConfirmModal.style.display = 'block';
});

closeDeleteModal.addEventListener('click', () => {
    deleteConfirmModal.style.display = 'none';
});

cancelDelete.addEventListener('click', () => {
    deleteConfirmModal.style.display = 'none';
});

confirmDelete.addEventListener('click', () => {
    if (!currentRoomId) return;
    
    deleteRoom(currentRoomId);
});

// 返回大厅
backBtn.addEventListener('click', () => {
    window.location.href = '/chat';
});

// 退出登录
logoutBtn.addEventListener('click', function() {
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    
    // 重定向到登录页面
    window.location.href = '/';
});

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 点击模态框外部区域关闭模态框
window.addEventListener('click', (event) => {
    if (event.target === createRoomModal) {
        createRoomModal.style.display = 'none';
    }
    if (event.target === deleteConfirmModal) {
        deleteConfirmModal.style.display = 'none';
    }
});

// 定期刷新消息和房间列表
function setupRefresh() {
    // 每5秒刷新一次消息
    setInterval(() => {
        if (currentRoomId) {
            loadRoomMessages();
        }
    }, 5000);
    
    // 每30秒刷新一次房间列表
    setInterval(loadRooms, 30000);
}

// 删除房间函数
function deleteRoom(roomId) {
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
            // 如果当前显示的是被删除的房间，则重置当前房间
            if (currentRoomId === roomId) {
                currentRoomId = null;
                currentRoomName.textContent = '选择房间';
                currentRoomDescription.textContent = '';
                messagesContainer.innerHTML = '';
            }
            
            // 重新加载房间列表
            loadRooms();
        } else {
            alert('删除房间失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('删除房间请求错误:', error);
    });
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', function() {
    loadRooms();
    setupRefresh();
});
