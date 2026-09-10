using ITsupport.DTOs.EmailNotification;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IEmailNotificationService
    {
        Task<ApiResult<PagedResult<EmailNotificationResponse>>> GetAllAsync(EmailNotificationQueryParameters parameters);
        Task<ApiResult<EmailNotificationResponse>> QueueEmailAsync(CreateEmailNotificationRequest request);
        Task<ApiResult<bool>> ProcessPendingEmailsAsync();
    }
}