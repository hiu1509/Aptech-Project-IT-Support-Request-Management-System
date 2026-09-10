using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.RequestAssignment;
using ITsupport.Entities;
using ITsupport.Models;
using ITsupport.Repositories;

namespace ITsupport.Services.Impl
{
    public class RequestAssignmentService : IRequestAssignmentService
    {
        private readonly IRequestAssignmentRepository _assignmentRepository;
        private readonly ITsupportDbContext _context;
        private readonly ILogger<RequestAssignmentService> _logger;
        private readonly IMapper _mapper;

        public RequestAssignmentService(
            IRequestAssignmentRepository assignmentRepository,
            ITsupportDbContext context,
            ILogger<RequestAssignmentService> logger,
            IMapper mapper)
        {
            _assignmentRepository = assignmentRepository;
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResult<List<AssignmentResponse>>> GetByRequestIdAsync(long requestId)
        {
            var assignments = await _assignmentRepository.GetAssignmentsByRequestIdAsync(requestId);
            return ApiResult<List<AssignmentResponse>>.Success(_mapper.Map<List<AssignmentResponse>>(assignments));
        }

        public async Task<ApiResult<AssignmentResponse>> AssignAsync(CreateAssignmentRequest request, int assignedByUserId)
        {
            var supportRequest = await _context.SupportRequests.FirstOrDefaultAsync(r => r.Id == request.RequestId);
            if (supportRequest is null)
            {
                return ApiResult<AssignmentResponse>.Failure("REQUEST_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ");
            }

            var type = request.AssignmentType.Trim().ToUpperInvariant();

            if (type == "IT_GROUP" && !request.AssignedToGroupId.HasValue)
            {
                return ApiResult<AssignmentResponse>.Failure("GROUP_REQUIRED", "Cần chọn nhóm IT phụ trách");
            }
            if ((type == "COORDINATOR" || type == "IT_STAFF") && !request.AssignedToUserId.HasValue)
            {
                return ApiResult<AssignmentResponse>.Failure("USER_REQUIRED", "Cần chọn người được phân công");
            }

            var currentAssignment = await _assignmentRepository.GetCurrentAssignmentAsync(request.RequestId, type);
            if (currentAssignment != null)
            {
                currentAssignment.IsCurrent = false;
                currentAssignment.EndedAt = DateTime.UtcNow;
            }

            var newAssignment = _mapper.Map<RequestAssignment>(request);
            newAssignment.AssignedByUserId = assignedByUserId;
            newAssignment.AssignedAt = DateTime.UtcNow;
            newAssignment.IsCurrent = true;

            await _assignmentRepository.AddAsync(newAssignment);

            switch (type)
            {
                case "COORDINATOR":
                    supportRequest.CurrentCoordinatorId = request.AssignedToUserId;
                    break;
                case "IT_GROUP":
                    supportRequest.CurrentITGroupId = request.AssignedToGroupId;
                    break;
                case "IT_STAFF":
                    supportRequest.CurrentAssigneeId = request.AssignedToUserId;
                    if (request.ExpectedCompletionAt.HasValue)
                    {
                        supportRequest.ExpectedCompletionAt = request.ExpectedCompletionAt;
                    }
                    break;
            }
            supportRequest.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Phân công thành công: RequestId={RequestId}, Type={Type}", request.RequestId, type);

            var created = await _context.RequestAssignments
                .Include(a => a.AssignedToUser)
                .Include(a => a.AssignedToGroup)
                .Include(a => a.AssignedByUser)
                .FirstOrDefaultAsync(a => a.Id == newAssignment.Id);

            return ApiResult<AssignmentResponse>.Success(_mapper.Map<AssignmentResponse>(created));
        }
    }
}