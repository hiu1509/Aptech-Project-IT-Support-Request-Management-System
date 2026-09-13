using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.SupportRequest
{
    public class ProvideMoreInfoRequest
    {
        [Required]
        [MaxLength(2000)]
        public string Message { get; set; } = string.Empty;
    }
}