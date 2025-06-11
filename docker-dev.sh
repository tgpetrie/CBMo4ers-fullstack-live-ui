#!/bin/bash

# BHABITS CB INSIGHT - Development Docker Script
# For local development with hot reload

echo "🧠 BHABITS CB INSIGHT - Development Mode"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🔧 Starting development environment...${NC}"

# Create development override
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  bhabits-cb-insight:
    volumes:
      - ./backend:/app/backend
      - ./frontend/src:/app/frontend/src
    environment:
      - FLASK_ENV=development
      - FLASK_DEBUG=1
    command: >
      sh -c "
        echo '🔧 Starting development servers...' &&
        cd /app && python backend/app.py &
        cd /app && python serve_static.py
      "
EOF

echo -e "${PURPLE}🚀 Building and starting development containers...${NC}"

# Build and start with override
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build

echo -e "${GREEN}✅ Development environment started!${NC}"
echo -e "${BLUE}📊 Dashboard: ${GREEN}http://localhost:3000${NC}"
echo -e "${BLUE}🔧 API: ${GREEN}http://localhost:5001${NC}"
