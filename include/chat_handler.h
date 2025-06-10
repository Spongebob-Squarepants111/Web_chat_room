#ifndef CHAT_HANDLER_H
#define CHAT_HANDLER_H

#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <hiredis/hiredis.h>
#include <mysql/mysql.h>

// 消息结构体
struct ChatMessage {
    std::string username;
    std::string content;
    std::string timestamp;
};

// 聊天室结构体
struct ChatRoom {
    int id;
    std::string name;
    std::string description;
    std::string creator;
    std::string created_at;
};

class ChatHandler {
private:
    // Redis连接
    redisContext* redis_context;
    // MySQL连接
    MYSQL* mysql_connection;
    
    // 用户令牌映射
    std::unordered_map<std::string, std::string> user_tokens;
    std::mutex tokens_mutex;

    // 创建用户会话令牌
    std::string createToken(const std::string& username);
    
public:
    ChatHandler();
    ~ChatHandler();

    // 初始化连接
    bool initialize(const std::string& redis_host, int redis_port, 
                    const std::string& mysql_host, int mysql_port,
                    const std::string& mysql_user, const std::string& mysql_password,
                    const std::string& mysql_db);

    // 验证用户令牌
    bool validateToken(const std::string& token, std::string& username);
                    
    // 用户注册
    bool registerUser(const std::string& username, const std::string& password, const std::string& email);
    
    // 用户登录
    bool loginUser(const std::string& username, const std::string& password, std::string& token);
    
    // 发送消息
    bool sendMessage(const std::string& token, const std::string& message);
    
    // 获取消息历史
    std::vector<ChatMessage> getMessages(const std::string& token, int limit);
    
    // 房间相关方法
    // 创建房间
    bool createRoom(const std::string& token, const std::string& name, const std::string& description, int& room_id);
    
    // 删除房间
    bool deleteRoom(const std::string& token, int room_id);
    
    // 获取房间列表
    std::vector<ChatRoom> getRooms();
    
    // 发送房间消息
    bool sendRoomMessage(const std::string& token, int room_id, const std::string& message);
    
    // 获取房间消息
    std::vector<ChatMessage> getRoomMessages(const std::string& token, int room_id, int limit);
    
    // 关闭连接
    void close();
};

#endif // CHAT_HANDLER_H
