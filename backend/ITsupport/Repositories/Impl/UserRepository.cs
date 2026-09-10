using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.User;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class UserRepository : IUserRepository
    {
        private readonly ITsupportDbContext _context;

        public UserRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<(List<User> Items, int TotalItems)> GetAllAsync(UserQueryParameters parameters)
        {
            IQueryable<User> query = _context.Users
                .Include(u => u.Department)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(parameters.Keyword))
            {
                var normalized = parameters.Keyword.Trim().ToUpper();
                query = query.Where(u =>
                    u.FullName.ToUpper().Contains(normalized) ||
                    u.Email.ToUpper().Contains(normalized) ||
                    (u.EmployeeCode != null && u.EmployeeCode.ToUpper().Contains(normalized))
                );
            }

            if (parameters.DepartmentId.HasValue)
            {
                query = query.Where(u => u.DepartmentId == parameters.DepartmentId.Value);
            }

            if (parameters.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == parameters.IsActive.Value);
            }

            var descending = parameters.SortDirection.Trim().ToUpper().Equals("DESC");
            query = parameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "fullname" => descending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
                "email" => descending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
                "employeecode" => descending ? query.OrderByDescending(u => u.EmployeeCode) : query.OrderBy(u => u.EmployeeCode),
                _ => descending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt)
            };

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User?> FindByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<bool> ExistsByEmailAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<bool> ExistsByEmployeeCodeAsync(string employeeCode)
        {
            return await _context.Users.AnyAsync(u => u.EmployeeCode == employeeCode);
        }

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
        }

        public void Remove(User user)
        {
            _context.Users.Remove(user);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}