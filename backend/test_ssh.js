const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function testAuth(username, password) {
  try {
    await ssh.connect({
      host: '160.187.68.243',
      username: username,
      password: password,
      readyTimeout: 10000
    });
    console.log(`✅ SUCCESS! User: ${username}, Pass: ${password}`);
    process.exit(0);
  } catch (err) {
    console.log(`❌ Failed: User: ${username}, Pass: ${password}`);
  }
}

async function run() {
  const passwords = [
    '&hTOC10k!9tp',
    '&hT0C10k!9tp',
    '8hTOC10k!9tp',
    '8hT0C10k!9tp'
  ];
  const users = ['root', 'admin', 'ubuntu', '55801429.grabercloud.com'];

  for (const u of users) {
    for (const p of passwords) {
      await testAuth(u, p);
    }
  }
  console.log('All variations failed.');
  process.exit(1);
}

run();
