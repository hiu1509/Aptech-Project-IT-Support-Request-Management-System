using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.RequestStatus
{
    public class CreateRequestStatusRequest
    {
        [Required(ErrorMessage = "Mã trạng thái không được để trống")]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên trạng thái không được để trống")]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Thứ tự hiển thị không được để trống")]
        public int DisplayOrder { get; set; }

        public bool IsClosed { get; set; } = false;
    }
}