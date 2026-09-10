using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.SupportRequest
{
    public class CreateSupportRequest
    {
        [Required]
        [MaxLength(50)]
        public string RequestCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public int RequesterId { get; set; }
        public int? CategoryId { get; set; }
        public int PriorityId { get; set; }
        public int StatusId { get; set; }
        public DateTime? DesiredDate { get; set; }
    }
}