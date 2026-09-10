namespace ITsupport.Models
{
    public class PagedResult<T>
    {
        public IReadOnlyList<T> Items { get; set; }
        public int TotalItems { get; set; }  
        public int TotalPages { get; set; }  
        public int PageNumber { get; set; }
        public int PageSize { get; set; }  
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;

    }
}
