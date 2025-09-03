#!/bin/bash

# Asset Management System - VPS Deployment Script
# Run this script on your VPS after uploading the project files

set -e

echo "🚀 Starting Asset Management System Deployment..."

# Configuration
PROJECT_DIR="/var/www/asset-management"
NGINX_CONFIG="/etc/nginx/sites-available/asset-management"
NGINX_ENABLED="/etc/nginx/sites-enabled/asset-management"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Step 1: Setup project directory
print_status "Setting up project directory..."
cd $PROJECT_DIR

# Step 2: Install dependencies and build
print_status "Installing dependencies..."
npm install --production

print_status "Building application..."
npm run build

# Step 3: Setup database
print_status "Setting up database..."
npm run db:generate
npm run db:push

# Step 4: Setup PM2 logs directory
print_status "Creating PM2 logs directory..."
mkdir -p /var/log/pm2
chown -R $(whoami):$(whoami) /var/log/pm2

# Step 5: Setup Nginx
print_status "Configuring Nginx..."
cp nginx.conf $NGINX_CONFIG

# Remove default nginx site if exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    print_status "Removed default Nginx site"
fi

# Enable our site
ln -sf $NGINX_CONFIG $NGINX_ENABLED
print_status "Enabled Asset Management site"

# Test nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    print_status "Nginx configuration is valid"
    systemctl reload nginx
    print_status "Nginx reloaded"
else
    print_error "Nginx configuration has errors!"
    exit 1
fi

# Step 6: Setup firewall (if ufw is available)
if command -v ufw >/dev/null 2>&1; then
    print_status "Configuring firewall..."
    ufw allow 22/tcp  # SSH
    ufw allow 80/tcp  # HTTP
    ufw allow 443/tcp # HTTPS
    ufw --force enable
    print_status "Firewall configured"
fi

# Step 7: Start application with PM2
print_status "Starting application with PM2..."
cd $PROJECT_DIR

# Stop existing process if running
pm2 stop asset-management 2>/dev/null || true
pm2 delete asset-management 2>/dev/null || true

# Start with ecosystem config
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
print_status "PM2 configured for auto-startup"

# Step 8: Set proper permissions
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

print_status "Setting proper file permissions..."

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env.production file with correct values"
echo "2. Update nginx.conf with your domain name"
echo "3. Restart services: sudo systemctl restart nginx && pm2 restart asset-management"
echo ""
echo "📊 Useful commands:"
echo "• Check PM2 status: pm2 status"
echo "• View logs: pm2 logs asset-management"
echo "• Restart app: pm2 restart asset-management"
echo "• Check Nginx: sudo nginx -t && sudo systemctl status nginx"
echo ""
echo "🌐 Your application should be available at:"
echo "• http://your-domain.com (if domain configured)"
echo "• http://your-vps-ip (if using IP)"
echo ""