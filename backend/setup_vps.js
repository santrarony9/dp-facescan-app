const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function runCommand(command, description) {
  console.log(`\n=== RUNNING: ${description} ===`);
  const result = await ssh.execCommand(command);
  console.log(result.stdout);
  if (result.stderr) console.log('STDERR:', result.stderr);
  if (result.code !== 0) throw new Error(`Command failed with code ${result.code}`);
}

async function setup() {
  try {
    console.log('Connecting to VPS...');
    await ssh.connect({
      host: '160.187.68.243',
      username: 'root',
      password: '&hT0C10k!9tp',
      readyTimeout: 20000
    });
    console.log('Connected!');

    await runCommand('dnf update -y || true', 'Update dnf');
    
    // Install EPEL & Redis
    await runCommand('dnf install -y epel-release || true', 'Install EPEL');
    await runCommand('dnf install -y redis || true', 'Install Redis');
    await runCommand('systemctl enable redis && systemctl start redis || true', 'Start Redis');
    
    // Install Node.js 20
    await runCommand('curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -', 'Add Node.js repo');
    await runCommand('dnf install -y nodejs gcc-c++ make || true', 'Install Node');
    
    // Install MongoDB 7.0
    const mongoRepo = `
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
`;
    await runCommand(`echo "${mongoRepo.replace(/\n/g, '\\n')}" > /etc/yum.repos.d/mongodb-org-7.0.repo`, 'Add Mongo Repo');
    await runCommand('dnf install -y mongodb-org || true', 'Install MongoDB');
    await runCommand('systemctl enable mongod && systemctl start mongod || true', 'Start MongoDB');
    
    // Nginx & PM2
    await runCommand('dnf install -y nginx || true', 'Install Nginx');
    await runCommand('npm install -g pm2', 'Install PM2');
    
    console.log('✅ VPS Setup Complete!');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
