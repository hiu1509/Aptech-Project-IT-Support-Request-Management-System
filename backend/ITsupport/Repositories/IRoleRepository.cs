using ITsupport.DTOs.Role;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IRoleRepository
    {
        Task<(List<Role> Items, int TotalItems)> GetAllAsync(RoleQueryParameters parameters);
        Task<Role?> GetByIdAsync(int id);
        Task<bool> ExistsByCodeAsync(string code);
        Task AddAsync(Role role);
        void Remove(Role role);
        Task<int> SaveChangesAsync();
    }
}