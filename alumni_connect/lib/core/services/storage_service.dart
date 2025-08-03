import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static SharedPreferences get prefs {
    if (_prefs == null) {
      throw Exception('StorageService not initialized. Call StorageService.init() first.');
    }
    return _prefs!;
  }

  // Token management
  static Future<void> setToken(String token) async {
    await prefs.setString('token', token);
  }

  static Future<String?> getToken() async {
    return prefs.getString('token');
  }

  static Future<void> clearToken() async {
    await prefs.remove('token');
  }

  // User role management
  static Future<void> setUserRole(String role) async {
    await prefs.setString('userRole', role);
  }

  static Future<String?> getUserRole() async {
    return prefs.getString('userRole');
  }

  static Future<void> clearUserRole() async {
    await prefs.remove('userRole');
  }

  // Generic storage methods
  static Future<void> setString(String key, String value) async {
    await prefs.setString(key, value);
  }

  static String? getString(String key) {
    return prefs.getString(key);
  }

  static Future<void> setBool(String key, bool value) async {
    await prefs.setBool(key, value);
  }

  static bool? getBool(String key) {
    return prefs.getBool(key);
  }

  static Future<void> setInt(String key, int value) async {
    await prefs.setInt(key, value);
  }

  static int? getInt(String key) {
    return prefs.getInt(key);
  }

  static Future<void> remove(String key) async {
    await prefs.remove(key);
  }

  static Future<void> clear() async {
    await prefs.clear();
  }
}