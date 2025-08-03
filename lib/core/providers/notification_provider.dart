import 'package:flutter/foundation.dart';
import 'dart:async';

import '../services/api_service.dart';

class NotificationProvider extends ChangeNotifier {
  int _unreadCount = 0;
  DateTime _lastChecked = DateTime.now();
  Timer? _timer;

  int get unreadCount => _unreadCount;

  NotificationProvider() {
    _startPeriodicCheck();
  }

  void _startPeriodicCheck() {
    _timer = Timer.periodic(const Duration(seconds: 30), (_) {
      checkForNewMessages();
    });
  }

  Future<void> checkForNewMessages() async {
    try {
      // This would be implemented based on your backend API
      // For now, we'll use a placeholder implementation
      final response = await ApiService.get('/chat/unread/count');
      final data = response as Map<String, dynamic>;
      final total = (data.values as Iterable<dynamic>)
          .cast<int>()
          .fold<int>(0, (sum, count) => sum + count);

      _unreadCount = total;
      notifyListeners();
    } catch (e) {
      debugPrint('Error checking for new messages: $e');
    }
  }

  void markAsRead() {
    _unreadCount = 0;
    _lastChecked = DateTime.now();
    notifyListeners();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
