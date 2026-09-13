using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Auth
{
    public class ResetPasswordRequest
    {
        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; }
            = string.Empty;


        [Required]
        public string ResetToken { get; set; }
            = string.Empty;


        [Required]
        [MinLength(
            6,
            ErrorMessage =
                "Mật khẩu mới phải có ít nhất 6 ký tự"
        )]
        public string NewPassword { get; set; }
            = string.Empty;


        [Required]
        [Compare(
            nameof(NewPassword),
            ErrorMessage =
                "Xác nhận mật khẩu mới không khớp"
        )]
        public string ConfirmNewPassword { get; set; }
            = string.Empty;
    }
}