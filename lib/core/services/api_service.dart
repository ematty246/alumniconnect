import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'storage_service.dart';

class ApiService {
  static final Dio _dio = Dio();
  static const String baseUrl = 'http://192.168.116.88:8081';

  static void initialize() {
    _dio.options.baseUrl = baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);

    // Request interceptor to add auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await StorageService.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['Content-Type'] = 'application/json';
          handler.next(options);
        },
        onResponse: (response, handler) {
          debugPrint('API Response: ${response.data}');
          handler.next(response);
        },
        onError: (error, handler) {
          debugPrint('API Error: ${error.response?.data ?? error.message}');
          handler.next(error);
        },
      ),
    );
  }

  static Future<dynamic> get(String endpoint) async {
    try {
      final response = await _dio.get(endpoint);
      return response.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> post(String endpoint, dynamic data) async {
    try {
      final response = await _dio.post(endpoint, data: data);
      return response.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> put(String endpoint, dynamic data) async {
    try {
      final response = await _dio.put(endpoint, data: data);
      return response.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> delete(String endpoint) async {
    try {
      final response = await _dio.delete(endpoint);
      return response.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> postFormData(
      String endpoint, FormData formData) async {
    try {
      final response = await _dio.post(
        endpoint,
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
      return response.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Exception _handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return Exception(
              'Connection timeout. Please check your internet connection.');
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final message =
              error.response?.data['message'] ?? 'Server error occurred';
          return Exception('Server error ($statusCode): $message');
        case DioExceptionType.cancel:
          return Exception('Request was cancelled');
        case DioExceptionType.unknown:
          return Exception(
              'Network error. Please check your internet connection.');
        default:
          return Exception('An unexpected error occurred');
      }
    }
    return Exception(error.toString());
  }
}
