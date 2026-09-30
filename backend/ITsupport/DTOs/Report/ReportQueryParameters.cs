namespace ITsupport.DTOs.Report
{
    public class ReportQueryParameters
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        public int? DepartmentId { get; set; }
        public int? CategoryId { get; set; }
        public int? PriorityId { get; set; }
        public int? ITGroupId { get; set; }
        public string? StatusCode { get; set; }
    }
}
