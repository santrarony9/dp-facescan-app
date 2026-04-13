const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
  host: '160.187.68.243',
  username: 'root',
  password: 'Bm0y431YQKrf6iI'
};

async function main() {
  try {
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
