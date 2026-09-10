using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.EmailNotification;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class EmailNotificationRepository : IEmailNotificationRepository
    {
        private readonly ITsupportDbContext _context;

        public EmailNotificationRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<(List<EmailNotification> Items, int TotalItems)> GetAllAsync(EmailNotificationQueryParameters parameters)
        {
            IQueryable<EmailNotification> query = _context.EmailNotifications
                .Include(e => e.RecipientUser)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(parameters.SendStatus))
            {
                var status = parameters.SendStatus.Trim().ToUpperInvariant();
                query = query.Where(e => e.SendStatus == status);
            }

            if (!string.IsNullOrWhiteSpace(parameters.EventCode))
            {
                var eventCode = parameters.EventCode.Trim().ToUpperInvariant();
                query = query.Where(e => e.EventCode == eventCode);
            }

            if (parameters.RequestId.HasValue)
            {
                query = query.Where(e => e.RequestId == parameters.RequestId.Value);
            }

            var descending = parameters.SortDirection.Trim().ToUpper().Equals("DESC");
            query = parameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "sentat" => descending ? query.OrderByDescending(e => e.SentAt) : query.OrderBy(e => e.SentAt),
                "eventcode" => descending ? query.OrderByDescending(e => e.EventCode) : query.OrderBy(e => e.EventCode),
                _ => descending ? query.OrderByDescending(e => e.CreatedAt) : query.OrderBy(e => e.CreatedAt)
            };

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        public async Task<List<EmailNotification>> GetPendingEmailsAsync(int limit = 50)
        {
            return await _context.EmailNotifications
                .Where(e => e.SendStatus == "PENDING")
                .OrderBy(e => e.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<EmailNotification?> GetByIdAsync(long id)
        {
            return await _context.EmailNotifications
                .Include(e => e.RecipientUser)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task AddAsync(EmailNotification notification)
        {
            await _context.EmailNotifications.AddAsync(notification);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}