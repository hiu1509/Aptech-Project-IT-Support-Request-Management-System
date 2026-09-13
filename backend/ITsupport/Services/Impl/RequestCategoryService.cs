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


        // =========================================================
        // GET ALL
        // =========================================================

        public async Task<ApiResult<PagedResult<RequestCategoryResponse>>> GetAllAsync(
            RequestCategoryQueryParameters parameters)
        {
            var (items, totalItems) =
                await _categoryRepository.GetAllAsync(parameters);

            var totalPages =
                totalItems == 0
                    ? 0
                    : (int)Math.Ceiling(
                        (double)totalItems /
                        parameters.PageSize
                    );

            var pagedResult =
                new PagedResult<RequestCategoryResponse>
                {
                    Items =
                        _mapper.Map<List<RequestCategoryResponse>>(
                            items
                        ),

                    TotalPages =
                        totalPages,

                    PageNumber =
                        parameters.Page,

                    PageSize =
                        parameters.PageSize,

                    TotalItems =
                        totalItems
                };

            return ApiResult<PagedResult<RequestCategoryResponse>>
                .Success(pagedResult);
        }


        // =========================================================
        // GET BY ID
        // =========================================================

        public async Task<ApiResult<RequestCategoryResponse>> GetByIdAsync(
            int id)
        {
            var category =
                await _categoryRepository.GetByIdAsync(id);

            if (category is null)
            {
                return ApiResult<RequestCategoryResponse>
                    .Failure(
                        "NOT_FOUND",
                        "Không tìm thấy danh mục"
                    );
            }

            return ApiResult<RequestCategoryResponse>
                .Success(
                    _mapper.Map<RequestCategoryResponse>(
                        category
                    )
                );
        }


        // =========================================================
        // CREATE
        // =========================================================

        public async Task<ApiResult<RequestCategoryResponse>> CreateAsync(
            CreateRequestCategoryRequest request)
        {
            // -----------------------------------------------------
            // NORMALIZE CODE
            // -----------------------------------------------------

            var code =
                request.Code
                    .Trim()
                    .ToUpperInvariant();


            // -----------------------------------------------------
            // CHECK CODE EXISTS
            // -----------------------------------------------------

            if (
                await _categoryRepository
                    .ExistsByCodeAsync(code)
            )
            {
                return ApiResult<RequestCategoryResponse>
                    .Failure(
                        "CATEGORY_CODE_EXISTS",
                        "Mã danh mục phân loại đã tồn tại"
                    );
            }


            // -----------------------------------------------------
            // CHECK PARENT CATEGORY
            // -----------------------------------------------------

            if (request.ParentCategoryId.HasValue)
            {
                var parentExists =
                    await _context.RequestCategories
                        .AnyAsync(
                            c =>
                                c.Id ==
                                request.ParentCategoryId.Value
                        );

                if (!parentExists)
                {
                    return ApiResult<RequestCategoryResponse>
                        .Failure(
                            "PARENT_CATEGORY_NOT_FOUND",
                            "Danh mục cha không tồn tại"
                        );
                }
            }


            // -----------------------------------------------------
            // CHECK DEFAULT IT GROUP
            // -----------------------------------------------------

            if (request.DefaultITGroupId.HasValue)
            {
                var groupExists =
                    await _context.ITGroups
                        .AnyAsync(
                            g =>
                                g.Id ==
                                request.DefaultITGroupId.Value
                        );

                if (!groupExists)
                {
                    return ApiResult<RequestCategoryResponse>
                        .Failure(
                            "ITGROUP_NOT_FOUND",
                            "Nhóm IT mặc định không tồn tại"
                        );
                }
            }


            // -----------------------------------------------------
            // MAP ENTITY
            // -----------------------------------------------------

            var entity =
                _mapper.Map<RequestCategory>(
                    request
                );


            // -----------------------------------------------------
            // NORMALIZE ENTITY DATA
            // -----------------------------------------------------

            entity.Code =
                code;

            entity.Name =
                request.Name.Trim();

            entity.Description =
                string.IsNullOrWhiteSpace(
                    request.Description
                )
                    ? null
                    : request.Description.Trim();

            entity.ParentCategoryId =
                request.ParentCategoryId;

            entity.DefaultITGroupId =
                request.DefaultITGroupId;

            entity.IsActive =
                request.IsActive;


            // -----------------------------------------------------
            // FIX CREATED AT
            // -----------------------------------------------------

            entity.CreatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _categoryRepository
                .AddAsync(entity);

            await _categoryRepository
                .SaveChangesAsync();


            // -----------------------------------------------------
            // LOG
            // -----------------------------------------------------

            _logger.LogInformation(
                "Request category created. Id={CategoryId}, Code={Code}",
                entity.Id,
                entity.Code
            );


            // -----------------------------------------------------
            // RETURN
            // -----------------------------------------------------

            var created =
                await _categoryRepository
                    .GetByIdAsync(
                        entity.Id
                    );

            if (created is null)
            {
                return ApiResult<RequestCategoryResponse>
                    .Failure(
                        "CREATE_FAILED",
                        "Tạo danh mục thành công nhưng không thể tải lại dữ liệu"
                    );
            }

            return ApiResult<RequestCategoryResponse>
                .Success(
                    _mapper.Map<RequestCategoryResponse>(
                        created
                    )
                );
        }


        // =========================================================
        // UPDATE
        // =========================================================

        public async Task<ApiResult<RequestCategoryResponse>> UpdateAsync(
            int id,
            UpdateRequestCategoryRequest request)
        {
            // -----------------------------------------------------
            // GET CATEGORY
            // -----------------------------------------------------

            var category =
                await _categoryRepository
                    .GetByIdAsync(id);

            if (category is null)
            {
                return ApiResult<RequestCategoryResponse>
                    .Failure(
                        "NOT_FOUND",
                        "Không tìm thấy danh mục"
                    );
            }


            // -----------------------------------------------------
            // CHECK PARENT CATEGORY
            // -----------------------------------------------------

            if (request.ParentCategoryId.HasValue)
            {
                if (
                    request.ParentCategoryId.Value ==
                    id
                )
                {
                    return ApiResult<RequestCategoryResponse>
                        .Failure(
                            "INVALID_PARENT",
                            "Không thể đặt danh mục làm cha của chính nó"
                        );
                }

                var parentExists =
                    await _context.RequestCategories
                        .AnyAsync(
                            c =>
                                c.Id ==
                                request.ParentCategoryId.Value
                        );

                if (!parentExists)
                {
                    return ApiResult<RequestCategoryResponse>
                        .Failure(
                            "PARENT_CATEGORY_NOT_FOUND",
                            "Danh mục cha không tồn tại"
                        );
                }
            }


            // -----------------------------------------------------
            // CHECK DEFAULT IT GROUP
            // -----------------------------------------------------

            if (request.DefaultITGroupId.HasValue)
            {
                var groupExists =
                    await _context.ITGroups
                        .AnyAsync(
                            g =>
                                g.Id ==
                                request.DefaultITGroupId.Value
                        );

                if (!groupExists)
                {
                    return ApiResult<RequestCategoryResponse>
                        .Failure(
                            "ITGROUP_NOT_FOUND",
                            "Nhóm IT mặc định không tồn tại"
                        );
                }
            }


            // -----------------------------------------------------
            // MAP UPDATE
            // -----------------------------------------------------

            _mapper.Map(
                request,
                category
            );


            // -----------------------------------------------------
            // NORMALIZE UPDATED DATA
            // -----------------------------------------------------

            category.Name =
                request.Name.Trim();

            category.Description =
                string.IsNullOrWhiteSpace(
                    request.Description
                )
                    ? null
                    : request.Description.Trim();

            category.ParentCategoryId =
                request.ParentCategoryId;

            category.DefaultITGroupId =
                request.DefaultITGroupId;

            category.IsActive =
                request.IsActive;




            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _categoryRepository
                .SaveChangesAsync();


            // -----------------------------------------------------
            // LOG
            // -----------------------------------------------------

            _logger.LogInformation(
                "Request category updated. Id={CategoryId}, Code={Code}",
                category.Id,
                category.Code
            );


            // -----------------------------------------------------
            // RETURN
            // -----------------------------------------------------

            var updated =
                await _categoryRepository
                    .GetByIdAsync(id);

            if (updated is null)
            {
                return ApiResult<RequestCategoryResponse>
                    .Failure(
                        "UPDATE_FAILED",
                        "Cập nhật danh mục thành công nhưng không thể tải lại dữ liệu"
                    );
            }

            return ApiResult<RequestCategoryResponse>
                .Success(
                    _mapper.Map<RequestCategoryResponse>(
                        updated
                    )
                );
        }


        // =========================================================
        // DELETE
        // =========================================================

        public async Task<ApiResult<RequestCategoryResponse>> DeleteAsync(
            int id)
        {
            // -----------------------------------------------------
            // GET CATEGORY
            // -----------------------------------------------------

            var category =
                await _categoryRepository
                    .GetByIdAsync(id);

            if (category is null)
            {
                return ApiResult<RequestCategoryResponse>
                    .Failure(
                        "NOT_FOUND",
                        "Không tìm thấy danh mục"
                    );
            }


            // -----------------------------------------------------
            // CHECK CHILD CATEGORIES
            // -----------------------------------------------------

            if (
                await _categoryRepository
                    .HasChildCategoriesAsync(id)
            )
            {
                return ApiResult<RequestCategoryResponse>
                    .Failure(
                        "HAS_CHILD_CATEGORIES",
                        "Không thể xóa danh mục đang có danh mục con"
                    );
            }


            // -----------------------------------------------------
            // CHECK CATEGORY USED BY REQUESTS
            // -----------------------------------------------------

            var isUsed =
                await _context.SupportRequests
                    .AnyAsync(
                        r =>
                            r.CategoryId ==
                            id
                    );

            if (isUsed)
            {
                return ApiResult<RequestCategoryResponse>
                    .Failure(
                        "CATEGORY_IN_USE",
                        "Không thể xóa danh mục đang được sử dụng trong yêu cầu hỗ trợ"
                    );
            }


            // -----------------------------------------------------
            // RESPONSE BEFORE DELETE
            // -----------------------------------------------------

            var response =
                _mapper.Map<RequestCategoryResponse>(
                    category
                );


            // -----------------------------------------------------
            // DELETE
            // -----------------------------------------------------

            _categoryRepository.Remove(
                category
            );

            await _categoryRepository
                .SaveChangesAsync();


            // -----------------------------------------------------
            // LOG
            // -----------------------------------------------------

            _logger.LogInformation(
                "Request category deleted. Id={CategoryId}, Code={Code}",
                category.Id,
                category.Code
            );


            return ApiResult<RequestCategoryResponse>
                .Success(response);
        }
    }
}