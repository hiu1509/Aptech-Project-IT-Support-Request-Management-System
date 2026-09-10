using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.Role
{
    public class RoleQueryParameters
    {
        public string? Keyword { get; set; }
        public string SortBy { get; set; } = "Name";
        public string SortDirection { get; set; } = "asc";

        [Range(1, int.MaxValue, ErrorMessage = "Trang bắt đầu tối thiểu từ 1")]
        public int Page { get; set; } = 1;

        [Range(1, 200, ErrorMessage = "Kích thước trang từ 1 đến 200")]
        public int PageSize { get; set; } = 10;
    }
}