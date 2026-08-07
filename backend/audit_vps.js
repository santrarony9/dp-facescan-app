const { NodeSSH } = require('node-ssh');
require('dotenv').config();
const ssh = new NodeSSH();

// VPS credentials from environment variables — NEVER hardcode these
const config = {
  host: process.env.VPS_HOST,
  username: process.env.VPS_USER || 'root',
  password: process.env.VPS_PASSWORD
};

if (!config.host || !config.password) {
  console.error('❌ Missing VPS credentials. Set VPS_HOST and VPS_PASSWORD in your .env file.');
  process.exit(1);
}

async function main() {
  try {
    console.log(`Connecting to VPS (${config.host})...`);
    await ssh.connect(config);
    console.log('Connected to VPS!');

    console.log('--- Nginx Config Audit ---');
    const nginx = await ssh.execCommand('cat /etc/nginx/conf.d/api.dreamlineproduction.com.conf');
    console.log(nginx.stdout);

    console.log('--- SSL Certificate Audit ---');
    const cert = await ssh.execCommand('certbot certificates');
    console.log(cert.stdout);

    console.log('--- PM2 Status ---');
    const pm2 = await ssh.execCommand('pm2 status');
    console.log(pm2.stdout);

    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

main();
