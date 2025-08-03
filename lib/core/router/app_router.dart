import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
/*
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/profile/presentation/pages/student_profile_page.dart';
import '../../features/profile/presentation/pages/alumni_profile_page.dart';
import '../../features/profile/presentation/pages/faculty_profile_page.dart';
import '../../features/connections/presentation/pages/connections_page.dart';
import '../../features/connections/presentation/pages/pending_requests_page.dart';
import '../../features/chat/presentation/pages/chat_page.dart';
import '../../features/search/presentation/pages/user_search_page.dart';
import '../../features/webinar/presentation/pages/webinar_dashboard_page.dart';
import '../../features/webinar/presentation/pages/create_webinar_page.dart';
import '../../features/webinar/presentation/pages/join_webinar_page.dart';
import '../../features/admin/presentation/pages/admin_dashboard_page.dart';
import '../../features/faculty/presentation/pages/verify_students_page.dart';
*/

import '../../shared/presentation/widgets/main_layout.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final isLoggedIn = authProvider.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login';
      final isRegistering = state.matchedLocation == '/register';
      final isHome = state.matchedLocation == '/';

      // If not logged in and trying to access protected routes
      if (!isLoggedIn && !isLoggingIn && !isRegistering && !isHome) {
        return '/login';
      }

      // If logged in and trying to access auth pages, redirect to dashboard
      if (isLoggedIn && (isLoggingIn || isRegistering)) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      ShellRoute(
        builder: (context, state, child) {
          return MainLayout(child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomePage(),
          ),
          GoRoute(
            path: '/login',
            builder: (context, state) => const LoginPage(),
          ),
          GoRoute(
            path: '/register',
            builder: (context, state) => const RegisterPage(),
          ),
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardPage(),
          ),
          /*
GoRoute(
  path: '/profile',
  builder: (context, state) => const ProfilePage(),
),
GoRoute(
  path: '/profile/student',
  builder: (context, state) => const StudentProfilePage(),
),
GoRoute(
  path: '/profile/alumni',
  builder: (context, state) => const AlumniProfilePage(),
),
GoRoute(
  path: '/profile/faculty',
  builder: (context, state) => const FacultyProfilePage(),
),
GoRoute(
  path: '/connections',
  builder: (context, state) => const ConnectionsPage(),
),
GoRoute(
  path: '/connections/pending',
  builder: (context, state) => const PendingRequestsPage(),
),
GoRoute(
  path: '/chat',
  builder: (context, state) => const ChatPage(),
),
GoRoute(
  path: '/chat/:username',
  builder: (context, state) {
    final username = state.pathParameters['username']!;
    return ChatPage(selectedUsername: username);
  },
),
GoRoute(
  path: '/search',
  builder: (context, state) => const UserSearchPage(),
),
GoRoute(
  path: '/webinar',
  builder: (context, state) => const WebinarDashboardPage(),
),
GoRoute(
  path: '/webinar/create',
  builder: (context, state) => const CreateWebinarPage(),
),
GoRoute(
  path: '/webinar/join/:id',
  builder: (context, state) {
    final id = state.pathParameters['id']!;
    return JoinWebinarPage(webinarId: id);
  },
),
GoRoute(
  path: '/admin',
  builder: (context, state) => const AdminDashboardPage(),
),
GoRoute(
  path: '/verify-students',
  builder: (context, state) => const VerifyStudentsPage(),
),
*/
        ],
      ),
    ],
  );
}
