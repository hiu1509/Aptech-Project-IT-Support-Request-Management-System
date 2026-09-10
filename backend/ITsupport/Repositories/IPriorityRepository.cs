using ITsupport.DTOs.Priority;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IPriorityRepository
    {
        Task<(List<Priority> Items, int TotalItems)> GetAllAsync(PriorityQueryParameters parameters);
        Task<Priority?> GetByIdAsync(int id);
        Task<bool> ExistsByCodeAsync(string code);
        Task<bool> ExistsByLevelAsync(byte level);
        Task AddAsync(Priority priority);
        void Remove(Priority priority);
        Task<int> SaveChangesAsync();
    }
}