namespace ITsupport.DTOs.SupportRequest
{
    public class SupportRequestResponse
    {
        public long Id { get; set; }

        public string RequestCode { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;


        // =========================================================
        // REQUESTER
        // =========================================================

        public int RequesterId { get; set; }

        public string? RequesterName { get; set; }

        public string? RequesterEmail { get; set; }


        // =========================================================
        // CATEGORY
        // =========================================================

        public int? CategoryId { get; set; }

        public string? CategoryName { get; set; }


        // =========================================================
        // PRIORITY
        // =========================================================

        public int PriorityId { get; set; }

        public string? PriorityName { get; set; }


        // =========================================================
        // STATUS
        // =========================================================

        public int StatusId { get; set; }

        public string? StatusCode { get; set; }

        public string? StatusName { get; set; }


        // =========================================================
        // IT GROUP
        // =========================================================

        public int? CurrentITGroupId { get; set; }

        public string? CurrentITGroupName { get; set; }


        // =========================================================
        // ASSIGNEE
        // =========================================================

        public int? CurrentAssigneeId { get; set; }

        public string? CurrentAssigneeName { get; set; }


        // =========================================================
        // DATES
        // =========================================================

        public DateTime? DesiredDate { get; set; }

        public DateTime? ExpectedCompletionAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}