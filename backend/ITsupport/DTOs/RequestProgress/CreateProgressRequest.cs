using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.RequestProgress
{
    public class CreateProgressRequest
    {
        [Required(ErrorMessage = "RequestId không được để trống")]
        public long RequestId { get; set; }
        [Required(ErrorMessage = "Nội dung tiến độ không được để trống")]
        public string ProgressContent { get; set; } = string.Empty;
        public string? ResultContent { get; set; }
    }
}