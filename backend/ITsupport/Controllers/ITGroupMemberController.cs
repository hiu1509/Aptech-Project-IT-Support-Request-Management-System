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

        public ITGroupMemberController(IITGroupMemberService service)
        {
            _service = service;
        }

        [HttpGet("group/{itGroupId}")]
        public async Task<IActionResult> GetMembersByGroupId(int itGroupId)
        {
            var result = await _service.GetMembersByGroupIdAsync(itGroupId);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetGroupsByUserId(int userId)
        {
            var result = await _service.GetGroupsByUserIdAsync(userId);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult> AddMember([FromBody] AddITGroupMemberRequest request)
        {
            var result = await _service.AddMemberAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPut("{itGroupId}/{userId}")]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult> UpdateMember(int itGroupId, int userId, [FromBody] UpdateITGroupMemberRequest request)
        {
            var result = await _service.UpdateMemberAsync(itGroupId, userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("{itGroupId}/{userId}")]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult> RemoveMember(int itGroupId, int userId)
        {
            var result = await _service.RemoveMemberAsync(itGroupId, userId);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }
            return Ok(result);
        }
    }
}