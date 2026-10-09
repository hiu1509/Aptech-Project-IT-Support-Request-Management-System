using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FirebaseAdmin.Messaging;

namespace ITsupport.Services.Impl
{
    public class FirebaseNotificationService
        : IFirebaseNotificationService
    {
        private readonly ILogger<FirebaseNotificationService> _logger;

        public FirebaseNotificationService(
            ILogger<FirebaseNotificationService> logger)
        {
            _logger = logger;
        }

        public async Task<bool> SendToDeviceAsync(
            string fcmToken,
            string title,
            string body,
            Dictionary<string, string>? data = null)
        {
            if (string.IsNullOrWhiteSpace(fcmToken))
            {
                _logger.LogWarning(
                    "Không thể gửi FCM vì FcmToken rỗng."
                );

                return false;
            }

            try
            {
                var message = new Message
                {
                    Token = fcmToken,

                    Notification = new Notification
                    {
                        Title = title,
                        Body = body
                    },

                    Data = data ?? new Dictionary<string, string>()
                };

                var messageId =
                    await FirebaseMessaging.DefaultInstance
                        .SendAsync(message);

                _logger.LogInformation(
                    "FCM sent successfully. MessageId={MessageId}",
                    messageId
                );

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send FCM notification."
                );

                // Không throw tiếp để lỗi FCM không làm hỏng
                // nghiệp vụ phân công yêu cầu.
                return false;
            }
        }
    }
}