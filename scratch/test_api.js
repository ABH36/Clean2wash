async function testApi() {
    const url = 'http://localhost:5002/api/consumer/vehicles/brands?type=4+Wheeler';
    console.log('Fetching:', url);
    try {
        const response = await fetch(url);
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testApi();
