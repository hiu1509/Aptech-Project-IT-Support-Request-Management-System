using ITsupport.Entities;

namespace ITsupport.Services
{
    public interface ITokenService
    {
        (string Token, DateTime ExpireAt) CreateToken(User user, IEnumerable<string>? roles = null);
    }
}