using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.SupportRequest
{
    public class UserRejectCompletionRequest
    {
        [Required]
        [MaxLength(2000)]
        public string Reason { get; set; } = string.Empty;
    }
}