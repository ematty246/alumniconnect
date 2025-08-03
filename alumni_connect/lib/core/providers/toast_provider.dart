import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

enum ToastType { info, success, warning, error }

class ToastMessage {
  final String id;
  final String message;
  final ToastType type;
  final DateTime timestamp;

  ToastMessage({
    required this.id,
    required this.message,
    required this.type,
    required this.timestamp,
  });
}

class ToastProvider extends ChangeNotifier {
  final List<ToastMessage> _toasts = [];

  List<ToastMessage> get toasts => List.unmodifiable(_toasts);

  void addToast(String message, ToastType type) {
    final toast = ToastMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      message: message,
      type: type,
      timestamp: DateTime.now(),
    );

    _toasts.add(toast);
    notifyListeners();

    // Auto remove after 4 seconds
    Future.delayed(const Duration(seconds: 4), () {
      removeToast(toast.id);
    });
  }

  void removeToast(String id) {
    _toasts.removeWhere((toast) => toast.id == id);
    notifyListeners();
  }

  void showSuccess(String message) => addToast(message, ToastType.success);
  void showError(String message) => addToast(message, ToastType.error);
  void showWarning(String message) => addToast(message, ToastType.warning);
  void showInfo(String message) => addToast(message, ToastType.info);
}