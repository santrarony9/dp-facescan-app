const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
ssh.connect({host: '160.187.68.243', username: 'root', password: '&hT0C10k!9tp'}).then(async () => {
    await ssh.execCommand("sed -i 's/5000/5005/g' /etc/nginx/conf.d/dreamline.conf");
    await ssh.execCommand("systemctl reload nginx");
    console.log("Done fixing nginx!");
    process.exit(0);
});
