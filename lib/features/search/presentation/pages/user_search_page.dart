import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class UserSearchPage extends StatefulWidget {
  const UserSearchPage({super.key});

  @override
  State<UserSearchPage> createState() => _UserSearchPageState();
}

class _UserSearchPageState extends State<UserSearchPage> {
  final _searchController = TextEditingController();
  
  List<Map<String, dynamic>> _searchResults = [];
  Map<String, String> _userStatuses = {};
  bool _loading = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _loading = true);

    try {
      final dio = Dio();
      final response = await dio.get('http://localhost:8081/auth/search-users?query=$query');
      
      setState(() {
        _searchResults = List<Map<String, dynamic>>.from(response.data);
      });
      
      // Check connection status for each user
      final statuses = <String, String>{};
      for (final userInfo in _searchResults) {
        if (userInfo['username'] != user.username) {
          try {
            final statusResponse = await dio.get(
              'http://localhost:8083/api/chat/connection/status?viewedUsername=${userInfo['username']}'
            );
            statuses[userInfo['username']] = statusResponse.data;
          } catch (error) {
            statuses[userInfo['username']] = 'NOT_CONNECTED';
          }
        }
      }
      
      setState(() {
        _userStatuses = statuses;
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Error searching users');
      setState(() => _searchResults = []);
    } finally {
      setState(() => _loading = false);
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
      
      // Update the status for this user
      setState(() {
        _userStatuses[username] = 'PENDING';
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Error sending connection request');
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
    final user = context.read<AuthProvider>().user;

    return FadeInWidget(
      child: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeroSection(),
            const SizedBox(height: 32),
            _buildSearchSection(),
            if (_searchResults.isNotEmpty) ...[
              const SizedBox(height: 32),
              _buildSearchResults(user),
            ],
            if (_searchController.text.isNotEmpty && _searchResults.isEmpty && !_loading) ...[
              const SizedBox(height: 32),
              _buildNoResults(),
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
          Icon(Icons.search, size: 48, color: Colors.white),
          SizedBox(height: 16),
          Text(
            'Find People',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 8),
          Text(
            'Search for students, alumni, and faculty members',
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
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by username...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _handleSearch,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search),
                        SizedBox(width: 8),
                        Text('Search'),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults(user) {
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
            'Search Results (${_searchResults.length})',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.2,
            ),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final userInfo = _searchResults[index];
              final status = _userStatuses[userInfo['username']] ?? 'NOT_CONNECTED';
              
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.primaryColor,
                      radius: 30,
                      child: Text(
                        userInfo['username'][0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Text(
                            userInfo['username'],
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        _getRoleBadge(userInfo['role']),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '@${userInfo['username']}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    _getStatusBadge(status),
                    const SizedBox(height: 8),
                    
                    if (userInfo['username'] != user?.username && status == 'NOT_CONNECTED')
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () => _sendConnectionRequest(userInfo['username']),
                          icon: const Icon(Icons.person_add, size: 16),
                          label: const Text('Connect'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNoResults() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(48),
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
      child: const Column(
        children: [
          Icon(Icons.person_search, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'No users found',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Try searching with a different username',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}