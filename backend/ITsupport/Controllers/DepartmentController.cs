using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.Department;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResult<PagedResult<DepartmentResponse>>>> GetAll([FromQuery] DepartmentQueryParameters parameters)
        {
            var allowedSortFields = new[] { "name", "code" };
            var allowedSortDirections = new[] { "desc", "asc" };

            if (!allowedSortFields.Contains(parameters.SortBy.ToLowerInvariant()) ||
                !allowedSortDirections.Contains(parameters.SortDirection.ToLowerInvariant()))
            {
                return BadRequest(ApiResult<string>.Failure("BAD_SORT_DIRECTION", "Cột sắp xếp hoặc chiều sắp xếp không hợp lệ"));
            }

            var result = await _departmentService.GetAllAsync(parameters);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _departmentService.GetByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request)
        {
            var result = await _departmentService.CreateAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartmentRequest request)
        {
            var result = await _departmentService.UpdateAsync(id, request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _departmentService.DeleteAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }
    }
}