using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IRequestHistoryRepository
    {
        Task<List<RequestHistory>> GetByRequestIdAsync(long requestId);
        Task<RequestHistory?> GetByIdAsync(long id);
        Task AddAsync(RequestHistory history);
        Task<int> SaveChangesAsync();
    }
}