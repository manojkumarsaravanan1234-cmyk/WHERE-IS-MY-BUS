const http = require('http');

http.get('http://localhost:5000/health', (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('HEALTH STATUS:', res.statusCode, body));
}).on('error', (e) => console.error('HEALTH ERROR:', e.message));
