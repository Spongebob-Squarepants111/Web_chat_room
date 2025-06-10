#ifndef SERVER_H
#define SERVER_H

#include <string>
#include <unordered_map>
#include <functional>
#include <vector>
#include <mutex>
#include <thread>
#include <netinet/in.h>

// 处理HTTP请求的函数类型
typedef std::function<std::string(const std::unordered_map<std::string, std::string>&, const std::string&)> HttpHandler;

class HttpServer {
private:
    int server_fd;
    int port;
    bool running;
    std::mutex handlers_mutex;
    std::unordered_map<std::string, HttpHandler> handlers;
    std::vector<std::thread> worker_threads;

    // 处理客户端连接
    void handleClient(int client_fd);
    
    // 解析HTTP请求
    std::unordered_map<std::string, std::string> parseHttpRequest(const std::string& request, std::string& path, std::string& body);
    
    // 构建HTTP响应
    std::string buildHttpResponse(const std::string& content_type, const std::string& body);
    
    // 静态文件处理
    std::string handleStaticFile(const std::string& path);

public:
    HttpServer(int port);
    ~HttpServer();

    // 添加路由处理器
    void addHandler(const std::string& path, HttpHandler handler);
    
    // 启动服务器
    bool start();
    
    // 停止服务器
    void stop();
};

#endif // SERVER_H
