using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.RequestHistory
{
    public class CreateHistoryRequest
    {
        [Required(ErrorMessage = "RequestId không được để trống")]
        public long RequestId { get; set; }

        [Required(ErrorMessage = "Mã hành động không được để trống")]
        [MaxLength(50)]
        public string ActionCode { get; set; } = string.Empty;

        public int? FromStatusId { get; set; }
        public int? ToStatusId { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }
    }
}