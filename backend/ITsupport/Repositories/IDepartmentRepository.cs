using ITsupport.DTOs.Department;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IDepartmentRepository
    {
        Task<(List<Department> Items, int TotalItems)> GetAllAsync(DepartmentQueryParameters parameters);
        Task<Department?> GetByIdAsync(int id);
        Task<bool> ExistsByCodeAsync(string code);
        Task AddAsync(Department department);
        void Remove(Department department);
        Task<int> SaveChangesAsync();
    }
}