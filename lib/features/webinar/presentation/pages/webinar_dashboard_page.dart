import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'dart:async';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class WebinarDashboardPage extends StatefulWidget {
  const WebinarDashboardPage({super.key});

  @override
  State<WebinarDashboardPage> createState() => _WebinarDashboardPageState();
}

class _WebinarDashboardPageState extends State<WebinarDashboardPage> {
  final _searchController = TextEditingController();
  
  List<Map<String, dynamic>> _webinars = [];
  Map<String, Map<String, dynamic>> _countdowns = {};
  bool _loading = true;
  String _viewMode = 'grid'; // 'grid' or 'calendar'
  DateTime _currentDate = DateTime.now();
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    _fetchWebinars();
    
    // Start countdown timer
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _fetchCountdowns();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchWebinars() async {
    try {
      setState(() => _loading = true);
      final dio = Dio();
      final response = await dio.get('http://localhost:8086/webinar/all');
      
      setState(() {
        _webinars = List<Map<String, dynamic>>.from(response.data ?? []);
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Failed to fetch webinars');
      setState(() => _webinars = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchCountdowns() async {
    for (final webinar in _webinars) {
      if (webinar['id'] != null) {
        try {
          final dio = Dio();
          final response = await dio.get('http://localhost:8086/webinar/countdown/${webinar['id']}');
          
          if (response.statusCode == 200) {
            setState(() {
              _countdowns[webinar['id'].toString()] = {
                'hours': response.data['hours'] ?? 0,
                'minutes': response.data['minutes'] ?? 0,
                'seconds': response.data['seconds'] ?? 0,
                'status': response.data['status'] ?? 'Ongoing',
              };
            });
          }
        } catch (error) {
          // Handle error silently
        }
      }
    }
  }

  Future<void> _handleSearch(String query) async {
    if (query.trim().isEmpty) {
      _fetchWebinars();
      return;
    }

    try {
      setState(() => _loading = true);
      final dio = Dio();
      final response = await dio.get('http://localhost:8086/webinar/search?query=${Uri.encodeComponent(query)}');
      
      setState(() {
        _webinars = List<Map<String, dynamic>>.from(response.data ?? []);
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Search failed');
      setState(() => _webinars = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  void _handleJoinWebinar(Map<String, dynamic> webinar) {
    final link = webinar['link'] ?? webinar['videoLink'] ?? webinar['meetingLink'] ?? webinar['url'] ?? webinar['jitsiLink'];
    if (link != null) {
      // In a real app, you would use url_launcher to open the link
      context.read<ToastProvider>().showInfo('Opening webinar link: $link');
    } else {
      context.read<ToastProvider>().showError('Meeting link not available');
    }
  }

  String _getWebinarStatus(String webinarId) {
    final countdown = _countdowns[webinarId];
    if (countdown == null) return 'Loading...';

    switch (countdown['status']) {
      case 'Upcoming':
        return 'Upcoming';
      case 'Ongoing':
        return 'Live';
      case 'Ended':
        return 'Ended';
      default:
        return 'Live';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Live':
      case 'Ongoing':
        return AppTheme.successColor;
      case 'Upcoming':
        return AppTheme.warningColor;
      case 'Ended':
        return Colors.grey;
      default:
        return AppTheme.successColor;
    }
  }

  String _formatCountdownTime(int time) {
    return time.toString().padLeft(2, '0');
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user;

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return FadeInWidget(
      child: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeroSection(user),
            const SizedBox(height: 32),
            _buildViewToggle(),
            const SizedBox(height: 16),
            if (_viewMode == 'grid') ...[
              _buildSearchSection(),
              const SizedBox(height: 32),
              _buildWebinarGrid(),
            ] else
              _buildCalendarView(),
            if (user == null) ...[
              const SizedBox(height: 32),
              _buildAuthPrompt(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection(user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(Icons.video_call, size: 48, color: Colors.white),
          const SizedBox(height: 16),
          const Text(
            'Webinar Dashboard',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Discover and join live webinars or create your own',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white,
              fontWeight: FontWeight.w400,
            ),
            textAlign: TextAlign.center,
          ),
          if (user != null) ...[
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => context.go('/webinar/create'),
              icon: const Icon(Icons.add),
              label: const Text('Create Webinar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildViewToggle() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(
              value: 'grid',
              label: Text('Grid View'),
              icon: Icon(Icons.grid_view),
            ),
            ButtonSegment(
              value: 'calendar',
              label: Text('Calendar View'),
              icon: Icon(Icons.calendar_month),
            ),
          ],
          selected: {_viewMode},
          onSelectionChanged: (Set<String> selection) {
            setState(() {
              _viewMode = selection.first;
            });
          },
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
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search webinars by title...',
          prefixIcon: const Icon(Icons.search),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        onChanged: _handleSearch,
      ),
    );
  }

  Widget _buildWebinarGrid() {
    if (_webinars.isEmpty) {
      return _buildEmptyState();
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.8,
      ),
      itemCount: _webinars.length,
      itemBuilder: (context, index) {
        final webinar = _webinars[index];
        return _WebinarCard(
          webinar: webinar,
          countdown: _countdowns[webinar['id']?.toString()],
          onJoin: () => _handleJoinWebinar(webinar),
        );
      },
    );
  }

  Widget _buildCalendarView() {
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
      child: const Column(
        children: [
          Text(
            'Calendar View',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 16),
          Text(
            'Calendar view implementation would go here',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    final user = context.read<AuthProvider>().user;
    
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
      child: Column(
        children: [
          const Icon(Icons.video_call, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'No Webinars Found',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchController.text.isNotEmpty
                ? 'No webinars match "${_searchController.text}". Try a different search term.'
                : 'No webinars are currently available. Be the first to create one!',
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
          if (user != null) ...[
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => context.go('/webinar/create'),
              icon: const Icon(Icons.add),
              label: const Text('Create First Webinar'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAuthPrompt() {
    return Container(
      padding: const EdgeInsets.all(32),
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
          const Icon(Icons.info, size: 48, color: AppTheme.primaryColor),
          const SizedBox(height: 16),
          const Text(
            'Want to create your own webinars?',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Sign in to start hosting interactive webinars and connect with your audience.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton(
                onPressed: () => context.go('/login'),
                child: const Text('Sign In'),
              ),
              const SizedBox(width: 16),
              ElevatedButton(
                onPressed: () => context.go('/register'),
                child: const Text('Sign Up'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WebinarCard extends StatelessWidget {
  final Map<String, dynamic> webinar;
  final Map<String, dynamic>? countdown;
  final VoidCallback onJoin;

  const _WebinarCard({
    required this.webinar,
    required this.countdown,
    required this.onJoin,
  });

  @override
  Widget build(BuildContext context) {
    final status = countdown?['status'] ?? 'Ongoing';
    final statusColor = _getStatusColor(status);

    return Container(
      padding: const EdgeInsets.all(16),
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
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.video_call, color: AppTheme.primaryColor),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _getWebinarStatus(status),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Title
          Text(
            webinar['title'] ?? 'Untitled Webinar',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          
          // Meta info
          if (webinar['hostUsername'] != null) ...[
            Row(
              children: [
                const Icon(Icons.person, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Hosted by ${webinar['hostUsername']}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
          ],
          
          if (webinar['scheduledDate'] != null) ...[
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  webinar['scheduledDate'],
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 4),
          ],
          
          if (webinar['timeSlot'] != null) ...[
            Row(
              children: [
                const Icon(Icons.access_time, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  webinar['timeSlot'],
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ],
          
          const Spacer(),
          
          // Countdown
          if (countdown != null) ...[
            const SizedBox(height: 12),
            _buildCountdownDisplay(countdown!),
          ],
          
          const SizedBox(height: 16),
          
          // Join Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: status == 'Ended' ? null : onJoin,
              icon: const Icon(Icons.video_call, size: 16),
              label: Text(_getJoinButtonText(status)),
              style: ElevatedButton.styleFrom(
                backgroundColor: status == 'Ended' ? Colors.grey : statusColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCountdownDisplay(Map<String, dynamic> countdown) {
    final status = countdown['status'];
    
    if (status == 'Upcoming') {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.warningColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Starts in ', style: TextStyle(fontSize: 12)),
            Text(
              '${_formatCountdownTime(countdown['hours'])}:${_formatCountdownTime(countdown['minutes'])}:${_formatCountdownTime(countdown['seconds'])}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppTheme.warningColor,
              ),
            ),
          ],
        ),
      );
    } else if (status == 'Ongoing') {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.successColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.circle, size: 8, color: AppTheme.successColor),
            SizedBox(width: 4),
            Text(
              'Live Now',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppTheme.successColor,
              ),
            ),
          ],
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.grey.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text(
          'This webinar has ended.',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
          textAlign: TextAlign.center,
        ),
      );
    }
  }

  String _formatCountdownTime(int time) {
    return time.toString().padLeft(2, '0');
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Live':
      case 'Ongoing':
        return AppTheme.successColor;
      case 'Upcoming':
        return AppTheme.warningColor;
      case 'Ended':
        return Colors.grey;
      default:
        return AppTheme.successColor;
    }
  }

  String _getWebinarStatus(String status) {
    switch (status) {
      case 'Upcoming':
        return 'Upcoming';
      case 'Ongoing':
        return 'Live';
      case 'Ended':
        return 'Ended';
      default:
        return 'Live';
    }
  }

  String _getJoinButtonText(String status) {
    switch (status) {
      case 'Ongoing':
        return 'Join Live Now';
      case 'Ended':
        return 'Ended';
      default:
        return 'Join Live Now';
    }
  }
}