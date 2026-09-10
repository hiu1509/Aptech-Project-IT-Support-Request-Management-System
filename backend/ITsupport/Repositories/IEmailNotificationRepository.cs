using ITsupport.DTOs.EmailNotification;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IEmailNotificationRepository
    {
        Task<(List<EmailNotification> Items, int TotalItems)> GetAllAsync(EmailNotificationQueryParameters parameters);
        Task<List<EmailNotification>> GetPendingEmailsAsync(int limit = 50);
        Task<EmailNotification?> GetByIdAsync(long id);
        Task AddAsync(EmailNotification notification);
        Task<int> SaveChangesAsync();
    }
}