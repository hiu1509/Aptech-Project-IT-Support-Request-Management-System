using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class UserRoleRepository : IUserRoleRepository
    {
        private readonly ITsupportDbContext _context;

        public UserRoleRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserRole>> GetRolesByUserIdAsync(int userId)
        {
            return await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .Include(ur => ur.AssignedByUser)
                .Where(ur => ur.UserId == userId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<UserRole?> GetAsync(int userId, int roleId)
        {
            return await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .Include(ur => ur.AssignedByUser)
                .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
        }

        public async Task<bool> ExistsAsync(int userId, int roleId)
        {
            return await _context.UserRoles
                .AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
        }

        public async Task AddAsync(UserRole userRole)
        {
            await _context.UserRoles.AddAsync(userRole);
        }

        public void Remove(UserRole userRole)
        {
            _context.UserRoles.Remove(userRole);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}