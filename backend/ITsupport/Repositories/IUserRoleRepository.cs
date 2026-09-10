using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IUserRoleRepository
    {
        Task<List<UserRole>> GetRolesByUserIdAsync(int userId);
        Task<UserRole?> GetAsync(int userId, int roleId);
        Task<bool> ExistsAsync(int userId, int roleId);
        Task AddAsync(UserRole userRole);
        void Remove(UserRole userRole);
        Task<int> SaveChangesAsync();
    }
}