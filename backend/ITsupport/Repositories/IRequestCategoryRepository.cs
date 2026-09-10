using ITsupport.DTOs.RequestCategory;
using ITsupport.Entities;

namespace ITsupport.Repositories
{
    public interface IRequestCategoryRepository
    {
        Task<(List<RequestCategory> Items, int TotalItems)> GetAllAsync(RequestCategoryQueryParameters parameters);
        Task<RequestCategory?> GetByIdAsync(int id);
        Task<bool> ExistsByCodeAsync(string code);
        Task<bool> HasChildCategoriesAsync(int parentId);
        Task AddAsync(RequestCategory category);
        void Remove(RequestCategory category);
        Task<int> SaveChangesAsync();
    }
}