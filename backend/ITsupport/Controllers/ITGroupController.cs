using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.ITGroup;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ITGroupController : ControllerBase
    {
        private readonly IITGroupService _itGroupService;

        public ITGroupController(IITGroupService itGroupService)
        {
            _itGroupService = itGroupService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResult<PagedResult<ITGroupResponse>>>> GetAll([FromQuery] ITGroupQueryParameters parameters)
        {
            var allowedSortFields = new[] { "name", "code" };
            var allowedSortDirections = new[] { "desc", "asc" };

            if (!allowedSortFields.Contains(parameters.SortBy.ToLowerInvariant()) ||
                !allowedSortDirections.Contains(parameters.SortDirection.ToLowerInvariant()))
            {
                return BadRequest(ApiResult<string>.Failure("BAD_SORT_DIRECTION", "Cột hoặc chiều sắp xếp không hợp lệ"));
            }

            var result = await _itGroupService.GetAllAsync(parameters);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _itGroupService.GetByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateITGroupRequest request)
        {
            var result = await _itGroupService.CreateAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateITGroupRequest request)
        {
            var result = await _itGroupService.UpdateAsync(id, request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _itGroupService.DeleteAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }
    }
}