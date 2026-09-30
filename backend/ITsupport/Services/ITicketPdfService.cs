namespace ITsupport.Services
{
    public interface ITicketPdfService
    {
        /// <summary>
        /// Tao phieu PDF tom tat 1 yeu cau ho tro, kem QR quet nhanh toi trang chi tiet.
        /// Tra ve null neu khong tim thay yeu cau.
        /// </summary>
        Task<byte[]?> GenerateTicketPdfAsync(long requestId);
    }
}
