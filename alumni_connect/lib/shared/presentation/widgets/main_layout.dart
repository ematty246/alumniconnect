import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/notification_provider.dart';
import 'custom_navbar.dart';
import 'toast_overlay.dart';

class MainLayout extends StatelessWidget {
  final Widget child;

  const MainLayout({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const CustomNavbar(),
          Expanded(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              child: child,
            ),
          ),
        ],
      ),
      floatingActionButton: const ToastOverlay(),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerTop,
    );
  }
}