using ITsupport.DTOs.ITGroup;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IITGroupRepository
    {
        Task<(List<ITGroup> Items, int TotalItems)> GetAllAsync(ITGroupQueryParameters parameters);
        Task<ITGroup?> GetByIdAsync(int id);
        Task<bool> ExistsByCodeAsync(string code);
        Task AddAsync(ITGroup itGroup);
        void Remove(ITGroup itGroup);
        Task<int> SaveChangesAsync();
    }
}