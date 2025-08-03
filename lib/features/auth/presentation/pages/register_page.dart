import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/toast_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _enrollNumberController = TextEditingController();
  final _departmentController = TextEditingController();
  final _classAdvisorController = TextEditingController();

  String _selectedRole = 'STUDENT';
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _isLoading = false;

  // Password strength
  Map<String, bool> _passwordChecks = {
    'length': false,
    'lowercase': false,
    'uppercase': false,
    'number': false,
    'special': false,
  };
  int _passwordScore = 0;

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
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _enrollNumberController.dispose();
    _departmentController.dispose();
    _classAdvisorController.dispose();
    super.dispose();
  }

  void _checkPasswordStrength(String password) {
    setState(() {
      _passwordChecks = {
        'length': password.length >= 8,
        'lowercase': RegExp(r'[a-z]').hasMatch(password),
        'uppercase': RegExp(r'[A-Z]').hasMatch(password),
        'number': RegExp(r'\d').hasMatch(password),
        'special': RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password),
      };

      _passwordScore = _passwordChecks.values.where((check) => check).length;
    });
  }

  String _getPasswordStrengthText() {
    if (_passwordScore <= 2) return 'Weak';
    if (_passwordScore <= 4) return 'Good';
    return 'Strong';
  }

  Color _getPasswordStrengthColor() {
    if (_passwordScore <= 2) return AppTheme.errorColor;
    if (_passwordScore <= 4) return AppTheme.warningColor;
    return AppTheme.successColor;
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      context.read<ToastProvider>().showError('Passwords do not match');
      return;
    }

    if (_passwordScore < 4) {
      context.read<ToastProvider>().showError(
          'Password is too weak. Please create a stronger password.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final userData = {
        'name': _nameController.text.trim(),
        'username': _usernameController.text.trim(),
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'role': _selectedRole,
        if (_selectedRole == 'STUDENT' || _selectedRole == 'FACULTY')
          'department': _departmentController.text.trim(),
        if (_selectedRole == 'STUDENT') ...{
          'enrollNumber': _enrollNumberController.text.trim(),
          'classAdvisor': _classAdvisorController.text.trim(),
        },
      };

      final result = await context.read<AuthProvider>().register(userData);

      if (result['success'] == true) {
        context
            .read<ToastProvider>()
            .showSuccess(result['message'] ?? 'Registration successful');

        if (_selectedRole == 'STUDENT' && result['token'] == null) {
          // Student registration - pending verification
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) context.go('/login');
          });
        } else if (result['token'] != null) {
          // ALUMNI/FACULTY with token
          context.go('/dashboard');
        } else {
          context.go('/login');
        }
      } else {
        context
            .read<ToastProvider>()
            .showError(result['message'] ?? 'Registration failed');
      }
    } catch (e) {
      context
          .read<ToastProvider>()
          .showError('Registration failed. Please try again.');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: FadeInWidget(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 500),
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
                          Icons.person_add,
                          size: 32,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Create Account',
                        style: Theme.of(context).textTheme.displaySmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Join the AlumniConnect community',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),

                      // Full Name
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Full Name',
                          prefixIcon: Icon(Icons.person),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your full name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Username
                      TextFormField(
                        controller: _usernameController,
                        decoration: const InputDecoration(
                          labelText: 'Username',
                          prefixIcon: Icon(Icons.alternate_email),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a username';
                          }
                          return null;
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

                      // Role Selection
                      DropdownButtonFormField<String>(
                        value: _selectedRole,
                        decoration: const InputDecoration(
                          labelText: 'Role',
                          prefixIcon: Icon(Icons.work),
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

                      // Department (for Faculty and Students)
                      if (_selectedRole == 'FACULTY' ||
                          _selectedRole == 'STUDENT') ...[
                        Container(
                          width: double.infinity,
                          child: DropdownButtonFormField<String>(
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
                              if ((_selectedRole == 'FACULTY' ||
                                      _selectedRole == 'STUDENT') &&
                                  (value == null || value.isEmpty)) {
                                return 'Please select your department';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

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
                        const SizedBox(height: 16),

                        // Class Advisor (for students)
                        TextFormField(
                          controller: _classAdvisorController,
                          decoration: const InputDecoration(
                            labelText: 'Class Advisor',
                            prefixIcon: Icon(Icons.supervisor_account),
                            hintText: 'Search and select your class advisor',
                          ),
                          validator: (value) {
                            if (_selectedRole == 'STUDENT' &&
                                (value == null || value.isEmpty)) {
                              return 'Please enter your class advisor';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
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
                        onChanged: _checkPasswordStrength,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a password';
                          }
                          return null;
                        },
                      ),

                      // Password Strength Indicator
                      if (_passwordController.text.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: LinearProgressIndicator(
                                value: _passwordScore / 5,
                                backgroundColor: Colors.grey[300],
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  _getPasswordStrengthColor(),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _getPasswordStrengthText(),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _getPasswordStrengthColor(),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            _PasswordCheck(
                              label: '8+ characters',
                              isValid: _passwordChecks['length']!,
                            ),
                            _PasswordCheck(
                              label: 'Lowercase',
                              isValid: _passwordChecks['lowercase']!,
                            ),
                            _PasswordCheck(
                              label: 'Uppercase',
                              isValid: _passwordChecks['uppercase']!,
                            ),
                            _PasswordCheck(
                              label: 'Number',
                              isValid: _passwordChecks['number']!,
                            ),
                            _PasswordCheck(
                              label: 'Special char',
                              isValid: _passwordChecks['special']!,
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 16),

                      // Confirm Password
                      TextFormField(
                        controller: _confirmPasswordController,
                        decoration: InputDecoration(
                          labelText: 'Confirm Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(_showConfirmPassword
                                ? Icons.visibility_off
                                : Icons.visibility),
                            onPressed: () {
                              setState(() {
                                _showConfirmPassword = !_showConfirmPassword;
                              });
                            },
                          ),
                        ),
                        obscureText: !_showConfirmPassword,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please confirm your password';
                          }
                          return null;
                        },
                      ),

                      // Password Match Indicator
                      if (_confirmPasswordController.text.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(
                              _passwordController.text ==
                                      _confirmPasswordController.text
                                  ? Icons.check_circle
                                  : Icons.cancel,
                              size: 16,
                              color: _passwordController.text ==
                                      _confirmPasswordController.text
                                  ? AppTheme.successColor
                                  : AppTheme.errorColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _passwordController.text ==
                                      _confirmPasswordController.text
                                  ? 'Passwords match'
                                  : 'Passwords do not match',
                              style: TextStyle(
                                fontSize: 12,
                                color: _passwordController.text ==
                                        _confirmPasswordController.text
                                    ? AppTheme.successColor
                                    : AppTheme.errorColor,
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 32),

                      // Register Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: (_isLoading || _passwordScore < 4)
                              ? null
                              : _handleRegister,
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
                                    Icon(Icons.person_add),
                                    SizedBox(width: 8),
                                    Text('Create Account'),
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Login Link
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Already have an account? '),
                          TextButton(
                            onPressed: () => context.go('/login'),
                            child: const Text(
                              'Sign in',
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
      ),
    );
  }
}

class _PasswordCheck extends StatelessWidget {
  final String label;
  final bool isValid;

  const _PasswordCheck({
    required this.label,
    required this.isValid,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          isValid ? Icons.check : Icons.close,
          size: 12,
          color: isValid ? AppTheme.successColor : AppTheme.errorColor,
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: isValid ? AppTheme.successColor : AppTheme.errorColor,
          ),
        ),
      ],
    );
  }
}
