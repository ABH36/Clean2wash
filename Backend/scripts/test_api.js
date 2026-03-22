const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env.local' });
require('dotenv').config();

const adminId = '69aaa83b2011ac682d96b72a'; // REAL ADMIN ID
const token = jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

async function test() {
    console.log("Testing Admin Users Endpoint for Captains...");
    try {
        const res = await fetch('http://localhost:5003/api/admin/users?role=captain', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response Body:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}
test();
