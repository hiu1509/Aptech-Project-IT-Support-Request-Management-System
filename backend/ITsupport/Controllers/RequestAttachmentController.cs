using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.RequestAttachment;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RequestAttachmentController : ControllerBase
    {
        private readonly IRequestAttachmentService _attachmentService;

        public RequestAttachmentController(IRequestAttachmentService attachmentService)
        {
            _attachmentService = attachmentService;
        }

        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetByRequestId(long requestId)
        {
            var result = await _attachmentService.GetByRequestIdAsync(requestId);
            return Ok(result);
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload([FromForm] UploadAttachmentRequest request)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _attachmentService.UploadAttachmentAsync(request, currentUserId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpGet("download/{id}")]
        public async Task<IActionResult> Download(long id)
        {
            var (stream, contentType, fileName) = await _attachmentService.DownloadAttachmentAsync(id);
            if (stream == null)
            {
                return NotFound(ApiResult<string>.Failure("FILE_NOT_FOUND", "Tệp tin không tồn tại"));
            }

            return File(stream, contentType, fileName);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isAdmin = User.IsInRole("Admin");

            var result = await _attachmentService.DeleteAttachmentAsync(id, currentUserId, isAdmin);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}