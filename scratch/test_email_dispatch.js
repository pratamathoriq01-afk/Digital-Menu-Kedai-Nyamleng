const https = require('https');

const postData = JSON.stringify({
  orderId: 'KDN-TEST99',
  customerName: 'Pelanggan Kedai',
  customerEmail: 'kedainyamleng03@gmail.com',
  customerPhone: '085113661387',
  orderType: 'TAKEAWAY',
  items: [
    {
      menuItem: { id: 'm1', name: 'Nasi Goreng Nyamleng', price: 18000 },
      quantity: 2,
      unitPrice: 18000,
      itemSubtotal: 36000,
      selectedVariants: [],
      selectedAddOns: [],
    }
  ],
  subtotal: 36000,
  taxAmount: 3600,
  serviceFee: 0,
  discountAmount: 0,
  totalAmount: 39600,
  paymentMethod: 'QRIS',
  paymentStatus: 'PAID',
  orderStatus: 'PENDING',
  createdAt: new Date().toISOString(),
});

const options = {
  hostname: 'digital-menu-kedai-nyamleng.vercel.app',
  port: 443,
  path: '/api/email/send-receipt',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`EMAIL API STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('RESPONSE BODY:');
    console.log(data);
  });
});

req.on('error', e => console.error('REQUEST ERROR:', e));
req.write(postData);
req.end();
