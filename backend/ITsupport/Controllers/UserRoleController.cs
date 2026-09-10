using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.UserRole;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UserRoleController : ControllerBase
    {
        private readonly IUserRoleService _userRoleService;

        public UserRoleController(IUserRoleService userRoleService)
        {
            _userRoleService = userRoleService;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(int userId)
        {
            var result = await _userRoleService.GetRolesByUserIdAsync(userId);
            return Ok(result);
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignRole([FromBody] AssignUserRoleRequest request)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _userRoleService.AssignRoleAsync(request, currentUserId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpDelete("revoke")]
        public async Task<IActionResult> RevokeRole([FromQuery] int userId, [FromQuery] int roleId)
        {
            var result = await _userRoleService.RemoveRoleAsync(userId, roleId);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
    }
}