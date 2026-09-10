using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.RequestHistory;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RequestHistoryController : ControllerBase
    {
        private readonly IRequestHistoryService _historyService;

        public RequestHistoryController(IRequestHistoryService historyService)
        {
            _historyService = historyService;
        }

        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetByRequestId(long requestId)
        {
            var result = await _historyService.GetByRequestIdAsync(requestId);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Leader,Coordinator,ITStaff")]
        public async Task<IActionResult> Create([FromBody] CreateHistoryRequest request)
        {
            int? currentUserId = null;
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var parsedId))
            {
                currentUserId = parsedId;
            }

            var result = await _historyService.LogHistoryAsync(request, currentUserId);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}