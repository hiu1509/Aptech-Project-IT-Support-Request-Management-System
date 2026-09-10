namespace ITsupport.DTOs.Priority
{
    public class PriorityResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public byte Level { get; set; }
        public int? TargetResolutionHours { get; set; }
        public bool IsActive { get; set; }
    }
}