const { NodeSSH } = require('node-ssh');
require('dotenv').config();
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: process.env.VPS_HOST,
      username: process.env.VPS_USER,
      password: process.env.VPS_PASSWORD,
      readyTimeout: 60000
    });

    const result = await ssh.execCommand('pm2 logs facescan-backend --lines 50 --nostream');
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    
    // Also check pm2 status
    const status = await ssh.execCommand('pm2 status');
    console.log(status.stdout);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
