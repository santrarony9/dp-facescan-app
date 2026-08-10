const axios = require('axios');
axios.post('https://api.dreamlineproduction.com/api/auth/admin-login', { pin: '0000' })
  .then(res => console.log('SUCCESS'))
  .catch(error => {
    console.log('error.response?.data?.message:', error.response?.data?.message);
    console.log('fallback:', error.response?.data?.message || 'Invalid PIN');
  });
