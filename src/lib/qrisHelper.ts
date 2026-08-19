/**
 * EMVCo QRIS Dynamic Payload Generator & Checksum Calculator
 * Kedai Nyamleng Digital POS Integration
 */

export function crc16CCITT(str: string): string {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const hex = (crc & 0xFFFF).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

/**
 * Mengubah QRIS Statis menjadi QRIS Dinamis dengan nominal transaksi otomatis
 * @param rawStaticQRIS String payload QRIS Statis dasar
 * @param amount Nominal tagihan (angka bulat tanpa desimal)
 */
export function generateDynamicQRIS(rawStaticQRIS: string, amount: number): string {
  if (!rawStaticQRIS) return '';
  let qris = rawStaticQRIS.trim();
  
  // 1. Ubah Tag 01 dari Statis (010211) menjadi Dinamis (010212)
  qris = qris.replace('010211', '010212');
  
  // 2. Hapus CRC lama (Tag 63) di bagian akhir jika ada
  const crcIndex = qris.lastIndexOf('6304');
  let baseQRIS = crcIndex !== -1 ? qris.substring(0, crcIndex) : qris;
  
  // 3. Susun Tag 54 (Transaction Amount)
  const amountStr = Math.round(amount).toString();
  const amountLen = amountStr.length.toString().padStart(2, '0');
  const tag54 = `54${amountLen}${amountStr}`;
  
  // 4. Sisipkan Tag 54 sebelum Tag 58 (Country code)
  if (baseQRIS.includes('5802ID')) {
    baseQRIS = baseQRIS.replace('5802ID', `${tag54}5802ID`);
  } else {
    baseQRIS = baseQRIS + tag54;
  }
  
  // 5. Tambahkan header Tag 63 dan hitung ulang Checksum CRC16
  const qrisWithCrcHeader = baseQRIS + '6304';
  const checksum = crc16CCITT(qrisWithCrcHeader);
  
  return qrisWithCrcHeader + checksum;
}
