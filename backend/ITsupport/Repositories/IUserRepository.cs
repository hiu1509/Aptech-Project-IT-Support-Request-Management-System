using ITsupport.DTOs.User;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IUserRepository
    {
        Task<(List<User> Items, int TotalItems)> GetAllAsync(UserQueryParameters parameters);
        Task<User?> GetByIdAsync(int id);
        Task<User?> FindByEmailAsync(string email);
        Task<bool> ExistsByEmailAsync(string email);
        Task<bool> ExistsByEmployeeCodeAsync(string employeeCode);
        Task AddAsync(User user);
        void Remove(User user);
        Task<int> SaveChangesAsync();
    }
}