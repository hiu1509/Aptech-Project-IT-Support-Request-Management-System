using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.ITGroupMember;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ITGroupMemberController : ControllerBase
    {
        private readonly IITGroupMemberService _service;

        public ITGroupMemberController(
            IITGroupMemberService service)
        {
            _service = service;
        }


        private int? GetCurrentUserId()
        {
            var value =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (int.TryParse(value, out var userId))
            {
                return userId;
            }

            return null;
        }


        [HttpGet("group/{itGroupId}")]
        public async Task<IActionResult>
            GetMembersByGroupId(int itGroupId)
        {
            var result =
                await _service
                    .GetMembersByGroupIdAsync(
                        itGroupId
                    );

            return Ok(result);
        }


        [HttpGet("user/{userId}")]
        public async Task<IActionResult>
            GetGroupsByUserId(int userId)
        {
            var result =
                await _service
                    .GetGroupsByUserIdAsync(
                        userId
                    );

            return Ok(result);
        }


        [HttpPost]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult>
            AddMember(
                [FromBody]
                AddITGroupMemberRequest request)
        {
            var currentUserId =
                GetCurrentUserId();

            if (!currentUserId.HasValue)
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "UNAUTHORIZED",
                        "Không xác định được người dùng đăng nhập"
                    )
                );
            }

            var isAdmin =
                User.IsInRole("Admin");

            var result =
                await _service.AddMemberAsync(
                    request,
                    currentUserId.Value,
                    isAdmin
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }


        [HttpPut("{itGroupId}/{userId}")]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult>
            UpdateMember(
                int itGroupId,
                int userId,
                [FromBody]
                UpdateITGroupMemberRequest request)
        {
            var currentUserId =
                GetCurrentUserId();

            if (!currentUserId.HasValue)
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "UNAUTHORIZED",
                        "Không xác định được người dùng đăng nhập"
                    )
                );
            }

            var isAdmin =
                User.IsInRole("Admin");

            var result =
                await _service.UpdateMemberAsync(
                    itGroupId,
                    userId,
                    request,
                    currentUserId.Value,
                    isAdmin
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }


        [HttpDelete("{itGroupId}/{userId}")]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult>
            RemoveMember(
                int itGroupId,
                int userId)
        {
            var currentUserId =
                GetCurrentUserId();

            if (!currentUserId.HasValue)
            {
                return Unauthorized(
                    ApiResult<string>.Failure(
                        "UNAUTHORIZED",
                        "Không xác định được người dùng đăng nhập"
                    )
                );
            }

            var isAdmin =
                User.IsInRole("Admin");

            var result =
                await _service.RemoveMemberAsync(
                    itGroupId,
                    userId,
                    currentUserId.Value,
                    isAdmin
                );

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}