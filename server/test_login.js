const axios = require('axios');

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'universeboss333@gmail.com',
            password: 'universeboss6374'
        });
        console.log('Admin Login Test:', res.data.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log('Response:', res.data);
    } catch (err) {
        console.error('❌ Admin Login Test Failed:', err.response?.data?.message || err.message);
    }
}

testLogin();
