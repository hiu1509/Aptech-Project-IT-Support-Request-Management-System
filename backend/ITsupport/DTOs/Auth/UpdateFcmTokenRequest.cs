using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Auth
{
    public class UpdateFcmTokenRequest
    {
        [Required]
        [MaxLength(500)]
        public string Token { get; set; } = string.Empty;
    }
}