using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.ITGroup;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class ITGroupRepository : IITGroupRepository
    {
        private readonly ITsupportDbContext _context;

        public ITGroupRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<(List<ITGroup> Items, int TotalItems)> GetAllAsync(ITGroupQueryParameters parameters)
        {
            IQueryable<ITGroup> query = _context.ITGroups.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(parameters.Keyword))
            {
                var normalizedKeyword = parameters.Keyword.Trim().ToUpper();
                query = query.Where(g =>
                    g.Code.ToUpper().Contains(normalizedKeyword) ||
                    g.Name.ToUpper().Contains(normalizedKeyword)
                );
            }

            var descending = parameters.SortDirection.Trim().ToUpper().Equals("DESC");
            query = parameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "code" => descending ? query.OrderByDescending(g => g.Code) : query.OrderBy(g => g.Code),
                _ => descending ? query.OrderByDescending(g => g.Name) : query.OrderBy(g => g.Name)
            };

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        public async Task<ITGroup?> GetByIdAsync(int id)
        {
            return await _context.ITGroups.FirstOrDefaultAsync(g => g.Id == id);
        }

        public async Task<bool> ExistsByCodeAsync(string code)
        {
            return await _context.ITGroups.AnyAsync(g => g.Code == code);
        }

        public async Task AddAsync(ITGroup itGroup)
        {
            await _context.ITGroups.AddAsync(itGroup);
        }

        public void Remove(ITGroup itGroup)
        {
            _context.ITGroups.Remove(itGroup);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}