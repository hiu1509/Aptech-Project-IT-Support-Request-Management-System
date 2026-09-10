using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.SupportRequest;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SupportRequestController : ControllerBase
    {
        private readonly ISupportRequestService _service;

        public SupportRequestController(ISupportRequestService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResult<PagedResult<SupportRequestResponse>>>> GetAll([FromQuery] SupportRequestQueryParameters parameters)
        {
            var allowedSortFields = new[] { "createdat", "title", "requestcode" };
            var allowedSortDirections = new[] { "desc", "asc" };

            if (!allowedSortFields.Contains(parameters.SortBy.ToLowerInvariant()) ||
                !allowedSortDirections.Contains(parameters.SortDirection.ToLowerInvariant()))
            {
                return BadRequest(ApiResult<string>.Failure("BAD_SORT_DIRECTION"));
            }

            var result = await _service.GetAllAsync(parameters);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSupportRequest request)
        {
            var result = await _service.CreateAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateSupportRequest request)
        {
            var result = await _service.UpdateAsync(id, request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }
    }
}