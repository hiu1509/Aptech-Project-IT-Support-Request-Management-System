using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Auth
{
    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; }
            = string.Empty;
    }
}