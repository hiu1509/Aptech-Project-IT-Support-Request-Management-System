using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class RequestHistoryRepository : IRequestHistoryRepository
    {
        private readonly ITsupportDbContext _context;

        public RequestHistoryRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<List<RequestHistory>> GetByRequestIdAsync(long requestId)
        {
            return await _context.RequestHistories
                .Include(h => h.FromStatus)
                .Include(h => h.ToStatus)
                .Include(h => h.PerformedByUser)
                .Where(h => h.RequestId == requestId)
                .OrderByDescending(h => h.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<RequestHistory?> GetByIdAsync(long id)
        {
            return await _context.RequestHistories
                .Include(h => h.FromStatus)
                .Include(h => h.ToStatus)
                .Include(h => h.PerformedByUser)
                .FirstOrDefaultAsync(h => h.Id == id);
        }

        public async Task AddAsync(RequestHistory history)
        {
            await _context.RequestHistories.AddAsync(history);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}