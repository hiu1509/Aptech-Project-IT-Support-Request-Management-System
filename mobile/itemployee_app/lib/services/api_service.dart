import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/attachment_model.dart';
import '../models/category_model.dart';
import '../models/login_response.dart';
import '../models/request_model.dart';
import '../models/comment_model.dart';
import '../models/request_history_model.dart';
import '../models/priority_model.dart';
import '../models/user_profile_model.dart';

class ApiService {
  static const String baseUrl = 'https://10.0.2.2:7123/api';

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
  )..httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        final client = HttpClient();
        client.badCertificateCallback = (cert, host, port) => true;
        return client;
      },
    );

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  // ============================================================
  // LOGIN (HỖ TRỢ CẢ USER VÀ ITSTAFF)
  // ============================================================

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

      final role = loginResponse.role.toLowerCase();
      if (role != 'itstaff' && role != 'user' && role != 'employee') {
        throw Exception(
          'Tài khoản không có quyền truy cập ứng dụng IT Support.',
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

        if (message != null && message.toString().trim().isNotEmpty) {
          throw Exception(message.toString());
        }

        if (errorCode != null && errorCode.toString().trim().isNotEmpty) {
          throw Exception(errorCode.toString());
        }
      }

      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      }

      if (e.type == DioExceptionType.connectionError) {
        throw Exception('Không kết nối được Backend tại $baseUrl.');
      }

      throw Exception('Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    }
  }

  // ============================================================
  // TOKEN & ROLE STORAGE
  // ============================================================

  static Future<String?> getAccessToken() async {
    return _storage.read(key: 'accessToken');
  }

  static Future<String?> getUserRole() async {
    return _storage.read(key: 'role');
  }

  static Future<void> updateFcmToken(String fcmToken) async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      if (fcmToken.trim().isEmpty) {
        throw Exception('FCM token không hợp lệ.');
      }

      final response = await _dio.post(
        '/Auth/fcm-token',
        data: {'token': fcmToken.trim()},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
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
              'Không thể cập nhật FCM token.',
        );
      }
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map) {
        final message = data['message'];

        if (message != null && message.toString().trim().isNotEmpty) {
          throw Exception(message.toString());
        }
      }

      if (e.response?.statusCode == 401) {
        throw Exception('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      throw Exception('Không thể cập nhật FCM token.');
    }
  }

  static Future<bool> hasToken() async {
    final token = await getAccessToken();
    return token != null && token.trim().isNotEmpty;
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  static Future<void> logout() async {
    await _storage.deleteAll();
  }

  // ============================================================
  // LẤY DANH SÁCH DANH MỤC SỰ CỐ (REQUEST CATEGORIES)
  // Backend Route: GET /api/RequestCategory
  // ============================================================

  static Future<List<CategoryModel>> getCategories() async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.get(
        '/RequestCategory',
        queryParameters: {
          'sortBy': 'name',
          'sortDirection': 'asc',
          'pageSize': 100,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      final responseData = response.data;

      if (responseData is! Map) {
        throw Exception('Dữ liệu danh mục trả về không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);

      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Không thể tải danh mục.');
      }

      final data = result['data'];
      if (data == null) return [];

      List<dynamic> items = [];
      if (data is Map) {
        final pagedData = Map<String, dynamic>.from(data);
        final rawItems = pagedData['items'];
        if (rawItems is List) items = rawItems;
      } else if (data is List) {
        items = data;
      }

      return items
          .whereType<Map>()
          .map((item) => CategoryModel.fromJson(Map<String, dynamic>.from(item)))
          .where((cat) => cat.isActive)
          .toList();
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải danh mục sự cố.',
      );
    }
  }

  // ============================================================
  // TẠO YÊU CẦU MỚI (DÀNH CHO USER / EMPLOYEE)
  // Backend Route: POST /api/SupportRequest
  // DTO: CreateSupportRequest
  // ============================================================

  static Future<RequestModel> createRequest({
    required String title,
    required String description,
    required int priorityId,
    int? categoryId,
    DateTime? desiredDate,
  }) async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final Map<String, dynamic> payload = {
        'title': title.trim(),
        'description': description.trim(),
        'priorityId': priorityId,
      };

      if (categoryId != null) {
        payload['categoryId'] = categoryId;
      }

      if (desiredDate != null) {
        payload['desiredDate'] = desiredDate.toIso8601String();
      }

      final response = await _dio.post(
        '/SupportRequest',
        data: payload,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      return _parseRequestResponse(
        response,
        defaultError: 'Không thể tạo yêu cầu hỗ trợ.',
      );
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tạo yêu cầu hỗ trợ.',
      );
    }
  }

  // ============================================================
  // GET MY REQUESTS (DÀNH CHO USER / EMPLOYEE)
  // Backend Route: GET /api/SupportRequest/my
  // ============================================================

  static Future<List<RequestModel>> getMyRequests() async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.get(
        '/SupportRequest/my',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
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
              'Không thể tải danh sách yêu cầu của bạn.',
        );
      }

      final data = result['data'];
      if (data == null) {
        return [];
      }

      List<dynamic> items = [];
      if (data is Map) {
        final pagedData = Map<String, dynamic>.from(data);
        final rawItems = pagedData['items'];
        if (rawItems is List) {
          items = rawItems;
        }
      } else if (data is List) {
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
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải danh sách yêu cầu của bạn.',
      );
    }
  }

  // ============================================================
  // GET ASSIGNED REQUESTS (DÀNH CHO IT STAFF)
  // Backend Route: GET /api/SupportRequest/assigned
  // ============================================================

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
          headers: {'Authorization': 'Bearer $token'},
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

      List<dynamic> items = [];
      if (data is Map) {
        final pagedData = Map<String, dynamic>.from(data);
        final rawItems = pagedData['items'];
        if (rawItems is List) {
          items = rawItems;
        }
      } else if (data is List) {
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
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải danh sách công việc.',
      );
    }
  }

  // ============================================================
  // GET REQUEST BY ID
  // ============================================================

  static Future<RequestModel> getRequestById(int requestId) async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.get(
        '/SupportRequest/$requestId',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      return _parseRequestResponse(
        response,
        defaultError: 'Không thể tải thông tin yêu cầu.',
      );
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải thông tin yêu cầu.',
      );
    }
  }

  // ============================================================
  // USER: XÁC NHẬN HOÀN THÀNH
  // Backend Route: POST /api/SupportRequest/{id}/confirm-completion
  // ============================================================

  static Future<void> confirmCompletion(int requestId) async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.post(
        '/SupportRequest/$requestId/confirm-completion',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      final result = Map<String, dynamic>.from(response.data);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Xác nhận không thành công.');
      }
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể xác nhận hoàn thành.',
      );
    }
  }

  // ============================================================
  // USER: TỪ CHỐI / YÊU CẦU LÀM LẠI
  // Backend Route: POST /api/SupportRequest/{id}/reject-completion
  // DTO: UserRejectCompletionRequest
  // ============================================================

  static Future<void> rejectCompletion(int requestId, String reason) async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.post(
        '/SupportRequest/$requestId/reject-completion',
        data: {'reason': reason.trim()},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      final result = Map<String, dynamic>.from(response.data);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Gửi phản hồi thất bại.');
      }
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể gửi yêu cầu làm lại.',
      );
    }
  }

  // ============================================================
  // IT STAFF: BẮT ĐẦU XỬ LÝ (ACCEPT HANDLING)
  // Backend Route: POST /api/SupportRequest/{id}/accept-handling
  // ============================================================

  static Future<RequestModel> acceptHandling(int requestId) async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.post(
        '/SupportRequest/$requestId/accept-handling',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      return _parseRequestResponse(
        response,
        defaultError: 'Không thể bắt đầu xử lý công việc.',
      );
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể bắt đầu xử lý công việc.',
      );
    }
  }

  // ============================================================
  // IT STAFF: BẮT ĐẦU LÀM LẠI (START REWORK)
  // Backend Route: POST /api/SupportRequest/{id}/start-rework
  // ============================================================

  static Future<RequestModel> startRework(int requestId) async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.post(
        '/SupportRequest/$requestId/start-rework',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      return _parseRequestResponse(
        response,
        defaultError: 'Không thể bắt đầu xử lý lại công việc.',
      );
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể bắt đầu xử lý lại công việc.',
      );
    }
  }

  // ============================================================
  // IT STAFF: HOÀN THÀNH XỬ LÝ (COMPLETE HANDLING)
  // Backend Route: POST /api/SupportRequest/{id}/complete-handling
  // ============================================================

  static Future<RequestModel> completeHandling(int requestId) async {
    try {
      final token = await getAccessToken();

      if (token == null || token.trim().isEmpty) {
        throw Exception(
          'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.',
        );
      }

      final response = await _dio.post(
        '/SupportRequest/$requestId/complete-handling',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      return _parseRequestResponse(
        response,
        defaultError: 'Không thể hoàn thành xử lý công việc.',
      );
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể hoàn thành xử lý công việc.',
      );
    }
  }

  // ============================================================
  // PARSE SUPPORT REQUEST RESPONSE
  // ============================================================

  static RequestModel _parseRequestResponse(
    Response<dynamic> response, {
    required String defaultError,
  }) {
    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Phản hồi từ máy chủ không hợp lệ.');
    }

    final result = Map<String, dynamic>.from(responseData);

    if (result['isSuccess'] != true) {
      throw Exception(
        result['message'] ?? result['errorCode'] ?? defaultError,
      );
    }

    final data = result['data'];

    if (data is! Map) {
      throw Exception('Không nhận được thông tin công việc sau khi cập nhật.');
    }

    return RequestModel.fromJson(Map<String, dynamic>.from(data));
  }

  // ============================================================
  // HANDLE SUPPORT REQUEST ERROR
  // ============================================================

  static Exception _handleRequestDioException(
    DioException e, {
    required String defaultError,
  }) {
    if (e.response?.statusCode == 401) {
      return Exception('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (e.response?.statusCode == 403) {
      return Exception('Tài khoản không có quyền thực hiện thao tác này.');
    }

    final data = e.response?.data;

    if (data is Map) {
      final message = data['message'];

      if (message != null && message.toString().trim().isNotEmpty) {
        return Exception(message.toString());
      }

      final errorCode = data['errorCode'];

      if (errorCode != null && errorCode.toString().trim().isNotEmpty) {
        return Exception(errorCode.toString());
      }
    }

    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return Exception('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    }

    if (e.type == DioExceptionType.connectionError) {
      return Exception('Không kết nối được Backend tại $baseUrl.');
    }

    return Exception(defaultError);
  }

  // ============================================================
  // LẤY DANH SÁCH FILE ĐÍNH KÈM CỦA ĐƠN
  // Backend Route: GET /api/RequestAttachment/request/{requestId}
  // ============================================================
  static Future<List<AttachmentModel>> getAttachments(int requestId) async {
    try {
      final token = await getAccessToken();
      if (token == null || token.trim().isEmpty) {
        throw Exception('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
      }

      final response = await _dio.get(
        '/RequestAttachment/request/$requestId',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Không thể tải danh sách tệp đính kèm.');
      }

      final data = result['data'];
      if (data == null || data is! List) return [];

      return data
          .whereType<Map>()
          .map((item) => AttachmentModel.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải danh sách tệp đính kèm.',
      );
    }
  }

  // ============================================================
  // UPLOAD FILE/ẢNH ĐÍNH KÈM
  // Backend Route: POST /api/RequestAttachment/upload
  // ============================================================
  static Future<AttachmentModel> uploadAttachment({
    required int requestId,
    required String filePath,
    String contextType = 'REQUEST',
  }) async {
    try {
      final token = await getAccessToken();
      if (token == null || token.trim().isEmpty) {
        throw Exception('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
      }

      final fileName = filePath.split(Platform.pathSeparator).last;
      final formData = FormData.fromMap({
        'RequestId': requestId,
        'ContextType': contextType,
        'File': await MultipartFile.fromFile(filePath, filename: fileName),
      });

      final response = await _dio.post(
        '/RequestAttachment/upload',
        data: formData,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Tải tệp lên thất bại.');
      }

      final data = result['data'];
      if (data == null || data is! Map) {
        throw Exception('Máy chủ không trả về thông tin tệp đã tải.');
      }

      return AttachmentModel.fromJson(Map<String, dynamic>.from(data));
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải tệp lên máy chủ.',
      );
    }
  }

  // ============================================================
  // LẤY DANH SÁCH BÌNH LUẬN CỦA ĐƠN
  // Backend Route: GET /api/RequestComment/request/{requestId}
  // ============================================================
  static Future<List<CommentModel>> getComments(int requestId) async {
    try {
      final token = await getAccessToken();
      if (token == null || token.trim().isEmpty) {
        throw Exception('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
      }

      final response = await _dio.get(
        '/RequestComment/request/$requestId',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Không thể tải danh sách bình luận.');
      }

      final data = result['data'];
      if (data == null || data is! List) return [];

      return data
          .whereType<Map>()
          .map((item) => CommentModel.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải trao đổi bình luận.',
      );
    }
  }

  // ============================================================
  // GỬI BÌNH LUẬN MỚI
  // Backend Route: POST /api/RequestComment
  // DTO: CreateCommentRequest
  // ============================================================
  static Future<CommentModel> createComment({
    required int requestId,
    required String content,
  }) async {
    try {
      final token = await getAccessToken();
      if (token == null || token.trim().isEmpty) {
        throw Exception('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
      }

      final response = await _dio.post(
        '/RequestComment',
        data: {
          'requestId': requestId,
          'content': content.trim(),
        },
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Gửi bình luận thất bại.');
      }

      final data = result['data'];
      if (data == null || data is! Map) {
        throw Exception('Máy chủ không trả về thông tin bình luận.');
      }

      return CommentModel.fromJson(Map<String, dynamic>.from(data));
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể gửi bình luận.',
      );
    }
  }

  // ============================================================
  // LẤY LỊCH SỬ TIẾN ĐỘ XỬ LÝ ĐƠN
  // Backend Route: GET /api/RequestHistory/request/{requestId}
  // ============================================================
  static Future<List<RequestHistoryModel>> getRequestHistories(int requestId) async {
    try {
      final token = await getAccessToken();
      if (token == null || token.trim().isEmpty) {
        throw Exception('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
      }

      final response = await _dio.get(
        '/RequestHistory/request/$requestId',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Không thể tải lịch sử xử lý.');
      }

      final data = result['data'];
      if (data == null || data is! List) return [];

      return data
          .whereType<Map>()
          .map((item) => RequestHistoryModel.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải lịch sử xử lý đơn.',
      );
    }
  }

  // ============================================================
  // LẤY DANH SÁCH MỨC ĐỘ ƯU TIÊN (PRIORITIES)
  // Backend Route: GET /api/Priority
  // ============================================================
  static Future<List<PriorityModel>> getPriorities() async {
    try {
      final token = await getAccessToken();
      if (token == null || token.trim().isEmpty) {
        throw Exception('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
      }

      final response = await _dio.get(
        '/Priority',
        queryParameters: {
          'sortBy': 'level',
          'sortDirection': 'asc',
          'pageSize': 50,
        },
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Không thể tải mức độ ưu tiên.');
      }

      final data = result['data'];
      if (data == null) return [];

      List<dynamic> items = [];
      if (data is Map) {
        final pagedData = Map<String, dynamic>.from(data);
        final rawItems = pagedData['items'];
        if (rawItems is List) items = rawItems;
      } else if (data is List) {
        items = data;
      }

      return items
          .whereType<Map>()
          .map((item) => PriorityModel.fromJson(Map<String, dynamic>.from(item)))
          .where((p) => p.isActive) // Chỉ lấy các mức ưu tiên đang hoạt động
          .toList();
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải mức độ ưu tiên.',
      );
    }
  }

  // ============================================================
  // LẤY PROFILE CHI TIẾT NGƯỜI DÙNG HIỆN TẠI
  // Backend Route: GET /api/User/{id}
  // ============================================================
  static Future<UserProfileModel> getUserProfile() async {
    try {
      final token = await getAccessToken();
      final userIdStr = await _storage.read(key: 'userId');

      if (token == null || token.trim().isEmpty || userIdStr == null) {
        throw Exception('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
      }

      final response = await _dio.get(
        '/User/$userIdStr',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Không thể tải thông tin cá nhân.');
      }

      final data = result['data'];
      if (data == null || data is! Map) {
        throw Exception('Máy chủ không trả về thông tin cá nhân.');
      }

      return UserProfileModel.fromJson(Map<String, dynamic>.from(data));
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể tải thông tin cá nhân.',
      );
    }
  }

  // ============================================================
  // QUÊN MẬT KHẨU (GỬI TOKEN VỀ EMAIL)
  // Backend Route: POST /api/PasswordReset/forgot-password
  // ============================================================
  static Future<void> forgotPassword(String email) async {
    try {
      final response = await _dio.post(
        '/PasswordReset/forgot-password',
        data: {'email': email.trim()},
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Yêu cầu đặt lại mật khẩu thất bại.');
      }
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể gửi yêu cầu đặt lại mật khẩu.',
      );
    }
  }

  // ============================================================
  // ĐẶT LẠI MẬT KHẨU BẰNG TOKEN
  // Backend Route: POST /api/PasswordReset/reset-password
  // ============================================================
  static Future<void> resetPassword({
    required String token,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      final response = await _dio.post(
        '/PasswordReset/reset-password',
        data: {
          'token': token.trim(),
          'newPassword': newPassword,
          'confirmPassword': confirmPassword,
        },
      );

      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(responseData);
      if (result['isSuccess'] != true) {
        throw Exception(result['message'] ?? 'Đặt lại mật khẩu thất bại.');
      }
    } on DioException catch (e) {
      throw _handleRequestDioException(
        e,
        defaultError: 'Không thể đặt lại mật khẩu.',
      );
    }
  }
}