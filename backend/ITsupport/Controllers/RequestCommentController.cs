using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.RequestComment;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RequestCommentController : ControllerBase
    {
        private readonly IRequestCommentService _commentService;

        public RequestCommentController(IRequestCommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetByRequestId(long requestId)
        {
            var result = await _commentService.GetByRequestIdAsync(requestId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCommentRequest request)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _commentService.AddCommentAsync(request, currentUserId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateCommentRequest request)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _commentService.UpdateCommentAsync(id, request, currentUserId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isAdmin = User.IsInRole("Admin");

            var result = await _commentService.DeleteCommentAsync(id, currentUserId, isAdmin);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}