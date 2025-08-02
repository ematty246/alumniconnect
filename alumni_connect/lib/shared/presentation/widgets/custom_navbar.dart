import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/notification_provider.dart';
import '../../../core/theme/app_theme.dart';

class CustomNavbar extends StatelessWidget {
  const CustomNavbar({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, NotificationProvider>(
      builder: (context, authProvider, notificationProvider, _) {
        final user = authProvider.user;
        final unreadCount = notificationProvider.unreadCount;

        return Container(
          height: 70,
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                // Logo and brand
                GestureDetector(
                  onTap: () => context.go('/'),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.school,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'AlumniConnect',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Navigation items
                Row(
                  children: [
                    _NavItem(
                      icon: Icons.home,
                      label: 'Home',
                      onTap: () => context.go('/'),
                    ),
                    _NavItem(
                      icon: Icons.video_call,
                      label: 'Webinar',
                      onTap: () => context.go('/webinar'),
                    ),
                    
                    if (user != null) ...[
                      _NavItem(
                        icon: Icons.dashboard,
                        label: 'Dashboard',
                        onTap: () => context.go('/dashboard'),
                      ),
                      _NavItem(
                        icon: Icons.person,
                        label: 'Profile',
                        onTap: () => context.go('/profile'),
                      ),
                      _NavItem(
                        icon: Icons.people,
                        label: 'Connections',
                        onTap: () => context.go('/connections'),
                      ),
                      _NavItem(
                        icon: Icons.chat,
                        label: 'Chat',
                        onTap: () => context.go('/chat'),
                        badgeCount: unreadCount,
                      ),
                      
                      if (user.role == 'FACULTY')
                        _NavItem(
                          icon: Icons.verified_user,
                          label: 'Verify Students',
                          onTap: () => context.go('/verify-students'),
                        ),
                      
                      _NavItem(
                        icon: Icons.logout,
                        label: 'Logout',
                        onTap: () {
                          authProvider.logout();
                          context.go('/');
                        },
                      ),
                    ] else ...[
                      _NavItem(
                        icon: Icons.login,
                        label: 'Login',
                        onTap: () => context.go('/login'),
                      ),
                      _NavItem(
                        icon: Icons.person_add,
                        label: 'Register',
                        onTap: () => context.go('/register'),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int? badgeCount;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badgeCount,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    size: 18,
                    color: AppTheme.textPrimary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              
              if (badgeCount != null && badgeCount! > 0)
                Positioned(
                  right: -8,
                  top: -8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppTheme.errorColor,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 20,
                      minHeight: 20,
                    ),
                    child: Text(
                      badgeCount! > 99 ? '99+' : badgeCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}