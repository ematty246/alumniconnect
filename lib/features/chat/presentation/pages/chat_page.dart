import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:async';
import 'dart:io';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class ChatPage extends StatefulWidget {
  final String? selectedUsername;

  const ChatPage({super.key, this.selectedUsername});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _messageController = TextEditingController();
  final _searchController = TextEditingController();
  final ScrollController _messagesScrollController = ScrollController();
  
  String _selectedUser = '';
  List<Map<String, dynamic>> _messages = [];
  List<Map<String, dynamic>> _connectedUsers = [];
  List<Map<String, dynamic>> _searchResults = [];
  Map<String, int> _unreadCounts = {};
  bool _loading = false;
  bool _isSearching = false;
  File? _selectedFile;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    if (widget.selectedUsername != null) {
      _selectedUser = widget.selectedUsername!;
    }
    _fetchConnectedUsers();
    _fetchUnreadCounts();
    
    // Auto-refresh every 2 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      if (_selectedUser.isNotEmpty) {
        _fetchChatHistory();
      }
      _fetchUnreadCounts();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _searchController.dispose();
    _messagesScrollController.dispose();
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchConnectedUsers() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    try {
      final dio = Dio();
      final response = await dio.get('http://localhost:8081/auth/users');
      final allUsers = response.data;

      final connected = <Map<String, dynamic>>[];
      for (final userInfo in allUsers) {
        if (userInfo['username'] != user.username) {
          try {
            final statusResponse = await dio.get(
              'http://localhost:8083/api/chat/connection/status?viewedUsername=${userInfo['username']}'
            );
            if (statusResponse.data == 'CONNECTED') {
              connected.add({
                'username': userInfo['username'],
                'role': userInfo['role'],
              });
            }
          } catch (error) {
            // Ignore connection status errors
          }
        }
      }
      
      setState(() {
        _connectedUsers = connected;
      });
    } catch (error) {
      // Handle error silently
    }
  }

  Future<void> _fetchUnreadCounts() async {
    final user = context.read<AuthProvider>().user;
    if (user?.username == null) return;

    try {
      final dio = Dio();
      final response = await dio.get(
        'http://localhost:8084/api/chat/unread/count?receiver=${user!.username}'
      );
      
      setState(() {
        _unreadCounts = Map<String, int>.from(response.data ?? {});
      });
    } catch (error) {
      // Handle error silently
    }
  }

  Future<void> _fetchChatHistory() async {
    final user = context.read<AuthProvider>().user;
    if (_selectedUser.isEmpty || user?.username == null) return;

    try {
      final dio = Dio();
      final response = await dio.get(
        'http://localhost:8084/api/chat/history/with-reactions?sender=${user!.username}&receiver=$_selectedUser'
      );
      setState(() {
        _messages = List<Map<String, dynamic>>.from(response.data);
      });
      
      // Scroll to bottom after loading messages
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_messagesScrollController.hasClients) {
          _messagesScrollController.animateTo(
            _messagesScrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (error) {
      setState(() => _messages = []);
    }
  }

  Future<void> _handleSendMessage() async {
    final user = context.read<AuthProvider>().user;
    if (_selectedUser.isEmpty || user?.username == null) {
      context.read<ToastProvider>().showError('Please select a user to chat with');
      return;
    }

    final message = _messageController.text.trim();
    if (message.isEmpty && _selectedFile == null) {
      context.read<ToastProvider>().showError('Please enter a message or select a file');
      return;
    }

    setState(() => _loading = true);

    try {
      final dio = Dio();

      if (_selectedFile != null) {
        // Send file message
        final formData = FormData();
        formData.fields.add(MapEntry('sender', user!.username));
        formData.fields.add(MapEntry('receiver', _selectedUser));
        formData.files.add(MapEntry(
          'file',
          await MultipartFile.fromFile(_selectedFile!.path),
        ));

        await dio.post('http://localhost:8084/api/chat/send/file', data: formData);
        
        setState(() => _selectedFile = null);
      } else {
        // Send text message
        await dio.post('http://localhost:8084/api/chat/send/text', data: {
          'sender': user!.username,
          'receiver': _selectedUser,
          'message': message,
        });
      }

      _messageController.clear();
      context.read<ToastProvider>().showSuccess('Message sent successfully');
      
      // Refresh chat history immediately
      await _fetchChatHistory();
      await _fetchUnreadCounts();
    } catch (error) {
      context.read<ToastProvider>().showError('Error sending message');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleSearchUsers() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    // Filter connected users based on search query
    final filteredUsers = _connectedUsers
        .where((userInfo) => userInfo['username']
            .toString()
            .toLowerCase()
            .contains(query.toLowerCase()))
        .toList();

    setState(() {
      _searchResults = filteredUsers;
    });
  }

  Future<void> _handleUserSelect(String username) async {
    final user = context.read<AuthProvider>().user;
    if (user?.username == null) return;

    setState(() {
      _selectedUser = username;
      _searchResults = [];
      _searchController.clear();
      _isSearching = false;
    });

    // Mark messages as read
    try {
      final dio = Dio();
      await dio.put(
        'http://localhost:8084/api/chat/mark-read?sender=$username&receiver=${user!.username}'
      );
      
      // Clear unread count for selected user
      setState(() {
        _unreadCounts[username] = 0;
      });
      
      await _fetchUnreadCounts();
    } catch (error) {
      // Handle error silently
    }

    await _fetchChatHistory();
  }

  Future<void> _pickFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles();

    if (result != null) {
      setState(() {
        _selectedFile = File(result.files.single.path!);
      });
    }
  }

  Future<void> _handleDeleteChat() async {
    final user = context.read<AuthProvider>().user;
    if (_selectedUser.isEmpty || user?.username == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Chat'),
        content: const Text('Are you sure you want to delete this chat history?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final dio = Dio();
        await dio.delete(
          'http://localhost:8084/api/chat/delete?user1=${user!.username}&user2=$_selectedUser'
        );
        
        context.read<ToastProvider>().showSuccess('Chat history deleted successfully');
        setState(() => _messages = []);
        await _fetchUnreadCounts();
      } catch (error) {
        context.read<ToastProvider>().showError('Error deleting chat history');
      }
    }
  }

  Widget _buildNotificationBadge(String username) {
    final count = _unreadCounts[username] ?? 0;
    if (count == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(6),
      decoration: const BoxDecoration(
        color: AppTheme.successColor,
        shape: BoxShape.circle,
      ),
      child: Text(
        count > 99 ? '99+' : count.toString(),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _getRoleBadge(String role) {
    Color color;
    IconData icon;

    switch (role) {
      case 'FACULTY':
        color = AppTheme.warningColor;
        icon = Icons.school;
        break;
      case 'ALUMNI':
        color = AppTheme.primaryColor;
        icon = Icons.work;
        break;
      case 'STUDENT':
      default:
        color = Colors.grey;
        icon = Icons.person;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 2),
          Text(
            role,
            style: TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FadeInWidget(
      child: Column(
        children: [
          _buildHeroSection(),
          const SizedBox(height: 16),
          Expanded(
            child: Row(
              children: [
                // User List
                Expanded(
                  flex: 1,
                  child: _buildUserList(),
                ),
                const SizedBox(width: 16),
                
                // Chat Window
                Expanded(
                  flex: 2,
                  child: _buildChatWindow(),
                ),
                const SizedBox(width: 16),
                
                // Chat Info
                Expanded(
                  flex: 1,
                  child: _buildChatInfo(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        children: [
          Icon(Icons.chat, size: 32, color: Colors.white),
          SizedBox(height: 8),
          Text(
            'Chat',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Connect and communicate with your network',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserList() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Find Users',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          
          // Search
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search connected users...',
              prefixIcon: const Icon(Icons.search, size: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            onChanged: (_) => _handleSearchUsers(),
          ),
          const SizedBox(height: 12),
          
          // Search Results or Connected Users
          Expanded(
            child: ListView.builder(
              itemCount: _isSearching && _searchController.text.isNotEmpty
                  ? _searchResults.length
                  : _connectedUsers.length,
              itemBuilder: (context, index) {
                final userInfo = _isSearching && _searchController.text.isNotEmpty
                    ? _searchResults[index]
                    : _connectedUsers[index];
                
                return _UserListItem(
                  username: userInfo['username'],
                  role: userInfo['role'],
                  isSelected: _selectedUser == userInfo['username'],
                  unreadCount: _unreadCounts[userInfo['username']] ?? 0,
                  onTap: () => _handleUserSelect(userInfo['username']),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatWindow() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Chat Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.chat, color: AppTheme.primaryColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _selectedUser.isEmpty ? 'Select a user to chat' : 'Chat with $_selectedUser',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (_selectedUser.isNotEmpty)
                  IconButton(
                    onPressed: _handleDeleteChat,
                    icon: const Icon(Icons.delete, color: AppTheme.errorColor),
                    tooltip: 'Delete Chat',
                  ),
              ],
            ),
          ),
          
          // Messages
          Expanded(
            child: _selectedUser.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat, size: 48, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No messages yet. Start the conversation!',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _messagesScrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      return _MessageBubble(message: message);
                    },
                  ),
          ),
          
          // Message Input
          if (_selectedUser.isNotEmpty) _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(12),
          bottomRight: Radius.circular(12),
        ),
      ),
      child: Column(
        children: [
          if (_selectedFile != null) ...[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.attach_file, size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_selectedFile!.path.split('/').last)),
                  IconButton(
                    onPressed: () => setState(() => _selectedFile = null),
                    icon: const Icon(Icons.close, size: 16),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
          
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Type your message...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  enabled: !_loading && _selectedFile == null,
                ),
              ),
              const SizedBox(width: 8),
              
              IconButton(
                onPressed: _pickFile,
                icon: const Icon(Icons.attach_file),
                tooltip: 'Attach File',
              ),
              
              ElevatedButton(
                onPressed: (_loading || (_messageController.text.trim().isEmpty && _selectedFile == null))
                    ? null
                    : _handleSendMessage,
                style: ElevatedButton.styleFrom(
                  shape: const CircleBorder(),
                  padding: const EdgeInsets.all(12),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChatInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chat Info',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          
          if (_selectedUser.isNotEmpty) ...[
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    backgroundColor: AppTheme.primaryColor,
                    radius: 30,
                    child: Text(
                      _selectedUser[0].toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _selectedUser,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '@$_selectedUser',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  _getRoleBadge(_getSelectedUserRole()),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            _InfoRow(
              label: 'Messages',
              value: _messages.length.toString(),
            ),
            const SizedBox(height: 8),
            _InfoRow(
              label: 'Connection',
              value: 'Connected',
              valueColor: AppTheme.successColor,
            ),
            const SizedBox(height: 8),
            _InfoRow(
              label: 'Role',
              value: _getSelectedUserRole(),
            ),
            
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _handleDeleteChat,
                icon: const Icon(Icons.delete, color: AppTheme.errorColor),
                label: const Text('Clear Chat'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.errorColor,
                  side: const BorderSide(color: AppTheme.errorColor),
                ),
              ),
            ),
          ] else ...[
            const Center(
              child: Column(
                children: [
                  Icon(Icons.person, size: 48, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'Select a user to view chat information',
                    style: TextStyle(color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _getSelectedUserRole() {
    final userInfo = _connectedUsers.firstWhere(
      (user) => user['username'] == _selectedUser,
      orElse: () => {'role': 'USER'},
    );
    return userInfo['role'] ?? 'USER';
  }
}

class _UserListItem extends StatelessWidget {
  final String username;
  final String role;
  final bool isSelected;
  final int unreadCount;
  final VoidCallback onTap;

  const _UserListItem({
    required this.username,
    required this.role,
    required this.isSelected,
    required this.unreadCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isSelected ? AppTheme.primaryColor.withOpacity(0.1) : null,
        border: Border.all(
          color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
          width: isSelected ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryColor,
          radius: 20,
          child: Text(
            username[0].toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Row(
          children: [
            Expanded(child: Text(username)),
            if (unreadCount > 0)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppTheme.successColor,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  unreadCount > 99 ? '99+' : unreadCount.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
        subtitle: Text('@$username'),
        onTap: onTap,
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Map<String, dynamic> message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user;
    final isMe = message['senderUsername'] == user?.username;
    
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        decoration: BoxDecoration(
          color: isMe ? AppTheme.primaryColor : Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${message['senderUsername']} • ${_formatTimestamp(message['timestamp'])}',
              style: TextStyle(
                fontSize: 10,
                color: isMe ? Colors.white70 : Colors.grey[600],
              ),
            ),
            const SizedBox(height: 4),
            
            if (message['message'] != null)
              Text(
                message['message'],
                style: TextStyle(
                  fontSize: 14,
                  color: isMe ? Colors.white : Colors.black87,
                ),
              ),
            
            if (message['fileUrl'] != null) ...[
              const SizedBox(height: 8),
              _buildFileAttachment(message['fileUrl']),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFileAttachment(String fileUrl) {
    if (_isImageFile(fileUrl)) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          fileUrl,
          width: 200,
          height: 200,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              width: 200,
              height: 100,
              color: Colors.grey[300],
              child: const Icon(Icons.broken_image),
            );
          },
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.attach_file, size: 16),
            const SizedBox(width: 8),
            Text(_isPdfFile(fileUrl) ? 'PDF File' : 'File'),
          ],
        ),
      );
    }
  }

  bool _isImageFile(String fileUrl) {
    return RegExp(r'\.(jpg|jpeg|png|gif|webp)$', caseSensitive: false).hasMatch(fileUrl);
  }

  bool _isPdfFile(String fileUrl) {
    return fileUrl.toLowerCase().endsWith('.pdf');
  }

  String _formatTimestamp(dynamic timestamp) {
    try {
      final dateTime = DateTime.parse(timestamp.toString());
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return '';
    }
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          '$label:',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? Colors.black87,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}