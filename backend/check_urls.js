const { NodeSSH } = require('node-ssh');
require('dotenv').config();
const ssh = new NodeSSH();

const config = {
  host: '160.187.68.243',
  username: 'root',
  password: '&hT0C10k!9tp',
  readyTimeout: 60000
};

const REMOTE_DIR = '/root/DPFaceScan/backend';

async function check() {
  try {
    await ssh.connect(config);
    console.log('Connected.\n');

    // Check sample photo URLs
    const result = await ssh.execCommand(`cd ${REMOTE_DIR} && node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/dreamline').then(async () => {
  const db = mongoose.connection.db;
  const photos = await db.collection('photos').find().limit(3).toArray();
  photos.forEach((p, i) => {
    console.log('Photo', i+1, ':', JSON.stringify({
      _id: p._id,
      eventId: p.eventId,
      imageUrl: p.imageUrl,
      thumbnailUrl: p.thumbnailUrl,
      isProcessed: p.isProcessed
    }, null, 2));
  });
  const total = await db.collection('photos').countDocuments();
  console.log('Total photos:', total);
  
  // Check event cover
  const event = await db.collection('events').findOne();
  if (event) {
    console.log('Event:', JSON.stringify({
      _id: event._id,
      name: event.name,
      coverImage: event.coverImage
    }, null, 2));
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"`);
    console.log(result.stdout);
    if (result.stderr) console.log('Errors:', result.stderr);

    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
}

check();
