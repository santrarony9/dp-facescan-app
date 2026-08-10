const { NodeSSH } = require('node-ssh');
const path = require('path');
require('dotenv').config();
const ssh = new NodeSSH();

const config = {
  host: '160.187.68.243',
  username: 'root',
  password: '&hT0C10k!9tp',
  readyTimeout: 60000
};

const REMOTE_DIR = '/root/DPFaceScan/backend';

async function fixEverything() {
  try {
    console.log('=== CONNECTING ===');
    await ssh.connect(config);
    console.log('Connected.\n');

    // STEP 1: Sync backend code
    console.log('=== STEP 1: SYNCING CODE ===');
    await ssh.putDirectory(__dirname, REMOTE_DIR, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => {
        const base = path.basename(itemPath);
        return base !== 'node_modules' && base !== '.git' && !base.endsWith('.tar.gz') 
          && base !== 'db_check.js' && base !== 'clean_s3.js' && base !== 'diagnose_vps.js';
      }
    });
    console.log('Code synced.\n');

    // STEP 2: Install dependencies
    console.log('=== STEP 2: INSTALLING DEPS ===');
    await ssh.execCommand('npm install --production', { cwd: REMOTE_DIR });
    console.log('Dependencies installed.\n');

    // STEP 3: Fix the PORT - Nginx SSL config proxies to 5005, so backend MUST run on 5005
    console.log('=== STEP 3: FIXING PORT ===');
    await ssh.execCommand('sed -i "s/^PORT=.*/PORT=5005/" .env', { cwd: REMOTE_DIR });
    const portVerify = await ssh.execCommand('grep "^PORT=" .env', { cwd: REMOTE_DIR });
    console.log('Backend .env PORT set to:', portVerify.stdout.trim());

    // STEP 4: Also update Nginx conf.d to match port 5005 (in case both configs load)
    console.log('\n=== STEP 4: FIXING NGINX ===');
    await ssh.execCommand('sed -i "s/proxy_pass http:\\/\\/127.0.0.1:5000/proxy_pass http:\\/\\/127.0.0.1:5005/" /etc/nginx/conf.d/api.dreamlineproduction.com.conf');
    await ssh.execCommand('nginx -t && nginx -s reload');
    console.log('Nginx reloaded.\n');

    // STEP 5: Restart PM2 with correct port
    console.log('=== STEP 5: RESTARTING BACKEND ===');
    // Delete old magik-backend if it exists
    await ssh.execCommand('pm2 stop magik-backend 2>/dev/null || true');
    await ssh.execCommand('pm2 delete magik-backend 2>/dev/null || true');
    
    const restartResult = await ssh.execCommand('pm2 restart facescan-backend --update-env || pm2 start index.js --name "facescan-backend"', { cwd: REMOTE_DIR });
    console.log(restartResult.stdout);
    
    // Wait a moment for the server to start
    await new Promise(r => setTimeout(r, 3000));

    // STEP 6: Verify port
    console.log('\n=== STEP 6: VERIFYING ===');
    const portCheck = await ssh.execCommand('ss -tlnp | grep node');
    console.log('Node.js ports:', portCheck.stdout);

    // STEP 7: Check DB
    console.log('\n=== STEP 7: DATABASE CHECK ===');
    const dbResult = await ssh.execCommand(`cd ${REMOTE_DIR} && node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/dreamline').then(async () => {
  const db = mongoose.connection.db;
  const ec = await db.collection('events').countDocuments();
  const pc = await db.collection('photos').countDocuments();
  console.log('Events:', ec, 'Photos:', pc);
  if (pc > 0) {
    const s = await db.collection('photos').findOne();
    console.log('Sample photo eventId:', s.eventId, 'type:', typeof s.eventId);
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"`);
    console.log(dbResult.stdout);
    if (dbResult.stderr) console.log('DB errors:', dbResult.stderr);

    // Save PM2 state
    await ssh.execCommand('pm2 save');

    console.log('\n=== ALL FIXES APPLIED SUCCESSFULLY ===');
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
}

fixEverything();
