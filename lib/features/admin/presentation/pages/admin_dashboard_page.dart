import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';

import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  List<Map<String, dynamic>> _pendingStudents = [];
  List<Map<String, dynamic>> _verifiedStudents = [];
  bool _loading = true;
  String _activeTab = 'pending';
  String? _verifyingStudent;

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    try {
      setState(() => _loading = true);
      
      final dio = Dio();
      final pendingResponse = await dio.get('http://localhost:8081/auth/pending-students');
      final verifiedResponse = await dio.get('http://localhost:8081/auth/verified-students');
      
      setState(() {
        _pendingStudents = List<Map<String, dynamic>>.from(pendingResponse.data);
        _verifiedStudents = List<Map<String, dynamic>>.from(verifiedResponse.data);
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Failed to fetch student data');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleVerifyStudent(String email, bool isVerified) async {
    try {
      setState(() => _verifyingStudent = email);
      
      final dio = Dio();
      final response = await dio.post(
        'http://localhost:8081/auth/verify-student?email=${Uri.encodeComponent(email)}&isVerified=$isVerified'
      );
      
      context.read<ToastProvider>().showSuccess(response.data.toString());
      
      // Refresh the lists
      await _fetchStudents();
    } catch (error) {
      context.read<ToastProvider>().showError('Failed to verify student');
    } finally {
      setState(() => _verifyingStudent = null);
    }
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
            Text('Loading student data...'),
          ],
        ),
      );
    }

    return FadeInWidget(
      child: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(),
            const SizedBox(height: 32),
            _buildStatsCards(),
            const SizedBox(height: 32),
            _buildTabSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        children: [
          Icon(Icons.admin_panel_settings, size: 48, color: Colors.white),
          SizedBox(height: 16),
          Text(
            'Admin Dashboard',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 8),
          Text(
            'Manage student registrations and verifications',
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

  Widget _buildStatsCards() {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            title: 'Pending Verification',
            count: _pendingStudents.length,
            icon: Icons.access_time,
            color: AppTheme.warningColor,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatCard(
            title: 'Verified Students',
            count: _verifiedStudents.length,
            icon: Icons.check_circle,
            color: AppTheme.successColor,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatCard(
            title: 'Total Students',
            count: _pendingStudents.length + _verifiedStudents.length,
            icon: Icons.people,
            color: AppTheme.primaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildTabSection() {
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
          // Tabs
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => setState(() => _activeTab = 'pending'),
                  icon: const Icon(Icons.access_time),
                  label: Text('Pending (${_pendingStudents.length})'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _activeTab == 'pending' ? AppTheme.primaryColor : Colors.grey[300],
                    foregroundColor: _activeTab == 'pending' ? Colors.white : Colors.grey[600],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => setState(() => _activeTab = 'verified'),
                  icon: const Icon(Icons.check_circle),
                  label: Text('Verified (${_verifiedStudents.length})'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _activeTab == 'verified' ? AppTheme.primaryColor : Colors.grey[300],
                    foregroundColor: _activeTab == 'verified' ? Colors.white : Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          // Tab Content
          if (_activeTab == 'pending')
            _buildPendingStudents()
          else
            _buildVerifiedStudents(),
        ],
      ),
    );
  }

  Widget _buildPendingStudents() {
    if (_pendingStudents.isEmpty) {
      return const _EmptyState(
        icon: Icons.access_time,
        title: 'No Pending Students',
        description: 'All student registrations have been processed',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Pending Verification',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _pendingStudents.length,
          itemBuilder: (context, index) {
            final student = _pendingStudents[index];
            return _StudentCard(
              student: student,
              isPending: true,
              isVerifying: _verifyingStudent == student['email'],
              onVerify: (isVerified) => _handleVerifyStudent(student['email'], isVerified),
            );
          },
        ),
      ],
    );
  }

  Widget _buildVerifiedStudents() {
    if (_verifiedStudents.isEmpty) {
      return const _EmptyState(
        icon: Icons.check_circle,
        title: 'No Verified Students',
        description: 'No students have been verified yet',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Verified Students',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _verifiedStudents.length,
          itemBuilder: (context, index) {
            final student = _verifiedStudents[index];
            return _StudentCard(
              student: student,
              isPending: false,
              isVerifying: false,
              onVerify: null,
            );
          },
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final int count;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.count,
    required this.icon,
    required this.color,
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
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 24, color: color),
          ),
          const SizedBox(height: 12),
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _StudentCard extends StatelessWidget {
  final Map<String, dynamic> student;
  final bool isPending;
  final bool isVerifying;
  final Function(bool)? onVerify;

  const _StudentCard({
    required this.student,
    required this.isPending,
    required this.isVerifying,
    required this.onVerify,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppTheme.primaryColor,
            radius: 24,
            child: const Icon(Icons.person, color: Colors.white),
          ),
          const SizedBox(width: 16),
          
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['username'] ?? 'Unknown',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.email, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        student['email'] ?? 'No email',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.badge, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      student['enrollNumber'] ?? 'No enrollment number',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          if (!isPending)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.successColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, size: 16, color: AppTheme.successColor),
                  SizedBox(width: 4),
                  Text(
                    'Verified',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.successColor,
                    ),
                  ),
                ],
              ),
            )
          else
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ElevatedButton.icon(
                  onPressed: isVerifying ? null : () => onVerify?.call(true),
                  icon: isVerifying
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.check, size: 16),
                  label: const Text('Approve'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.successColor,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: isVerifying ? null : () => onVerify?.call(false),
                  icon: isVerifying
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.close, size: 16),
                  label: const Text('Reject'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.errorColor,
                    side: const BorderSide(color: AppTheme.errorColor),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(48),
      child: Column(
        children: [
          Icon(icon, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: const TextStyle(
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