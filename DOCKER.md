# 🐳 Docker Deployment Guide

This document explains how to deploy BHABITS CB INSIGHT using Docker containers.

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### One-Command Deployment
```bash
./docker-deploy.sh
```

This will:
- Build the multi-stage Docker image
- Start both frontend and backend containers
- Set up networking between services
- Provide health checks

### Manual Docker Commands

#### Build the Image
```bash
docker build -t bhabits-cb-insight .
```

#### Run with Docker Compose
```bash
# Production deployment
docker-compose up -d

# Development with hot reload
./docker-dev.sh
```

#### Run Single Container
```bash
docker run -d \
  --name bhabits-cb-insight \
  -p 3000:3000 \
  -p 5001:5001 \
  bhabits-cb-insight
```

## 📊 Service Architecture

### Container Structure
```
┌─────────────────────────────────────┐
│           Nginx (Optional)          │
│        Reverse Proxy :80            │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        BHABITS CB INSIGHT           │
│                                     │
│  ┌─────────────┐ ┌─────────────────┐│
│  │  Frontend   │ │    Backend      ││
│  │   :3000     │ │     :5001       ││
│  │   React     │ │     Flask       ││
│  │   Vite      │ │   + SocketIO    ││
│  └─────────────┘ └─────────────────┘│
└─────────────────────────────────────┘
```

### Port Mapping
- **3000**: Frontend React application
- **5001**: Backend Flask API + WebSockets
- **80**: Nginx reverse proxy (production profile)

## 🔧 Configuration Options

### Environment Variables
```bash
# Flask configuration
FLASK_ENV=production          # or development
FLASK_DEBUG=0                # Set to 1 for debug mode
PYTHONUNBUFFERED=1           # For proper logging

# Container configuration
WORKERS=4                    # Gunicorn workers (if using)
```

### Volume Mounts (Development)
```yaml
volumes:
  - ./backend:/app/backend      # Hot reload backend
  - ./frontend/src:/app/frontend/src  # Hot reload frontend
```

## 🏗️ Multi-Stage Build

The Dockerfile uses a multi-stage build:

1. **Frontend Builder** (`node:18-alpine`)
   - Installs npm dependencies
   - Builds React app with Vite
   - Outputs static files to `/dist`

2. **Production** (`python:3.9-slim`)
   - Installs Python dependencies
   - Copies backend code
   - Copies built frontend assets
   - Sets up both servers

## 📈 Scaling & Production

### With Nginx Reverse Proxy
```bash
# Start with nginx reverse proxy
docker-compose --profile production up -d
```

### Health Checks
```bash
# Check container health
docker-compose ps

# View health check logs
docker inspect bhabits-cb-insight | grep Health -A 10
```

### Resource Monitoring
```bash
# Monitor resource usage
docker stats bhabits-cb-insight

# View logs
docker-compose logs -f bhabits-cb-insight
```

## 🛠️ Development Workflow

### Hot Reload Development
```bash
# Start development environment
./docker-dev.sh

# This enables:
# - Volume mounts for live code changes
# - Debug mode for Flask
# - Source maps for React
```

### Debugging
```bash
# Access container shell
docker exec -it bhabits-cb-insight /bin/bash

# View backend logs
docker logs bhabits-cb-insight

# View specific service logs
docker-compose logs backend
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default Flask secret key
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Use environment secrets for API keys
- [ ] Enable container scanning

### SSL/HTTPS Setup
1. Add SSL certificates to `./ssl/` directory
2. Uncomment HTTPS configuration in `docker/nginx.conf`
3. Update port mappings in `docker-compose.yml`

## 📋 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs bhabits-cb-insight

# Rebuild image
docker-compose build --no-cache
```

**API not responding:**
```bash
# Test backend directly
curl http://localhost:5001/api/crypto

# Check backend health
docker exec bhabits-cb-insight curl http://localhost:5001/api/crypto
```

**Frontend not loading:**
```bash
# Test frontend directly
curl http://localhost:3000

# Check if static files are built
docker exec bhabits-cb-insight ls -la frontend/dist/
```

### Performance Tuning
```bash
# Increase container resources
docker run --memory=2g --cpus=2 bhabits-cb-insight

# Monitor performance
docker stats --no-stream bhabits-cb-insight
```

## 🚀 Deployment Options

### 1. Local Development
```bash
./docker-dev.sh
```

### 2. Local Production
```bash
./docker-deploy.sh
```

### 3. Cloud Deployment
```bash
# Build for cloud platform
docker build -t your-registry/bhabits-cb-insight .
docker push your-registry/bhabits-cb-insight

# Deploy to cloud
kubectl apply -f k8s/
# or
docker-compose -f docker-compose.prod.yml up -d
```

---

**Copyright 2025 GUISAN DESIGN - TOM PETRIE - BHABIT**
