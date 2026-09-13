using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.SupportRequest;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SupportRequestController : ControllerBase
    {
        private readonly ISupportRequestService _service;

        public SupportRequestController(ISupportRequestService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResult<PagedResult<SupportRequestResponse>>>> GetAll(
    [FromQuery] SupportRequestQueryParameters parameters)
        {
            var allowedSortFields = new[]
            {
        "createdat",
        "title",
        "requestcode"
    };

            var allowedSortDirections = new[]
            {
        "desc",
        "asc"
    };

            if (
                !allowedSortFields.Contains(
                    parameters.SortBy.ToLowerInvariant()
                ) ||
                !allowedSortDirections.Contains(
                    parameters.SortDirection.ToLowerInvariant()
                )
            )
            {
                return BadRequest(
                    ApiResult<string>.Failure(
                        "BAD_SORT_DIRECTION"
                    )
                );
            }

            var result =
                await _service.GetAllAsync(parameters);

            return Ok(result);
        }

        [HttpGet("my")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetMyRequests(
    [FromQuery] SupportRequestQueryParameters parameters)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var userId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.GetMyRequestsAsync(
                    parameters,
                    userId
                );

            return Ok(result);
        }


        [HttpGet("coordinator")]
        [Authorize(Roles = "Coordinator")]
        public async Task<IActionResult> GetCoordinatorRequests(
            [FromQuery] SupportRequestQueryParameters parameters)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var userId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.GetCoordinatorRequestsAsync(
                    parameters,
                    userId
                );

            return Ok(result);
        }


        [HttpGet("assigned")]
        [Authorize(Roles = "ITStaff")]
        public async Task<IActionResult> GetAssignedRequests(
            [FromQuery] SupportRequestQueryParameters parameters)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var userId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.GetAssignedRequestsAsync(
                    parameters,
                    userId
                );

            return Ok(result);
        }


        [HttpGet("team")]
        [Authorize(Roles = "Leader")]
        public async Task<IActionResult> GetTeamRequests(
            [FromQuery] SupportRequestQueryParameters parameters)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var userId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.GetTeamRequestsAsync(
                    parameters,
                    userId
                );

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSupportRequest request)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out var requesterId))
            {
                return Unauthorized(
                    ApiResult<string>.Failure("INVALID_USER")
                );
            }

            var result = await _service.CreateAsync(
                request,
                requesterId
            );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/accept")]
        [Authorize(Roles = "Coordinator")]
        public async Task<IActionResult> Accept(long id)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var coordinatorUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.AcceptAsync(
                    id,
                    coordinatorUserId
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/request-info")]
        [Authorize(Roles = "Coordinator")]
        public async Task<IActionResult> RequestMoreInfo(
            long id,
            [FromBody] RequestMoreInfoRequest request
        )
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var coordinatorUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.RequestMoreInfoAsync(
                    id,
                    coordinatorUserId,
                    request
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/provide-info")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> ProvideMoreInfo(
            long id,
            [FromBody] ProvideMoreInfoRequest request
        )
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var requesterUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.ProvideMoreInfoAsync(
                    id,
                    requesterUserId,
                    request
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/classify")]
        [Authorize(Roles = "Coordinator")]
        public async Task<IActionResult> Classify(
            long id,
            [FromBody] ClassifySupportRequest request
        )
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var coordinatorUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.ClassifyAsync(
                    id,
                    coordinatorUserId,
                    request
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/accept-handling")]
        [Authorize(Roles = "ITStaff")]
        public async Task<IActionResult> AcceptHandling(long id)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var itStaffUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.AcceptHandlingAsync(
                    id,
                    itStaffUserId
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/start-rework")]
        [Authorize(Roles = "ITStaff")]
        public async Task<IActionResult> StartRework(long id)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var itStaffUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.StartReworkAsync(
                    id,
                    itStaffUserId
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/complete-handling")]
        [Authorize(Roles = "ITStaff")]
        public async Task<IActionResult> CompleteHandling(long id)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var itStaffUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.CompleteHandlingAsync(
                    id,
                    itStaffUserId
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/internal-review-pass")]
        [Authorize(Roles = "Coordinator")]
        public async Task<IActionResult> InternalReviewPass(long id)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var coordinatorUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.InternalReviewPassAsync(
                    id,
                    coordinatorUserId
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/internal-review-fail")]
        [Authorize(Roles = "Coordinator")]
        public async Task<IActionResult> InternalReviewFail(
    long id,
    [FromBody] InternalReviewFailRequest request
)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var coordinatorUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.InternalReviewFailAsync(
                    id,
                    coordinatorUserId,
                    request
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/confirm-completion")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> ConfirmCompletion(long id)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var requesterUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.ConfirmCompletionAsync(
                    id,
                    requesterUserId
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/reject-completion")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> RejectCompletion(
    long id,
    [FromBody] UserRejectCompletionRequest request
)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                userIdValue,
                out var requesterUserId
            ))
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "INVALID_USER"
                    )
                );
            }

            var result =
                await _service.RejectCompletionAsync(
                    id,
                    requesterUserId,
                    request
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateSupportRequest request)
        {
            var result = await _service.UpdateAsync(id, request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }
    }
}