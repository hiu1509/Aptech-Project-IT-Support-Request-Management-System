namespace ITsupport.Services
{
    public interface IQrCodeService
    {
        /// <summary>Sinh anh QR dang PNG (byte[]) tu 1 chuoi noi dung (thuong la URL).</summary>
        byte[] GeneratePng(string content, int pixelsPerModule = 10);
    }
}
