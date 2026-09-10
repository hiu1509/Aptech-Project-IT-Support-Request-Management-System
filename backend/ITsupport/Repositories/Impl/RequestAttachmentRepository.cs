using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class RequestAttachmentRepository : IRequestAttachmentRepository
    {
        private readonly ITsupportDbContext _context;

        public RequestAttachmentRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<List<RequestAttachment>> GetByRequestIdAsync(long requestId)
        {
            return await _context.RequestAttachments
                .Include(a => a.UploadedByUser)
                .Where(a => a.RequestId == requestId)
                .OrderByDescending(a => a.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<RequestAttachment?> GetByIdAsync(long id)
        {
            return await _context.RequestAttachments
                .Include(a => a.UploadedByUser)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task AddAsync(RequestAttachment attachment)
        {
            await _context.RequestAttachments.AddAsync(attachment);
        }

        public void Remove(RequestAttachment attachment)
        {
            _context.RequestAttachments.Remove(attachment);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}