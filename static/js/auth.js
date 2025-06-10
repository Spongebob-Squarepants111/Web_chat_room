// DOM元素
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');

// 切换表单
loginTab.addEventListener('click', function() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', function() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// 登录表单提交
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    // 清除之前的消息
    loginMessage.textContent = '';
    loginMessage.classList.remove('success', 'error');
    
    // 发送登录请求
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loginMessage.textContent = '登录成功，正在跳转...';
            loginMessage.classList.add('success');
            
            // 存储令牌到本地存储
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            
            // 跳转到聊天页面
            setTimeout(() => {
                window.location.href = '/chat';
            }, 1000);
        } else {
            loginMessage.textContent = data.message || '登录失败，请检查用户名和密码';
            loginMessage.classList.add('error');
        }
    })
    .catch(error => {
        loginMessage.textContent = '登录请求失败，请稍后再试';
        loginMessage.classList.add('error');
        console.error('登录请求错误:', error);
    });
});

// 注册表单提交
registerForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('register-email').value;
    
    // 清除之前的消息
    registerMessage.textContent = '';
    registerMessage.classList.remove('success', 'error');
    
    // 发送注册请求
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password,
            email: email
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            registerMessage.textContent = '注册成功，请登录';
            registerMessage.classList.add('success');
            
            // 清空表单
            document.getElementById('register-username').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-email').value = '';
            
            // 切换到登录表单
            setTimeout(() => {
                loginTab.click();
            }, 1500);
        } else {
            registerMessage.textContent = data.message || '注册失败，请稍后再试';
            registerMessage.classList.add('error');
        }
    })
    .catch(error => {
        registerMessage.textContent = '注册请求失败，请稍后再试';
        registerMessage.classList.add('error');
        console.error('注册请求错误:', error);
    });
});

// 检查用户是否已登录
window.addEventListener('DOMContentLoaded', function() {
    // 先清除任何现有的令牌，禁用自动登录
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    
    // 可以在此处添加其他初始化代码
}); 