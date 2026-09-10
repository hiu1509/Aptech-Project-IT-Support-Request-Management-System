using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.User;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Leader")]
        public async Task<ActionResult<ApiResult<PagedResult<UserResponse>>>> GetAll([FromQuery] UserQueryParameters parameters)
        {
            var allowedSortFields = new[] { "fullname", "email", "employeecode", "createdat" };
            var allowedSortDirections = new[] { "desc", "asc" };

            if (!allowedSortFields.Contains(parameters.SortBy.ToLowerInvariant()) ||
                !allowedSortDirections.Contains(parameters.SortDirection.ToLowerInvariant()))
            {
                return BadRequest(ApiResult<string>.Failure("BAD_SORT_DIRECTION", "Cột hoặc chiều sắp xếp không hợp lệ"));
            }

            var result = await _userService.GetAllAsync(parameters);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _userService.GetByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            var result = await _userService.CreateAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
        {
            var result = await _userService.UpdateAsync(id, request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _userService.DeleteAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }
    }
}