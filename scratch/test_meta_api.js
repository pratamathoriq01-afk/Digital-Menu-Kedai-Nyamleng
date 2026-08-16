const https = require('https');

const token = "EAIVg03W6mvsBSAAkJznZAZBSkvU1ZCwnHfZBm0p6ZBFiXL5fFr47E3ZBqF7RbEs60Hy3X30ZBy4q304QcT6MZAbZC0v46pKtMaNo8p48h19ZAU6SZBRKok3n1yj0fxtOpSDomQSYISDxz7bzzv0wkiIsvXMbM00E3y5dZAXdNVMQsKC29ZCPigGoD219albKSK6tyjGJ4eAZDZD";
const phoneNumberId = "1287651777760923";

const payload = JSON.stringify({
  messaging_product: "whatsapp",
  to: "6285113661387",
  type: "template",
  template: {
    name: "hello_world",
    language: {
      code: "en_US"
    }
  }
});

const options = {
  hostname: 'graph.facebook.com',
  port: 443,
  path: `/v19.0/${phoneNumberId}/messages`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  console.log(`META API TEMPLATE STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('META API TEMPLATE RESPONSE:', data));
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
