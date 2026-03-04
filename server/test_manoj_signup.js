const http = require('http');

const data = JSON.stringify({
    name: 'MANOJ KUMAR S',
    email: 'manojkumar@gmail.com',
    password: 'password123',
    role: 'driver'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', (e) => console.error('ERROR:', e.message));
req.write(data);
req.end();
