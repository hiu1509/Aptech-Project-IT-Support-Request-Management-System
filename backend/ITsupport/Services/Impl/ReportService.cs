using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using ITsupport.Data;
using ITsupport.DTOs.Report;
using ITsupport.Entities;
using ITsupport.Models;

namespace ITsupport.Services.Impl
{
    public class ReportService : IReportService
    {
        private readonly ITsupportDbContext _context;

        public ReportService(ITsupportDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // LOAD DU LIEU THEO BO LOC (dung chung cho summary + excel)
        // =========================================================

        private async Task<List<SupportRequest>> LoadFilteredAsync(ReportQueryParameters parameters)
        {
            var query = _context.SupportRequests
                .Include(r => r.Status)
                .Include(r => r.Category)
                .Include(r => r.Priority)
                .Include(r => r.CurrentITGroup)
                .Include(r => r.Requester)
                .Include(r => r.CurrentAssignee)
                .AsNoTracking()
                .AsQueryable();

            if (parameters.FromDate.HasValue)
                query = query.Where(r => r.CreatedAt >= parameters.FromDate.Value);

            if (parameters.ToDate.HasValue)
                query = query.Where(r => r.CreatedAt <= parameters.ToDate.Value);

            if (parameters.DepartmentId.HasValue)
                query = query.Where(r => r.RequesterDepartmentId == parameters.DepartmentId.Value);

            if (parameters.CategoryId.HasValue)
                query = query.Where(r => r.CategoryId == parameters.CategoryId.Value);

            if (parameters.PriorityId.HasValue)
                query = query.Where(r => r.PriorityId == parameters.PriorityId.Value);

            if (parameters.ITGroupId.HasValue)
                query = query.Where(r => r.CurrentITGroupId == parameters.ITGroupId.Value);

            if (!string.IsNullOrWhiteSpace(parameters.StatusCode))
                query = query.Where(r => r.Status != null && r.Status.Code == parameters.StatusCode);

            return await query.ToListAsync();
        }

        // =========================================================
        // UC29 - BAO CAO TONG HOP
        // =========================================================

        public async Task<ApiResult<ReportSummaryResponse>> GetSummaryAsync(ReportQueryParameters parameters)
        {
            var requests = await LoadFilteredAsync(parameters);

            var departmentNames = await _context.Departments
                .AsNoTracking()
                .ToDictionaryAsync(d => d.Id, d => d.Name);

            var completed = requests.Where(r => r.CompletedAt.HasValue).ToList();

            double? avgResolutionHours = completed.Count > 0
                ? completed.Average(r => (r.CompletedAt!.Value - r.CreatedAt).TotalHours)
                : null;

            var ratedRequests = requests.Where(r => r.Rating.HasValue).ToList();
            double? avgRating = ratedRequests.Count > 0
                ? ratedRequests.Average(r => r.Rating!.Value)
                : null;

            var response = new ReportSummaryResponse
            {
                FromDate = parameters.FromDate,
                ToDate = parameters.ToDate,

                TotalRequests = requests.Count,
                TotalCompleted = completed.Count,
                TotalOpen = requests.Count(r => r.Status == null || !r.Status.IsClosed),
                TotalOverdue = requests.Count(r => r.IsOverdue),
                TotalRework = requests.Sum(r => r.ReworkCount),

                AvgResolutionHours = avgResolutionHours.HasValue ? Math.Round(avgResolutionHours.Value, 1) : null,
                AvgRating = avgRating.HasValue ? Math.Round(avgRating.Value, 2) : null,
                RatedCount = ratedRequests.Count,

                ByStatus = requests
                    .GroupBy(r => r.Status?.Code ?? "UNKNOWN")
                    .Select(g => new ReportCountItem
                    {
                        Key = g.Key,
                        Label = g.First().Status?.Name ?? g.Key,
                        Count = g.Count(),
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList(),

                ByCategory = requests
                    .GroupBy(r => r.CategoryId?.ToString() ?? "NONE")
                    .Select(g => new ReportCountItem
                    {
                        Key = g.Key,
                        Label = g.First().Category?.Name ?? "Chưa phân loại",
                        Count = g.Count(),
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList(),

                ByPriority = requests
                    .GroupBy(r => r.PriorityId.ToString())
                    .Select(g => new ReportCountItem
                    {
                        Key = g.Key,
                        Label = g.First().Priority?.Name ?? g.Key,
                        Count = g.Count(),
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList(),

                ByDepartment = requests
                    .GroupBy(r => r.RequesterDepartmentId?.ToString() ?? "NONE")
                    .Select(g => new ReportCountItem
                    {
                        Key = g.Key,
                        Label = g.First().RequesterDepartmentId.HasValue
                            && departmentNames.TryGetValue(g.First().RequesterDepartmentId!.Value, out var deptName)
                                ? deptName
                                : "Không rõ",
                        Count = g.Count(),
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList(),

                ByITGroup = requests
                    .GroupBy(r => r.CurrentITGroupId?.ToString() ?? "NONE")
                    .Select(g => new ReportCountItem
                    {
                        Key = g.Key,
                        Label = g.First().CurrentITGroup?.Name ?? "Chưa chuyển nhóm",
                        Count = g.Count(),
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList(),
            };

            return ApiResult<ReportSummaryResponse>.Success(response);
        }

        // =========================================================
        // UC29 - XUAT EXCEL
        // =========================================================

        public async Task<byte[]> ExportExcelAsync(ReportQueryParameters parameters)
        {
            var requests = await LoadFilteredAsync(parameters);

            var departmentNames = await _context.Departments
                .AsNoTracking()
                .ToDictionaryAsync(d => d.Id, d => d.Name);

            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Requests");

            var headers = new[]
            {
                "Mã yêu cầu", "Tiêu đề", "Người gửi", "Email", "Phòng/ban",
                "Loại yêu cầu", "Mức ưu tiên", "Trạng thái", "Nhóm IT hiện tại",
                "Người xử lý", "Ngày tạo", "Hạn xử lý", "Ngày hoàn thành",
                "Quá hạn?", "Số lần xử lý lại", "Đánh giá",
            };

            for (var i = 0; i < headers.Length; i++)
            {
                sheet.Cell(1, i + 1).Value = headers[i];
            }

            var headerRow = sheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#174A9C");
            headerRow.Style.Font.FontColor = XLColor.White;

            var row = 2;
            foreach (var r in requests.OrderByDescending(x => x.CreatedAt))
            {
                var deptName = r.RequesterDepartmentId.HasValue
                    && departmentNames.TryGetValue(r.RequesterDepartmentId.Value, out var dn)
                        ? dn
                        : "";

                sheet.Cell(row, 1).Value = r.RequestCode;
                sheet.Cell(row, 2).Value = r.Title;
                sheet.Cell(row, 3).Value = r.Requester?.FullName ?? "";
                sheet.Cell(row, 4).Value = r.Requester?.Email ?? "";
                sheet.Cell(row, 5).Value = deptName;
                sheet.Cell(row, 6).Value = r.Category?.Name ?? "";
                sheet.Cell(row, 7).Value = r.Priority?.Name ?? "";
                sheet.Cell(row, 8).Value = r.Status?.Name ?? "";
                sheet.Cell(row, 9).Value = r.CurrentITGroup?.Name ?? "";
                sheet.Cell(row, 10).Value = r.CurrentAssignee?.FullName ?? "";

                sheet.Cell(row, 11).Value = r.CreatedAt;
                sheet.Cell(row, 11).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";

                if (r.ExpectedCompletionAt.HasValue)
                {
                    sheet.Cell(row, 12).Value = r.ExpectedCompletionAt.Value;
                    sheet.Cell(row, 12).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
                }

                if (r.CompletedAt.HasValue)
                {
                    sheet.Cell(row, 13).Value = r.CompletedAt.Value;
                    sheet.Cell(row, 13).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
                }

                sheet.Cell(row, 14).Value = r.IsOverdue ? "Có" : "Không";
                sheet.Cell(row, 15).Value = r.ReworkCount;
                sheet.Cell(row, 16).Value = r.Rating.HasValue ? r.Rating.Value.ToString() : "";

                row++;
            }

            sheet.SheetView.FreezeRows(1);
            sheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
}
