import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'app.dart';
import 'firebase_options.dart';
import 'services/api_service.dart';
import 'screens/request_detail_screen.dart';
import 'screens/request_list_screen.dart';

Future<void> openRequestFromNotification(
  RemoteMessage message,
) async {
  try {
    final requestIdText =
        message.data['requestId'];

    if (requestIdText == null) {
      debugPrint(
        'FCM không có requestId.',
      );
      return;
    }

    final requestId =
        int.tryParse(requestIdText.toString());

    if (requestId == null) {
      debugPrint(
        'FCM requestId không hợp lệ: $requestIdText',
      );
      return;
    }

    if (!isLoggedIn) {
      debugPrint(
        'Phiên hiện tại chưa đăng nhập. '
        'Không mở request #$requestId từ notification.',
      );

      scaffoldMessengerKey.currentState
          ?.hideCurrentSnackBar();

      scaffoldMessengerKey.currentState
          ?.showSnackBar(
        const SnackBar(
          content: Text(
            'Vui lòng đăng nhập để xem yêu cầu.',
          ),
        ),
      );

      return;
    }

    final request =
        await ApiService.getRequestById(
          requestId,
        );

    final navigator =
        navigatorKey.currentState;

    if (navigator == null) {
      debugPrint(
        'Navigator chưa sẵn sàng.',
      );
      return;
    }

    navigator.pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => const RequestListScreen(),
      ),
      (route) => false,
    );

    // Sau đó mở yêu cầu từ notification
    navigator.push(
      MaterialPageRoute(
        builder: (_) => RequestDetailScreen(
          request: request,
        ),
      ),
    );
  } catch (e) {
    debugPrint(
      'Không thể mở request từ FCM: $e',
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Khởi tạo Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Xin quyền gửi thông báo
  final messaging = FirebaseMessaging.instance;

  final settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );

  debugPrint(
    'Notification permission: ${settings.authorizationStatus}',
  );

  // Lấy FCM Token của thiết bị
  final token = await messaging.getToken();

  debugPrint('================ FCM TOKEN ================');
  debugPrint(token);
  debugPrint('===========================================');

  // =====================================================
  // NHẬN FCM KHI APP ĐANG MỞ
  // =====================================================
  FirebaseMessaging.onMessage.listen(
    (RemoteMessage message) {
      debugPrint('========== FCM RECEIVED ==========');
      debugPrint(
        'Title: ${message.notification?.title}',
      );
      debugPrint(
        'Body: ${message.notification?.body}',
      );
      debugPrint(
        'Data: ${message.data}',
      );
      debugPrint('==================================');

      scaffoldMessengerKey.currentState
          ?.hideCurrentSnackBar();

      scaffoldMessengerKey.currentState
          ?.showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 8),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment:
                CrossAxisAlignment.start,
            children: [
              Text(
                message.notification?.title ??
                    'Thông báo mới',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                message.notification?.body ??
                    'Bạn có yêu cầu hỗ trợ mới.',
              ),
            ],
          ),
          action: SnackBarAction(
            label: 'Xem',
            onPressed: () async {
              await openRequestFromNotification(
                message,
              );
            },
          ),
        ),
      );
    },
  );

  // =====================================================
  // NGƯỜI DÙNG BẤM NOTIFICATION KHI APP ĐANG CHẠY NỀN
  // =====================================================
  FirebaseMessaging.onMessageOpenedApp.listen(
    (RemoteMessage message) async {
      debugPrint(
        'Notification opened: ${message.data}',
      );

      await openRequestFromNotification(
        message,
      );
    },
  );

  runApp(const MyApp());
}