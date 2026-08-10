const jwt = require('jsonwebtoken');
const axios = require('axios');
const token = jwt.sign({ id: 'admin', role: 'admin' }, 'Dx7kQ9mW2pL8vR4nB6tY1sF3jH0cA5eZ9uG2wN7xK4bM8dP1rT6yV0qI3oE5lJ', { expiresIn: '1h' });

axios.get('https://api.dreamlineproduction.com/api/gallery/6a76ca3fe8970b3e5d4926e9', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => {
  console.log('Event:', r.data.event);
  console.log('Photo count:', r.data.photos.length);
  if (r.data.photos.length > 0) {
    console.log('Sample Photo URL:', r.data.photos[0].imageUrl);
  }
}).catch(e => console.error('Error:', e.response ? e.response.status : e.message));
