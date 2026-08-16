const https = require('https');

const postData = JSON.stringify({
  from: '6285113661387',
  message: 'pesanan sudah selesai ya?'
});

const options = {
  hostname: 'digital-menu-kedai-nyamleng.vercel.app',
  port: 443,
  path: '/api/whatsapp/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('RESPONSE BODY:');
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});

req.write(postData);
req.end();
