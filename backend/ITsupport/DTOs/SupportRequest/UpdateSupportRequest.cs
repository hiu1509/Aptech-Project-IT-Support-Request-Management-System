using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.SupportRequest
{
    public class UpdateSupportRequest
    {
        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public int? CategoryId { get; set; }
        public int PriorityId { get; set; }
        public int StatusId { get; set; }
        public DateTime? DesiredDate { get; set; }
        public DateTime? ExpectedCompletionAt { get; set; }
    }
}