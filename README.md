# CBMo4ers Cryptocurrency Dashboard

A real-time cryptocurrency dashboard featuring live market data from Coinbase with WebSocket updates.

## 🚀 Features

- **Real-time WebSocket Updates**: Live cryptocurrency data every 30 seconds
- **24h Top Movers Banner**: Scrolling banner showing the most volatile cryptocurrencies
- **Top Gainers/Losers**: Real-time tables of best and worst performing cryptos
- **Live Connection Status**: Visual indicator of WebSocket connection status
- **Coinbase Integration**: Direct links to Coinbase for each cryptocurrency
- **Modern UI**: Built with React, Tailwind CSS, and responsive design

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API calls

### Backend
- **Flask** - Python web framework
- **Flask-SocketIO** - WebSocket support for real-time updates
- **Flask-CORS** - Cross-origin resource sharing
- **Requests** - HTTP library for API calls to Coinbase

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Git

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

## 🚀 Running the Application

### Start Backend (Flask + WebSockets)
```bash
cd backend
source venv/bin/activate
python app.py
```
Backend will run on `http://localhost:5001`

### Start Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173` (or next available port)

## 🔧 Configuration

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5001
```

## 📡 API Endpoints

- `GET /top-gainers` - Top 10 cryptocurrency gainers (24h)
- `GET /top-losers` - Top 10 cryptocurrency losers (24h)  
- `GET /top-24h` - Top 5 most volatile cryptocurrencies
- `WebSocket /socket.io` - Real-time data updates

## 🌟 WebSocket Events

- `connect` - Client connects and receives initial data
- `crypto_update` - Real-time cryptocurrency data updates
- `disconnect` - Client disconnects

## 📊 Data Source

Live cryptocurrency data provided by **Coinbase Exchange API**:
- Real-time prices and 24h statistics
- No authentication required for public market data
- Rate limiting handled with smart caching

## 🎨 UI Features

- **Live Indicator**: Green pulsing dot when connected
- **Last Update Time**: Shows when data was last refreshed
- **Color-coded Changes**: Green for gains, red for losses
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Professional dark cryptocurrency exchange look

## 🚀 Recent Updates

**Latest Commit**: Running basic UI over REST WebSockets - Success!
- ✅ Implemented real-time WebSocket connections
- ✅ Added live 24h top movers banner
- ✅ Enhanced UI with connection status indicators
- ✅ Integrated Coinbase API for live market data
- ✅ Optimized performance with caching and background updates

## 📝 License

MIT License - Feel free to use and modify for your projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ✅ Features
- Coinbase live price updates
- Top 3min gainers & losers
- 24h top movers scrolling banner
- Tailwind styling + React
- Patched `esbuild` via `overrides`
- No force-mode npm installs

## 🔧 Setup

### Backend
```bash
./start_backend.sh
```

### Frontend
```bash
cd frontend
chmod +x start_frontend.sh
./start_frontend.sh
```

Then visit: http://localhost:5173
