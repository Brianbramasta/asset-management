# 🚀 Hostinger VPS Deployment Guide

## Asset Management System

### 📋 Prerequisites

- Hostinger VPS (Ubuntu 20.04+ recommended)
- SSH access to VPS
- Domain name (optional)
- Basic Linux command knowledge

---

## 🔧 Step-by-Step Deployment

### 1. **Connect to Your VPS**

```bash
ssh root@your-vps-ip
# OR
ssh your-username@your-vps-ip
```

### 2. **Upload Project Files**

Choose one method:

**Method A: Using Git (Recommended)**

```bash
cd /var/www
git clone https://github.com/your-username/asset-management.git
```

**Method B: Using FTP/SFTP**

- Upload all project files to `/var/www/asset-management/`
- Use FileZilla, WinSCP, or similar tools

**Method C: Using scp from local machine**

```bash
scp -r "c:\Users\Brian\Desktop\all progress code\freelance\Mas Riyan\asset-management" root@your-vps-ip:/var/www/
```

### 3. **Run Deployment Script**

```bash
cd /var/www/asset-management
chmod +x deploy.sh
sudo ./deploy.sh
```

### 4. **Configure Environment Variables**

```bash
nano .env.production
```

**Required Changes:**

```env
# Change these values!
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-a-strong-secret-key-here
JWT_SECRET=generate-another-strong-secret-key-here

# Email settings
MAILTRAP_API_TOKEN=your-mailtrap-token
MAILTRAP_FROM_EMAIL=noreply@yourdomain.com
```

**Generate secure secrets:**

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

### 5. **Configure Domain (Optional)**

If using a domain name:

```bash
# Edit Nginx config
nano /etc/nginx/sites-available/asset-management

# Replace 'yourdomain.com' with your actual domain
# Then restart Nginx
systemctl restart nginx
```

### 6. **Setup SSL Certificate (Optional)**

```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh yourdomain.com
```

### 7. **Restart Services**

```bash
# Restart application
pm2 restart asset-management

# Restart Nginx
systemctl restart nginx

# Check status
pm2 status
systemctl status nginx
```

---

## 🌐 **Access Your Application**

- **With Domain + SSL**: https://yourdomain.com
- **With Domain (HTTP)**: http://yourdomain.com
- **With IP**: http://your-vps-ip

---

## 📊 **Management Commands**

### PM2 Process Management

```bash
pm2 status                    # Check app status
pm2 logs asset-management     # View logs
pm2 restart asset-management  # Restart app
pm2 stop asset-management     # Stop app
pm2 start asset-management    # Start app
pm2 monit                     # Monitor resources
```

### Nginx Management

```bash
sudo nginx -t                 # Test configuration
sudo systemctl restart nginx  # Restart Nginx
sudo systemctl status nginx   # Check status
sudo tail -f /var/log/nginx/asset-management.access.log  # View access logs
sudo tail -f /var/log/nginx/asset-management.error.log   # View error logs
```

### Database Management

```bash
cd /var/www/asset-management
npm run db:push     # Update schema
npm run seed        # Seed initial data
```

---

## 🔧 **Troubleshooting**

### **App Not Starting**

```bash
pm2 logs asset-management  # Check logs
pm2 restart asset-management
```

### **502 Bad Gateway**

```bash
# Check if app is running
pm2 status

# Check Nginx config
sudo nginx -t

# Restart both services
pm2 restart asset-management
sudo systemctl restart nginx
```

### **Database Issues**

```bash
cd /var/www/asset-management
npm run db:generate
npm run db:push
```

### **SSL Certificate Issues**

```bash
sudo certbot renew --dry-run  # Test renewal
sudo certbot certificates     # List certificates
```

---

## 🔒 **Security Considerations**

1. **Change default passwords**
2. **Setup firewall rules**
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Monitor logs regularly**
5. **Backup database**: `cp /var/www/asset-management/prisma/dev.db ~/backup-$(date +%Y%m%d).db`

---

## 📈 **Performance Optimization**

### Enable Gzip in Nginx

Add to nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;
```

### Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/asset-management
```

---

## 🔄 **Updates & Maintenance**

### Update Application

```bash
cd /var/www/asset-management
git pull                    # If using Git
npm install                 # Update dependencies
npm run build              # Rebuild
pm2 restart asset-management
```

### Backup Database

```bash
cp /var/www/asset-management/prisma/dev.db ~/backup-$(date +%Y%m%d).db
```

---

## 📞 **Support**

If you encounter issues:

1. Check logs: `pm2 logs asset-management`
2. Verify Nginx: `sudo nginx -t`
3. Check system resources: `htop` or `pm2 monit`
4. Review error logs in `/var/log/nginx/`

---

**🎉 Your Asset Management System is now deployed and ready to use!**
