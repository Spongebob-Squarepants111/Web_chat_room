#include "../include/server.h"
#include <iostream>
#include <sstream>
#include <string>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <arpa/inet.h>
#include <fstream>
#include <thread>
#include <mutex>
#include <vector>
#include <algorithm>
#include <netinet/in.h>
#include <iomanip>
#include <chrono>

// 在main.cpp中声明的函数，用于去除查询参数
extern std::string removeQueryParams(const std::string& path);

// 检查字符串是否以指定后缀结尾的辅助函数
bool endsWith(const std::string& str, const std::string& suffix) {
    if (str.length() < suffix.length()) {
        return false;
    }
    return str.compare(str.length() - suffix.length(), suffix.length(), suffix) == 0;
}

HttpServer::HttpServer(int port) : port(port), running(false), server_fd(-1) {
}

HttpServer::~HttpServer() {
    if (running) {
        stop();
    }
}

bool HttpServer::start() {
    // 创建套接字
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == -1) {
        std::cerr << "Failed to create socket" << std::endl;
        return false;
    }

    // 设置套接字选项，允许端口重用
    int opt = 1;
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt))) {
        std::cerr << "Failed to set socket options" << std::endl;
        close(server_fd);
        return false;
    }

    // 绑定地址和端口
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;  // 监听所有网络接口
    address.sin_port = htons(port);

    std::cout << "Binding to all interfaces (0.0.0.0:" << port << ")" << std::endl;

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        std::cerr << "Failed to bind to port " << port << std::endl;
        close(server_fd);
        return false;
    }

    // 监听连接
    if (listen(server_fd, 10) < 0) {
        std::cerr << "Failed to listen on socket" << std::endl;
        close(server_fd);
        return false;
    }

    running = true;
    std::cout << "Server started on port " << port << std::endl;

    // 接受连接
    while (running) {
        struct sockaddr_in client_addr;
        socklen_t addrlen = sizeof(client_addr);
        int client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &addrlen);
        
        if (client_fd < 0) {
            std::cerr << "Failed to accept connection" << std::endl;
            continue;
        }

        // 打印客户端信息
        char client_ip[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &client_addr.sin_addr, client_ip, INET_ADDRSTRLEN);
        std::cout << "New connection from " << client_ip << ":" << ntohs(client_addr.sin_port) << std::endl;

        // 创建新线程处理连接
        worker_threads.push_back(std::thread(&HttpServer::handleClient, this, client_fd));
    }

    return true;
}

void HttpServer::stop() {
    running = false;
    if (server_fd != -1) {
        close(server_fd);
        server_fd = -1;
    }

    // 等待所有工作线程结束
    for (auto& thread : worker_threads) {
        if (thread.joinable()) {
            thread.join();
        }
    }
    worker_threads.clear();
}

void HttpServer::addHandler(const std::string& path, HttpHandler handler) {
    std::lock_guard<std::mutex> lock(handlers_mutex);
    handlers[path] = handler;
}

void HttpServer::handleClient(int client_fd) {
    // 接收请求数据
    char buffer[8192] = {0};  // 增大缓冲区，防止大请求被截断
    int bytes_read = read(client_fd, buffer, sizeof(buffer) - 1);
    if (bytes_read <= 0) {
        close(client_fd);
        return;
    }

    std::string request(buffer);
    std::string path, body;
    auto headers = parseHttpRequest(request, path, body);

    // 获取请求方法
    std::string method = headers["method"];
    
    // 处理请求
    std::string response;
    bool found = false;
    
    // 标准化API路径 - 处理可能的斜杠差异和查询参数
    std::string normalized_path = removeQueryParams(path);
    // 移除结尾的斜杠
    while (normalized_path.length() > 1 && normalized_path.back() == '/') {
        normalized_path.pop_back();
    }

    // 处理路由匹配
    if (method == "POST") {
        // 尝试查找完全匹配的处理函数
        {
            std::lock_guard<std::mutex> lock(handlers_mutex);
            auto it = handlers.find(normalized_path);
            if (it != handlers.end()) {
                std::string content = it->second(headers, body);
                response = buildHttpResponse("application/json", content);
                found = true;
            }
        }
        
        // 如果未找到匹配，尝试进行API前缀匹配
        if (!found && normalized_path.find("/api/") == 0) {
            std::lock_guard<std::mutex> lock(handlers_mutex);
            
            for (const auto& handler_pair : handlers) {
                if (normalized_path.find(handler_pair.first) == 0 || handler_pair.first.find(normalized_path) == 0) {
                    std::string content = handler_pair.second(headers, body);
                    response = buildHttpResponse("application/json", content);
                    found = true;
                    break;
                }
            }
        }
    } else {
        // 处理非POST请求
        {
            std::lock_guard<std::mutex> lock(handlers_mutex);
            // 去除查询参数
            std::string clean_path = removeQueryParams(path);
            
            auto it = handlers.find(clean_path);
            if (it != handlers.end()) {
                // 找到处理函数，调用处理函数
                std::string content = it->second(headers, body);
                
                // 根据内容类型设置响应头
                std::string contentType = "text/html";
                if (path.find("/api/") == 0) {
                    contentType = "application/json";
                }
                
                response = buildHttpResponse(contentType, content);
                found = true;
            }
        }
    }

    if (!found) {
        // 尝试返回静态文件
        std::string content = handleStaticFile(path);
        if (!content.empty()) {
            std::string content_type = "text/html";
            if (endsWith(path, ".css")) {
                content_type = "text/css";
            } else if (endsWith(path, ".js")) {
                content_type = "application/javascript";
            } else if (endsWith(path, ".jpg") || endsWith(path, ".jpeg")) {
                content_type = "image/jpeg";
            } else if (endsWith(path, ".png")) {
                content_type = "image/png";
            }
            response = buildHttpResponse(content_type, content);
        } else {
            // 返回404
            std::cerr << "404错误: 路径 " << path << " 不存在" << std::endl;
            response = buildHttpResponse("text/html", "<html><body><h1>404 Not Found</h1><p>The requested URL " + path + " was not found on this server.</p></body></html>");
        }
    }

    // 发送响应
    write(client_fd, response.c_str(), response.length());
    close(client_fd);
}

std::unordered_map<std::string, std::string> HttpServer::parseHttpRequest(
    const std::string& request, std::string& path, std::string& body) {
    std::unordered_map<std::string, std::string> headers;
    std::istringstream stream(request);
    std::string line;

    // 解析请求行
    std::getline(stream, line);
    std::istringstream request_line(line);
    std::string method, http_version;
    request_line >> method >> path >> http_version;
    
    // 输出HTTP请求方法和路径信息
    std::cout << "收到HTTP请求: " << method << " " << path << " " << http_version << std::endl;
    
    // 将请求方法添加到请求头中
    headers["method"] = method;

    // 解析请求头
    while (std::getline(stream, line) && line != "\r") {
        size_t colon_pos = line.find(':');
        if (colon_pos != std::string::npos) {
            std::string key = line.substr(0, colon_pos);
            std::string value = line.substr(colon_pos + 1);
            // 去除前导和尾随空格
            while (!value.empty() && (value[0] == ' ' || value[0] == '\t'))
                value.erase(0, 1);
            while (!value.empty() && (value.back() == ' ' || value.back() == '\t' || value.back() == '\r'))
                value.pop_back();
            headers[key] = value;
            
            // 输出重要请求头信息
            if (key == "Content-Type" || key == "Authorization") {
                std::cout << "请求头: " << key << ": " << value << std::endl;
            }
        }
    }

    // 解析请求体
    std::stringstream body_stream;
    while (std::getline(stream, line)) {
        body_stream << line << "\n";
    }
    body = body_stream.str();
    
    // 输出请求体信息（为安全起见不输出完整内容）
    if (!body.empty()) {
        std::cout << "收到请求体，长度: " << body.length() << " 字节" << std::endl;
        // 在调试模式下可以考虑输出请求体内容
        if (body.length() < 500) {
            std::cout << "请求体内容: " << body << std::endl;
        }
    }

    return headers;
}

std::string HttpServer::buildHttpResponse(const std::string& content_type, const std::string& body) {
    std::stringstream response;
    response << "HTTP/1.1 200 OK\r\n"
             << "Content-Type: " << content_type << "\r\n"
             << "Content-Length: " << body.length() << "\r\n"
             << "Connection: close\r\n"
             << "\r\n"
             << body;
    return response.str();
}

std::string HttpServer::handleStaticFile(const std::string& path) {
    std::string file_path = "./static" + (path == "/" ? "/index.html" : path);
    std::ifstream file(file_path, std::ios::binary);
    if (!file) {
        return "";
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}
