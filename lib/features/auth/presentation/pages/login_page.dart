import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _enrollNumberController = TextEditingController();
  final _departmentController = TextEditingController();

  String _selectedRole = 'STUDENT';
  bool _showPassword = false;
  bool _isLoading = false;

  final List<String> _departments = [
    'Computer Science',
    'Information Technology',
    'Electronics and Communication',
    'Electrical and Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Mathematics',
    'Physics',
    'Chemistry',
    'English',
    'Management Studies',
  ];

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _enrollNumberController.dispose();
    _departmentController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedRole == 'STUDENT' &&
        _enrollNumberController.text.trim().isEmpty) {
      context
          .read<ToastProvider>()
          .showError('Enrollment number is required for students');
      return;
    }

    if (_selectedRole == 'FACULTY' &&
        _departmentController.text.trim().isEmpty) {
      context
          .read<ToastProvider>()
          .showError('Department is required for faculty');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await context.read<AuthProvider>().login(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            role: _selectedRole,
            enrollNumber: _selectedRole == 'STUDENT'
                ? _enrollNumberController.text.trim()
                : null,
            department: _selectedRole == 'FACULTY'
                ? _departmentController.text.trim()
                : null,
          );

      if (result['success'] == true) {
        context
            .read<ToastProvider>()
            .showSuccess(result['message'] ?? 'Login successful');
        context.go('/dashboard');
      } else {
        context
            .read<ToastProvider>()
            .showError(result['message'] ?? 'Login failed');
      }
    } catch (e) {
      context
          .read<ToastProvider>()
          .showError('Login failed. Please try again.');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        backgroundColor: Colors.grey[50],
        resizeToAvoidBottomInset: true,
        body: SafeArea(
          child: FadeInWidget(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 400),
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Header
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: AppTheme.primaryGradient,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.login,
                            size: 32,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Welcome Back',
                          style: Theme.of(context).textTheme.displaySmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Sign in to your account',
                          style:
                              Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 32),

                        // Role Selection
                        DropdownButtonFormField<String>(
                          value: _selectedRole,
                          decoration: const InputDecoration(
                            labelText: 'Login as',
                            prefixIcon: Icon(Icons.person),
                          ),
                          items: const [
                            DropdownMenuItem(
                                value: 'STUDENT', child: Text('STUDENT')),
                            DropdownMenuItem(
                                value: 'ALUMNI', child: Text('ALUMNI')),
                            DropdownMenuItem(
                                value: 'FACULTY', child: Text('FACULTY')),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedRole = value!;
                            });
                          },
                        ),
                        const SizedBox(height: 16),

                        // Email
                        TextFormField(
                          controller: _emailController,
                          decoration: const InputDecoration(
                            labelText: 'Email Address',
                            prefixIcon: Icon(Icons.email),
                          ),
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your email';
                            }
                            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                                .hasMatch(value)) {
                              return 'Please enter a valid email';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        // Enrollment Number (for students)
                        if (_selectedRole == 'STUDENT') ...[
                          TextFormField(
                            controller: _enrollNumberController,
                            decoration: const InputDecoration(
                              labelText: 'Enrollment Number',
                              prefixIcon: Icon(Icons.badge),
                            ),
                            validator: (value) {
                              if (_selectedRole == 'STUDENT' &&
                                  (value == null || value.isEmpty)) {
                                return 'Please enter your enrollment number';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16)
                        ],

                        // Department (for faculty)
                        if (_selectedRole == 'FACULTY') ...[
                          DropdownButtonFormField<String>(
                            value: _departmentController.text.isEmpty
                                ? null
                                : _departmentController.text,
                            decoration: const InputDecoration(
                              labelText: 'Department',
                              prefixIcon: Icon(Icons.school),
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 16),
                            ),
                            isExpanded: true,
                            items: _departments.map((dept) {
                              return DropdownMenuItem(
                                value: dept,
                                child: Text(
                                  dept,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            onChanged: (value) {
                              _departmentController.text = value ?? '';
                            },
                            validator: (value) {
                              if (_selectedRole == 'FACULTY' &&
                                  (value == null || value.isEmpty)) {
                                return 'Please select your department';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16)
                        ],

                        // Password
                        TextFormField(
                          controller: _passwordController,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock),
                            suffixIcon: IconButton(
                              icon: Icon(_showPassword
                                  ? Icons.visibility_off
                                  : Icons.visibility),
                              onPressed: () {
                                setState(() {
                                  _showPassword = !_showPassword;
                                });
                              },
                            ),
                          ),
                          obscureText: !_showPassword,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your password';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 32),

                        // Login Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                          Colors.white),
                                    ),
                                  )
                                : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.login),
                                      SizedBox(width: 8),
                                      Text('Sign In'),
                                    ],
                                  ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Register Link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text("Don't have an account? "),
                            TextButton(
                              onPressed: () => context.go('/register'),
                              child: const Text(
                                'Sign up',
                                style: TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ));
  }
}
