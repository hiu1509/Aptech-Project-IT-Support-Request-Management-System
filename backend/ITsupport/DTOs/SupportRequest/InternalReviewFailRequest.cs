using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.SupportRequest
{
    public class InternalReviewFailRequest
    {
        [Required(ErrorMessage = "Lý do yêu cầu xử lý lại không được để trống")]
        [MaxLength(2000)]
        public string Reason { get; set; } = string.Empty;
    }
}