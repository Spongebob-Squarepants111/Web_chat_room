#include "../include/client.h"
#include "../include/chat_handler.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// 全局聊天处理器实例
extern ChatHandler g_chat_handler;

// 引用main.cpp中定义的函数
extern std::string removeQueryParams(const std::string& path);
extern std::string getResourcePath(const std::string& relativePath);

// 从请求Body解析JSON
json parseJsonBody(const std::string& body) {
    try {
        if (body.empty()) {
            std::cout << "警告：请求体为空" << std::endl;
            return json();
        }
        
        // 移除请求体可能有的前缀空白
        std::string trimmedBody = body;
        trimmedBody.erase(0, trimmedBody.find_first_not_of("\n\r\t "));
        
        // 调试输出
        std::cout << "尝试解析JSON: " << trimmedBody << std::endl;
        
        // 实际解析
        return json::parse(trimmedBody);
    } catch (const json::parse_error& e) {
        std::cerr << "JSON解析错误: " << e.what() << std::endl;
        std::cerr << "错误位置: " << e.byte << std::endl;
        return json();
    } catch (const std::exception& e) {
        std::cerr << "JSON解析异常: " << e.what() << std::endl;
        return json();
    } catch (...) {
        std::cerr << "未知的JSON解析错误" << std::endl;
        return json();
    }
}

// 从Authorization标头中提取token
std::string extractToken(const std::unordered_map<std::string, std::string>& headers) {
    auto it = headers.find("Authorization");
    if (it != headers.end()) {
        std::string auth = it->second;
        if (auth.find("Bearer ") == 0) {
            return auth.substr(7);
        }
    }
    return "";
}

std::string ApiClient::handleLogin(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    json data = parseJsonBody(body);
    
    if (!data.contains("username") || !data.contains("password")) {
        response["success"] = false;
        response["message"] = "缺少用户名或密码";
        return response.dump();
    }
    
    std::string username = data["username"];
    std::string password = data["password"];
    std::string token;
    
    bool success = g_chat_handler.loginUser(username, password, token);
    
    if (success) {
        response["success"] = true;
        response["token"] = token;
        response["message"] = "登录成功";
    } else {
        response["success"] = false;
        response["message"] = "用户名或密码不正确";
    }
    
    return response.dump();
}

std::string ApiClient::handleRegister(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    json data = parseJsonBody(body);
    
    if (!data.contains("username") || !data.contains("password") || !data.contains("email")) {
        response["success"] = false;
        response["message"] = "注册信息不完整";
        return response.dump();
    }
    
    std::string username = data["username"];
    std::string password = data["password"];
    std::string email = data["email"];
    
    bool success = g_chat_handler.registerUser(username, password, email);
    
    if (success) {
        response["success"] = true;
        response["message"] = "注册成功";
    } else {
        response["success"] = false;
        response["message"] = "注册失败，用户名可能已存在";
    }
    
    return response.dump();
}

std::string ApiClient::handleVerify(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    
    std::string token = extractToken(headers);
    if (token.empty()) {
        response["success"] = false;
        response["message"] = "无效的令牌";
        return response.dump();
    }
    
    std::string username;
    bool valid = g_chat_handler.validateToken(token, username);
    
    if (valid) {
        response["success"] = true;
        response["username"] = username;
    } else {
        response["success"] = false;
        response["message"] = "令牌验证失败";
    }
    
    return response.dump();
}

std::string ApiClient::handleSendMessage(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    
    std::string token = extractToken(headers);
    if (token.empty()) {
        response["success"] = false;
        response["message"] = "无效的令牌";
        return response.dump();
    }
    
    json data = parseJsonBody(body);
    
    if (!data.contains("message")) {
        response["success"] = false;
        response["message"] = "消息内容不能为空";
        return response.dump();
    }
    
    std::string message = data["message"];
    bool success = g_chat_handler.sendMessage(token, message);
    
    if (success) {
        response["success"] = true;
        response["message"] = "发送成功";
    } else {
        response["success"] = false;
        response["message"] = "发送失败，请重新登录";
    }
    
    return response.dump();
}

std::string ApiClient::handleGetMessages(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    
    std::string token = extractToken(headers);
    if (token.empty()) {
        response["success"] = false;
        response["message"] = "无效的令牌";
        return response.dump();
    }
    
    int limit = 50;  // 默认获取50条消息
    
    std::vector<ChatMessage> messages = g_chat_handler.getMessages(token, limit);
    
    json messageArray = json::array();
    for (const auto& msg : messages) {
        json messageObj;
        messageObj["username"] = msg.username;
        messageObj["content"] = msg.content;
        messageObj["timestamp"] = msg.timestamp;
        messageArray.push_back(messageObj);
    }
    
    response["success"] = true;
    response["messages"] = messageArray;
    
    return response.dump();
}

std::string ApiClient::handleChatPage(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    // 读取聊天页面HTML文件
    std::string filePath = getResourcePath("/templates/chat.html");
    std::ifstream file(filePath);
    if (!file) {
        std::cerr << "Error: Could not open chat.html at " << filePath << std::endl;
        return "<html><body><h1>Error: Chat page not found</h1></body></html>";
    }
    
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

// 处理创建房间请求
std::string ApiClient::handleCreateRoom(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    
    std::string token = extractToken(headers);
    if (token.empty()) {
        response["success"] = false;
        response["message"] = "无效的令牌";
        return response.dump();
    }
    
    // 尝试解析请求体
    json data;
    try {
        data = parseJsonBody(body);
    } catch (const std::exception& e) {
        response["success"] = false;
        response["message"] = "无效的请求格式";
        return response.dump();
    }
    
    // 检查必要参数
    if (!data.contains("name") || !data.contains("description")) {
        response["success"] = false;
        response["message"] = "房间信息不完整";
        return response.dump();
    }
    
    std::string name = data["name"];
    std::string description = data["description"];
    
    int room_id = 0;
    bool success = g_chat_handler.createRoom(token, name, description, room_id);
    
    if (success) {
        response["success"] = true;
        response["message"] = "房间创建成功";
        response["room_id"] = room_id;
    } else {
        response["success"] = false;
        response["message"] = "房间创建失败";
    }
    
    return response.dump();
}

// 处理删除房间请求
std::string ApiClient::handleDeleteRoom(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    
    std::string token = extractToken(headers);
    if (token.empty()) {
        response["success"] = false;
        response["message"] = "无效的令牌";
        return response.dump();
    }
    
    json data = parseJsonBody(body);
    
    if (!data.contains("room_id")) {
        response["success"] = false;
        response["message"] = "未指定房间ID";
        return response.dump();
    }
    
    int room_id = data["room_id"];
    
    bool success = g_chat_handler.deleteRoom(token, room_id);
    
    if (success) {
        response["success"] = true;
        response["message"] = "房间删除成功";
    } else {
        response["success"] = false;
        response["message"] = "房间删除失败，可能是权限不足";
    }
    
    return response.dump();
}

// 处理获取房间列表请求
std::string ApiClient::handleGetRooms(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    
    std::string token = extractToken(headers);
    if (token.empty()) {
        response["success"] = false;
        response["message"] = "无效的令牌";
        return response.dump();
    }
    
    std::string username;
    if (!g_chat_handler.validateToken(token, username)) {
        response["success"] = false;
        response["message"] = "令牌验证失败";
        return response.dump();
    }
    
    std::vector<ChatRoom> rooms = g_chat_handler.getRooms();
    
    json roomsArray = json::array();
    for (const auto& room : rooms) {
        json roomObj;
        roomObj["id"] = room.id;
        roomObj["name"] = room.name;
        roomObj["description"] = room.description;
        roomObj["creator"] = room.creator;
        roomObj["created_at"] = room.created_at;
        // 标记当前用户是否是该房间的创建者
        roomObj["is_creator"] = (username == room.creator);
        
        roomsArray.push_back(roomObj);
    }
    
    response["success"] = true;
    response["rooms"] = roomsArray;
    
    return response.dump();
}

// 处理发送房间消息请求
std::string ApiClient::handleSendRoomMessage(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    
    std::string token = extractToken(headers);
    if (token.empty()) {
        response["success"] = false;
        response["message"] = "无效的令牌";
        return response.dump();
    }
    
    json data = parseJsonBody(body);
    
    if (!data.contains("room_id") || !data.contains("message")) {
        response["success"] = false;
        response["message"] = "消息信息不完整";
        return response.dump();
    }
    
    int room_id = data["room_id"];
    std::string message = data["message"];
    
    bool success = g_chat_handler.sendRoomMessage(token, room_id, message);
    
    if (success) {
        response["success"] = true;
        response["message"] = "发送成功";
    } else {
        response["success"] = false;
        response["message"] = "发送失败，请重新登录";
    }
    
    return response.dump();
}

// 处理获取房间消息历史请求
std::string ApiClient::handleGetRoomMessages(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    json response;
    
    std::string token = extractToken(headers);
    if (token.empty()) {
        response["success"] = false;
        response["message"] = "无效的令牌";
        return response.dump();
    }
    
    json data = parseJsonBody(body);
    
    if (!data.contains("room_id")) {
        response["success"] = false;
        response["message"] = "未指定房间ID";
        return response.dump();
    }
    
    int room_id = data["room_id"];
    int limit = 50;  // 默认获取50条消息
    
    if (data.contains("limit")) {
        limit = data["limit"];
    }
    
    std::string username;
    if (!g_chat_handler.validateToken(token, username)) {
        response["success"] = false;
        response["message"] = "令牌验证失败";
        return response.dump();
    }
    
    std::vector<ChatMessage> messages = g_chat_handler.getRoomMessages(token, room_id, limit);
    
    json messageArray = json::array();
    for (const auto& msg : messages) {
        json messageObj;
        messageObj["username"] = msg.username;
        messageObj["content"] = msg.content;
        messageObj["timestamp"] = msg.timestamp;
        messageArray.push_back(messageObj);
    }
    
    response["success"] = true;
    response["messages"] = messageArray;
    
    return response.dump();
}

// 处理房间页面请求
std::string ApiClient::handleRoomPage(const std::unordered_map<std::string, std::string>& headers, const std::string& body) {
    // 读取房间页面HTML文件
    std::string filePath = getResourcePath("/templates/room.html");
    std::ifstream file(filePath);
    if (!file) {
        std::cerr << "Error: Could not open room.html at " << filePath << std::endl;
        return "<html><body><h1>Error: Room page not found</h1></body></html>";
    }
    
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}
