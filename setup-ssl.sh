#!/bin/bash

# SSL Setup Script for Asset Management System
# This script sets up Let's Encrypt SSL certificates

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if domain is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <domain-name>"
    print_error "Example: $0 yourdomain.com"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@$DOMAIN"

print_status "Setting up SSL for domain: $DOMAIN"

# Install Certbot
print_status "Installing Certbot..."
sudo apt update
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symlink
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Stop nginx temporarily
print_status "Stopping Nginx temporarily..."
sudo systemctl stop nginx

# Get SSL certificate
print_status "Obtaining SSL certificate..."
sudo certbot certonly --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Update Nginx configuration for SSL
print_status "Updating Nginx configuration for SSL..."
sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/asset-management
sudo sed -i "s/#.*ssl_certificate/    ssl_certificate/g" /etc/nginx/sites-available/asset-management
sudo sed -i "s|/etc/ssl/certs/yourdomain.crt|/etc/letsencrypt/live/$DOMAIN/fullchain.pem|g" /etc/nginx/sites-available/asset-management
sudo sed -i "s|/etc/ssl/private/yourdomain.key|/etc/letsencrypt/live/$DOMAIN/privkey.pem|g" /etc/nginx/sites-available/asset-management

# Test nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Start nginx
print_status "Starting Nginx..."
sudo systemctl start nginx

# Setup auto-renewal
print_status "Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

print_status "SSL setup completed successfully!"
echo ""
echo "🔒 Your site is now secured with SSL!"
echo "📋 Certificate details:"
echo "• Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "• Private key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "• Auto-renewal: Configured via cron"
echo ""
echo "🌐 Your application is now available at:"
echo "• https://$DOMAIN"
echo "• https://www.$DOMAIN"