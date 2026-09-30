namespace ITsupport.DTOs.Report
{
    public class ReportCountItem
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class ReportSummaryResponse
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        public int TotalRequests { get; set; }
        public int TotalCompleted { get; set; }
        public int TotalOpen { get; set; }
        public int TotalOverdue { get; set; }
        public int TotalRework { get; set; }

        public double? AvgResolutionHours { get; set; }
        public double? AvgRating { get; set; }
        public int RatedCount { get; set; }

        public List<ReportCountItem> ByStatus { get; set; } = new();
        public List<ReportCountItem> ByCategory { get; set; } = new();
        public List<ReportCountItem> ByPriority { get; set; } = new();
        public List<ReportCountItem> ByDepartment { get; set; } = new();
        public List<ReportCountItem> ByITGroup { get; set; } = new();
    }
}
