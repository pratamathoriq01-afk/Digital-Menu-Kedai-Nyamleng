// Test EMVCo QRIS Dynamic Generator
const staticQRIS = "00020101021126610014COM.GO-JEK.WWW01189360091439239121390210G9239121390303UMI51440014ID.CO.QRIS.WWW0215ID10265488213900303UMI5204581253033605802ID5924Kedai Nyamleng, BLIMBING6006MALANG61056512662070703A0163040BF6";

function crc16CCITT(str) {
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
  let hex = (crc & 0xFFFF).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

function generateDynamicQRIS(rawStaticQRIS, amount) {
  let qris = rawStaticQRIS.trim();
  
  // 1. Convert Tag 01 from static (010211) to dynamic (010212)
  qris = qris.replace("010211", "010212");
  
  // 2. Remove existing CRC (Tag 63) from the end
  const crcIndex = qris.lastIndexOf("6304");
  let baseQRIS = crcIndex !== -1 ? qris.substring(0, crcIndex) : qris;
  
  // 3. Construct Tag 54 (Transaction Amount)
  const amountStr = Math.round(amount).toString();
  const amountLen = amountStr.length.toString().padStart(2, '0');
  const tag54 = `54${amountLen}${amountStr}`;
  
  // 4. Inject Tag 54 before Tag 58 (Country code) if Tag 58 exists
  if (baseQRIS.includes("5802ID")) {
    baseQRIS = baseQRIS.replace("5802ID", `${tag54}5802ID`);
  } else {
    baseQRIS = baseQRIS + tag54;
  }
  
  // 5. Append Tag 63 header and calculate CRC16
  const qrisWithCrcHeader = baseQRIS + "6304";
  const checksum = crc16CCITT(qrisWithCrcHeader);
  
  return qrisWithCrcHeader + checksum;
}

const testAmount = 25000;
const dynamicResult = generateDynamicQRIS(staticQRIS, testAmount);
console.log("Original Static QRIS:", staticQRIS);
console.log("Dynamic QRIS (Nominal Rp 25.000):", dynamicResult);
