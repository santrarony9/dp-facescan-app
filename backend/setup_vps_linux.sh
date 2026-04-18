#!/bin/bash

# AlmaLinux 9 VPS Setup Script for DP Face Scan App
# This script installs Node.js, MongoDB, Redis, and clones the repository.

# 1. Update system
echo "Updating system..."
sudo dnf update -y

# 2. Install Node.js (v20)
echo "Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 3. Install MongoDB 7.0
echo "Configuring MongoDB repository..."
cat <<EOF | sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF

sudo dnf install -y mongodb-org
sudo systemctl enable --now mongod

# 4. Install Redis
echo "Installing Redis..."
sudo dnf install -y redis
sudo systemctl enable --now redis

# 5. Install Git
sudo dnf install -y git

# 6. Setup App Directory
mkdir -p ~/DPFaceScan
cd ~/DPFaceScan

# 7. Clone Repository (Placeholder - replace with actual repo if needed)
# git clone https://github.com/santrarony9/dp-facescan-app.git .

# 8. Create .env file for Backend
echo "Creating .env configuration..."
# Note: Use environment variables for secrets during deployment
cat <<EOF > backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dp_facescan
JWT_SECRET=$(openssl rand -base64 32)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=ap-south-2
AWS_S3_BUCKET=dreamlinepro
AZURE_FACE_KEY=""
AZURE_FACE_ENDPOINT=https://facescan-dp.cognitiveservices.azure.com/
EOF

# 9. Install Backend Dependencies and Start with PM2
sudo npm install -g pm2
cd backend
npm install
pm2 start index.js --name "facescan-backend"
pm2 save

echo "------------------------------------------------"
echo "SETUP COMPLETE! Your backend is running on PM2."
echo "Check logs with: pm2 logs facescan-backend"
echo "------------------------------------------------"
