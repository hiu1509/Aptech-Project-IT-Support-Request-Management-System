using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IITGroupMemberRepository
    {
        Task<List<ITGroupMember>> GetMembersByGroupIdAsync(int itGroupId);
        Task<List<ITGroupMember>> GetGroupsByUserIdAsync(int userId);
        Task<ITGroupMember?> GetAsync(int itGroupId, int userId);
        Task<bool> ExistsAsync(int itGroupId, int userId);
        Task AddAsync(ITGroupMember member);
        void Remove(ITGroupMember member);
        Task<int> SaveChangesAsync();
    }
}