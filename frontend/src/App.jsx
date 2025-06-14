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
    <div className="p-6 space-y-10 text-white font-mono bg-black min-h-screen">
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
  );
}
