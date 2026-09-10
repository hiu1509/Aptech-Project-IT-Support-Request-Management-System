using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class RequestCommentRepository : IRequestCommentRepository
    {
        private readonly ITsupportDbContext _context;

        public RequestCommentRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<List<RequestComment>> GetByRequestIdAsync(long requestId)
        {
            return await _context.RequestComments
                .Include(c => c.User)
                .Where(c => c.RequestId == requestId)
                .OrderBy(c => c.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<RequestComment?> GetByIdAsync(long id)
        {
            return await _context.RequestComments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task AddAsync(RequestComment comment)
        {
            await _context.RequestComments.AddAsync(comment);
        }

        public void Remove(RequestComment comment)
        {
            _context.RequestComments.Remove(comment);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}