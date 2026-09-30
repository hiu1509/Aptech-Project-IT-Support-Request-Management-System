import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/login_response.dart';
import '../models/request_model.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:5219/api';

  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  // =========================
  // LOGIN
  // =========================

  static Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/Auth/login',
        data: {
          'email': email.trim(),
          'password': password,
        },
      );

      final responseData = response.data;

      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final Map<String, dynamic> result =
          Map<String, dynamic>.from(responseData);

      if (result['isSuccess'] != true) {
        throw Exception(
          result['message'] ??
              result['errorCode'] ??
              'Đăng nhập không thành công.',
        );
      }

      if (result['data'] == null) {
        throw Exception('Máy chủ không trả về thông tin đăng nhập.');
      }

      final loginResponse = LoginResponse.fromJson(
        Map<String, dynamic>.from(result['data']),
      );

      if (loginResponse.accessToken.isEmpty) {
        throw Exception('Máy chủ không trả về access token.');
      }

      // App này chỉ dành cho IT Staff.
      if (loginResponse.role.toLowerCase() != 'itstaff') {
        throw Exception(
          'Tài khoản này không có quyền truy cập ứng dụng IT Staff.',
        );
      }

      await _storage.write(
        key: 'accessToken',
        value: loginResponse.accessToken,
      );

      await _storage.write(
        key: 'userId',
        value: loginResponse.id.toString(),
      );

      await _storage.write(
        key: 'email',
        value: loginResponse.email,
      );

      await _storage.write(
        key: 'fullName',
        value: loginResponse.fullName,
      );

      await _storage.write(
        key: 'role',
        value: loginResponse.role,
      );

      return loginResponse;
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map) {
        final message = data['message'];
        final errorCode = data['errorCode'];

        if (message != null &&
            message.toString().trim().isNotEmpty) {
          throw Exception(message.toString());
        }

        if (errorCode != null &&
            errorCode.toString().trim().isNotEmpty) {
          throw Exception(errorCode.toString());
        }
      }

      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception(
          'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
        );
      }

      if (e.type == DioExceptionType.connectionError) {
        throw Exception(
          'Không kết nối được Backend tại $baseUrl.',
        );
      }

      throw Exception(
        'Đăng nhập thất bại. Vui lòng kiểm tra lại.',
      );
    }
  }

  // =========================
  // TOKEN
  // =========================

  static Future<String?> getAccessToken() async {
    return _storage.read(key: 'accessToken');
  }

  static Future<bool> hasToken() async {
    final token = await getAccessToken();

    return token != null && token.trim().isNotEmpty;
  }

  // =========================
  // LOGOUT
  // =========================

  static Future<void> logout() async {
    await _storage.deleteAll();
  }

  static Future<List<RequestModel>> getAssignedRequests() async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.get(
        '/SupportRequest/assigned',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );

      final responseData = response.data;

      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);

      if (result['isSuccess'] != true) {
        throw Exception(
          result['message'] ??
              result['errorCode'] ??
              'Không thể tải danh sách công việc.',
        );
      }

      final data = result['data'];

      if (data == null) {
        return [];
      }

      // API trả về PagedResult<SupportRequestResponse>
      List<dynamic> items = [];

      if (data is Map) {
        final pagedData = Map<String, dynamic>.from(data);

        final rawItems = pagedData['items'];

        if (rawItems is List) {
          items = rawItems;
        }
      } else if (data is List) {
        // Giữ tương thích nếu backend thay đổi sang trả List trực tiếp.
        items = data;
      }

      return items
          .whereType<Map>()
          .map(
            (item) => RequestModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        );
      }

      if (e.response?.statusCode == 403) {
        throw Exception(
          'Tài khoản không có quyền truy cập công việc IT Staff.',
        );
      }

      final data = e.response?.data;

      if (data is Map &&
          data['message'] != null &&
          data['message'].toString().trim().isNotEmpty) {
        throw Exception(data['message'].toString());
      }

      throw Exception(
        'Không thể tải danh sách công việc.',
      );
    }
  }
}