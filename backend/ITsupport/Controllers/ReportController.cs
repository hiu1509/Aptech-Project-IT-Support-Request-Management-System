using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITsupport.DTOs.Report;
using ITsupport.Services;

namespace ITsupport.Controllers
{
    // UC29 - Bao cao yeu cau: tong hop theo trang thai/loai/uu tien/phong ban/nhom IT,
    // va xuat Excel de tai ve. Chi Admin/Coordinator/Leader duoc xem (khop UC27/UC29).
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Coordinator,Leader")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] ReportQueryParameters parameters)
        {
            var result = await _reportService.GetSummaryAsync(parameters);
            return Ok(result);
        }

        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportExcel([FromQuery] ReportQueryParameters parameters)
        {
            var bytes = await _reportService.ExportExcelAsync(parameters);
            var fileName = $"bao-cao-yeu-cau-{DateTime.UtcNow:yyyyMMdd-HHmm}.xlsx";

            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }
    }
}
