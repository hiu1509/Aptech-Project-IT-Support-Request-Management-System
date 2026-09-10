using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.RequestCategory;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class RequestCategoryRepository : IRequestCategoryRepository
    {
        private readonly ITsupportDbContext _context;

        public RequestCategoryRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<(List<RequestCategory> Items, int TotalItems)> GetAllAsync(RequestCategoryQueryParameters parameters)
        {
            IQueryable<RequestCategory> query = _context.RequestCategories
                .Include(rc => rc.ParentCategory)
                .Include(rc => rc.DefaultITGroup)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(parameters.Keyword))
            {
                var normalized = parameters.Keyword.Trim().ToUpper();
                query = query.Where(c =>
                    c.Code.ToUpper().Contains(normalized) ||
                    c.Name.ToUpper().Contains(normalized)
                );
            }

            if (parameters.ParentCategoryId.HasValue)
            {
                query = query.Where(c => c.ParentCategoryId == parameters.ParentCategoryId.Value);
            }

            if (parameters.DefaultITGroupId.HasValue)
            {
                query = query.Where(c => c.DefaultITGroupId == parameters.DefaultITGroupId.Value);
            }

            if (parameters.IsActive.HasValue)
            {
                query = query.Where(c => c.IsActive == parameters.IsActive.Value);
            }

            var descending = parameters.SortDirection.Trim().ToUpper().Equals("DESC");
            query = parameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "code" => descending ? query.OrderByDescending(c => c.Code) : query.OrderBy(c => c.Code),
                _ => descending ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name)
            };

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        public async Task<RequestCategory?> GetByIdAsync(int id)
        {
            return await _context.RequestCategories
                .Include(rc => rc.ParentCategory)
                .Include(rc => rc.DefaultITGroup)
                .FirstOrDefaultAsync(rc => rc.Id == id);
        }

        public async Task<bool> ExistsByCodeAsync(string code)
        {
            return await _context.RequestCategories.AnyAsync(rc => rc.Code == code);
        }

        public async Task<bool> HasChildCategoriesAsync(int parentId)
        {
            return await _context.RequestCategories.AnyAsync(rc => rc.ParentCategoryId == parentId);
        }

        public async Task AddAsync(RequestCategory category)
        {
            await _context.RequestCategories.AddAsync(category);
        }

        public void Remove(RequestCategory category)
        {
            _context.RequestCategories.Remove(category);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}