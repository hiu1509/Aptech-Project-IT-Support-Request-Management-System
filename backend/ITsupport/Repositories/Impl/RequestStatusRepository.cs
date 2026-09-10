using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.RequestStatus;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class RequestStatusRepository : IRequestStatusRepository
    {
        private readonly ITsupportDbContext _context;

        public RequestStatusRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<(List<RequestStatus> Items, int TotalItems)> GetAllAsync(RequestStatusQueryParameters parameters)
        {
            IQueryable<RequestStatus> query = _context.RequestStatuses.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(parameters.Keyword))
            {
                var normalizedKeyword = parameters.Keyword.Trim().ToUpper();
                query = query.Where(s =>
                    s.Code.ToUpper().Contains(normalizedKeyword) ||
                    s.Name.ToUpper().Contains(normalizedKeyword)
                );
            }

            var descending = parameters.SortDirection.Trim().ToUpper().Equals("DESC");
            query = parameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "code" => descending ? query.OrderByDescending(s => s.Code) : query.OrderBy(s => s.Code),
                "name" => descending ? query.OrderByDescending(s => s.Name) : query.OrderBy(s => s.Name),
                _ => descending ? query.OrderByDescending(s => s.DisplayOrder) : query.OrderBy(s => s.DisplayOrder)
            };

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        public async Task<RequestStatus?> GetByIdAsync(int id)
        {
            return await _context.RequestStatuses.FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<bool> ExistsByCodeAsync(string code)
        {
            return await _context.RequestStatuses.AnyAsync(s => s.Code == code);
        }

        public async Task AddAsync(RequestStatus requestStatus)
        {
            await _context.RequestStatuses.AddAsync(requestStatus);
        }

        public void Remove(RequestStatus requestStatus)
        {
            _context.RequestStatuses.Remove(requestStatus);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}