const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const config = {
  host: '160.187.68.243',
  username: 'root',
  password: '&hT0C10k!9tp',
  readyTimeout: 60000
};

const NGINX_CONF = `
server {
    listen 80;
    server_name api.dreamlineproduction.com;

    location / {
        proxy_pass http://127.0.0.1:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }
}
`;

async function setupNginx() {
  try {
    console.log('Connecting to VPS...');
    await ssh.connect(config);
    
    console.log('Writing Nginx config...');
    await ssh.execCommand(`echo "${NGINX_CONF.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" > /etc/nginx/conf.d/api.dreamlineproduction.com.conf`);
    
    console.log('Testing Nginx config...');
    const testResult = await ssh.execCommand('nginx -t');
    console.log(testResult.stderr);

    if (testResult.code === 0) {
      console.log('Reloading Nginx...');
      await ssh.execCommand('systemctl reload nginx');
      
      console.log('Attempting to install Certbot and get SSL certificate...');
      await ssh.execCommand('dnf install epel-release -y');
      await ssh.execCommand('dnf install certbot python3-certbot-nginx -y');
      const certResult = await ssh.execCommand('certbot --nginx -d api.dreamlineproduction.com --non-interactive --agree-tos -m admin@dreamlineproduction.com');
      console.log(certResult.stdout);
      console.log(certResult.stderr);
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setupNginx();
