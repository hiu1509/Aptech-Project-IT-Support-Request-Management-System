using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.SupportRequest;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class SupportRequestRepository : ISupportRequestRepository
    {
        private readonly ITsupportDbContext _context;

        public SupportRequestRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        private static IQueryable<SupportRequest> WithDetails(IQueryable<SupportRequest> query)
        {
            return query
                .Include(r => r.Requester)
                .Include(r => r.Category)
                .Include(r => r.Priority)
                .Include(r => r.Status)
                .Include(r => r.CurrentITGroup)
                .Include(r => r.CurrentAssignee);
        }

        public async Task<(List<SupportRequest> Items, int TotalItems)> GetAllAsync(SupportRequestQueryParameters parameters)
        {
            IQueryable<SupportRequest> query = WithDetails(_context.SupportRequests.AsNoTracking());
            query = ApplySearch(query, parameters.Keyword);
            query = ApplySorting(query, parameters.SortBy, parameters.SortDirection);

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        private static IQueryable<SupportRequest> ApplySearch(IQueryable<SupportRequest> query, string? keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword)) return query;

            var normalizedKeyword = keyword.Trim().ToUpper();
            return query.Where(r =>
                r.RequestCode.ToUpper().Contains(normalizedKeyword) ||
                r.Title.ToUpper().Contains(normalizedKeyword) ||
                r.Description.ToUpper().Contains(normalizedKeyword)
            );
        }

        private static IQueryable<SupportRequest> ApplySorting(IQueryable<SupportRequest> query, string sortBy, string sortDirection)
        {
            var descending = sortDirection.ToUpper().Equals("DESC");
            return sortBy.Trim().ToLowerInvariant() switch
            {
                "title" => descending ? query.OrderByDescending(r => r.Title) : query.OrderBy(r => r.Title),
                "requestcode" => descending ? query.OrderByDescending(r => r.RequestCode) : query.OrderBy(r => r.RequestCode),
                _ => descending ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt)
            };
        }

        public async Task<SupportRequest?> GetByIdAsync(long id)
        {
            return await WithDetails(_context.SupportRequests).FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<bool> ExistsByCodeAsync(string requestCode)
        {
            return await _context.SupportRequests.AnyAsync(r => r.RequestCode == requestCode);
        }

        public async Task AddAsync(SupportRequest request)
        {
            await _context.SupportRequests.AddAsync(request);
        }

        public void Remove(SupportRequest request)
        {
            _context.SupportRequests.Remove(request);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}