namespace ITsupport.DTOs.RequestCategory
{
    public class RequestCategoryResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int? ParentCategoryId { get; set; }
        public string? ParentCategoryName { get; set; }
        public int? DefaultITGroupId { get; set; }
        public string? DefaultITGroupName { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
}