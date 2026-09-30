using QRCoder;

namespace ITsupport.Services.Impl
{
    public class QrCodeService : IQrCodeService
    {
        public byte[] GeneratePng(string content, int pixelsPerModule = 10)
        {
            using var generator = new QRCodeGenerator();
            using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
            var pngQrCode = new PngByteQRCode(data);
            return pngQrCode.GetGraphic(pixelsPerModule);
        }
    }
}
