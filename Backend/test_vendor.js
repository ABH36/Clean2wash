const http = require('http');

async function runVendorTest() {
    // 1. Vendor Login
    const loginData = JSON.stringify({ email: 'vendor@CarWash.in', password: 'vendor123' });
    const loginOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/vendor/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };

    const loginRes = await new Promise((resolve) => {
        const req = http.request(loginOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.write(loginData);
        req.end();
    });

    console.log('VENDOR LOGIN STATUS:', loginRes.status);
    const token = loginRes.body.token;

    if (!token) {
        console.error('No token received!');
        return;
    }

    // 2. Get Dashboard Stats
    const dashOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/vendor/dashboard',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const dashRes = await new Promise((resolve) => {
        const req = http.request(dashOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.end();
    });

    console.log('DASHBOARD STATUS:', dashRes.status);
    console.log('EARNINGS:', dashRes.body.data.earnings.total);

    // 3. Add Staff to Roster (Using Rahul Captain's phone)
    const staffData = JSON.stringify({ phone: '9999999999' });
    const staffOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/vendor/staff',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': staffData.length
        }
    };

    const staffRes = await new Promise((resolve) => {
        const req = http.request(staffOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.write(staffData);
        req.end();
    });

    console.log('ADD STAFF STATUS:', staffRes.status);
    if (staffRes.status === 200) {
        console.log('ADDED STAFF:', staffRes.body.data.name);
    } else {
        console.log('SERVER ERROR:', staffRes.body.error || staffRes.body);
    }

    // 4. Manage Service (Add)
    const serviceData = JSON.stringify({
        name: 'Ceramic Coating Gold',
        price: 4999,
        category: 'Protection',
        duration: '4 hours'
    });
    const serviceOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/vendor/services',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': serviceData.length
        }
    };

    const serviceRes = await new Promise((resolve) => {
        const req = http.request(serviceOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.write(serviceData);
        req.end();
    });

    console.log('ADD SERVICE STATUS:', serviceRes.status);
    if (serviceRes.status === 200) {
        console.log('ADDED SERVICE:', serviceRes.body.data[0].name);
    } else {
        console.log('SERVER ERROR:', serviceRes.body.error || serviceRes.body);
    }

    // 5. Get Bookings
    const bOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/vendor/bookings',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const bRes = await new Promise((resolve) => {
        const req = http.request(bOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.end();
    });

    console.log('GET BOOKINGS STATUS:', bRes.status);
    console.log('BOOKINGS COUNT:', bRes.body.count);
}

runVendorTest().catch(console.error);
