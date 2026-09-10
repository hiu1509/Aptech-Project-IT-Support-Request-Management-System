using ITsupport.DTOs.SupportRequest;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface ISupportRequestRepository
    {
        Task<(List<SupportRequest> Items, int TotalItems)> GetAllAsync(SupportRequestQueryParameters parameters);
        Task<SupportRequest?> GetByIdAsync(long id);
        Task<bool> ExistsByCodeAsync(string requestCode);
        Task AddAsync(SupportRequest request);
        void Remove(SupportRequest request);
        Task<int> SaveChangesAsync();
    }
}
