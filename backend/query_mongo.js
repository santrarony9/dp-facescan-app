const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
require('dotenv').config({path: '.env'});
ssh.connect({host: process.env.VPS_HOST, username: process.env.VPS_USER, password: process.env.VPS_PASSWORD}).then(async () => {
  const res = await ssh.execCommand('mongosh dreamline --eval "db.photos.countDocuments({eventId: ObjectId(\'6a76f1457e8ab5dcf2dbfc56\')})"');
  console.log(res.stdout);
  process.exit(0);
}).catch(console.error);
