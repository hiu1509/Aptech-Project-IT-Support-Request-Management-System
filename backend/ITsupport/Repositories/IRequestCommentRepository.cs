using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IRequestCommentRepository
    {
        Task<List<RequestComment>> GetByRequestIdAsync(long requestId);
        Task<RequestComment?> GetByIdAsync(long id);
        Task AddAsync(RequestComment comment);
        void Remove(RequestComment comment);
        Task<int> SaveChangesAsync();
    }
}