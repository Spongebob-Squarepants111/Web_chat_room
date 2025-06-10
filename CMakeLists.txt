cmake_minimum_required(VERSION 3.10)
project(Chat_Room)

# 设置C++标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 查找依赖包
find_package(Threads REQUIRED)
find_library(HIREDIS_LIBRARY NAMES hiredis)
find_library(MYSQLCLIENT_LIBRARY NAMES mysqlclient)

# 移除nlohmann_json FetchContent部分
# 直接使用系统安装的库或包含头文件路径
include_directories(${CMAKE_SOURCE_DIR})
# 如果你已安装nlohmann_json库，取消注释下行
# include_directories(/usr/include/nlohmann)

# 添加源文件
set(SOURCES
    src/server.cpp
    src/chat_handler.cpp
    src/client.cpp
    main.cpp
)

# 添加头文件目录
include_directories(${CMAKE_SOURCE_DIR})

# 创建可执行文件
add_executable(chat_server ${SOURCES})

# 链接库
target_link_libraries(chat_server
    PRIVATE
    Threads::Threads
    ${HIREDIS_LIBRARY}
    ${MYSQLCLIENT_LIBRARY}
)

# 安装规则
install(TARGETS chat_server DESTINATION bin)
install(DIRECTORY static/ DESTINATION ${CMAKE_INSTALL_PREFIX}/static)
install(DIRECTORY templates/ DESTINATION ${CMAKE_INSTALL_PREFIX}/templates)

# 复制静态文件到构建目录
add_custom_command(TARGET chat_server POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
    ${CMAKE_SOURCE_DIR}/static ${CMAKE_BINARY_DIR}/static
)

add_custom_command(TARGET chat_server POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
    ${CMAKE_SOURCE_DIR}/templates ${CMAKE_BINARY_DIR}/templates
)
