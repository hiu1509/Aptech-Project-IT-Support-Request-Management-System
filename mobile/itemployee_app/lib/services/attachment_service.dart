import 'package:dio/dio.dart';
import 'api_service.dart';

class AttachmentService {
  static const String _baseUrl = 'http://10.0.2.2:5219/api';

  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 60),
    ),
  );

  /// Upload file/ảnh:
  /// - IT Staff tải ảnh xử lý: contextType = 'PROGRESS'
  /// - Employee đính kèm ảnh lỗi: contextType = 'REQUEST'
  static Future<void> uploadAttachment({
    required int requestId,
    required String filePath,
    String contextType = 'PROGRESS',
  }) async {
    final token = await ApiService.getAccessToken();

    if (token == null || token.isEmpty) {
      throw Exception('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
    }

    final fileName = filePath.split(RegExp(r'[/\\]')).last;

    final formData = FormData.fromMap({
      'RequestId': requestId,
      'ContextType': contextType,
      'File': await MultipartFile.fromFile(
        filePath,
        filename: fileName,
      ),
    });

    try {
      final response = await _dio.post(
        '/RequestAttachment/upload',
        data: formData,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      final data = response.data;
      if (data is! Map) {
        throw Exception('Phản hồi tải tệp từ hệ thống không hợp lệ.');
      }

      final result = Map<String, dynamic>.from(data);
      if (result['isSuccess'] != true) {
        throw Exception(
          result['message']?.toString() ?? 'Không thể tải tệp lên.',
        );
      }
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map) {
        final result = Map<String, dynamic>.from(data);
        throw Exception(
          result['message']?.toString() ?? 'Không thể tải tệp lên.',
        );
      }

      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        throw Exception('Kết nối tới máy chủ bị quá thời gian.');
      }

      if (e.type == DioExceptionType.connectionError) {
        throw Exception(
          'Không kết nối được tới máy chủ. Hãy kiểm tra backend đang chạy.',
        );
      }

      throw Exception('Không thể tải tệp lên.');
    }
  }

  static Future<void> uploadEvidence({
    required int requestId,
    required String filePath,
  }) async {
    return uploadAttachment(
      requestId: requestId,
      filePath: filePath,
      contextType: 'PROGRESS',
    );
  }
}