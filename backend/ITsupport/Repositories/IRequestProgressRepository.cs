using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IRequestProgressRepository
    {
        Task<List<RequestProgress>> GetByRequestIdAsync(long requestId);
        Task<RequestProgress?> GetByIdAsync(long id);
        Task AddAsync(RequestProgress progress);
        Task<int> SaveChangesAsync();
    }
}