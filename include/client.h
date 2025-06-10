#ifndef CLIENT_H
#define CLIENT_H

#include <string>
#include <unordered_map>
#include <functional>

// API请求处理器
class ApiClient {
public:
    // 处理登录请求
    static std::string handleLogin(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 处理注册请求
    static std::string handleRegister(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 处理验证请求
    static std::string handleVerify(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 处理发送消息请求
    static std::string handleSendMessage(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 处理获取消息请求
    static std::string handleGetMessages(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 处理聊天页面请求
    static std::string handleChatPage(const std::unordered_map<std::string, std::string>& headers, const std::string& body);

    // 房间相关API
    // 创建房间请求
    static std::string handleCreateRoom(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 删除房间请求
    static std::string handleDeleteRoom(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 获取房间列表
    static std::string handleGetRooms(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 发送房间消息
    static std::string handleSendRoomMessage(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 获取房间消息历史
    static std::string handleGetRoomMessages(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
    
    // 处理房间页面请求
    static std::string handleRoomPage(const std::unordered_map<std::string, std::string>& headers, const std::string& body);
};

#endif // CLIENT_H