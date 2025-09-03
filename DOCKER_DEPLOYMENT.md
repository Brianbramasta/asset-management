# Docker Deployment Guide

This guide explains how to deploy the ManajemenAset System using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Your Mailtrap API credentials

## Quick Start

### 1. Prepare Environment Variables

Copy the production environment template:
```bash
cp .env.production.example .env.production
```

Edit `.env.production` and update the following values:
- `NEXTAUTH_SECRET`: Generate a strong secret key
- `JWT_SECRET`: Generate a strong JWT secret key  
- `NEXTAUTH_URL`: Set to your domain (e.g., https://yourdomain.com)
- `MAILTRAP_API_TOKEN`: Your Mailtrap API token
- `MAILTRAP_FROM_EMAIL`: Your sender email address

### 2. Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up --build -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f asset-management
```

### 3. Access the Application

- Open your browser and navigate to: http://localhost:3000
- The application should be running without demo credentials

## Manual Docker Build

If you prefer to build manually:

```bash
# Build the Docker image
docker build -t asset-management .

# Run the container
docker run -d \
  --name asset-management \
  -p 3000:3000 \
  -e NEXTAUTH_SECRET=your-secret \
  -e JWT_SECRET=your-jwt-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e MAILTRAP_API_TOKEN=your-token \
  -e MAILTRAP_HOST=send.api.mailtrap.io \
  -e MAILTRAP_FROM_EMAIL=noreply@example.com \
  -e MAILTRAP_FROM_NAME="ManajemenAset System" \
  asset-management
```

## Production Deployment

For production deployment:

1. **Change all secrets**: Update `NEXTAUTH_SECRET` and `JWT_SECRET` with strong, unique values
2. **Update URLs**: Set `NEXTAUTH_URL` to your production domain
3. **Configure reverse proxy**: Use nginx or similar for SSL termination
4. **Database backup**: Ensure regular backups of your SQLite database
5. **Monitoring**: Set up health check monitoring on `/api/health`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `your-super-secret-key` |
| `JWT_SECRET` | JWT signing secret | `your-jwt-secret` |
| `NEXTAUTH_URL` | Application base URL | `https://yourdomain.com` |
| `DATABASE_URL` | Database connection string | `file:./prisma/dev.db` |
| `MAILTRAP_API_TOKEN` | Mailtrap API token | `your-api-token` |
| `MAILTRAP_HOST` | Mailtrap host | `send.api.mailtrap.io` |
| `MAILTRAP_FROM_EMAIL` | Sender email address | `noreply@example.com` |
| `MAILTRAP_FROM_NAME` | Sender name | `ManajemenAset System` |

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs asset-management`
- Verify environment variables are set correctly
- Ensure port 3000 is not already in use

### Database issues
- Ensure the SQLite database file exists
- Check file permissions in the container

### Email not working
- Verify Mailtrap credentials are correct
- Check the `/api/health` endpoint for system status
- Test email functionality through the settings page

## Health Check

The application includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "ManajemenAset System"
}
```

## Stopping the Application

```bash
# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```