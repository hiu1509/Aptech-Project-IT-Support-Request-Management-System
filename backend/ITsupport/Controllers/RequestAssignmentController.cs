using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.RequestAssignment;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RequestAssignmentController : ControllerBase
    {
        private readonly IRequestAssignmentService _assignmentService;

        public RequestAssignmentController(IRequestAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
        }

        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetByRequestId(long requestId)
        {
            var result = await _assignmentService.GetByRequestIdAsync(requestId);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Leader,Coordinator")]
        public async Task<IActionResult> Assign([FromBody] CreateAssignmentRequest request)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _assignmentService.AssignAsync(request, currentUserId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}