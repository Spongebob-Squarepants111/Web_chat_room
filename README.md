# 网页聊天室项目

一个基于C++实现的Web聊天室项目，使用MySQL存储用户信息、使用Redis缓存token和存储聊天消息。

## 功能特点

- 用户注册和登录
- 用户认证（使用Redis缓存token）
- 实时聊天
- 聊天历史记录
- 清晰的Web界面

## 技术栈

- **后端**：C++17
- **数据库**：MySQL - 用于存储用户信息
- **缓存**：Redis - 用于缓存用户token和存储聊天消息
- **前端**：HTML, CSS, JavaScript
- **服务器**：自定义HTTP服务器

## 依赖项

- C++17编译器（如GCC或Clang）
- MySQL客户端库
- hiredis（Redis客户端库）
- nlohmann/json（JSON处理库，构建时自动下载）
- pthread库

## 编译和安装

### 使用CMake

```bash
mkdir -p build && cd build
cmake ..
make
sudo make install
```

### 使用Make

```bash
make
sudo make install
```

## 配置

在运行前，确保你已经：

1. 启动了MySQL服务器，并创建了一个数据库（默认为`chat_room`）
2. 启动了Redis服务器
3. 在`main.cpp`中配置了正确的数据库连接信息：

```cpp
g_chat_handler.initialize("127.0.0.1", 6379,  // Redis配置
                          "127.0.0.1", 3306,  // MySQL配置
                          "用户名", "密码", "数据库名");
```

## 运行

```bash
chat_server
```

或者在项目目录中：

```bash
make run
```

服务器默认在8080端口启动。你可以通过浏览器访问`http://localhost:8080`来使用聊天室。

## 项目结构

- `include/` - 头文件目录
- `src/` - 源文件目录
- `static/` - 静态资源（CSS, JS等）
- `templates/` - HTML模板
- `main.cpp` - 程序入口
- `CMakeLists.txt` - CMake构建配置
- `Makefile` - Make构建配置

## API说明

- `/api/register` - 用户注册
- `/api/login` - 用户登录
- `/api/verify` - 验证用户token
- `/api/send` - 发送消息
- `/api/messages` - 获取消息历史

## 贡献

欢迎通过提交Issue或Pull Request来贡献代码。

## 许可证

MIT License
