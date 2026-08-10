const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();
require('dotenv').config();

const config = {
  host: '160.187.68.243',
  username: 'root',
  password: '&hT0C10k!9tp',
  readyTimeout: 60000
};

const REMOTE_DIR = '/root/DPFaceScan/backend';

async function run() {
  try {
    console.log('=== STEP 1: CONNECTING ===');
    await ssh.connect(config);
    console.log('Connected to VPS.\n');

    // Step 2: Check Nginx config to find what port it proxies to
    console.log('=== STEP 2: NGINX CONFIG ===');
    const nginxSites = await ssh.execCommand('ls /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null');
    console.log('Nginx sites:', nginxSites.stdout);
    
    const nginxGrep = await ssh.execCommand('grep -r "api.dreamlineproduction" /etc/nginx/ 2>/dev/null');
    console.log('Nginx config for api.dreamlineproduction:', nginxGrep.stdout || 'NOT FOUND');
    
    // Try all possible config locations
    const configs = [
      '/etc/nginx/sites-enabled/default',
      '/etc/nginx/sites-enabled/api.dreamlineproduction.com',
      '/etc/nginx/sites-available/api.dreamlineproduction.com',
      '/etc/nginx/conf.d/api.dreamlineproduction.com.conf',
    ];
    
    for (const cfg of configs) {
      const result = await ssh.execCommand(`cat ${cfg} 2>/dev/null`);
      if (result.stdout && result.stdout.includes('proxy_pass')) {
        console.log(`\nFOUND CONFIG at ${cfg}:`);
        console.log(result.stdout);
      }
    }
    
    // Also search for any file containing proxy_pass
    const proxySearch = await ssh.execCommand('grep -rl "proxy_pass" /etc/nginx/ 2>/dev/null');
    console.log('\nFiles with proxy_pass:', proxySearch.stdout);
    
    for (const file of (proxySearch.stdout || '').trim().split('\n').filter(Boolean)) {
      const content = await ssh.execCommand(`cat ${file}`);
      console.log(`\n--- ${file} ---`);
      console.log(content.stdout);
    }

    // Step 3: Check what port facescan-backend is actually running on
    console.log('\n=== STEP 3: BACKEND PORT ===');
    const envContent = await ssh.execCommand(`cat ${REMOTE_DIR}/.env`);
    console.log('Backend .env:', envContent.stdout);
    
    const portCheck = await ssh.execCommand('ss -tlnp | grep node');
    console.log('\nNode.js listening ports:', portCheck.stdout);

    // Step 4: PM2 status
    console.log('\n=== STEP 4: PM2 STATUS ===');
    const pm2Status = await ssh.execCommand('pm2 jlist');
    const processes = JSON.parse(pm2Status.stdout || '[]');
    processes.forEach(p => {
      console.log(`  ${p.name} (id:${p.pm_id}) - status:${p.pm2_env.status} pid:${p.pid} port:${p.pm2_env.PORT || 'not set'}`);
    });

    // Step 5: Check DB
    console.log('\n=== STEP 5: DATABASE ===');
    const dbScript = `
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamline';
mongoose.connect(uri).then(async () => {
  console.log('Connected to:', uri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name).join(', '));
  const eventCount = await db.collection('events').countDocuments();
  const photoCount = await db.collection('photos').countDocuments();
  console.log('Events:', eventCount, 'Photos:', photoCount);
  if (photoCount > 0) {
    const sample = await db.collection('photos').findOne();
    console.log('Sample photo eventId:', sample.eventId, 'type:', typeof sample.eventId);
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
`;
    await ssh.execCommand(`cat > /tmp/db_check.js << 'DBEOF'\n${dbScript}\nDBEOF`);
    const dbResult = await ssh.execCommand(`cd ${REMOTE_DIR} && node /tmp/db_check.js`);
    console.log(dbResult.stdout);
    if (dbResult.stderr) console.log('DB stderr:', dbResult.stderr);

    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
}

run();
