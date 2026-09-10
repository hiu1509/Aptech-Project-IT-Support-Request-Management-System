using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class RequestProgressRepository : IRequestProgressRepository
    {
        private readonly ITsupportDbContext _context;

        public RequestProgressRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<List<RequestProgress>> GetByRequestIdAsync(long requestId)
        {
            return await _context.RequestProgress
                .Include(p => p.UpdatedByUser)
                .Where(p => p.RequestId == requestId)
                .OrderByDescending(p => p.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<RequestProgress?> GetByIdAsync(long id)
        {
            return await _context.RequestProgress
                .Include(p => p.UpdatedByUser)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task AddAsync(RequestProgress progress)
        {
            await _context.RequestProgress.AddAsync(progress);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}