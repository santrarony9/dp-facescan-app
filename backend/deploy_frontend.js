const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

require('dotenv').config();

const config = {
  host: process.env.VPS_HOST,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
};

async function deploy() {
  try {
    console.log('Connecting...');
    await ssh.connect(config);
    console.log('Connected!');

    const localDist = path.join(__dirname, '..', 'frontend', 'dist');
    const remoteDist = '/var/www/dreamline/html'; // Assuming this is where Nginx serves it! Wait, let me check the exact path later!

    console.log('Uploading dist to /var/www/dreamline/dist...');
    await ssh.putDirectory(localDist, '/var/www/dreamline/dist', {
      recursive: true,
      concurrency: 10
    });
    
    // Copy the dist contents to html (or whatever the Nginx root is)
    // Actually, it's better to find the correct directory first.
    
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
deploy();
