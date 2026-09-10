using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.RequestProgress;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RequestProgressController : ControllerBase
    {
        private readonly IRequestProgressService _progressService;

        public RequestProgressController(IRequestProgressService progressService)
        {
            _progressService = progressService;
        }

        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetByRequestId(long requestId)
        {
            var result = await _progressService.GetByRequestIdAsync(requestId);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Leader,Coordinator,ITStaff")]
        public async Task<IActionResult> AddProgress([FromBody] CreateProgressRequest request)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _progressService.AddProgressAsync(request, currentUserId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}