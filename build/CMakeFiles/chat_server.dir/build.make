# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.16

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:


#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:


# Remove some rules from gmake that .SUFFIXES does not remove.
SUFFIXES =

.SUFFIXES: .hpux_make_needs_suffix_list


# Suppress display of executed commands.
$(VERBOSE).SILENT:


# A target that is always out of date.
cmake_force:

.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /usr/bin/cmake

# The command to remove a file.
RM = /usr/bin/cmake -E remove -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /root/C++_Projects/Chat_Room

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /root/C++_Projects/Chat_Room/build

# Include any dependencies generated for this target.
include CMakeFiles/chat_server.dir/depend.make

# Include the progress variables for this target.
include CMakeFiles/chat_server.dir/progress.make

# Include the compile flags for this target's objects.
include CMakeFiles/chat_server.dir/flags.make

CMakeFiles/chat_server.dir/src/server.cpp.o: CMakeFiles/chat_server.dir/flags.make
CMakeFiles/chat_server.dir/src/server.cpp.o: ../src/server.cpp
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/root/C++_Projects/Chat_Room/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building CXX object CMakeFiles/chat_server.dir/src/server.cpp.o"
	/usr/bin/c++  $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -o CMakeFiles/chat_server.dir/src/server.cpp.o -c /root/C++_Projects/Chat_Room/src/server.cpp

CMakeFiles/chat_server.dir/src/server.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/chat_server.dir/src/server.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /root/C++_Projects/Chat_Room/src/server.cpp > CMakeFiles/chat_server.dir/src/server.cpp.i

CMakeFiles/chat_server.dir/src/server.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/chat_server.dir/src/server.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /root/C++_Projects/Chat_Room/src/server.cpp -o CMakeFiles/chat_server.dir/src/server.cpp.s

CMakeFiles/chat_server.dir/src/chat_handler.cpp.o: CMakeFiles/chat_server.dir/flags.make
CMakeFiles/chat_server.dir/src/chat_handler.cpp.o: ../src/chat_handler.cpp
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/root/C++_Projects/Chat_Room/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Building CXX object CMakeFiles/chat_server.dir/src/chat_handler.cpp.o"
	/usr/bin/c++  $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -o CMakeFiles/chat_server.dir/src/chat_handler.cpp.o -c /root/C++_Projects/Chat_Room/src/chat_handler.cpp

CMakeFiles/chat_server.dir/src/chat_handler.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/chat_server.dir/src/chat_handler.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /root/C++_Projects/Chat_Room/src/chat_handler.cpp > CMakeFiles/chat_server.dir/src/chat_handler.cpp.i

CMakeFiles/chat_server.dir/src/chat_handler.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/chat_server.dir/src/chat_handler.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /root/C++_Projects/Chat_Room/src/chat_handler.cpp -o CMakeFiles/chat_server.dir/src/chat_handler.cpp.s

CMakeFiles/chat_server.dir/src/client.cpp.o: CMakeFiles/chat_server.dir/flags.make
CMakeFiles/chat_server.dir/src/client.cpp.o: ../src/client.cpp
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/root/C++_Projects/Chat_Room/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_3) "Building CXX object CMakeFiles/chat_server.dir/src/client.cpp.o"
	/usr/bin/c++  $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -o CMakeFiles/chat_server.dir/src/client.cpp.o -c /root/C++_Projects/Chat_Room/src/client.cpp

CMakeFiles/chat_server.dir/src/client.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/chat_server.dir/src/client.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /root/C++_Projects/Chat_Room/src/client.cpp > CMakeFiles/chat_server.dir/src/client.cpp.i

CMakeFiles/chat_server.dir/src/client.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/chat_server.dir/src/client.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /root/C++_Projects/Chat_Room/src/client.cpp -o CMakeFiles/chat_server.dir/src/client.cpp.s

CMakeFiles/chat_server.dir/main.cpp.o: CMakeFiles/chat_server.dir/flags.make
CMakeFiles/chat_server.dir/main.cpp.o: ../main.cpp
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/root/C++_Projects/Chat_Room/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_4) "Building CXX object CMakeFiles/chat_server.dir/main.cpp.o"
	/usr/bin/c++  $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -o CMakeFiles/chat_server.dir/main.cpp.o -c /root/C++_Projects/Chat_Room/main.cpp

CMakeFiles/chat_server.dir/main.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/chat_server.dir/main.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /root/C++_Projects/Chat_Room/main.cpp > CMakeFiles/chat_server.dir/main.cpp.i

CMakeFiles/chat_server.dir/main.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/chat_server.dir/main.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /root/C++_Projects/Chat_Room/main.cpp -o CMakeFiles/chat_server.dir/main.cpp.s

# Object files for target chat_server
chat_server_OBJECTS = \
"CMakeFiles/chat_server.dir/src/server.cpp.o" \
"CMakeFiles/chat_server.dir/src/chat_handler.cpp.o" \
"CMakeFiles/chat_server.dir/src/client.cpp.o" \
"CMakeFiles/chat_server.dir/main.cpp.o"

# External object files for target chat_server
chat_server_EXTERNAL_OBJECTS =

chat_server: CMakeFiles/chat_server.dir/src/server.cpp.o
chat_server: CMakeFiles/chat_server.dir/src/chat_handler.cpp.o
chat_server: CMakeFiles/chat_server.dir/src/client.cpp.o
chat_server: CMakeFiles/chat_server.dir/main.cpp.o
chat_server: CMakeFiles/chat_server.dir/build.make
chat_server: /usr/lib/x86_64-linux-gnu/libhiredis.so
chat_server: /usr/lib/x86_64-linux-gnu/libmysqlclient.so
chat_server: CMakeFiles/chat_server.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --bold --progress-dir=/root/C++_Projects/Chat_Room/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_5) "Linking CXX executable chat_server"
	$(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/chat_server.dir/link.txt --verbose=$(VERBOSE)
	/usr/bin/cmake -E copy_directory /root/C++_Projects/Chat_Room/static /root/C++_Projects/Chat_Room/build/static
	/usr/bin/cmake -E copy_directory /root/C++_Projects/Chat_Room/templates /root/C++_Projects/Chat_Room/build/templates

# Rule to build all files generated by this target.
CMakeFiles/chat_server.dir/build: chat_server

.PHONY : CMakeFiles/chat_server.dir/build

CMakeFiles/chat_server.dir/clean:
	$(CMAKE_COMMAND) -P CMakeFiles/chat_server.dir/cmake_clean.cmake
.PHONY : CMakeFiles/chat_server.dir/clean

CMakeFiles/chat_server.dir/depend:
	cd /root/C++_Projects/Chat_Room/build && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /root/C++_Projects/Chat_Room /root/C++_Projects/Chat_Room /root/C++_Projects/Chat_Room/build /root/C++_Projects/Chat_Room/build /root/C++_Projects/Chat_Room/build/CMakeFiles/chat_server.dir/DependInfo.cmake --color=$(COLOR)
.PHONY : CMakeFiles/chat_server.dir/depend

