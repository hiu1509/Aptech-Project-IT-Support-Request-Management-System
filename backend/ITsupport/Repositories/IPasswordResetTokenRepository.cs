using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IPasswordResetTokenRepository
    {
        Task<PasswordResetToken?> GetByTokenHashAsync(string tokenHash);
        Task<PasswordResetToken?> GetLatestActiveTokenByUserIdAsync(int userId);
        Task AddAsync(PasswordResetToken token);
        Task<int> SaveChangesAsync();
    }
}