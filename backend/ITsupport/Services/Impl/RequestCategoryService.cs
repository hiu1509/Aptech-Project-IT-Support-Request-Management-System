using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.RequestCategory;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class RequestCategoryService : IRequestCategoryService
    {
        private readonly IRequestCategoryRepository _categoryRepository;
        private readonly ITsupportDbContext _context;
        private readonly ILogger<RequestCategoryService> _logger;
        private readonly IMapper _mapper;

        public RequestCategoryService(
            IRequestCategoryRepository categoryRepository,
            ITsupportDbContext context,
            ILogger<RequestCategoryService> logger,
            IMapper mapper)
        {
            _categoryRepository = categoryRepository;
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<PagedResult<RequestCategoryResponse>>> GetAllAsync(RequestCategoryQueryParameters parameters)
        {
            var (items, totalItems) = await _categoryRepository.GetAllAsync(parameters);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling((double)totalItems / parameters.PageSize);

            var pagedResult = new PagedResult<RequestCategoryResponse>
            {
                Items = _mapper.Map<List<RequestCategoryResponse>>(items),
                TotalPages = totalPages,
                PageNumber = parameters.Page,
                PageSize = parameters.PageSize,
                TotalItems = totalItems
            };

            return ApiResult<PagedResult<RequestCategoryResponse>>.Success(pagedResult);
        }

        public async Task<ApiResult<RequestCategoryResponse>> GetByIdAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            return category is null
                ? ApiResult<RequestCategoryResponse>.Failure("NOT_FOUND", "Không tìm thấy danh mục")
                : ApiResult<RequestCategoryResponse>.Success(_mapper.Map<RequestCategoryResponse>(category));
        }

        public async Task<ApiResult<RequestCategoryResponse>> CreateAsync(CreateRequestCategoryRequest request)
        {
            var code = request.Code.Trim().ToUpperInvariant();
            if (await _categoryRepository.ExistsByCodeAsync(code))
            {
                return ApiResult<RequestCategoryResponse>.Failure("CATEGORY_CODE_EXISTS", "Mã danh mục phân loại đã tồn tại");
            }

            if (request.ParentCategoryId.HasValue)
            {
                var parentExists = await _context.RequestCategories.AnyAsync(c => c.Id == request.ParentCategoryId.Value);
                if (!parentExists)
                {
                    return ApiResult<RequestCategoryResponse>.Failure("PARENT_CATEGORY_NOT_FOUND", "Danh mục cha không tồn tại");
                }
            }

            if (request.DefaultITGroupId.HasValue)
            {
                var groupExists = await _context.ITGroups.AnyAsync(g => g.Id == request.DefaultITGroupId.Value);
                if (!groupExists)
                {
                    return ApiResult<RequestCategoryResponse>.Failure("ITGROUP_NOT_FOUND", "Nhóm IT mặc định không tồn tại");
                }
            }

            var entity = _mapper.Map<RequestCategory>(request);
            await _categoryRepository.AddAsync(entity);
            await _categoryRepository.SaveChangesAsync();

            var created = await _categoryRepository.GetByIdAsync(entity.Id);
            return ApiResult<RequestCategoryResponse>.Success(_mapper.Map<RequestCategoryResponse>(created));
        }

        public async Task<ApiResult<RequestCategoryResponse>> UpdateAsync(int id, UpdateRequestCategoryRequest request)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category is null)
            {
                return ApiResult<RequestCategoryResponse>.Failure("NOT_FOUND", "Không tìm thấy danh mục");
            }

            if (request.ParentCategoryId.HasValue)
            {
                if (request.ParentCategoryId.Value == id)
                {
                    return ApiResult<RequestCategoryResponse>.Failure("INVALID_PARENT", "Không thể đặt danh mục làm cha của chính nó");
                }

                var parentExists = await _context.RequestCategories.AnyAsync(c => c.Id == request.ParentCategoryId.Value);
                if (!parentExists)
                {
                    return ApiResult<RequestCategoryResponse>.Failure("PARENT_CATEGORY_NOT_FOUND", "Danh mục cha không tồn tại");
                }
            }

            if (request.DefaultITGroupId.HasValue)
            {
                var groupExists = await _context.ITGroups.AnyAsync(g => g.Id == request.DefaultITGroupId.Value);
                if (!groupExists)
                {
                    return ApiResult<RequestCategoryResponse>.Failure("ITGROUP_NOT_FOUND", "Nhóm IT mặc định không tồn tại");
                }
            }

            _mapper.Map(request, category);
            await _categoryRepository.SaveChangesAsync();

            var updated = await _categoryRepository.GetByIdAsync(id);
            return ApiResult<RequestCategoryResponse>.Success(_mapper.Map<RequestCategoryResponse>(updated));
        }

        public async Task<ApiResult<RequestCategoryResponse>> DeleteAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category is null)
            {
                return ApiResult<RequestCategoryResponse>.Failure("NOT_FOUND", "Không tìm thấy danh mục");
            }

            if (await _categoryRepository.HasChildCategoriesAsync(id))
            {
                return ApiResult<RequestCategoryResponse>.Failure("HAS_CHILD_CATEGORIES", "Không thể xóa danh mục đang có danh mục con");
            }

            _categoryRepository.Remove(category);
            await _categoryRepository.SaveChangesAsync();

            return ApiResult<RequestCategoryResponse>.Success(_mapper.Map<RequestCategoryResponse>(category));
        }
    }
}