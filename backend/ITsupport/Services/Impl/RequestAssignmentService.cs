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


        // =========================================================
        // GET ASSIGNMENTS BY REQUEST
        // =========================================================

        public async Task<ApiResult<List<AssignmentResponse>>> GetByRequestIdAsync(
            long requestId)
        {
            var assignments =
                await _assignmentRepository
                    .GetAssignmentsByRequestIdAsync(requestId);


            return ApiResult<List<AssignmentResponse>>
                .Success(
                    _mapper.Map<List<AssignmentResponse>>(
                        assignments
                    )
                );
        }


        // =========================================================
        // ASSIGN
        // =========================================================

        public async Task<ApiResult<AssignmentResponse>> AssignAsync(
            CreateAssignmentRequest request,
            int assignedByUserId)
        {
            // -----------------------------------------------------
            // GET SUPPORT REQUEST
            // -----------------------------------------------------

            var supportRequest =
                await _context.SupportRequests
                    .FirstOrDefaultAsync(
                        r => r.Id == request.RequestId
                    );


            if (supportRequest is null)
            {
                return ApiResult<AssignmentResponse>.Failure(
                    "REQUEST_NOT_FOUND",
                    "Không tìm thấy yêu cầu hỗ trợ"
                );
            }


            var type =
                request.AssignmentType
                    .Trim()
                    .ToUpperInvariant();


            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

            if (
                type == "IT_GROUP" &&
                !request.AssignedToGroupId.HasValue
            )
            {
                return ApiResult<AssignmentResponse>.Failure(
                    "GROUP_REQUIRED",
                    "Cần chọn nhóm IT phụ trách"
                );
            }


            if (
                (
                    type == "COORDINATOR" ||
                    type == "IT_STAFF"
                ) &&
                !request.AssignedToUserId.HasValue
            )
            {
                return ApiResult<AssignmentResponse>.Failure(
                    "USER_REQUIRED",
                    "Cần chọn người được phân công"
                );
            }


            // -----------------------------------------------------
            // GET CURRENT STATUS
            // -----------------------------------------------------

            var currentStatus =
                await _context.RequestStatuses
                    .FirstOrDefaultAsync(
                        s => s.Id == supportRequest.StatusId
                    );


            if (currentStatus is null)
            {
                return ApiResult<AssignmentResponse>.Failure(
                    "CURRENT_STATUS_NOT_FOUND",
                    "Không tìm thấy trạng thái hiện tại của yêu cầu"
                );
            }


            // -----------------------------------------------------
            // PREPARE COORDINATOR STATUS TRANSITION
            //
            // NEW -> WAITING_COORDINATOR
            // -----------------------------------------------------

            RequestStatus? waitingCoordinatorStatus = null;


            if (
                type == "COORDINATOR" &&
                string.Equals(
                    currentStatus.Code,
                    "NEW",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                waitingCoordinatorStatus =
                    await _context.RequestStatuses
                        .FirstOrDefaultAsync(
                            s => s.Code ==
                                "WAITING_COORDINATOR"
                        );


                if (waitingCoordinatorStatus is null)
                {
                    return ApiResult<AssignmentResponse>.Failure(
                        "WAITING_COORDINATOR_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái WAITING_COORDINATOR"
                    );
                }
            }

            // -----------------------------------------------------
            // PREPARE IT GROUP STATUS TRANSITION
            //
            // CLASSIFIED -> WAITING_IT_ASSIGNMENT
            // -----------------------------------------------------

            RequestStatus? waitingITAssignmentStatus = null;

            if (type == "IT_GROUP")
            {
                if (!string.Equals(
                    currentStatus.Code,
                    "CLASSIFIED",
                    StringComparison.OrdinalIgnoreCase
                ))
                {
                    return ApiResult<AssignmentResponse>.Failure(
                        "INVALID_STATUS",
                        "Only classified requests can be transferred to an IT group."
                    );
                }

                waitingITAssignmentStatus =
                    await _context.RequestStatuses
                        .FirstOrDefaultAsync(
                            s => s.Code == "WAITING_IT_ASSIGNMENT"
                        );

                if (waitingITAssignmentStatus is null)
                {
                    return ApiResult<AssignmentResponse>.Failure(
                        "WAITING_IT_ASSIGNMENT_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái WAITING_IT_ASSIGNMENT"
                    );
                }

                var groupExists =
                    await _context.ITGroups
                        .AnyAsync(
                            g =>
                                g.Id == request.AssignedToGroupId &&
                                g.IsActive
                        );

                if (!groupExists)
                {
                    return ApiResult<AssignmentResponse>.Failure(
                        "IT_GROUP_NOT_FOUND",
                        "Nhóm IT không tồn tại hoặc đã ngừng hoạt động"
                    );
                }
            }

            // -----------------------------------------------------
            // PREPARE IT STAFF STATUS TRANSITION
            //
            // WAITING_IT_ASSIGNMENT -> ASSIGNED
            // -----------------------------------------------------

            RequestStatus? assignedStatus = null;

            if (type == "IT_STAFF")
            {
                if (!string.Equals(
                    currentStatus.Code,
                    "WAITING_IT_ASSIGNMENT",
                    StringComparison.OrdinalIgnoreCase
                ))
                {
                    return ApiResult<AssignmentResponse>.Failure(
                        "INVALID_STATUS",
                        "Only requests waiting for IT assignment can be assigned to IT staff."
                    );
                }

                if (!supportRequest.CurrentITGroupId.HasValue)
                {
                    return ApiResult<AssignmentResponse>.Failure(
                        "IT_GROUP_NOT_ASSIGNED",
                        "Yêu cầu chưa được chuyển đến nhóm IT"
                    );
                }

                var isLeaderOfCurrentGroup =
                await _context.ITGroupMembers
                    .AnyAsync(
                        m =>
                            m.ITGroupId ==
                                supportRequest.CurrentITGroupId.Value
                            &&
                            m.UserId ==
                                assignedByUserId
                            &&
                            m.IsActive
                            &&
                            m.MemberRole == "LEADER"
                    );

                            if (!isLeaderOfCurrentGroup)
                            {
                                return ApiResult<AssignmentResponse>.Failure(
                                    "NOT_IT_GROUP_LEADER",
                                    "Chỉ IT Team Lead của nhóm IT hiện tại mới được phân công IT Staff"
                                );
                            }

                var isValidITStaff =
                    await (
                        from member in _context.ITGroupMembers
                        join userRole in _context.UserRoles
                            on member.UserId equals userRole.UserId
                        join role in _context.Roles
                            on userRole.RoleId equals role.Id
                        where
                            member.ITGroupId ==
                                supportRequest.CurrentITGroupId.Value
                            &&
                            member.UserId ==
                                request.AssignedToUserId.Value
                            &&
                            member.IsActive
                            &&
                            role.Code == "ITStaff"
                        select member
                    ).AnyAsync();

                if (!isValidITStaff)
                {
                    return ApiResult<AssignmentResponse>.Failure(
                        "INVALID_IT_STAFF",
                        "Người được chọn phải là IT Staff đang hoạt động trong nhóm IT hiện tại của yêu cầu"
                    );
                }

                assignedStatus =
                    await _context.RequestStatuses
                        .FirstOrDefaultAsync(
                            s => s.Code == "ASSIGNED"
                        );

                if (assignedStatus is null)
                {
                    return ApiResult<AssignmentResponse>.Failure(
                        "ASSIGNED_STATUS_NOT_FOUND",
                        "Không tìm thấy trạng thái ASSIGNED"
                    );
                }
            }

            // -----------------------------------------------------
            // END CURRENT ASSIGNMENT OF SAME TYPE
            // -----------------------------------------------------

            var currentAssignment =
                await _assignmentRepository
                    .GetCurrentAssignmentAsync(
                        request.RequestId,
                        type
                    );


            if (currentAssignment != null)
            {
                currentAssignment.IsCurrent = false;

                currentAssignment.EndedAt =
                    DateTime.UtcNow;
            }


            // -----------------------------------------------------
            // CREATE NEW ASSIGNMENT
            // -----------------------------------------------------

            var newAssignment =
                _mapper.Map<RequestAssignment>(
                    request
                );


            newAssignment.AssignmentType =
                type;

            newAssignment.AssignedByUserId =
                assignedByUserId;

            newAssignment.AssignedAt =
                DateTime.UtcNow;

            newAssignment.IsCurrent =
                true;


            await _assignmentRepository
                .AddAsync(newAssignment);


            // -----------------------------------------------------
            // SAVE OLD STATUS FOR HISTORY
            // -----------------------------------------------------

            var oldStatusId =
                supportRequest.StatusId;


            var oldStatusCode =
                currentStatus.Code;


            // -----------------------------------------------------
            // UPDATE SUPPORT REQUEST
            // -----------------------------------------------------

            switch (type)
            {
                case "COORDINATOR":

                    supportRequest.CurrentCoordinatorId =
                        request.AssignedToUserId;


                    // Only initial assignment changes workflow status.
                    if (
                        waitingCoordinatorStatus != null
                    )
                    {
                        supportRequest.StatusId =
                            waitingCoordinatorStatus.Id;
                    }

                    break;


                case "IT_GROUP":

                    supportRequest.CurrentITGroupId =
                        request.AssignedToGroupId;

                    if (waitingITAssignmentStatus != null)
                    {
                        supportRequest.StatusId =
                            waitingITAssignmentStatus.Id;
                    }

                    break;


                case "IT_STAFF":

                    supportRequest.CurrentAssigneeId =
                        request.AssignedToUserId;

                    if (request.ExpectedCompletionAt.HasValue)
                    {
                        supportRequest.ExpectedCompletionAt =
                            request.ExpectedCompletionAt;
                    }

                    if (assignedStatus != null)
                    {
                        supportRequest.StatusId =
                            assignedStatus.Id;
                    }

                    break;
            }


            supportRequest.UpdatedAt =
                DateTime.UtcNow;


            // -----------------------------------------------------
            // CREATE HISTORY
            // -----------------------------------------------------

            var history =
                new RequestHistory
                {
                    RequestId =
                        supportRequest.Id,

                    PerformedByUserId =
                        assignedByUserId,

                    FromStatusId =
                        oldStatusId,

                    ToStatusId =
                        supportRequest.StatusId,

                    CreatedAt =
                        DateTime.UtcNow
                };


            switch (type)
            {
                case "COORDINATOR":

                    if (
                        waitingCoordinatorStatus != null
                    )
                    {
                        history.ActionCode =
                            "ASSIGN_COORDINATOR";

                        history.Description =
                            string.IsNullOrWhiteSpace(
                                request.Note
                            )
                                ? "Coordinator assigned. Request moved from NEW to WAITING_COORDINATOR."
                                : request.Note;
                    }
                    else
                    {
                        history.ActionCode =
                            "REASSIGN_COORDINATOR";

                        history.Description =
                            string.IsNullOrWhiteSpace(
                                request.Note
                            )
                                ? "Coordinator reassigned."
                                : request.Note;
                    }

                    break;


                case "IT_GROUP":

                    history.ActionCode =
                        "ASSIGN_IT_GROUP";

                    history.Description =
                        string.IsNullOrWhiteSpace(
                            request.Note
                        )
                            ? "Request assigned to IT group."
                            : request.Note;

                    break;


                case "IT_STAFF":

                    history.ActionCode =
                        "ASSIGN_IT_STAFF";

                    history.Description =
                        string.IsNullOrWhiteSpace(
                            request.Note
                        )
                            ? "Request assigned to IT staff."
                            : request.Note;

                    break;


                default:

                    history.ActionCode =
                        "ASSIGNMENT_UPDATED";

                    history.Description =
                        request.Note;

                    break;
            }


            _context.RequestHistories.Add(
                history
            );


            // -----------------------------------------------------
            // SAVE EVERYTHING
            // -----------------------------------------------------

            await _context.SaveChangesAsync();


            _logger.LogInformation(
                "Assignment successful: RequestId={RequestId}, Type={Type}, FromStatus={FromStatus}, ToStatusId={ToStatusId}",
                request.RequestId,
                type,
                oldStatusCode,
                supportRequest.StatusId
            );


            // -----------------------------------------------------
            // LOAD CREATED ASSIGNMENT
            // -----------------------------------------------------

            var created =
                await _context.RequestAssignments

                    .Include(
                        a => a.AssignedToUser
                    )

                    .Include(
                        a => a.AssignedToGroup
                    )

                    .Include(
                        a => a.AssignedByUser
                    )

                    .FirstOrDefaultAsync(
                        a => a.Id ==
                            newAssignment.Id
                    );


            return ApiResult<AssignmentResponse>
                .Success(
                    _mapper.Map<AssignmentResponse>(
                        created
                    )
                );
        }
    }
}