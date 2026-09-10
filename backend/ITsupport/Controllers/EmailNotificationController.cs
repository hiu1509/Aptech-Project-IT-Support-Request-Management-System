using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.EmailNotification;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class EmailNotificationController : ControllerBase
    {
        private readonly IEmailNotificationService _emailNotificationService;

        public EmailNotificationController(IEmailNotificationService emailNotificationService)
        {
            _emailNotificationService = emailNotificationService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResult<PagedResult<EmailNotificationResponse>>>> GetAll([FromQuery] EmailNotificationQueryParameters parameters)
        {
            var allowedSortFields = new[] { "createdat", "sentat", "eventcode" };
            var allowedSortDirections = new[] { "desc", "asc" };

            if (!allowedSortFields.Contains(parameters.SortBy.ToLowerInvariant()) ||
                !allowedSortDirections.Contains(parameters.SortDirection.ToLowerInvariant()))
            {
                return BadRequest(ApiResult<string>.Failure("BAD_SORT_DIRECTION", "Cột hoặc chiều sắp xếp không hợp lệ"));
            }

            var result = await _emailNotificationService.GetAllAsync(parameters);
            return Ok(result);
        }

        [HttpPost("queue")]
        public async Task<IActionResult> QueueEmail([FromBody] CreateEmailNotificationRequest request)
        {
            var result = await _emailNotificationService.QueueEmailAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("process-queue")]
        public async Task<IActionResult> ProcessQueue()
        {
            var result = await _emailNotificationService.ProcessPendingEmailsAsync();
            return Ok(result);
        }
    }
}