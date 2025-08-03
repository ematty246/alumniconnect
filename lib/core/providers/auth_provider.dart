import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String? _token;
  bool _loading = false;

  UserModel? get user => _user;
  String? get token => _token;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null && _token != null;

  AuthProvider() {
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    _loading = true;
    notifyListeners();

    try {
      final token = await StorageService.getToken();
      final userRole = await StorageService.getUserRole();

      if (token != null && userRole != null) {
        _token = token;

        // Verify token with backend
        final response = await ApiService.get('/auth/check-token');
        if (response['valid'] == true) {
          _user = UserModel(
            email: response['email'],
            username: response['username'],
            role: userRole,
          );
        } else {
          await _clearAuth();
        }
      }
    } catch (e) {
      debugPrint('Auth initialization error: $e');
      await _clearAuth();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    required String role,
    String? enrollNumber,
    String? department,
  }) async {
    _loading = true;
    notifyListeners();

    try {
      final payload = {
        'email': email,
        'password': password,
        'role': role,
        if (role == 'STUDENT' && enrollNumber != null)
          'enrollNumber': enrollNumber,
        if (role == 'FACULTY' && department != null) 'department': department,
      };

      final response = await ApiService.post('/auth/login', payload);

      final token = response['token'];
      final returnedRole = response['role'];
      final userData = response['user'] ?? {};

      if (token != null && returnedRole != null) {
        _token = token;
        _user = UserModel(
          email: userData['email'] ?? email,
          username: userData['username'] ?? email.split('@')[0],
          role: returnedRole,
          department: userData['department'] ?? department,
        );

        await StorageService.setToken(token);
        await StorageService.setUserRole(returnedRole);

        _loading = false;
        notifyListeners();

        return {
          'success': true,
          'message': response['message'] ?? 'Login successful'
        };
      } else {
        throw Exception('Invalid response from server');
      }
    } catch (e) {
      _loading = false;
      notifyListeners();

      if (e is DioException) {
        return {
          'success': false,
          'message': e.response?.data['message'] ?? 'Login failed'
        };
      }
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await ApiService.post('/auth/register', userData);

      final token = response['token'];
      final role = response['role'];
      final responseUser = response['user'];
      final message = response['message'];

      // Check if this is a student registration (no token returned - pending verification)
      if (userData['role'] == 'STUDENT' && token == null) {
        _loading = false;
        notifyListeners();
        return {
          'success': true,
          'message': message ??
              'We are validating your credentials. You will be notified upon verification.',
          'token': null,
          'role': null,
        };
      }

      // For ALUMNI/FACULTY with token
      if (token != null && role != null) {
        _token = token;
        _user = UserModel(
          email: responseUser?['email'] ?? userData['email'],
          username: responseUser?['username'] ?? userData['username'],
          role: role,
        );

        await StorageService.setToken(token);
        await StorageService.setUserRole(role);

        _loading = false;
        notifyListeners();

        return {
          'success': true,
          'message': message ?? 'Registration successful',
          'token': token,
          'role': role,
        };
      }

      _loading = false;
      notifyListeners();
      return {
        'success': true,
        'message': message ?? 'Registration successful',
        'token': token,
        'role': role,
      };
    } catch (e) {
      _loading = false;
      notifyListeners();

      if (e is DioException) {
        return {
          'success': false,
          'message': e.response?.data['message'] ?? 'Registration failed'
        };
      }
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<void> logout() async {
    await _clearAuth();
    notifyListeners();
  }

  Future<void> _clearAuth() async {
    _user = null;
    _token = null;
    await StorageService.clearToken();
    await StorageService.clearUserRole();
  }
}
