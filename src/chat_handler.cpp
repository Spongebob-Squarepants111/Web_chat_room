#include "../include/chat_handler.h"
#include <iostream>
#include <ctime>
#include <random>
#include <sstream>
#include <iomanip>

ChatHandler::ChatHandler() : redis_context(nullptr), mysql_connection(nullptr) {
}

ChatHandler::~ChatHandler() {
    close();
}

bool ChatHandler::initialize(const std::string& redis_host, int redis_port, 
                            const std::string& mysql_host, int mysql_port,
                            const std::string& mysql_user, const std::string& mysql_password,
                            const std::string& mysql_db) {
    // 连接Redis
    redis_context = redisConnect(redis_host.c_str(), redis_port);
    if (redis_context == nullptr || redis_context->err) {
        if (redis_context) {
            std::cerr << "Redis connection error: " << redis_context->errstr << std::endl;
            redisFree(redis_context);
            redis_context = nullptr;
        } else {
            std::cerr << "Redis connection error: can't allocate redis context" << std::endl;
        }
        return false;
    }

    // 连接MySQL
    mysql_connection = mysql_init(nullptr);
    if (mysql_connection == nullptr) {
        std::cerr << "MySQL init failed" << std::endl;
        return false;
    }

    if (mysql_real_connect(mysql_connection, mysql_host.c_str(), mysql_user.c_str(), 
                           mysql_password.c_str(), mysql_db.c_str(), mysql_port, nullptr, 0) == nullptr) {
        std::cerr << "MySQL connection error: " << mysql_error(mysql_connection) << std::endl;
        mysql_close(mysql_connection);
        mysql_connection = nullptr;
        return false;
    }

    // 创建用户表（如果不存在）
    const char* create_users_table = 
        "CREATE TABLE IF NOT EXISTS users ("
        "id INT AUTO_INCREMENT PRIMARY KEY,"
        "username VARCHAR(50) NOT NULL UNIQUE,"
        "password VARCHAR(255) NOT NULL,"
        "email VARCHAR(100),"
        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";

    if (mysql_query(mysql_connection, create_users_table)) {
        std::cerr << "Failed to create users table: " << mysql_error(mysql_connection) << std::endl;
        return false;
    }

    return true;
}

void ChatHandler::close() {
    // 关闭Redis连接
    if (redis_context) {
        redisFree(redis_context);
        redis_context = nullptr;
    }

    // 关闭MySQL连接
    if (mysql_connection) {
        mysql_close(mysql_connection);
        mysql_connection = nullptr;
    }
}

std::string ChatHandler::createToken(const std::string& username) {
    // 使用随机数生成器生成令牌
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    
    const char* hex = "0123456789abcdef";
    std::string token;
    
    for (int i = 0; i < 32; ++i) {
        token += hex[dis(gen)];
    }
    
    // 在Redis中缓存令牌
    std::string key = "token:" + token;
    redisReply* reply = (redisReply*)redisCommand(redis_context, "SET %s %s", key.c_str(), username.c_str());
    
    if (reply == nullptr) {
        std::cerr << "Failed to set token in Redis" << std::endl;
        return "";
    }
    
    freeReplyObject(reply);
    
    // 不再设置过期时间，因为不支持EXPIRE命令
    
    return token;
}

bool ChatHandler::validateToken(const std::string& token, std::string& username) {
    // 从Redis中获取令牌对应的用户名
    std::string key = "token:" + token;
    redisReply* reply = (redisReply*)redisCommand(redis_context, "GET %s", key.c_str());
    
    if (reply == nullptr || reply->type == REDIS_REPLY_NIL) {
        if (reply) {
            freeReplyObject(reply);
        }
        return false;
    }
    
    username = reply->str;
    freeReplyObject(reply);
    
    // 简单刷新令牌（重新设置，因为没有EXPIRE命令）
    reply = (redisReply*)redisCommand(redis_context, "SET %s %s", key.c_str(), username.c_str());
    if (reply) {
        freeReplyObject(reply);
    }
    
    return true;
}

bool ChatHandler::registerUser(const std::string& username, const std::string& password, const std::string& email) {
    // 简单的密码加密（实际应用中应使用更安全的方式）
    // 在这里就简单使用明文密码作为示例
    std::string query = "INSERT INTO users (username, password, email) VALUES ('" +
                        username + "', '" + password + "', '" + email + "')";
    
    if (mysql_query(mysql_connection, query.c_str())) {
        std::cerr << "User registration failed: " << mysql_error(mysql_connection) << std::endl;
        return false;
    }
    
    return true;
}

bool ChatHandler::loginUser(const std::string& username, const std::string& password, std::string& token) {
    std::string query = "SELECT id FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
    
    if (mysql_query(mysql_connection, query.c_str())) {
        std::cerr << "Login query failed: " << mysql_error(mysql_connection) << std::endl;
        return false;
    }
    
    MYSQL_RES* result = mysql_store_result(mysql_connection);
    if (result == nullptr) {
        std::cerr << "No result from login query" << std::endl;
        return false;
    }
    
    bool success = false;
    if (mysql_num_rows(result) > 0) {
        token = createToken(username);
        success = !token.empty();
    }
    
    mysql_free_result(result);
    return success;
}

bool ChatHandler::sendMessage(const std::string& token, const std::string& message) {
    std::string username;
    if (!validateToken(token, username)) {
        return false;
    }
    
    // 创建消息记录
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&in_time_t), "%Y-%m-%d %H:%M:%S");
    std::string timestamp = ss.str();
    
    // 将消息保存在Redis中
    std::string message_data = username + ":" + message + ":" + timestamp;
    
    // 获取当前消息计数
    redisReply* count_reply = (redisReply*)redisCommand(redis_context, "GET chat_message_count");
    int count = 0;
    if (count_reply != nullptr && count_reply->type == REDIS_REPLY_STRING) {
        count = std::stoi(count_reply->str);
        freeReplyObject(count_reply);
    }
    
    // 增加计数
    count++;
    
    // 保存消息
    std::string message_key = "chat_message:" + std::to_string(count);
    redisReply* reply = (redisReply*)redisCommand(redis_context, "SET %s %s", 
                                                 message_key.c_str(), message_data.c_str());
    
    if (reply == nullptr) {
        std::cerr << "Failed to save message" << std::endl;
        return false;
    }
    
    freeReplyObject(reply);
    
    // 更新消息计数
    reply = (redisReply*)redisCommand(redis_context, "SET chat_message_count %d", count);
    if (reply != nullptr) {
        freeReplyObject(reply);
    }
    
    return true;
}

std::vector<ChatMessage> ChatHandler::getMessages(const std::string& token, int limit) {
    std::vector<ChatMessage> messages;
    std::string username;
    if (!validateToken(token, username)) {
        return messages;
    }
    
    // 从Redis中获取消息计数
    redisReply* count_reply = (redisReply*)redisCommand(redis_context, "GET chat_message_count");
    int total_messages = 0;
    if (count_reply != nullptr && count_reply->type == REDIS_REPLY_STRING) {
        total_messages = std::stoi(count_reply->str);
        freeReplyObject(count_reply);
    } else {
        if (count_reply) {
            freeReplyObject(count_reply);
        }
        return messages;
    }
    
    // 计算开始索引，确保不超出范围
    int start = std::max(1, total_messages - limit + 1);
    int end = total_messages;
    
    // 逆序获取消息，以便最新的消息在前面
    for (int i = end; i >= start; --i) {
        std::string key = "chat_message:" + std::to_string(i);
        redisReply* reply = (redisReply*)redisCommand(redis_context, "GET %s", key.c_str());
        
        if (reply != nullptr && reply->type == REDIS_REPLY_STRING) {
            std::string message_data = reply->str;
            size_t first_colon = message_data.find(':');
            if (first_colon != std::string::npos) {
                size_t second_colon = message_data.find(':', first_colon + 1);
                if (second_colon != std::string::npos) {
                    ChatMessage msg;
                    msg.username = message_data.substr(0, first_colon);
                    msg.content = message_data.substr(first_colon + 1, second_colon - first_colon - 1);
                    msg.timestamp = message_data.substr(second_colon + 1);
                    messages.push_back(msg);
                }
            }
        }
        
        if (reply) {
            freeReplyObject(reply);
        }
    }
    
    return messages;
}

// 创建房间
bool ChatHandler::createRoom(const std::string& token, const std::string& name, const std::string& description, int& room_id) {
    std::string username;
    if (!validateToken(token, username)) {
        std::cerr << "令牌验证失败" << std::endl;
        return false;
    }
    
    std::cout << "验证令牌成功，用户: " << username << std::endl;
    
    // 创建房间表(如果不存在)
    const char* create_rooms_table = 
        "CREATE TABLE IF NOT EXISTS rooms ("
        "id INT AUTO_INCREMENT PRIMARY KEY,"
        "name VARCHAR(100) NOT NULL,"
        "description TEXT,"
        "creator VARCHAR(50) NOT NULL,"
        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";
    
    if (mysql_query(mysql_connection, create_rooms_table)) {
        std::cerr << "创建房间表失败: " << mysql_error(mysql_connection) << std::endl;
        return false;
    }
    
    std::cout << "检查房间表完成" << std::endl;
    
    // 插入新房间
    std::stringstream ss;
    ss << "INSERT INTO rooms (name, description, creator) VALUES ('"
       << name << "', '" << description << "', '" << username << "')";
    
    std::string query = ss.str();
    std::cout << "执行SQL: " << query << std::endl;
    
    if (mysql_query(mysql_connection, query.c_str())) {
        std::cerr << "创建房间失败: " << mysql_error(mysql_connection) << std::endl;
        return false;
    }
    
    // 获取新房间ID
    room_id = mysql_insert_id(mysql_connection);
    std::cout << "房间创建成功，ID: " << room_id << std::endl;
    
    return true;
}

// 删除房间
bool ChatHandler::deleteRoom(const std::string& token, int room_id) {
    std::string username;
    if (!validateToken(token, username)) {
        return false;
    }
    
    // 检查用户是否是房间创建者
    std::stringstream check_ss;
    check_ss << "SELECT creator FROM rooms WHERE id = " << room_id;
    
    if (mysql_query(mysql_connection, check_ss.str().c_str())) {
        std::cerr << "查询房间失败: " << mysql_error(mysql_connection) << std::endl;
        return false;
    }
    
    MYSQL_RES* check_result = mysql_store_result(mysql_connection);
    if (check_result == nullptr) {
        std::cerr << "无法获取房间信息" << std::endl;
        return false;
    }
    
    MYSQL_ROW row = mysql_fetch_row(check_result);
    if (row == nullptr) {
        mysql_free_result(check_result);
        std::cerr << "房间不存在" << std::endl;
        return false;
    }
    
    std::string creator = row[0];
    mysql_free_result(check_result);
    
    if (creator != username) {
        std::cerr << "用户无权限删除该房间" << std::endl;
        return false;
    }
    
    // 删除房间
    std::stringstream delete_ss;
    delete_ss << "DELETE FROM rooms WHERE id = " << room_id;
    
    if (mysql_query(mysql_connection, delete_ss.str().c_str())) {
        std::cerr << "删除房间失败: " << mysql_error(mysql_connection) << std::endl;
        return false;
    }
    
    // 删除房间消息
    std::string room_messages_key = "room:" + std::to_string(room_id) + ":messages";
    redisCommand(redis_context, "DEL %s", room_messages_key.c_str());
    
    return true;
}

// 获取房间列表
std::vector<ChatRoom> ChatHandler::getRooms() {
    std::vector<ChatRoom> rooms;
    
    // 创建房间表(如果不存在)
    const char* create_rooms_table = 
        "CREATE TABLE IF NOT EXISTS rooms ("
        "id INT AUTO_INCREMENT PRIMARY KEY,"
        "name VARCHAR(100) NOT NULL,"
        "description TEXT,"
        "creator VARCHAR(50) NOT NULL,"
        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";
    
    if (mysql_query(mysql_connection, create_rooms_table)) {
        std::cerr << "检查房间表失败: " << mysql_error(mysql_connection) << std::endl;
        return rooms;
    }
    
    // 查询所有房间
    const char* query = "SELECT id, name, description, creator, created_at FROM rooms ORDER BY created_at DESC";
    
    if (mysql_query(mysql_connection, query)) {
        std::cerr << "获取房间列表失败: " << mysql_error(mysql_connection) << std::endl;
        return rooms;
    }
    
    MYSQL_RES* result = mysql_store_result(mysql_connection);
    if (result == nullptr) {
        std::cerr << "无法获取房间结果集" << std::endl;
        return rooms;
    }
    
    MYSQL_ROW row;
    while ((row = mysql_fetch_row(result))) {
        ChatRoom room;
        room.id = std::stoi(row[0]);
        room.name = row[1];
        room.description = row[2] ? row[2] : "";
        room.creator = row[3];
        room.created_at = row[4];
        
        rooms.push_back(room);
    }
    
    mysql_free_result(result);
    return rooms;
}

// 发送房间消息
bool ChatHandler::sendRoomMessage(const std::string& token, int room_id, const std::string& message) {
    std::string username;
    if (!validateToken(token, username)) {
        return false;
    }
    
    // 检查房间是否存在
    std::stringstream check_ss;
    check_ss << "SELECT id FROM rooms WHERE id = " << room_id;
    
    if (mysql_query(mysql_connection, check_ss.str().c_str())) {
        std::cerr << "查询房间失败: " << mysql_error(mysql_connection) << std::endl;
        return false;
    }
    
    MYSQL_RES* check_result = mysql_store_result(mysql_connection);
    if (check_result == nullptr || mysql_num_rows(check_result) == 0) {
        if (check_result) mysql_free_result(check_result);
        std::cerr << "房间不存在" << std::endl;
        return false;
    }
    
    mysql_free_result(check_result);
    
    // 创建消息记录
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&in_time_t), "%Y-%m-%d %H:%M:%S");
    std::string timestamp = ss.str();
    
    // 将消息保存在Redis中
    std::string message_data = username + ":" + message + ":" + timestamp;
    
    // 获取当前房间消息计数
    std::string room_count_key = "room:" + std::to_string(room_id) + ":message_count";
    redisReply* count_reply = (redisReply*)redisCommand(redis_context, "GET %s", room_count_key.c_str());
    int count = 0;
    if (count_reply != nullptr && count_reply->type == REDIS_REPLY_STRING) {
        count = std::stoi(count_reply->str);
        freeReplyObject(count_reply);
    }
    
    // 增加计数
    count++;
    
    // 保存消息
    std::string room_message_key = "room:" + std::to_string(room_id) + ":message:" + std::to_string(count);
    redisReply* reply = (redisReply*)redisCommand(redis_context, "SET %s %s", 
                                                room_message_key.c_str(), message_data.c_str());
    
    if (reply == nullptr) {
        std::cerr << "保存房间消息失败" << std::endl;
        return false;
    }
    
    freeReplyObject(reply);
    
    // 更新计数
    reply = (redisReply*)redisCommand(redis_context, "SET %s %d", room_count_key.c_str(), count);
    
    if (reply) {
        freeReplyObject(reply);
    }
    
    return true;
}

// 获取房间消息
std::vector<ChatMessage> ChatHandler::getRoomMessages(const std::string& token, int room_id, int limit) {
    std::vector<ChatMessage> messages;
    
    std::string username;
    if (!validateToken(token, username)) {
        return messages;
    }
    
    // 获取当前房间消息计数
    std::string room_count_key = "room:" + std::to_string(room_id) + ":message_count";
    redisReply* count_reply = (redisReply*)redisCommand(redis_context, "GET %s", room_count_key.c_str());
    int count = 0;
    if (count_reply != nullptr && count_reply->type == REDIS_REPLY_STRING) {
        count = std::stoi(count_reply->str);
        freeReplyObject(count_reply);
    }
    
    // 计算起始索引
    int start = (count > limit) ? (count - limit + 1) : 1;
    
    // 获取消息
    for (int i = start; i <= count; ++i) {
        std::string room_message_key = "room:" + std::to_string(room_id) + ":message:" + std::to_string(i);
        redisReply* reply = (redisReply*)redisCommand(redis_context, "GET %s", room_message_key.c_str());
        
        if (reply != nullptr && reply->type == REDIS_REPLY_STRING) {
            std::string message_data = reply->str;
            freeReplyObject(reply);
            
            // 解析消息数据
            size_t first_colon = message_data.find(':');
            if (first_colon == std::string::npos) {
                continue;
            }
            
            size_t second_colon = message_data.find(':', first_colon + 1);
            if (second_colon == std::string::npos) {
                continue;
            }
            
            std::string msg_username = message_data.substr(0, first_colon);
            std::string msg_content = message_data.substr(first_colon + 1, second_colon - first_colon - 1);
            std::string msg_timestamp = message_data.substr(second_colon + 1);
            
            ChatMessage message;
            message.username = msg_username;
            message.content = msg_content;
            message.timestamp = msg_timestamp;
            
            messages.push_back(message);
        } else if (reply) {
            freeReplyObject(reply);
        }
    }
    
    return messages;
}
