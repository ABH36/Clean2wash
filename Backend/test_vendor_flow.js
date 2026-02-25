const http = require('http');

const postData = (path, data, token = null) => {
    return new Promise((resolve) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.write(payload);
        req.end();
    });
};

const putData = (path, data, token = null) => {
    return new Promise((resolve) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.write(payload);
        req.end();
    });
};

const getData = (path, token = null) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method: 'GET',
            headers: {}
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.end();
    });
};

async function runFlow() {
    console.log('--- STARTING VENDOR COMPLETE FLOW TEST ---');

    // 1. Login
    const loginRes = await postData('/api/v1/vendor/login', {
        email: 'vendor@carwash.in',
        password: 'password123'
    });
    const token = loginRes.body.token;
    console.log('LOGIN:', loginRes.status === 200 ? 'SUCCESS' : 'FAILED');

    // 2. Subscription
    const subRes = await putData('/api/v1/vendor/subscription', { plan: 'gold' }, token);
    console.log('SUBSCRIPTION:', subRes.status === 200 ? 'SUCCESS' : 'FAILED');

    // 3. Add Accessory
    const accRes = await postData('/api/v1/vendor/accessories', {
        name: 'Super Shine Wax',
        price: 800,
        salePrice: 599,
        category: 'Accessories',
        stock: 50,
        description: 'Premium wax for cars'
    }, token);
    console.log('ADD ACCESSORY:', accRes.status === 201 ? 'SUCCESS' : 'FAILED');

    // 4. Get Active Bookings (Assuming seeder or previous test created some)
    const bookingsRes = await getData('/api/v1/vendor/bookings', token);
    console.log('RETRIVED BOOKINGS:', bookingsRes.body.count);

    if (bookingsRes.body.count > 0) {
        const bookingId = bookingsRes.body.data[0]._id;

        // 5. Accept Booking
        const handleRes = await putData(`/api/v1/vendor/bookings/${bookingId}/handle`, { action: 'accept' }, token);
        console.log('ACCEPT BOOKING:', handleRes.status === 200 ? 'SUCCESS' : 'FAILED');
        console.log('PICKUP OTP GENERATED:', handleRes.body.data.pickupOTP);

        // 6. Assign Pickup
        // We need a staff ID. Let's get staff first.
        const staffRes = await getData('/api/v1/vendor/staff', token);
        if (staffRes.body.count > 0) {
            const staffId = staffRes.body.data[0]._id;
            const assignRes = await putData(`/api/v1/vendor/bookings/${bookingId}/assign`, {
                staffId,
                taskType: 'pickup'
            }, token);
            console.log('ASSIGN PICKUP:', assignRes.status === 200 ? 'SUCCESS' : 'FAILED');

            // 7. Update Status to At Studio
            const statusRes = await putData(`/api/v1/vendor/bookings/${bookingId}/status`, {
                status: 'at-studio',
                photos: ['url1', 'url2']
            }, token);
            console.log('STATUS AT-STUDIO:', statusRes.status === 200 ? 'SUCCESS' : 'FAILED');

            // 8. Update Status to Wash Completed
            const washRes = await putData(`/api/v1/vendor/bookings/${bookingId}/status`, {
                status: 'wash-completed',
                photos: ['url3', 'url4']
            }, token);
            console.log('STATUS WASH-COMPLETED:', washRes.status === 200 ? 'SUCCESS' : 'FAILED');
        }
    }

    console.log('--- FLOW TEST COMPLETED ---');
}

runFlow().catch(console.error);
