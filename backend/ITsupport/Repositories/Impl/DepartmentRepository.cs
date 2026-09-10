using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.Department;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly ITsupportDbContext _context;

        public DepartmentRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<(List<Department> Items, int TotalItems)> GetAllAsync(DepartmentQueryParameters parameters)
        {
            IQueryable<Department> query = _context.Departments.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(parameters.Keyword))
            {
                var normalizedKeyword = parameters.Keyword.Trim().ToUpper();
                query = query.Where(d =>
                    d.Code.ToUpper().Contains(normalizedKeyword) ||
                    d.Name.ToUpper().Contains(normalizedKeyword)
                );
            }

            var descending = parameters.SortDirection.Trim().ToUpper().Equals("DESC");
            query = parameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "code" => descending ? query.OrderByDescending(d => d.Code) : query.OrderBy(d => d.Code),
                _ => descending ? query.OrderByDescending(d => d.Name) : query.OrderBy(d => d.Name)
            };

            var totalItems = await query.CountAsync();
            var skip = (parameters.Page - 1) * parameters.PageSize;
            var items = await query.Skip(skip).Take(parameters.PageSize).ToListAsync();

            return (items, totalItems);
        }

        public async Task<Department?> GetByIdAsync(int id)
        {
            return await _context.Departments.FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<bool> ExistsByCodeAsync(string code)
        {
            return await _context.Departments.AnyAsync(d => d.Code == code);
        }

        public async Task AddAsync(Department department)
        {
            await _context.Departments.AddAsync(department);
        }

        public void Remove(Department department)
        {
            _context.Departments.Remove(department);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}