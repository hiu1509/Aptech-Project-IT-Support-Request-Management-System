using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class ITGroupMemberRepository : IITGroupMemberRepository
    {
        private readonly ITsupportDbContext _context;

        public ITGroupMemberRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<List<ITGroupMember>> GetMembersByGroupIdAsync(int itGroupId)
        {
            return await _context.ITGroupMembers
                .Include(gm => gm.ITGroup)
                .Include(gm => gm.User)
                .Where(gm => gm.ITGroupId == itGroupId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<ITGroupMember>> GetGroupsByUserIdAsync(int userId)
        {
            return await _context.ITGroupMembers
                .Include(gm => gm.ITGroup)
                .Include(gm => gm.User)
                .Where(gm => gm.UserId == userId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<ITGroupMember?> GetAsync(int itGroupId, int userId)
        {
            return await _context.ITGroupMembers
                .Include(gm => gm.ITGroup)
                .Include(gm => gm.User)
                .FirstOrDefaultAsync(gm => gm.ITGroupId == itGroupId && gm.UserId == userId);
        }

        public async Task<bool> ExistsAsync(int itGroupId, int userId)
        {
            return await _context.ITGroupMembers
                .AnyAsync(gm => gm.ITGroupId == itGroupId && gm.UserId == userId);
        }

        public async Task AddAsync(ITGroupMember member)
        {
            await _context.ITGroupMembers.AddAsync(member);
        }

        public void Remove(ITGroupMember member)
        {
            _context.ITGroupMembers.Remove(member);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}