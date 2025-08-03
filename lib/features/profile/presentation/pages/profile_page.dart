import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final user = authProvider.user;

        if (user == null) {
          return const Center(
            child: Text('Please log in to access your profile'),
          );
        }

        return FadeInWidget(
          child: SingleChildScrollView(
            child: Column(
              children: [
                _buildHeroSection(context, user),
                const SizedBox(height: 32),
                _buildProfileTypeCards(context, user),
                const SizedBox(height: 32),
                _buildAccountInfo(context, user),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeroSection(BuildContext context, user) {
    IconData roleIcon;
    String description;

    switch (user.role) {
      case 'STUDENT':
        roleIcon = Icons.school;
        description = 'Complete your student profile to connect with peers and alumni.';
        break;
      case 'ALUMNI':
        roleIcon = Icons.work;
        description = 'Share your professional journey and mentor current students.';
        break;
      case 'FACULTY':
        roleIcon = Icons.menu_book;
        description = 'Connect with students and fellow faculty members.';
        break;
      default:
        roleIcon = Icons.person;
        description = 'Complete your profile to get started.';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(roleIcon, size: 48, color: Colors.white),
          ),
          const SizedBox(height: 16),
          const Text(
            'Profile Setup',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: const TextStyle(
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

  Widget _buildProfileTypeCards(BuildContext context, user) {
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
            'Choose Your Profile Type',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 24),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 1,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 3,
            children: [
              _ProfileTypeCard(
                icon: Icons.school,
                title: 'Student Profile',
                description: 'Share your academic journey, skills, and projects.',
                isActive: user.role == 'STUDENT',
                onTap: () => context.go('/profile/student'),
              ),
              _ProfileTypeCard(
                icon: Icons.work,
                title: 'Alumni Profile',
                description: 'Showcase your professional achievements and experience.',
                isActive: user.role == 'ALUMNI',
                onTap: () => context.go('/profile/alumni'),
              ),
              _ProfileTypeCard(
                icon: Icons.menu_book,
                title: 'Faculty Profile',
                description: 'Share your research interests and academic expertise.',
                isActive: user.role == 'FACULTY',
                onTap: () => context.go('/profile/faculty'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAccountInfo(BuildContext context, user) {
    return Container(
      width: double.infinity,
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
            'Account Information',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 24),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 2,
            children: [
              _InfoCard(
                title: 'Username',
                value: user.username,
                color: AppTheme.primaryColor,
              ),
              _InfoCard(
                title: 'Email',
                value: user.email,
                color: AppTheme.primaryColor,
              ),
              _InfoCard(
                title: 'Role',
                value: user.role,
                color: AppTheme.primaryColor,
              ),
              if (user.department != null)
                _InfoCard(
                  title: 'Department',
                  value: user.department!,
                  color: AppTheme.primaryColor,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileTypeCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool isActive;
  final VoidCallback onTap;

  const _ProfileTypeCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: isActive ? AppTheme.primaryColor : Colors.grey[300]!,
          width: 2,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 32, color: AppTheme.primaryColor),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          ElevatedButton(
            onPressed: onTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: isActive ? AppTheme.primaryColor : Colors.grey[300],
              foregroundColor: isActive ? Colors.white : Colors.grey[600],
            ),
            child: Text(isActive ? 'Manage Profile' : 'View Sample'),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;

  const _InfoCard({
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}