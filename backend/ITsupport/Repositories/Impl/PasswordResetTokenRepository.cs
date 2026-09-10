using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.Entities;

namespace ITsupport.Repositories.Impl
{
    public class PasswordResetTokenRepository : IPasswordResetTokenRepository
    {
        private readonly ITsupportDbContext _context;

        public PasswordResetTokenRepository(ITsupportDbContext context)
        {
            _context = context;
        }

        public async Task<PasswordResetToken?> GetByTokenHashAsync(string tokenHash)
        {
            return await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);
        }

        public async Task<PasswordResetToken?> GetLatestActiveTokenByUserIdAsync(int userId)
        {
            return await _context.PasswordResetTokens
                .Where(t => t.UserId == userId && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task AddAsync(PasswordResetToken token)
        {
            await _context.PasswordResetTokens.AddAsync(token);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}