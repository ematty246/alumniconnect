import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/fade_in_widget.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final user = authProvider.user;
        
        return FadeInWidget(
          child: SingleChildScrollView(
            child: Column(
              children: [
                // Hero Section
                _buildHeroSection(context, user),
                const SizedBox(height: 40),
                
                // Features Section
                if (user != null)
                  _buildRoleSpecificFeatures(context, user.role)
                else
                  _buildDefaultFeatures(context),
                
                const SizedBox(height: 40),
                
                // Quick Actions
                if (user != null)
                  _buildQuickActions(context, user.role),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeroSection(BuildContext context, user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        gradient: user != null ? _getRoleGradient(user.role) : AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          if (user != null) _getRoleIcon(user.role),
          const SizedBox(height: 16),
          Text(
            user != null ? _getRoleTitle(user.role) : 'Welcome to AlumniConnect',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            user != null 
                ? _getRoleSubtitle(user.role)
                : 'Connect with alumni, students, and faculty. Build your professional network.',
            style: const TextStyle(
              fontSize: 18,
              color: Colors.white,
              fontWeight: FontWeight.w400,
            ),
            textAlign: TextAlign.center,
          ),
          
          if (user == null) ...[
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () => context.go('/register'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  ),
                  child: const Text(
                    'Get Started',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(width: 16),
                OutlinedButton(
                  onPressed: () => context.go('/login'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white, width: 2),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  ),
                  child: const Text(
                    'Sign In',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRoleSpecificFeatures(BuildContext context, String role) {
    final features = _getRoleFeatures(role);
    
    return Column(
      children: [
        Text(
          'Your Features',
          style: Theme.of(context).textTheme.displaySmall,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.2,
          ),
          itemCount: features.length,
          itemBuilder: (context, index) {
            final feature = features[index];
            return _FeatureCard(
              icon: feature['icon'],
              title: feature['title'],
              description: feature['description'],
              gradient: feature['gradient'],
            );
          },
        ),
      ],
    );
  }

  Widget _buildDefaultFeatures(BuildContext context) {
    final features = [
      {
        'icon': Icons.people,
        'title': 'Connect',
        'description': 'Build meaningful connections with alumni, current students, and faculty members from your institution.',
        'gradient': AppTheme.primaryGradient,
      },
      {
        'icon': Icons.chat,
        'title': 'Chat',
        'description': 'Engage in real-time conversations, share experiences, and collaborate on projects with your network.',
        'gradient': AppTheme.accentGradient,
      },
      {
        'icon': Icons.search,
        'title': 'Discover',
        'description': 'Find and connect with people based on interests, departments, graduation years, and professional backgrounds.',
        'gradient': AppTheme.successGradient,
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.0,
      ),
      itemCount: features.length,
      itemBuilder: (context, index) {
        final feature = features[index];
        return _FeatureCard(
          icon: feature['icon'],
          title: feature['title'],
          description: feature['description'],
          gradient: feature['gradient'],
        );
      },
    );
  }

  Widget _buildQuickActions(BuildContext context, String role) {
    final actions = _getRoleActions(role);
    
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
        children: [
          Row(
            children: [
              const Icon(Icons.flash_on, color: AppTheme.primaryColor),
              const SizedBox(width: 8),
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const Spacer(),
              _getRoleBadge(role),
            ],
          ),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: actions.length,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 2.5,
            ),
            itemCount: actions.length,
            itemBuilder: (context, index) {
              final action = actions[index];
              return ElevatedButton.icon(
                onPressed: () => context.go(action['route']),
                icon: Icon(action['icon'], size: 18),
                label: Text(action['label']),
                style: ElevatedButton.styleFrom(
                  backgroundColor: action['color'],
                  foregroundColor: Colors.white,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // Helper methods for role-specific content
  LinearGradient _getRoleGradient(String role) {
    switch (role) {
      case 'STUDENT':
        return AppTheme.primaryGradient;
      case 'ALUMNI':
        return AppTheme.successGradient;
      case 'FACULTY':
        return AppTheme.accentGradient;
      default:
        return AppTheme.primaryGradient;
    }
  }

  Widget _getRoleIcon(String role) {
    IconData icon;
    switch (role) {
      case 'STUDENT':
        icon = Icons.school;
        break;
      case 'ALUMNI':
        icon = Icons.work;
        break;
      case 'FACULTY':
        icon = Icons.menu_book;
        break;
      default:
        icon = Icons.person;
    }
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(icon, size: 32, color: Colors.white),
    );
  }

  String _getRoleTitle(String role) {
    switch (role) {
      case 'STUDENT':
        return 'Welcome Student!';
      case 'ALUMNI':
        return 'Welcome Alumni!';
      case 'FACULTY':
        return 'Welcome Faculty!';
      default:
        return 'Welcome!';
    }
  }

  String _getRoleSubtitle(String role) {
    switch (role) {
      case 'STUDENT':
        return 'Connect with alumni, find mentors, and build your professional network for your career journey.';
      case 'ALUMNI':
        return 'Share your experience, mentor students, and maintain connections with your alma mater.';
      case 'FACULTY':
        return 'Connect with students and alumni, foster academic relationships, and build institutional networks.';
      default:
        return 'Build your professional network.';
    }
  }

  List<Map<String, dynamic>> _getRoleFeatures(String role) {
    switch (role) {
      case 'STUDENT':
        return [
          {
            'icon': Icons.people,
            'title': 'Connect',
            'description': 'Build meaningful connections with alumni, current students, and faculty members from your institution.',
            'gradient': AppTheme.primaryGradient,
          },
          {
            'icon': Icons.chat,
            'title': 'Chat',
            'description': 'Engage in real-time conversations, get career advice, and collaborate with your network.',
            'gradient': AppTheme.accentGradient,
          },
          {
            'icon': Icons.search,
            'title': 'Find People',
            'description': 'Discover alumni in your field, find study groups, and connect with potential mentors.',
            'gradient': AppTheme.successGradient,
          },
          {
            'icon': Icons.person,
            'title': 'Profile Management',
            'description': 'Showcase your skills, projects, and academic achievements to attract connections.',
            'gradient': const LinearGradient(colors: [AppTheme.warningColor, Color(0xFFD97706)]),
          },
        ];
      case 'ALUMNI':
        return [
          {
            'icon': Icons.person,
            'title': 'Profile Management',
            'description': 'Keep your professional profile updated and showcase your career journey to inspire students.',
            'gradient': AppTheme.successGradient,
          },
          {
            'icon': Icons.chat,
            'title': 'Chat',
            'description': 'Mentor students, share career insights, and stay connected with your network.',
            'gradient': AppTheme.accentGradient,
          },
          {
            'icon': Icons.people,
            'title': 'Connect',
            'description': 'Maintain relationships with fellow alumni and connect with current students seeking guidance.',
            'gradient': AppTheme.primaryGradient,
          },
        ];
      case 'FACULTY':
        return [
          {
            'icon': Icons.people,
            'title': 'Connect',
            'description': 'Build connections with students, alumni, and fellow faculty members across departments.',
            'gradient': AppTheme.primaryGradient,
          },
          {
            'icon': Icons.chat,
            'title': 'Chat',
            'description': 'Communicate with students, collaborate with colleagues, and provide academic guidance.',
            'gradient': AppTheme.accentGradient,
          },
          {
            'icon': Icons.search,
            'title': 'Find People',
            'description': 'Discover students in your courses, connect with alumni, and network with other faculty.',
            'gradient': AppTheme.successGradient,
          },
          {
            'icon': Icons.person,
            'title': 'Profile Management',
            'description': 'Maintain your academic profile, showcase research, and highlight your expertise.',
            'gradient': const LinearGradient(colors: [AppTheme.warningColor, Color(0xFFD97706)]),
          },
        ];
      default:
        return [];
    }
  }

  List<Map<String, dynamic>> _getRoleActions(String role) {
    switch (role) {
      case 'STUDENT':
        return [
          {'route': '/profile', 'icon': Icons.person, 'label': 'Update Profile', 'color': AppTheme.primaryColor},
          {'route': '/connections', 'icon': Icons.people, 'label': 'My Connections', 'color': AppTheme.secondaryColor},
          {'route': '/chat', 'icon': Icons.chat, 'label': 'Start Chat', 'color': AppTheme.successColor},
          {'route': '/search', 'icon': Icons.search, 'label': 'Find People', 'color': AppTheme.accentColor},
        ];
      case 'ALUMNI':
        return [
          {'route': '/profile', 'icon': Icons.person, 'label': 'Update Profile', 'color': AppTheme.primaryColor},
          {'route': '/chat', 'icon': Icons.chat, 'label': 'Start Chat', 'color': AppTheme.successColor},
          {'route': '/connections', 'icon': Icons.people, 'label': 'My Connections', 'color': AppTheme.secondaryColor},
        ];
      case 'FACULTY':
        return [
          {'route': '/profile', 'icon': Icons.person, 'label': 'Update Profile', 'color': AppTheme.primaryColor},
          {'route': '/connections', 'icon': Icons.people, 'label': 'My Connections', 'color': AppTheme.secondaryColor},
          {'route': '/chat', 'icon': Icons.chat, 'label': 'Start Chat', 'color': AppTheme.successColor},
          {'route': '/search', 'icon': Icons.search, 'label': 'Find People', 'color': AppTheme.accentColor},
        ];
      default:
        return [];
    }
  }

  Widget _getRoleBadge(String role) {
    Color color;
    IconData icon;
    
    switch (role) {
      case 'STUDENT':
        color = AppTheme.textSecondary;
        icon = Icons.school;
        break;
      case 'ALUMNI':
        color = AppTheme.warningColor;
        icon = Icons.work;
        break;
      case 'FACULTY':
        color = AppTheme.primaryColor;
        icon = Icons.menu_book;
        break;
      default:
        color = AppTheme.textSecondary;
        icon = Icons.person;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 4),
          Text(
            role,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final LinearGradient gradient;

  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: gradient,
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
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 28, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}