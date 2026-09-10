using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IRequestAttachmentRepository
    {
        Task<List<RequestAttachment>> GetByRequestIdAsync(long requestId);
        Task<RequestAttachment?> GetByIdAsync(long id);
        Task AddAsync(RequestAttachment attachment);
        void Remove(RequestAttachment attachment);
        Task<int> SaveChangesAsync();
    }
}