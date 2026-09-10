using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.RequestCategory;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RequestCategoryController : ControllerBase
    {
        private readonly IRequestCategoryService _categoryService;

        public RequestCategoryController(IRequestCategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResult<PagedResult<RequestCategoryResponse>>>> GetAll([FromQuery] RequestCategoryQueryParameters parameters)
        {
            var allowedSortFields = new[] { "name", "code" };
            var allowedSortDirections = new[] { "desc", "asc" };

            if (!allowedSortFields.Contains(parameters.SortBy.ToLowerInvariant()) ||
                !allowedSortDirections.Contains(parameters.SortDirection.ToLowerInvariant()))
            {
                return BadRequest(ApiResult<string>.Failure("BAD_SORT_DIRECTION", "Cột hoặc chiều sắp xếp không hợp lệ"));
            }

            var result = await _categoryService.GetAllAsync(parameters);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _categoryService.GetByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult> Create([FromBody] CreateRequestCategoryRequest request)
        {
            var result = await _categoryService.CreateAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateRequestCategoryRequest request)
        {
            var result = await _categoryService.UpdateAsync(id, request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _categoryService.DeleteAsync(id);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}