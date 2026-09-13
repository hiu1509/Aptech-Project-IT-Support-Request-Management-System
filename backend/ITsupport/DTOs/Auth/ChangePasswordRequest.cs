using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Auth
{
    public class ChangePasswordRequest
    {
        [Required(
            ErrorMessage = "Mật khẩu hiện tại không được để trống"
        )]
        public string CurrentPassword { get; set; }
            = string.Empty;


        [Required(
            ErrorMessage = "Mật khẩu mới không được để trống"
        )]
        [MinLength(
            6,
            ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự"
        )]
        public string NewPassword { get; set; }
            = string.Empty;


        [Required(
            ErrorMessage = "Xác nhận mật khẩu không được để trống"
        )]
        [Compare(
            nameof(NewPassword),
            ErrorMessage = "Xác nhận mật khẩu mới không khớp"
        )]
        public string ConfirmNewPassword { get; set; }
            = string.Empty;
    }
}