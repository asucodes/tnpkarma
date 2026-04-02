const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/approve',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        // Mock cookies won't work perfectly unless we know them, but we might just get a 403
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => { console.log('STATUS:', res.statusCode); console.log('BODY:', data); });
});

req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });

req.write(JSON.stringify({ rowIndex: 2, approverName: "Ashirvad" }));
req.end();
