const { NodeSSH } = require('node-ssh');
require('dotenv').config();
const ssh = new NodeSSH();

async function getLogs() {
  await ssh.connect({
    host: process.env.VPS_HOST,
    username: process.env.VPS_USER,
    password: process.env.VPS_PASSWORD
  });
  
  const result = await ssh.execCommand('pm2 logs facescan-backend --lines 100 --nostream');
  console.log(result.stdout);
  console.log(result.stderr);
  process.exit(0);
}
getLogs();
