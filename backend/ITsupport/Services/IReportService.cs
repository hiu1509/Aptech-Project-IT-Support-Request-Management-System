using ITsupport.DTOs.Report;
using ITsupport.Models;

namespace ITsupport.Services
{
    public interface IReportService
    {
        Task<ApiResult<ReportSummaryResponse>> GetSummaryAsync(ReportQueryParameters parameters);

        Task<byte[]> ExportExcelAsync(ReportQueryParameters parameters);
    }
}
