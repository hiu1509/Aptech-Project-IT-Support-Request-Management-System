using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.Priority;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class PriorityService : IPriorityService
    {
        private readonly IPriorityRepository _repository;
        private readonly ITsupportDbContext _context;
        private readonly ILogger<PriorityService> _logger;
        private readonly IMapper _mapper;

        public PriorityService(
            IPriorityRepository repository,
            ITsupportDbContext context,
            ILogger<PriorityService> logger,
            IMapper mapper)
        {
            _repository = repository;
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }


        // =========================================================
        // GET ALL
        // =========================================================

        public async Task<ApiResult<PagedResult<PriorityResponse>>> GetAllAsync(
            PriorityQueryParameters parameters)
        {
            var (items, totalItems) =
                await _repository.GetAllAsync(parameters);

            var totalPages =
                totalItems == 0
                    ? 0
                    : (int)Math.Ceiling(
                        (double)totalItems /
                        parameters.PageSize
                    );

            var pagedResult =
                new PagedResult<PriorityResponse>
                {
                    Items =
                        _mapper.Map<List<PriorityResponse>>(
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

            return ApiResult<PagedResult<PriorityResponse>>
                .Success(pagedResult);
        }


        // =========================================================
        // GET BY ID
        // =========================================================

        public async Task<ApiResult<PriorityResponse>> GetByIdAsync(
            int id)
        {
            var priority =
                await _repository.GetByIdAsync(id);

            if (priority is null)
            {
                return ApiResult<PriorityResponse>
                    .Failure(
                        "NOT_FOUND",
                        "Không tìm thấy độ ưu tiên"
                    );
            }

            return ApiResult<PriorityResponse>
                .Success(
                    _mapper.Map<PriorityResponse>(
                        priority
                    )
                );
        }


        // =========================================================
        // CREATE
        // =========================================================

        public async Task<ApiResult<PriorityResponse>> CreateAsync(
            CreatePriorityRequest request)
        {
            var code =
                request.Code
                    .Trim()
                    .ToUpperInvariant();


            // -----------------------------------------------------
            // CHECK CODE
            // -----------------------------------------------------

            if (
                await _repository.ExistsByCodeAsync(
                    code
                )
            )
            {
                _logger.LogWarning(
                    "Mã độ ưu tiên đã tồn tại: {Code}",
                    code
                );

                return ApiResult<PriorityResponse>
                    .Failure(
                        "PRIORITY_CODE_EXISTS",
                        "Mã độ ưu tiên đã tồn tại"
                    );
            }


            // -----------------------------------------------------
            // CHECK LEVEL
            // -----------------------------------------------------

            if (
                await _repository.ExistsByLevelAsync(
                    request.Level
                )
            )
            {
                _logger.LogWarning(
                    "Cấp độ ưu tiên đã tồn tại: {Level}",
                    request.Level
                );

                return ApiResult<PriorityResponse>
                    .Failure(
                        "PRIORITY_LEVEL_EXISTS",
                        "Cấp độ ưu tiên (Level) đã tồn tại"
                    );
            }


            // -----------------------------------------------------
            // MAP
            // -----------------------------------------------------

            var priority =
                _mapper.Map<Priority>(
                    request
                );


            // -----------------------------------------------------
            // NORMALIZE
            // -----------------------------------------------------

            priority.Code =
                code;

            priority.Name =
                request.Name.Trim();

            priority.Level =
                request.Level;

            priority.TargetResolutionHours =
                request.TargetResolutionHours;

            priority.IsActive =
                request.IsActive;


            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _repository.AddAsync(
                priority
            );

            await _repository
                .SaveChangesAsync();


            _logger.LogInformation(
                "Priority created. Id={PriorityId}, Code={Code}, Level={Level}",
                priority.Id,
                priority.Code,
                priority.Level
            );


            return ApiResult<PriorityResponse>
                .Success(
                    _mapper.Map<PriorityResponse>(
                        priority
                    )
                );
        }


        // =========================================================
        // UPDATE
        // =========================================================

        public async Task<ApiResult<PriorityResponse>> UpdateAsync(
            int id,
            UpdatePriorityRequest request)
        {
            var priority =
                await _repository.GetByIdAsync(
                    id
                );

            if (priority is null)
            {
                return ApiResult<PriorityResponse>
                    .Failure(
                        "NOT_FOUND",
                        "Không tìm thấy độ ưu tiên"
                    );
            }


            // UpdatePriorityRequest chỉ cho sửa:
            // Name
            // TargetResolutionHours
            // IsActive
            //
            // Code và Level giữ nguyên.

            _mapper.Map(
                request,
                priority
            );


            priority.Name =
                request.Name.Trim();

            priority.TargetResolutionHours =
                request.TargetResolutionHours;

            priority.IsActive =
                request.IsActive;


            await _repository
                .SaveChangesAsync();


            _logger.LogInformation(
                "Priority updated. Id={PriorityId}, Code={Code}",
                priority.Id,
                priority.Code
            );


            return ApiResult<PriorityResponse>
                .Success(
                    _mapper.Map<PriorityResponse>(
                        priority
                    )
                );
        }


        // =========================================================
        // DELETE
        // =========================================================

        public async Task<ApiResult<PriorityResponse>> DeleteAsync(
            int id)
        {
            var priority =
                await _repository.GetByIdAsync(
                    id
                );

            if (priority is null)
            {
                return ApiResult<PriorityResponse>
                    .Failure(
                        "NOT_FOUND",
                        "Không tìm thấy độ ưu tiên"
                    );
            }


            // Không cho xóa Priority đang được Request sử dụng
            var isUsed =
                await _context.SupportRequests
                    .AnyAsync(
                        request =>
                            request.PriorityId == id
                    );


            if (isUsed)
            {
                return ApiResult<PriorityResponse>
                    .Failure(
                        "PRIORITY_IN_USE",
                        "Không thể xóa độ ưu tiên đang được sử dụng trong yêu cầu hỗ trợ"
                    );
            }


            var response =
                _mapper.Map<PriorityResponse>(
                    priority
                );


            _repository.Remove(
                priority
            );

            await _repository
                .SaveChangesAsync();


            _logger.LogInformation(
                "Priority deleted. Id={PriorityId}, Code={Code}",
                priority.Id,
                priority.Code
            );


            return ApiResult<PriorityResponse>
                .Success(response);
        }
    }
}