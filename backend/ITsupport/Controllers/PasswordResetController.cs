using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.PasswordReset;
using ITsupport.Models;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class PasswordResetController : ControllerBase
    {
        private readonly IPasswordResetService _passwordResetService;

        public PasswordResetController(IPasswordResetService passwordResetService)
        {
            _passwordResetService = passwordResetService;
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult<ApiResult<string>>> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var result = await _passwordResetService.GenerateResetTokenAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult<ApiResult<bool>>> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var result = await _passwordResetService.ResetPasswordAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}