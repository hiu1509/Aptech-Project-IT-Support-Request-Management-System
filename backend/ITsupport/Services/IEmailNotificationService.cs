using ITsupport.DTOs.EmailNotification;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IEmailNotificationService
    {
        Task<ApiResult<PagedResult<EmailNotificationResponse>>> GetAllAsync(
            EmailNotificationQueryParameters parameters
        );

        Task<ApiResult<EmailNotificationResponse>> QueueEmailAsync(
            CreateEmailNotificationRequest request
        );

        Task<ApiResult<bool>> ProcessPendingEmailsAsync();

        Task<ApiResult<bool>> SendNowAsync(
            long? requestId,
            int? recipientUserId,
            string recipientEmail,
            string eventCode,
            string subject,
            string body
        );
    }
}
