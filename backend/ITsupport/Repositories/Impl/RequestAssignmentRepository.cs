using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class RequestAssignmentRepository : IRequestAssignmentRepository
    {
        private readonly ITsupportDbContext _context;

        public RequestAssignmentRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<List<RequestAssignment>> GetAssignmentsByRequestIdAsync(long requestId)
        {
            return await _context.RequestAssignments
                .Include(a => a.AssignedToUser)
                .Include(a => a.AssignedToGroup)
                .Include(a => a.AssignedByUser)
                .Where(a => a.RequestId == requestId)
                .OrderByDescending(a => a.AssignedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<RequestAssignment?> GetCurrentAssignmentAsync(long requestId, string assignmentType)
        {
            return await _context.RequestAssignments
                .FirstOrDefaultAsync(a => a.RequestId == requestId && a.AssignmentType == assignmentType && a.IsCurrent);
        }

        public async Task AddAsync(RequestAssignment assignment)
        {
            await _context.RequestAssignments.AddAsync(assignment);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}