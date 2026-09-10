using System.ComponentModel.DataAnnotations;

namespace ITsupport.DTOs.SupportRequest
{
    public class SupportRequestQueryParameters
    {
        public string? Keyword { get; set; }
        public string SortBy { get; set; } = "CreatedAt";
        public string SortDirection { get; set; } = "desc";

        [Range(1, int.MaxValue, ErrorMessage = "Please enter a page min: 1")]
        public int Page { get; set; } = 1;

        [Range(1, 200, ErrorMessage = "Please enter a page size min: 1, max: 200")]
        public int PageSize { get; set; } = 10;
    }
}