import qrcode from 'qrcode-generator';

export function generateQRDataUrl(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createDataURL(6, 0);
}
