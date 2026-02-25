const http = require('http');

async function runCaptainTest() {
    // 1. Auth Login (Faridabad Demo Captain)
    const authData = JSON.stringify({ phone: '9999999999' });
    const authOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/captain/auth',
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

    console.log('CAPTAIN AUTH STATUS:', authRes.status);
    const token = authRes.body.token;

    if (!token) {
        console.error('No token received!');
        console.log('Response body:', authRes.body);
        return;
    }

    // 2. Get Available Jobs
    const jobOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/captain/jobs/available',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const jobRes = await new Promise((resolve) => {
        const req = http.request(jobOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.end();
    });

    console.log('JOBS STATUS:', jobRes.status);
    console.log('JOBS COUNT:', jobRes.body.count);

    // 3. Toggle Online Status
    const statusData = JSON.stringify({ isOnline: false });
    const statusOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/captain/status',
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': statusData.length
        }
    };

    const statusRes = await new Promise((resolve) => {
        const req = http.request(statusOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.write(statusData);
        req.end();
    });

    console.log('STATUS UPDATE:', statusRes.body.success ? 'SUCCESS' : 'FAILED');
    console.log('NEW STATUS (isOnline):', statusRes.body.data.isOnline);
}

runCaptainTest().catch(console.error);
