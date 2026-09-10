using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Auth
{
    public class RegisterRequest
    {
        [Required]
        [StringLength(100, MinimumLength = 4)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(100, MinimumLength = 4)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Compare(nameof(Password), ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
