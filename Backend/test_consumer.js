const http = require('http');

async function runTest() {
    // 1. Auth to get token
    const authData = JSON.stringify({ phone: '1234567890' });
    const authOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/consumer/auth',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': authData.length
        }
    };

    const authRes = await new Promise((resolve) => {
        const req = http.request(authOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.write(authData);
        req.end();
    });

    console.log('AUTH STATUS:', authRes.status);
    const token = authRes.body.token;

    if (!token) {
        console.error('No token received!');
        return;
    }

    // 2. Get Me
    const meOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/consumer/me',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const meRes = await new Promise((resolve) => {
        const req = http.request(meOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.end();
    });

    console.log('ME STATUS:', meRes.status);
    console.log('ME DATA:', JSON.stringify(meRes.body, null, 2));

    // 3. Update Profile
    const updateData = JSON.stringify({ name: 'Aryan Pathak', email: 'aryan@example.com' });
    const updateOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/consumer/update-profile',
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': updateData.length
        }
    };

    const updateRes = await new Promise((resolve) => {
        const req = http.request(updateOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.write(updateData);
        req.end();
    });

    console.log('UPDATE STATUS:', updateRes.status);
    console.log('UPDATE DATA:', JSON.stringify(updateRes.body, null, 2));
}

runTest().catch(console.error);
