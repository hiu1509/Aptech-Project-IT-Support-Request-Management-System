using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.Priority;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class PriorityRepository : IPriorityRepository
    {
        private readonly ITsupportDbContext _context;

        public PriorityRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<(List<Priority> Items, int TotalItems)> GetAllAsync(PriorityQueryParameters parameters)
        {
            IQueryable<Priority> query = _context.Priorities.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(parameters.Keyword))
            {
                var normalizedKeyword = parameters.Keyword.Trim().ToUpper();
                query = query.Where(p =>
                    p.Code.ToUpper().Contains(normalizedKeyword) ||
                    p.Name.ToUpper().Contains(normalizedKeyword)
                );
            }

            var descending = parameters.SortDirection.Trim().ToUpper().Equals("DESC");
            query = parameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "code" => descending ? query.OrderByDescending(p => p.Code) : query.OrderBy(p => p.Code),
                "name" => descending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                _ => descending ? query.OrderByDescending(p => p.Level) : query.OrderBy(p => p.Level)
            };

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        public async Task<Priority?> GetByIdAsync(int id)
        {
            return await _context.Priorities.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<bool> ExistsByCodeAsync(string code)
        {
            return await _context.Priorities.AnyAsync(p => p.Code == code);
        }

        public async Task<bool> ExistsByLevelAsync(byte level)
        {
            return await _context.Priorities.AnyAsync(p => p.Level == level);
        }

        public async Task AddAsync(Priority priority)
        {
            await _context.Priorities.AddAsync(priority);
        }

        public void Remove(Priority priority)
        {
            _context.Priorities.Remove(priority);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}