using ITsupport.DTOs.RequestCategory;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IRequestCategoryService
    {
        Task<ApiResult<PagedResult<RequestCategoryResponse>>> GetAllAsync(RequestCategoryQueryParameters parameters);
        Task<ApiResult<RequestCategoryResponse>> GetByIdAsync(int id);
        Task<ApiResult<RequestCategoryResponse>> CreateAsync(CreateRequestCategoryRequest request);
        Task<ApiResult<RequestCategoryResponse>> UpdateAsync(int id, UpdateRequestCategoryRequest request);
        Task<ApiResult<RequestCategoryResponse>> DeleteAsync(int id);
    }
}