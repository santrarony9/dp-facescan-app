const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
ssh.connect({host: '160.187.68.243', username: 'root', password: '&hT0C10k!9tp'}).then(async () => {
    const res = await ssh.execCommand('grep -rl "api.dreamlineproduction.com" /etc/nginx/');
    console.log("Files containing domain:");
    console.log(res.stdout);
    
    // Delete any config that is NOT api.dreamlineproduction.com.conf
    const files = res.stdout.split('\n').filter(Boolean);
    for (const f of files) {
        if (f.includes('magik') || f.includes('sbd') || f.includes('default')) {
            console.log('Deleting conflicting file:', f);
            await ssh.execCommand(`rm -f ${f}`);
        }
    }
    
    // Now restart nginx
    await ssh.execCommand('systemctl restart nginx');
    console.log('Nginx restarted.');
    process.exit(0);
});
