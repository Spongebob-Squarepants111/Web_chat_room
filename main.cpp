#include "include/server.h"
#include "include/chat_handler.h"
#include "include/client.h"
#include <iostream>
#include <string>
#include <fstream>
#include <sstream>
#include <unistd.h>
#include <limits.h>

// 处理URL中的查询参数，返回不带参数的基本路径
std::string removeQueryParams(const std::string& path) {
    size_t queryPos = path.find('?');
    if (queryPos != std::string::npos) {
        return path.substr(0, queryPos);
    }
    return path;
}

// 全局聊天处理器实例
ChatHandler g_chat_handler;

int main() {
    // 输出当前工作目录
    char cwd[PATH_MAX];
    if (getcwd(cwd, sizeof(cwd)) != nullptr) {
        std::cout << "Current working directory: " << cwd << std::endl;
    }

    // 初始化聊天处理器
    bool init_success = g_chat_handler.initialize("127.0.0.1", 6379, 
                                                 "127.0.0.1", 3306,
                                                 "chatuser", "chatpassword", "chat_room");
    if (!init_success) {
        std::cerr << "Failed to initialize chat handler" << std::endl;
        return 1;
    }
    
    // 创建HTTP服务器
    HttpServer server(8080);
    
    // 添加路由处理
    // 静态页面
    server.addHandler("/", [](const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
        std::ifstream file("./templates/index.html");
        if (!file) {
            std::cerr << "Error: Could not open index.html file" << std::endl;
            return std::string("<html><body><h1>Error: Index page not found</h1></body></html>");
        }
        std::stringstream buffer;
        buffer << file.rdbuf();
        return buffer.str();
    });
    
    server.addHandler("/chat", ApiClient::handleChatPage);
    server.addHandler("/room", ApiClient::handleRoomPage);
    
    // API路由
    server.addHandler("/api/login", ApiClient::handleLogin);
    server.addHandler("/api/register", ApiClient::handleRegister);
    server.addHandler("/api/verify", ApiClient::handleVerify);
    server.addHandler("/api/send", ApiClient::handleSendMessage);
    server.addHandler("/api/messages", ApiClient::handleGetMessages);
    
    // 房间相关API路由
    server.addHandler("/api/rooms", ApiClient::handleGetRooms);
    server.addHandler("/api/rooms/create", ApiClient::handleCreateRoom);
    server.addHandler("/api/rooms/delete", ApiClient::handleDeleteRoom);
    server.addHandler("/api/rooms/send", ApiClient::handleSendRoomMessage);
    server.addHandler("/api/rooms/messages", ApiClient::handleGetRoomMessages);
    
    // 静态文件处理
    server.addHandler("/js/", [](const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
        // 提取文件名
        std::string path = headers.at("path");
        std::string filename = "./static" + removeQueryParams(path);
        
        // 打开文件
        std::ifstream file(filename);
        if (!file) {
            std::cerr << "Error: Could not open file " << filename << std::endl;
            return std::string("console.error('Failed to load JavaScript file');");
        }
        
        // 读取文件内容
        std::stringstream buffer;
        buffer << file.rdbuf();
        return buffer.str();
    });
    
    server.addHandler("/css/", [](const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
        // 提取文件名
        std::string path = headers.at("path");
        std::string filename = "./static" + removeQueryParams(path);
        
        // 打开文件
        std::ifstream file(filename);
        if (!file) {
            std::cerr << "Error: Could not open file " << filename << std::endl;
            return std::string("/* CSS file not found */");
        }
        
        // 读取文件内容
        std::stringstream buffer;
        buffer << file.rdbuf();
        return buffer.str();
    });
    
    server.addHandler("/images/", [](const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
        // 提取文件名
        std::string path = headers.at("path");
        std::string filename = "./static" + removeQueryParams(path);
        
        // 打开文件
        std::ifstream file(filename, std::ios::binary);
        if (!file) {
            std::cerr << "Error: Could not open file " << filename << std::endl;
            return std::string("Image not found");
        }
        
        // 读取文件内容
        std::stringstream buffer;
        buffer << file.rdbuf();
        return buffer.str();
    });
    
    std::cout << "Starting chat server on port 8080..." << std::endl;
    
    // 启动服务器
    if (!server.start()) {
        std::cerr << "Failed to start server" << std::endl;
        return 1;
    }

    return 0;
}