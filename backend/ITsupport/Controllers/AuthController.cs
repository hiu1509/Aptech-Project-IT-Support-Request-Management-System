using System.Security.Claims;

using ITsupport.DTOs.Auth;
using ITsupport.Models;
using ITsupport.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace ITsupport.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController :
        ControllerBase
    {
        private readonly
            IAuthService _authService;


        public AuthController(
            IAuthService authService
        )
        {
            _authService =
                authService;
        }


        // =========================================================
        // REGISTER
        //
        // POST /api/Auth/register
        // Public endpoint
        // =========================================================

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResult<AuthResponse>>>
            Register(
                [FromBody]
                RegisterRequest request
            )
        {
            var result =
                await _authService
                    .RegisterAsync(
                        request
                    );


            if (!result.IsSuccess)
            {
                return BadRequest(
                    result
                );
            }


            return Ok(
                result
            );
        }


        // =========================================================
        // LOGIN
        //
        // POST /api/Auth/login
        // Public endpoint
        // =========================================================

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResult<AuthResponse>>>
            Login(
                [FromBody]
                LoginRequest request
            )
        {
            var result =
                await _authService
                    .LoginAsync(
                        request
                    );


            if (!result.IsSuccess)
            {
                return BadRequest(
                    result
                );
            }


            return Ok(
                result
            );
        }


        // =========================================================
        // FORGOT PASSWORD
        //
        // POST /api/Auth/forgot-password
        // Public endpoint
        // =========================================================

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<
            ActionResult<
                ApiResult<ForgotPasswordResponse>
            >
        >
            ForgotPassword(
                [FromBody]
                ForgotPasswordRequest request
            )
        {
            var result =
                await _authService
                    .ForgotPasswordAsync(
                        request
                    );


            /*
                Service luôn trả thông báo chung đối với
                trường hợp email không tồn tại hoặc
                tài khoản không hoạt động.

                Mục đích:
                Không để lộ email nào tồn tại trong hệ thống.
            */

            if (!result.IsSuccess)
            {
                return BadRequest(
                    result
                );
            }


            return Ok(
                result
            );
        }


        // =========================================================
        // RESET PASSWORD
        //
        // POST /api/Auth/reset-password
        // Public endpoint
        // =========================================================

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<
            ActionResult<
                ApiResult<string>
            >
        >
            ResetPassword(
                [FromBody]
                ResetPasswordRequest request
            )
        {
            var result =
                await _authService
                    .ResetPasswordAsync(
                        request
                    );


            if (!result.IsSuccess)
            {
                return BadRequest(
                    result
                );
            }


            return Ok(
                result
            );
        }


        // =========================================================
        // CHANGE PASSWORD
        //
        // POST /api/Auth/change-password
        // Login required
        // =========================================================

        [HttpPost("change-password")]
        [Authorize]
        public async Task<
            ActionResult<
                ApiResult<string>
            >
        >
            ChangePassword(
                [FromBody]
                ChangePasswordRequest request
            )
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (
                !int.TryParse(
                    userIdValue,
                    out var userId
                )
            )
            {
                return Unauthorized(
                    ApiResult<string>
                        .Failure(
                            "INVALID_USER",
                            "Không xác định được người dùng đăng nhập"
                        )
                );
            }


            var result =
                await _authService
                    .ChangePasswordAsync(
                        userId,
                        request
                    );


            if (!result.IsSuccess)
            {
                return BadRequest(
                    result
                );
            }


            return Ok(
                result
            );
        }
    }
}