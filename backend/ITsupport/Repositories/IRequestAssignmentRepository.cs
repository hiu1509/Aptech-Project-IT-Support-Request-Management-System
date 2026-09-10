using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IRequestAssignmentRepository
    {
        Task<List<RequestAssignment>> GetAssignmentsByRequestIdAsync(long requestId);
        Task<RequestAssignment?> GetCurrentAssignmentAsync(long requestId, string assignmentType);
        Task AddAsync(RequestAssignment assignment);
        Task<int> SaveChangesAsync();
    }
}