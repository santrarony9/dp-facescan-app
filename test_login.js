const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('https://api.dreamlineproduction.com/api/auth/admin-login', { pin: '1234' });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('HTTP ERROR:', err.response.status, err.response.data);
    } else {
      console.log('NETWORK ERROR:', err.message);
    }
  }
}
testLogin();
