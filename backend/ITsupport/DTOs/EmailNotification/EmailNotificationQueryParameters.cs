using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.EmailNotification
{
    public class EmailNotificationQueryParameters
    {
        public string? SendStatus { get; set; } 
        public string? EventCode { get; set; }
        public long? RequestId { get; set; }

        public string SortBy { get; set; } = "CreatedAt";
        public string SortDirection { get; set; } = "desc";

        [Range(1, int.MaxValue, ErrorMessage = "Trang bắt đầu tối thiểu từ 1")]
        public int Page { get; set; } = 1;

        [Range(1, 200, ErrorMessage = "Kích thước trang từ 1 đến 200")]
        public int PageSize { get; set; } = 10;
    }
}