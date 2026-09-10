namespace ITsupport.DTOs.RequestStatus
{
    public class RequestStatusResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsClosed { get; set; }
    }
}