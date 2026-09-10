using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.Role;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class RoleRepository : IRoleRepository
    {
        private readonly ITsupportDbContext _context;

        public RoleRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<(List<Role> Items, int TotalItems)> GetAllAsync(RoleQueryParameters parameters)
        {
            IQueryable<Role> query = _context.Roles.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(parameters.Keyword))
            {
                var normalizedKeyword = parameters.Keyword.Trim().ToUpper();
                query = query.Where(r =>
                    r.Code.ToUpper().Contains(normalizedKeyword) ||
                    r.Name.ToUpper().Contains(normalizedKeyword)
                );
            }

            var descending = parameters.SortDirection.Trim().ToUpper().Equals("DESC");
            query = parameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "code" => descending ? query.OrderByDescending(r => r.Code) : query.OrderBy(r => r.Code),
                _ => descending ? query.OrderByDescending(r => r.Name) : query.OrderBy(r => r.Name)
            };

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        public async Task<Role?> GetByIdAsync(int id)
        {
            return await _context.Roles.FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<bool> ExistsByCodeAsync(string code)
        {
            return await _context.Roles.AnyAsync(r => r.Code == code);
        }

        public async Task AddAsync(Role role)
        {
            await _context.Roles.AddAsync(role);
        }

        public void Remove(Role role)
        {
            _context.Roles.Remove(role);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}