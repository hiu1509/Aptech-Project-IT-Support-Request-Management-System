using ITsupport.DTOs.RequestStatus;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IRequestStatusRepository
    {
        Task<(List<RequestStatus> Items, int TotalItems)> GetAllAsync(
            RequestStatusQueryParameters parameters
        );

        Task<RequestStatus?> GetByIdAsync(int id);

        Task<RequestStatus?> GetByCodeAsync(string code);

        Task<bool> ExistsByCodeAsync(string code);

        Task AddAsync(RequestStatus requestStatus);

        void Remove(RequestStatus requestStatus);

        Task<int> SaveChangesAsync();
    }
}