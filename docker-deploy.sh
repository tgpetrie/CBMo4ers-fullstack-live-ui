#!/bin/bash

# BHABITS CB INSIGHT - Docker Deployment Script
# Copyright 2025 GUISAN DESIGN - TOM PETRIE - BHABIT

echo "🧠 BHABITS CB INSIGHT - Docker Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${BLUE}🐳 Building BHABITS CB INSIGHT containers...${NC}"

# Build the containers
docker-compose build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${PURPLE}🚀 Starting BHABITS CB INSIGHT...${NC}"

# Start the containers
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ BHABITS CB INSIGHT is now running!${NC}"
    echo ""
    echo -e "${BLUE}📊 Dashboard URL: ${GREEN}http://localhost:3000${NC}"
    echo -e "${BLUE}🔧 API Endpoint: ${GREEN}http://localhost:5001/api${NC}"
    echo -e "${BLUE}📡 Health Check: ${GREEN}http://localhost:5001/api/crypto${NC}"
    echo ""
    echo -e "${PURPLE}💜 Access your crypto insights at: ${GREEN}http://localhost:3000${NC}"
    echo ""
    echo "To view logs: ${BLUE}docker-compose logs -f${NC}"
    echo "To stop: ${BLUE}docker-compose down${NC}"
else
    echo -e "${RED}❌ Failed to start containers!${NC}"
    exit 1
fi
