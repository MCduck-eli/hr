const http = require('http');

const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/feedback-360/my-pending-tasks',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
}, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});
req.end();
