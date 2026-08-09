const { NodeSSH } = require('node-ssh');
const path = require('path');
require('dotenv').config();
const ssh = new NodeSSH();

// VPS credentials from environment variables — NEVER hardcode these
const config = {
  host: process.env.VPS_HOST,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD,
  readyTimeout: 60000 // 60s timeout for slow VPS handshakes
};

if (!config.host || !config.password) {
  console.error('❌ Missing VPS credentials. Set VPS_HOST and VPS_PASSWORD in your .env file.');
  process.exit(1);
}

const REMOTE_DIR = '/root/DPFaceScan/backend';

async function deploy() {
  try {
    console.log(`Connecting to Production VPS (${config.host})...`);
    await ssh.connect(config);
    console.log('Connected.');

    console.log('Syncing backend files (excluding node_modules)...');
    await ssh.putDirectory(__dirname, REMOTE_DIR, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => {
        const base = path.basename(itemPath);
        return base !== 'node_modules' && base !== '.git' && !base.endsWith('.tar.gz') && base !== 'db_check.js';
      }
    });
    console.log('Sync complete.');

    console.log('Installing production dependencies...');
    await ssh.execCommand('npm install --production', { cwd: REMOTE_DIR });
    
    console.log('Fixing Port Collision and PM2 Processes...');
    
    // Stop the old magik-backend which is hogging port 5000
    await ssh.execCommand('pm2 stop magik-backend || true');
    await ssh.execCommand('pm2 delete magik-backend || true');
    
    // Update the .env file to enforce Port 5000 for facescan-backend
    await ssh.execCommand('sed -i "s/^PORT=.*/PORT=5005/" .env', { cwd: REMOTE_DIR });

    console.log('Restarting PM2 processes...');
    const restartStatus = await ssh.execCommand('pm2 restart facescan-backend --update-env || pm2 start index.js --name "facescan-backend"', { cwd: REMOTE_DIR });
    console.log(restartStatus.stdout);

    console.log('Saving PM2 state...');
    await ssh.execCommand('pm2 save');

    console.log('DEPLOYMENT SUCCESSFUL!');
    process.exit(0);
  } catch (err) {
    console.error('Deployment Failed:', err);
    process.exit(1);
  }
}

deploy();
