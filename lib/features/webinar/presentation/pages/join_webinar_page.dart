import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class JoinWebinarPage extends StatefulWidget {
  final String webinarId;

  const JoinWebinarPage({super.key, required this.webinarId});

  @override
  State<JoinWebinarPage> createState() => _JoinWebinarPageState();
}

class _JoinWebinarPageState extends State<JoinWebinarPage> {
  Map<String, dynamic>? _webinar;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchWebinarDetails();
  }

  Future<void> _fetchWebinarDetails() async {
    try {
      setState(() => _loading = true);
      
      final dio = Dio();
      final response = await dio.get('http://localhost:8086/webinar/all');
      final webinars = List<Map<String, dynamic>>.from(response.data ?? []);
      
      final foundWebinar = webinars.firstWhere(
        (w) => w['id'].toString() == widget.webinarId,
        orElse: () => {},
      );
      
      if (foundWebinar.isNotEmpty) {
        setState(() {
          _webinar = foundWebinar;
          _error = null;
        });
      } else {
        setState(() {
          _error = 'Webinar not found';
        });
      }
    } catch (error) {
      setState(() {
        _error = 'Failed to load webinar details';
      });
      context.read<ToastProvider>().showError('Failed to load webinar details');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _handleJoinMeeting() {
    if (_webinar?['link'] != null) {
      // In a real app, you would use url_launcher to open the link
      context.read<ToastProvider>().showInfo('Opening webinar: ${_webinar!['link']}');
    }
  }

  void _handleBack() {
    context.go('/webinar');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading webinar details...'),
          ],
        ),
      );
    }

    if (_error != null || _webinar == null) {
      return FadeInWidget(
        child: Center(
          child: Container(
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
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error, size: 64, color: AppTheme.errorColor),
                const SizedBox(height: 16),
                const Text(
                  'Webinar Not Found',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'The webinar you\'re looking for doesn\'t exist or has been removed.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _handleBack,
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Back to Dashboard'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return FadeInWidget(
      child: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(),
            const SizedBox(height: 32),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 2,
                  child: _buildWebinarPreview(),
                ),
                const SizedBox(width: 32),
                Expanded(
                  flex: 1,
                  child: _buildInstructions(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: _handleBack,
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              'Join Webinar',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWebinarPreview() {
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
          // Webinar Icon
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.video_call, size: 48, color: Colors.white),
          ),
          const SizedBox(height: 24),
          
          // Title
          Text(
            _webinar!['title'] ?? 'Untitled Webinar',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          
          // Meta info
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.person, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text(
                'Hosted by ${_webinar!['hostUsername'] ?? 'Unknown Host'}',
                style: const TextStyle(color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 32),
          
          // Join Section
          const Text(
            'Ready to join?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Click the button below to join the webinar in this tab.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _handleJoinMeeting,
              icon: const Icon(Icons.video_call),
              label: const Text('Join Webinar Now'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppTheme.successColor,
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Meeting Link
          const Text(
            'Direct Meeting Link:',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Expanded(
                  child: SelectableText(
                    _webinar!['link'] ?? 'No link available',
                    style: TextStyle(
                      color: AppTheme.primaryColor,
                      fontSize: 12,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    // Copy to clipboard functionality would go here
                    context.read<ToastProvider>().showSuccess('Link copied to clipboard!');
                  },
                  icon: const Icon(Icons.copy, size: 16),
                  tooltip: 'Copy',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          OutlinedButton.icon(
            onPressed: () {
              // Open in new tab functionality would go here
              context.read<ToastProvider>().showInfo('Opening in new tab');
            },
            icon: const Icon(Icons.open_in_new),
            label: const Text('Open in New Tab'),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructions() {
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
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info, color: AppTheme.warningColor),
              SizedBox(width: 8),
              Text(
                'Important Meeting Instructions',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          
          Text(
            'Before Joining:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 8),
          _InstructionItem(text: 'No default moderator can be found'),
          _InstructionItem(text: 'Click "Login directly" and sign with Google'),
          _InstructionItem(text: 'If you created the meeting, specify your name as "Host" or "Faculty"'),
          _InstructionItem(text: 'If you\'re joining as participant, specify only your name'),
          
          SizedBox(height: 16),
          Text(
            'How to Join:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 8),
          _InstructionItem(text: '1. Click "Join Webinar Now" button'),
          _InstructionItem(text: '2. Allow camera and microphone permissions if prompted'),
          _InstructionItem(text: '3. Enter your name as instructed above'),
          _InstructionItem(text: '4. You\'ll be connected to the live webinar'),
          
          SizedBox(height: 16),
          Text(
            'Technical Requirements:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 8),
          _InstructionItem(text: 'Modern web browser (Chrome, Firefox, Safari, Edge)'),
          _InstructionItem(text: 'Stable internet connection'),
          _InstructionItem(text: 'Camera and microphone (optional)'),
          _InstructionItem(text: 'No software installation required'),
        ],
      ),
    );
  }
}

class _InstructionItem extends StatelessWidget {
  final String text;

  const _InstructionItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 4,
            height: 4,
            margin: const EdgeInsets.only(top: 8, right: 8),
            decoration: const BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}