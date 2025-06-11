# Multi-stage Docker build for BHABITS CB INSIGHT
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build the React app
RUN npm run build

# Stage 2: Python backend with frontend assets
FROM python:3.9-slim AS production

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend assets from the first stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create a simple static file server for frontend
COPY <<EOF ./serve_static.py
import os
from flask import Flask, send_from_directory, send_file

static_app = Flask(__name__)

@static_app.route('/', defaults={'path': ''})
@static_app.route('/<path:path>')
def serve_static(path):
    if path and os.path.exists(os.path.join('frontend/dist', path)):
        return send_from_directory('frontend/dist', path)
    return send_file('frontend/dist/index.html')

if __name__ == '__main__':
    static_app.run(host='0.0.0.0', port=3000)
EOF

# Expose ports
EXPOSE 5001 3000

# Environment variables
ENV FLASK_APP=backend/app.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/api/crypto || exit 1

# Start script
COPY <<EOF ./start.sh
#!/bin/bash
set -e

echo "🚀 Starting BHABITS CB INSIGHT..."

# Start backend in background
echo "📊 Starting Flask backend on port 5001..."
cd /app && python backend/app.py &
BACKEND_PID=$!

# Start frontend static server in background
echo "🎨 Starting frontend server on port 3000..."
python serve_static.py &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Wait for both processes
echo "✅ BHABITS CB INSIGHT is running!"
echo "📊 Backend API: http://localhost:5001"
echo "🎨 Frontend UI: http://localhost:3000"
echo "💜 Access the dashboard at: http://localhost:3000"

wait
EOF

RUN chmod +x start.sh

# Default command
CMD ["./start.sh"]
