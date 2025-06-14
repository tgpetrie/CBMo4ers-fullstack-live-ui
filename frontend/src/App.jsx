import React, { useEffect, useState } from "react";
import "../index.css";

const formatDecimal = val => {
  if (typeof val !== 'number' || isNaN(val)) return "0.00";
  
  const absVal = Math.abs(val);
  
  // For very small values (like SHIB), show up to 6 decimals but remove trailing zeros
  if (absVal < 0.01) {
    return parseFloat(val.toFixed(6)).toString();
  }
  // For values between 0.01 and 1, show up to 4 decimals but remove trailing zeros
  else if (absVal < 1) {
    return parseFloat(val.toFixed(4)).toString();
  }
  // For values >= 1, show 2 decimals
  else {
    return val.toFixed(2);
  }
};

const formatCurrency = val =>
  typeof val === 'number' && !isNaN(val)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: Math.abs(val) >= 1 ? 2 : 6
      }).format(val)
    : "$0.00";

const StatusBadge = ({ isConnected, lastUpdate }) => (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-4">
      <div
        className={`relative flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
          isConnected
            ? "bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/50 shadow-lg shadow-[#00CFFF]/40 animate-glow-pulse"
            : "bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/50 shadow-lg shadow-[#FF3B30]/40"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-[#00CFFF] animate-pulse" : "bg-[#FF3B30]"
          }`}
        ></div>
        <span>{isConnected ? "🚀 LIVE TRADING DATA" : "⚠️ OFFLINE"}</span>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg border border-white/10">
        <span className="text-sm text-white/60">Last Update:</span>
        <span className="text-sm font-mono text-white/90">
          {lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    </div>
    
    <div className="text-sm text-white/60 bg-black/30 px-4 py-2 rounded-lg border border-white/10">
      <span className="animate-gradient font-bold">CBMo4ers Dashboard</span>
    </div>
  </div>
);

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [bannerData, setBannerData] = useState([]);
  const [top24h, setTop24h] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5001/data");
        const data = await res.json();
        setGainers(Array.isArray(data.gainers) ? data.gainers : []);
        setLosers(Array.isArray(data.losers) ? data.losers : []);
        setBannerData(Array.isArray(data.banner) ? data.banner : []);
        setTop24h(Array.isArray(data.top24h) ? data.top24h : []);
        setIsConnected(true);
      } catch (err) {
        console.error("Fetch error:", err);
        setIsConnected(false);
      }
      setLastUpdate(new Date());
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getCoinbaseUrl = (product) => {
    // Convert product format (e.g., "BTC-USD") to Coinbase URL format
    const symbol = product.replace('-USD', '').toLowerCase();
    return `https://www.coinbase.com/price/${symbol}`;
  };

  const renderTable = (label, data, color) => (
    <div className="bhabit-container rounded-xl p-6 shadow-lg">
      <h2 className={`text-lg font-bold ${color} mb-4 flex items-center gap-2`}>
        <span className="animate-glow-pulse">💎</span>
        {label}
        <span className="text-xs bg-black/50 px-2 py-1 rounded-full text-white/60 border border-white/10">
          {data.length} items
        </span>
      </h2>
      {data.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-4"></div>
          <p>Loading market data...</p>
          <p className="text-sm mt-2">Analyzing price movements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.slice(0, 13).map((item, idx) => {
            const coinName = item.product || item.product_id || item.symbol || 'N/A';
            const percentChange = typeof item.percent_change === 'number' ? item.percent_change : 0;
            const value = `${formatDecimal(percentChange)}%`;
            const isPositive = percentChange >= 0;

            return (
              <a
                key={idx}
                href={getCoinbaseUrl(coinName)}
                target="_blank"
                rel="noopener noreferrer"
                className="bhabit-coin-item flex justify-between items-center px-4 py-3 rounded-lg cursor-pointer group relative overflow-hidden"
              >
                {/* Rank indicator */}
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-transparent via-white/20 to-transparent group-hover:via-[#FF5E00]/60 transition-all duration-300"></div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 font-mono w-6">#{idx + 1}</span>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    {coinName}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold transition-colors ${
                    isPositive ? 'text-[#00CFFF] group-hover:text-[#FF5E00]' : 'text-[#FF3B30] group-hover:text-[#FF3F7F]'
                  }`}>
                    {isPositive ? '+' : ''}{value}
                  </span>
                  <span className="text-xs text-white/40 group-hover:text-white/60">
                    {isPositive ? '📈' : '📉'}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-10 text-white font-mono bg-black min-h-screen relative overflow-hidden">
      {/* BHABIT Logo Background */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-96 h-96 bhabit-logo-bg bhabit-logo-glow">
          <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cyberpunk Rabbit - Based on your BHABIT logo */}
            <g>
              {/* Main rabbit body outline */}
              <path d="M180 140C180 140 200 100 240 110C280 100 300 140 300 140L320 160C340 180 360 220 350 270C340 320 300 360 256 370C212 360 172 320 162 270C152 220 172 180 192 160L180 140Z" 
                    fill="none" stroke="#9C3391" strokeWidth="3" strokeOpacity="0.15"/>
              
              {/* Large ears - distinctive BHABIT feature */}
              <path d="M200 140L180 70C175 50 190 30 210 35C230 40 240 70 235 110" 
                    fill="none" stroke="#FF3F7F" strokeWidth="4" strokeOpacity="0.12"/>
              <path d="M280 140L300 70C305 50 290 30 270 35C250 40 240 70 245 110" 
                    fill="none" stroke="#FF3F7F" strokeWidth="4" strokeOpacity="0.12"/>
              
              {/* Inner ear geometric lines */}
              <path d="M210 120L215 80L230 95L225 125" 
                    fill="none" stroke="#9C3391" strokeWidth="2" strokeOpacity="0.1"/>
              <path d="M270 120L265 80L250 95L255 125" 
                    fill="none" stroke="#9C3391" strokeWidth="2" strokeOpacity="0.1"/>
              
              {/* Glowing orange eyes - key BHABIT feature */}
              <circle cx="220" cy="190" r="8" fill="#FF5E00" fillOpacity="0.2"/>
              <circle cx="260" cy="190" r="8" fill="#FF5E00" fillOpacity="0.2"/>
              <circle cx="220" cy="190" r="4" fill="#FF5E00" fillOpacity="0.4"/>
              <circle cx="260" cy="190" r="4" fill="#FF5E00" fillOpacity="0.4"/>
              <circle cx="220" cy="190" r="2" fill="#FF5E00" fillOpacity="0.8"/>
              <circle cx="260" cy="190" r="2" fill="#FF5E00" fillOpacity="0.8"/>
              
              {/* Nose/muzzle area */}
              <ellipse cx="240" cy="220" rx="12" ry="8" fill="none" stroke="#FF3F7F" strokeWidth="2" strokeOpacity="0.1"/>
              
              {/* Cyberpunk tech lines across face/body */}
              <path d="M170 200L200 210L240 205L280 210L310 200" 
                    fill="none" stroke="#00CFFF" strokeWidth="2" strokeOpacity="0.08"/>
              <path d="M180 240L220 250L260 250L300 240" 
                    fill="none" stroke="#9C3391" strokeWidth="2" strokeOpacity="0.08"/>
              <path d="M190 280L230 290L250 285L290 280" 
                    fill="none" stroke="#FF3F7F" strokeWidth="1" strokeOpacity="0.06"/>
              
              {/* Geometric patterns on body */}
              <polygon points="200,300 220,320 200,340 180,320" 
                       fill="none" stroke="#FF3F7F" strokeWidth="1" strokeOpacity="0.06"/>
              <polygon points="280,300 260,320 280,340 300,320" 
                       fill="none" stroke="#FF3F7F" strokeWidth="1" strokeOpacity="0.06"/>
              
              {/* Additional cyberpunk details */}
              <circle cx="180" cy="170" r="3" fill="#00CFFF" fillOpacity="0.08"/>
              <circle cx="300" cy="170" r="3" fill="#00CFFF" fillOpacity="0.08"/>
              <line x1="180" y1="170" x2="190" y2="180" stroke="#00CFFF" strokeWidth="1" strokeOpacity="0.06"/>
              <line x1="300" y1="170" x2="290" y2="180" stroke="#00CFFF" strokeWidth="1" strokeOpacity="0.06"/>
              
              {/* Whiskers */}
              <line x1="190" y1="220" x2="160" y2="215" stroke="#E0E0E0" strokeWidth="1" strokeOpacity="0.05"/>
              <line x1="190" y1="230" x2="160" y2="235" stroke="#E0E0E0" strokeWidth="1" strokeOpacity="0.05"/>
              <line x1="290" y1="220" x2="320" y2="215" stroke="#E0E0E0" strokeWidth="1" strokeOpacity="0.05"/>
              <line x1="290" y1="230" x2="320" y2="235" stroke="#E0E0E0" strokeWidth="1" strokeOpacity="0.05"/>
              
              {/* Subtle body shading */}
              <ellipse cx="240" cy="280" rx="40" ry="60" fill="#9C3391" fillOpacity="0.03"/>
            </g>
          </svg>
        </div>
      </div>

      {/* Content layer */}
      <div className="relative z-10">
        <StatusBadge isConnected={isConnected} lastUpdate={lastUpdate} />
        
        {/* Enhanced Horizontal Scrolling Banner */}
        <div className="bhabit-banner relative overflow-hidden rounded-xl shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-[#9C3391]/10 via-[#00CFFF]/10 to-[#FF3F7F]/10 animate-pulse"></div>
          <div className="relative">
            <div className="flex items-center justify-between px-6 py-2 bg-black/30 border-b border-white/10">
              <span className="text-sm font-bold text-white/80 flex items-center gap-2">
                📊 <span className="animate-gradient">Live Market Movers</span>
              </span>
              <span className="text-xs text-white/60">Real-time • Updates every 30s</span>
            </div>
            <div className="flex animate-scroll space-x-6 py-4 px-6">
              {bannerData.concat(bannerData).map((item, idx) => (
                <a
                  key={idx}
                  href={getCoinbaseUrl(item.product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bhabit-banner-item flex-shrink-0 flex items-center space-x-3 px-5 py-3 rounded-full transition-all duration-300 cursor-pointer group"
                >
                  <span className="text-sm font-medium text-white/90 group-hover:text-white">
                    {item.product}
                  </span>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full transition-colors ${
                    item.percent_change >= 0 
                      ? 'text-[#00CFFF] bg-[#00CFFF]/20 group-hover:text-[#FF5E00]' 
                      : 'text-[#FF3B30] bg-[#FF3B30]/20 group-hover:text-[#FF3F7F]'
                  }`}>
                    {item.percent_change >= 0 ? '+' : ''}{formatDecimal(item.percent_change)}%
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {renderTable("🚀 Top BHABIT Price Gainers", gainers, "text-glow-cyan")}
          {renderTable("📉 Top BHABIT Price Losers", losers, "text-glow-red")}
          {renderTable("🔥 Volume Surge Leaders", bannerData, "text-glow-purple")}
          {renderTable("⭐ 24h Market Champions", top24h, "text-glow-orange")}
        </div>
      </div>
    </div>
  );
}
