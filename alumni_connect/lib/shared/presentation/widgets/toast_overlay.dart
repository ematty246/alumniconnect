import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/toast_provider.dart';
import '../../../core/theme/app_theme.dart';

class ToastOverlay extends StatelessWidget {
  const ToastOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ToastProvider>(
      builder: (context, toastProvider, _) {
        if (toastProvider.toasts.isEmpty) {
          return const SizedBox.shrink();
        }

        return Positioned(
          top: 100,
          right: 16,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: toastProvider.toasts.map((toast) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _ToastWidget(
                  message: toast.message,
                  type: toast.type,
                  onClose: () => toastProvider.removeToast(toast.id),
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }
}

class _ToastWidget extends StatefulWidget {
  final String message;
  final ToastType type;
  final VoidCallback onClose;

  const _ToastWidget({
    required this.message,
    required this.type,
    required this.onClose,
  });

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(1.0, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));

    _controller.forward();

    // Auto close after 4 seconds
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        _controller.reverse().then((_) => widget.onClose());
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _getBackgroundColor() {
    switch (widget.type) {
      case ToastType.success:
        return AppTheme.successColor;
      case ToastType.error:
        return AppTheme.errorColor;
      case ToastType.warning:
        return AppTheme.warningColor;
      case ToastType.info:
      default:
        return AppTheme.primaryColor;
    }
  }

  IconData _getIcon() {
    switch (widget.type) {
      case ToastType.success:
        return Icons.check_circle;
      case ToastType.error:
        return Icons.error;
      case ToastType.warning:
        return Icons.warning;
      case ToastType.info:
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          decoration: BoxDecoration(
            color: _getBackgroundColor(),
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _getIcon(),
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Flexible(
                  child: Text(
                    widget.message,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: () {
                    _controller.reverse().then((_) => widget.onClose());
                  },
                  child: const Icon(
                    Icons.close,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}