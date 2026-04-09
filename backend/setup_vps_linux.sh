#!/bin/bash

# Linux VPS Setup Script for DP Face Scan App
# This script installs Node.js, MongoDB, Redis, and clones the repository.

# Update system
sudo apt-get update -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update -y
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod

# Install Redis
sudo apt-get install -y redis-server
sudo systemctl enable --now redis-server

# Install Git
sudo apt-get install -y git

# Setup App Directory
mkdir -p ~/DPFaceScan
cd ~/DPFaceScan

# Clone Repository
git clone https://github.com/santrarony9/dp-facescan-app.git .

# Create .env file for Backend
cat <<EOF > backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dp_facescan
JWT_SECRET=RonyFaceScan2024!
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_REGION=ap-south-2
AWS_S3_BUCKET=dreamlinepro
AZURE_FACE_KEY=YOUR_AZURE_KEY
AZURE_FACE_ENDPOINT=https://facescan-dp.cognitiveservices.azure.com/
VITE_API_URL=http://localhost:5000/api
EOF

# Install Backend Dependencies and Start with PM2
sudo npm install -g pm2
cd backend
npm install
pm2 start index.js --name "facescan-backend"
pm2 save

echo "------------------------------------------------"
echo "SETUP COMPLETE! Your backend is running on PM2."
echo "------------------------------------------------"
