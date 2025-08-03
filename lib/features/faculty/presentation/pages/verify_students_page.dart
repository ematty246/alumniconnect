import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class VerifyStudentsPage extends StatefulWidget {
  const VerifyStudentsPage({super.key});

  @override
  State<VerifyStudentsPage> createState() => _VerifyStudentsPageState();
}

class _VerifyStudentsPageState extends State<VerifyStudentsPage> {
  final _searchController = TextEditingController();
  
  List<Map<String, dynamic>> _pendingStudents = [];
  List<Map<String, dynamic>> _verifiedStudents = [];
  List<Map<String, dynamic>> _filteredPendingStudents = [];
  List<Map<String, dynamic>> _filteredVerifiedStudents = [];
  bool _loading = false;
  String _activeTab = 'pending';

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchStudents() async {
    final user = context.read<AuthProvider>().user;
    if (user?.role != 'FACULTY') return;

    setState(() => _loading = true);

    try {
      final dio = Dio();
      final token = context.read<AuthProvider>().token;
      
      final pendingResponse = await dio.get(
        'http://localhost:8081/auth/pending-students',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );
      
      final verifiedResponse = await dio.get(
        'http://localhost:8081/auth/verified-students',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );
      
      setState(() {
        _pendingStudents = List<Map<String, dynamic>>.from(pendingResponse.data);
        _verifiedStudents = List<Map<String, dynamic>>.from(verifiedResponse.data);
        _filteredPendingStudents = _pendingStudents;
        _filteredVerifiedStudents = _verifiedStudents;
      });
    } catch (error) {
      context.read<ToastProvider>().showError('Failed to fetch pending students');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleVerifyStudent(String email, bool isVerified) async {
    try {
      setState(() => _loading = true);
      
      final dio = Dio();
      final token = context.read<AuthProvider>().token;
      
      final response = await dio.post(
        'http://localhost:8081/auth/verify-student?email=$email&isVerified=$isVerified',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      context.read<ToastProvider>().showSuccess(response.data.toString());
      
      // Add a small delay to ensure backend has processed the change
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Refresh both lists
      await _fetchStudents();
    } catch (error) {
      context.read<ToastProvider>().showError('Failed to update student status');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _filterStudents(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredPendingStudents = _pendingStudents;
        _filteredVerifiedStudents = _verifiedStudents;
      } else {
        _filteredPendingStudents = _pendingStudents.where((student) {
          final username = student['username']?.toString().toLowerCase() ?? '';
          final email = student['email']?.toString().toLowerCase() ?? '';
          final enrollNumber = student['enrollNumber']?.toString().toLowerCase() ?? '';
          final searchQuery = query.toLowerCase();
          
          return username.contains(searchQuery) ||
                 email.contains(searchQuery) ||
                 enrollNumber.contains(searchQuery);
        }).toList();
        
        _filteredVerifiedStudents = _verifiedStudents.where((student) {
          final username = student['username']?.toString().toLowerCase() ?? '';
          final email = student['email']?.toString().toLowerCase() ?? '';
          final enrollNumber = student['enrollNumber']?.toString().toLowerCase() ?? '';
          final searchQuery = query.toLowerCase();
          
          return username.contains(searchQuery) ||
                 email.contains(searchQuery) ||
                 enrollNumber.contains(searchQuery);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user;

    if (user?.role != 'FACULTY') {
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
            child: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.block, size: 64, color: AppTheme.errorColor),
                SizedBox(height: 16),
                Text(
                  'Access Denied',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Only faculty members can access this page.',
                  style: TextStyle(color: Colors.grey),
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
            _buildTabsAndSearch(),
            const SizedBox(height: 24),
            _buildContent(),
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
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.verified_user, size: 28, color: Colors.white),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Student Verification',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Manage student verification requests',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: _loading ? null : _fetchStudents,
                icon: _loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.refresh),
                label: const Text('Refresh'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppTheme.primaryColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTabsAndSearch() {
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
          
          // Search
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by username, email, or enrollment number...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onChanged: _filterStudents,
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(
        child: Column(
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading students...'),
          ],
        ),
      );
    }

    final students = _activeTab == 'pending' ? _filteredPendingStudents : _filteredVerifiedStudents;

    if (students.isEmpty) {
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
            Icon(
              _activeTab == 'pending' ? Icons.people : Icons.check_circle,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              _activeTab == 'pending' ? 'No Pending Students' : 'No Verified Students',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _activeTab == 'pending'
                  ? 'All students have been verified or no new requests.'
                  : 'No students have been verified yet.',
              style: const TextStyle(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

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
            _activeTab == 'pending' ? 'Pending Verification' : 'Verified Students',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          
          // Table Header
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Expanded(flex: 2, child: Text('Student', style: TextStyle(fontWeight: FontWeight.w600))),
                Expanded(flex: 2, child: Text('Email', style: TextStyle(fontWeight: FontWeight.w600))),
                Expanded(flex: 1, child: Text('Enrollment', style: TextStyle(fontWeight: FontWeight.w600))),
                Expanded(flex: 1, child: Text('Role', style: TextStyle(fontWeight: FontWeight.w600))),
                if (_activeTab == 'pending')
                  Expanded(flex: 2, child: Text('Actions', style: TextStyle(fontWeight: FontWeight.w600))),
                if (_activeTab == 'verified')
                  Expanded(flex: 1, child: Text('Status', style: TextStyle(fontWeight: FontWeight.w600))),
              ],
            ),
          ),
          const SizedBox(height: 8),
          
          // Table Rows
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: students.length,
            itemBuilder: (context, index) {
              final student = students[index];
              return _StudentRow(
                student: student,
                isPending: _activeTab == 'pending',
                onVerify: (isVerified) => _handleVerifyStudent(student['email'], isVerified),
              );
            },
          ),
        ],
      ),
    );
  }

  Future<void> _handleVerifyStudent(String email, bool isVerified) async {
    try {
      setState(() => _loading = true);
      
      final dio = Dio();
      final token = context.read<AuthProvider>().token;
      
      final response = await dio.post(
        'http://localhost:8081/auth/verify-student?email=$email&isVerified=$isVerified',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      context.read<ToastProvider>().showSuccess(response.data.toString());
      
      // Add a small delay to ensure backend has processed the change
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Refresh both lists
      await _fetchStudents();
    } catch (error) {
      context.read<ToastProvider>().showError('Failed to update student status');
    } finally {
      setState(() => _loading = false);
    }
  }
}

class _StudentRow extends StatelessWidget {
  final Map<String, dynamic> student;
  final bool isPending;
  final Function(bool) onVerify;

  const _StudentRow({
    required this.student,
    required this.isPending,
    required this.onVerify,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          // Student Avatar & Name
          Expanded(
            flex: 2,
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primaryColor,
                  radius: 16,
                  child: Text(
                    (student['username'] ?? 'U')[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    student['username'] ?? 'Unknown',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          
          // Email
          Expanded(
            flex: 2,
            child: Text(
              student['email'] ?? 'No email',
              style: const TextStyle(fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          
          // Enrollment Number
          Expanded(
            flex: 1,
            child: Text(
              student['enrollNumber'] ?? 'N/A',
              style: const TextStyle(fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          
          // Role
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                student['role'] ?? 'STUDENT',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.primaryColor,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          
          // Actions or Status
          if (isPending)
            Expanded(
              flex: 2,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton.icon(
                    onPressed: () => onVerify(true),
                    icon: const Icon(Icons.check, size: 14),
                    label: const Text('Verify'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.successColor,
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      textStyle: const TextStyle(fontSize: 10),
                    ),
                  ),
                  const SizedBox(width: 4),
                  OutlinedButton.icon(
                    onPressed: () => onVerify(false),
                    icon: const Icon(Icons.close, size: 14),
                    label: const Text('Reject'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.errorColor,
                      side: const BorderSide(color: AppTheme.errorColor),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      textStyle: const TextStyle(fontSize: 10),
                    ),
                  ),
                ],
              ),
            )
          else
            Expanded(
              flex: 1,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle, size: 12, color: AppTheme.successColor),
                    SizedBox(width: 4),
                    Text(
                      'Verified',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.successColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}