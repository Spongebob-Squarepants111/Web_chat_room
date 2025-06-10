CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
LDFLAGS = -lhiredis -lmysqlclient -lpthread

TARGET = chat_server
BUILDDIR = build
SRCDIR = src
INCDIR = include

SRCS = main.cpp \
       $(SRCDIR)/server.cpp \
       $(SRCDIR)/chat_handler.cpp \
       $(SRCDIR)/client.cpp

OBJS = $(patsubst %.cpp,$(BUILDDIR)/%.o,$(SRCS))

all: prepare $(BUILDDIR)/$(TARGET)

prepare:
	@mkdir -p $(BUILDDIR)/$(SRCDIR)

$(BUILDDIR)/$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LDFLAGS)

$(BUILDDIR)/%.o: %.cpp
	$(CXX) $(CXXFLAGS) -I$(INCDIR) -c -o $@ $<

# 安装
install: all
	mkdir -p $(DESTDIR)/usr/local/bin
	mkdir -p $(DESTDIR)/usr/local/share/chat_room/static
	mkdir -p $(DESTDIR)/usr/local/share/chat_room/templates
	cp $(BUILDDIR)/$(TARGET) $(DESTDIR)/usr/local/bin/
	cp -r static/* $(DESTDIR)/usr/local/share/chat_room/static/
	cp -r templates/* $(DESTDIR)/usr/local/share/chat_room/templates/

# 清理目标文件和可执行文件
clean:
	rm -rf $(BUILDDIR)

# 运行服务器
run: all
	$(BUILDDIR)/$(TARGET)

.PHONY: all prepare clean install run
