import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/notification_provider.dart';
import '../../../core/theme/app_theme.dart';

class CustomNavbar extends StatelessWidget implements PreferredSizeWidget {
  const CustomNavbar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, NotificationProvider>(
      builder: (context, authProvider, notificationProvider, _) {
        return AppBar(
          backgroundColor: Colors.white,
          elevation: 2,
          automaticallyImplyLeading:
              true, // This will show the drawer icon automatically
          title: GestureDetector(
            onTap: () => context.go('/'),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    'assets/logo.png',
                    width: 40,
                    height: 40,
                    fit: BoxFit.cover,
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
        );
      },
    );
  }
}

// Updated drawer without "Menu" text
Drawer buildAppDrawer(BuildContext context) {
  final authProvider = Provider.of<AuthProvider>(context, listen: false);
  final user = authProvider.user;
  final notificationProvider =
      Provider.of<NotificationProvider>(context, listen: false);
  final unreadCount = notificationProvider.unreadCount;

  return Drawer(
    child: ListView(
      padding: EdgeInsets.zero,
      children: [
        DrawerHeader(
          decoration: const BoxDecoration(gradient: AppTheme.primaryGradient),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset(
                  'assets/logo.png',
                  width: 50,
                  height: 50,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'AlumniConnect',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (user != null)
                Text(
                  'Welcome, ${user.username ?? 'User'}',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
            ],
          ),
        ),
        _buildDrawerItem(context, Icons.home, 'Home', () => context.go('/')),
        _buildDrawerItem(
            context, Icons.video_call, 'Webinar', () => context.go('/webinar')),
        if (user != null) ...[
          _buildDrawerItem(context, Icons.dashboard, 'Dashboard',
              () => context.go('/dashboard')),
          _buildDrawerItem(
              context, Icons.person, 'Profile', () => context.go('/profile')),
          _buildDrawerItem(context, Icons.people, 'Connections',
              () => context.go('/connections')),
          _buildDrawerItem(
              context, Icons.chat, 'Chat', () => context.go('/chat'),
              badgeCount: unreadCount),
          if (user.role == 'FACULTY')
            _buildDrawerItem(context, Icons.verified_user, 'Verify Students',
                () => context.go('/verify-students')),
          const Divider(),
          _buildDrawerItem(context, Icons.logout, 'Logout', () {
            authProvider.logout();
            context.go('/');
          }),
        ] else ...[
          _buildDrawerItem(
              context, Icons.login, 'Login', () => context.go('/login')),
          _buildDrawerItem(context, Icons.person_add, 'Register',
              () => context.go('/register')),
        ],
      ],
    ),
  );
}

Widget _buildDrawerItem(
    BuildContext context, IconData icon, String label, VoidCallback onTap,
    {int? badgeCount}) {
  return ListTile(
    leading: Stack(
      children: [
        Icon(icon, color: AppTheme.textPrimary),
        if (badgeCount != null && badgeCount > 0)
          Positioned(
            right: -6,
            top: -6,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: AppTheme.errorColor,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
              child: Text(
                badgeCount > 99 ? '99+' : badgeCount.toString(),
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
    title: Text(label),
    onTap: () {
      Navigator.pop(context);
      onTap();
    },
  );
}
