import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class ConnectionsPage extends StatefulWidget {
  const ConnectionsPage({super.key});

  @override
  State<ConnectionsPage> createState() => _ConnectionsPageState();
}

class _ConnectionsPageState extends State<ConnectionsPage> {
  final _searchController = TextEditingController();
  
  List<Map<String, dynamic>> _searchResults = [];
  List<Map<String, dynamic>> _pendingRequests = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchPendingRequests();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchPendingRequests() async {
    try {
      final dio = Dio();
      final response = await dio.get('http://localhost:8083/api/chat/connection/pending');
      setState(() {
        _pendingRequests = List<Map<String, dynamic>>.from(response.data);
        _loading = false;
      });
    } catch (error) {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    try {
      final dio = Dio();
      final response = await dio.get('http://localhost:8081/auth/search-users?query=$query');
      
      final results = <Map<String, dynamic>>[];
      
      for (final userInfo in response.data) {
        if (userInfo['username'] != user.username) {
          try {
            final statusResponse = await dio.get(
              'http://localhost:8083/api/chat/connection/status?viewedUsername=${userInfo['username']}'
            );
            results.add({
              'username': userInfo['username'],
              'role': userInfo['role'],
              'status': statusResponse.data,
            });
          } catch (error) {
            results.add({
              'username': userInfo['username'],
              'role': userInfo['role'],
              'status': 'NOT_CONNECTED',
            });
          }
        }
      }
      
      setState(() {
        _searchResults = results;
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Error searching users');
    }
  }

  Future<void> _sendConnectionRequest(String username) async {
    try {
      final dio = Dio();
      final response = await dio.post(
        'http://localhost:8083/api/chat/connection/send',
        data: {'receiverUsername': username},
      );
      
      context.read<ToastProvider>().showSuccess(response.data.toString());
      
      // Update the search results
      setState(() {
        _searchResults = _searchResults.map((user) {
          if (user['username'] == username) {
            return {...user, 'status': 'PENDING'};
          }
          return user;
        }).toList();
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Error sending connection request');
    }
  }

  Future<void> _respondToRequest(String fromUsername, String response) async {
    try {
      final dio = Dio();
      final apiResponse = await dio.post(
        'http://localhost:8083/api/chat/connection/respond?fromUsername=$fromUsername&response=$response'
      );
      
      context.read<ToastProvider>().showSuccess(apiResponse.data.toString());
      
      // Remove the request from pending list
      setState(() {
        _pendingRequests = _pendingRequests
            .where((request) => request['senderUsername'] != fromUsername)
            .toList();
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Error responding to request');
    }
  }

  Widget _getStatusBadge(String status) {
    Color color;
    String text;

    switch (status) {
      case 'CONNECTED':
        color = AppTheme.successColor;
        text = 'Connected';
        break;
      case 'PENDING':
        color = AppTheme.warningColor;
        text = 'Pending';
        break;
      default:
        color = Colors.grey;
        text = 'Not Connected';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            role,
            style: TextStyle(
              fontSize: 10,
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
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return FadeInWidget(
      child: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeroSection(),
            const SizedBox(height: 32),
            _buildStatusCards(),
            const SizedBox(height: 32),
            _buildSearchSection(),
            if (_searchResults.isNotEmpty) ...[
              const SizedBox(height: 32),
              _buildSearchResults(),
            ],
            if (_pendingRequests.isNotEmpty) ...[
              const SizedBox(height: 32),
              _buildRecentRequests(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        children: [
          Icon(Icons.people, size: 48, color: Colors.white),
          SizedBox(height: 16),
          Text(
            'Connections',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 8),
          Text(
            'Manage your professional network',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white,
              fontWeight: FontWeight.w400,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCards() {
    return Row(
      children: [
        Expanded(
          child: _StatusCard(
            title: 'Pending Requests',
            icon: Icons.person_add,
            count: _pendingRequests.length,
            description: 'Requests waiting for response',
            onTap: () => context.go('/connections/pending'),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatusCard(
            title: 'Quick Actions',
            icon: Icons.people,
            count: null,
            description: 'Find and connect with people',
            onTap: () => context.go('/search'),
          ),
        ),
      ],
    );
  }

  Widget _buildSearchSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Search & Connect',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search for users to connect...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              ElevatedButton(
                onPressed: _handleSearch,
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.search),
                    SizedBox(width: 8),
                    Text('Search'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Search Results',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: 16),
          
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final result = _searchResults[index];
              return _UserCard(
                username: result['username'],
                role: result['role'],
                status: result['status'],
                onConnect: () => _sendConnectionRequest(result['username']),
                onChat: () => context.go('/chat/${result['username']}'),
                onViewProfile: () {
                  final route = _getProfileRoute(result['role'], result['username']);
                  context.go(route);
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecentRequests() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Recent Requests',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _pendingRequests.take(3).length,
            itemBuilder: (context, index) {
              final request = _pendingRequests[index];
              return _RequestCard(
                username: request['senderUsername'],
                onAccept: () => _respondToRequest(request['senderUsername'], 'ACCEPTED'),
                onDecline: () => _respondToRequest(request['senderUsername'], 'REJECTED'),
              );
            },
          ),
        ],
      ),
    );
  }

  String _getProfileRoute(String role, String username) {
    switch (role) {
      case 'STUDENT':
        return '/profile/student/public/$username';
      case 'ALUMNI':
        return '/profile/alumni/public/$username';
      case 'FACULTY':
        return '/profile/faculty/public/$username';
      default:
        return '/profile/student/public/$username';
    }
  }
}

class _StatusCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final int? count;
  final String description;
  final VoidCallback onTap;

  const _StatusCard({
    required this.title,
    required this.icon,
    required this.count,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              Icon(icon, color: AppTheme.primaryColor),
            ],
          ),
          const SizedBox(height: 16),
          
          if (count != null) ...[
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: count! > 0 
                        ? AppTheme.warningColor.withOpacity(0.1)
                        : AppTheme.successColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    count.toString(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: count! > 0 ? AppTheme.warningColor : AppTheme.successColor,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(description),
              ],
            ),
          ] else ...[
            Text(description),
          ],
          
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onTap,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon),
                  const SizedBox(width: 8),
                  Text(count != null ? 'View All Requests' : 'Find People'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final String username;
  final String role;
  final String status;
  final VoidCallback onConnect;
  final VoidCallback onChat;
  final VoidCallback onViewProfile;

  const _UserCard({
    required this.username,
    required this.role,
    required this.status,
    required this.onConnect,
    required this.onChat,
    required this.onViewProfile,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppTheme.primaryColor,
            child: Text(
              username[0].toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      username,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _getRoleBadge(role),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '@$username',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          
          Column(
            children: [
              _getStatusBadge(status),
              const SizedBox(height: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: onViewProfile,
                    icon: const Icon(Icons.visibility, size: 20),
                    tooltip: 'View Profile',
                  ),
                  
                  if (status == 'NOT_CONNECTED')
                    IconButton(
                      onPressed: onConnect,
                      icon: const Icon(Icons.person_add, size: 20),
                      tooltip: 'Connect',
                    ),
                  
                  if (status == 'CONNECTED')
                    IconButton(
                      onPressed: onChat,
                      icon: const Icon(Icons.chat, size: 20),
                      tooltip: 'Chat',
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _getStatusBadge(String status) {
    Color color;
    String text;

    switch (status) {
      case 'CONNECTED':
        color = AppTheme.successColor;
        text = 'Connected';
        break;
      case 'PENDING':
        color = AppTheme.warningColor;
        text = 'Pending';
        break;
      default:
        color = Colors.grey;
        text = 'Not Connected';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            role,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final String username;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const _RequestCard({
    required this.username,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppTheme.primaryColor,
            child: Text(
              username[0].toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  username,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Wants to connect with you',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
          
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ElevatedButton(
                onPressed: onAccept,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.successColor,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: const Text('Accept'),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: onDecline,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.errorColor,
                  side: const BorderSide(color: AppTheme.errorColor),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: const Text('Decline'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}