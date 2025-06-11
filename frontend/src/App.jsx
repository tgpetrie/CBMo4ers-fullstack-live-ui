import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const formatDecimal = val => Math.abs(val) >= 1 ? val.toFixed(2) : val.toFixed(6);
const formatCurrency = val => new Intl.NumberFormat('en-US', { 
  style: 'currency', 
  currency: 'USD',
  minimumFractionDigits: Math.abs(val) >= 1 ? 2 : 6
}).format(val);

const StatusBadge = ({ isConnected, lastUpdate }) => (
  <div className="flex items-center gap-6">
    <div className="flex items-center gap-3">
      <div className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
        isConnected 
          ? 'bg-[#FF5E00]/20 text-[#FF5E00] border border-[#FF5E00]/50 shadow-lg shadow-[#FF5E00]/40' 
          : 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/50 shadow-lg shadow-[#FF3B30]/40'
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full ${
          isConnected ? 'bg-[#FF5E00] animate-pulse shadow-lg shadow-[#FF5E00]/60' : 'bg-[#FF3B30]'
        }`}></div>
        <span>📡</span>
        {isConnected ? 'LIVE' : 'OFFLINE'}
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-[#E0E0E0] tracking-wide">
        <span>🕐</span>
        UPDATED {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  </div>
);

const ContinuousScrollingBanner = ({ data }) => {
  return (
    <div className="overflow-hidden border shadow-2xl bg-gradient-to-r from-gray-950/95 via-black/90 to-gray-950/95 backdrop-blur-3xl rounded-3xl border-gray-800/60 shadow-black/80 hover:shadow-[#9C3391]/40 hover:shadow-2xl transition-all duration-500 relative group">
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 rounded-3xl pointer-events-none"></div>
      
      <div className="relative px-6 py-4 border-b bg-gradient-to-r from-gray-900/40 via-black/30 to-gray-900/40 border-gray-800/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔥</span>
          <h3 className="text-base font-bold tracking-wide text-gray-200/90 uppercase">
            Volume Surge Alert • Live Market Feed
          </h3>
        </div>
      </div>
      <div className="relative h-16 overflow-hidden backdrop-blur-2xl">
        <div className="absolute inset-0 flex items-center">
          <div className="flex animate-scroll whitespace-nowrap">
            {/* First set of data */}
            {data.map((coin, index) => (
              <div key={`first-${coin.symbol}`} className="flex-shrink-0 mx-8">
                <a 
                  href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} 
                  target="_blank"
                  className="flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#9C3391]/40 hover:drop-shadow-lg rounded-lg px-3 py-2 hover:bg-gray-900/40 backdrop-blur-xl"
                >
                  <div className="text-sm font-bold text-gray-300/90 tracking-wide">
                    {coin.symbol}
                  </div>
                  <div className="font-mono text-sm text-gray-100/95">
                    {formatCurrency(coin.current)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${
                    (coin.volume_change || 0) >= 0 ? 'text-[#00CFFF]' : 'text-[#FF5E00]'
                  }`}>
                    <span>{(coin.volume_change || 0) >= 0 ? '🔥' : '❄️'}</span>
                    Vol: {(coin.volume_change || 0) >= 0 ? '+' : ''}{formatDecimal(Math.abs(coin.volume_change || 0))}%
                  </div>
                  <div className={`text-xs ${
                    coin.gain >= 0 ? 'text-[#FF3F7F]' : 'text-[#FF3B30]'
                  }`}>
                    Price: {coin.gain >= 0 ? '+' : ''}{formatDecimal(coin.gain)}%
                  </div>
                </a>
              </div>
            ))}
            {/* Duplicate set for seamless scrolling */}
            {data.map((coin, index) => (
              <div key={`second-${coin.symbol}`} className="flex-shrink-0 mx-8">
                <a 
                  href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} 
                  target="_blank"
                  className="flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#9C3391]/40 hover:drop-shadow-lg rounded-lg px-3 py-2 hover:bg-gray-900/40 backdrop-blur-xl"
                >
                  <div className="text-sm font-bold text-gray-300/90 tracking-wide">
                    {coin.symbol}
                  </div>
                  <div className="font-mono text-sm text-gray-100/95">
                    {formatCurrency(coin.current)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${
                    (coin.volume_change || 0) >= 0 ? 'text-[#00CFFF]' : 'text-[#FF5E00]'
                  }`}>
                    <span>{(coin.volume_change || 0) >= 0 ? '🔥' : '❄️'}</span>
                    Vol: {(coin.volume_change || 0) >= 0 ? '+' : ''}{formatDecimal(Math.abs(coin.volume_change || 0))}%
                  </div>
                  <div className={`text-xs ${
                    coin.gain >= 0 ? 'text-[#FF3F7F]' : 'text-[#FF3B30]'
                  }`}>
                    Price: {coin.gain >= 0 ? '+' : ''}{formatDecimal(coin.gain)}%
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CryptoRow = ({ coin, index }) => (
  <tr className="transition-all duration-300 group hover:bg-gray-900/30 hover:shadow-lg hover:shadow-[#9C3391]/30 hover:drop-shadow-lg backdrop-blur-xl">
    <td className="py-5 pl-6 pr-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-black rounded-full shadow-lg bg-gradient-to-br from-gray-300 via-gray-200 to-gray-400 backdrop-blur-xl group-hover:shadow-[#9C3391]/40 transition-all duration-300">
          {index + 1}
        </div>
        <a 
          href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} 
          target="_blank"
          className="font-bold text-gray-300/90 transition-all duration-300 hover:text-[#00CFFF] hover:shadow-lg hover:shadow-[#9C3391]/30 hover:drop-shadow-lg group-hover:underline tracking-wide"
        >
          {coin.symbol}
        </a>
      </div>
    </td>
    <td className="px-4 py-5 text-right">
      <div className="font-mono text-base font-bold text-gray-200/95">
        {formatCurrency(coin.current)}
      </div>
    </td>
    <td className="py-5 pl-4 pr-6 text-right">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg backdrop-blur-xl border group-hover:shadow-[#9C3391]/40 hover:drop-shadow-lg ${
        coin.gain >= 0 
          ? 'bg-gray-900/40 text-[#FF3F7F] border-gray-700/50 shadow-[#FF3F7F]/15 hover:shadow-[#9C3391]/30 hover:bg-gray-800/50' 
          : 'bg-gray-900/40 text-[#FF3B30] border-gray-700/50 shadow-[#FF3B30]/15 hover:shadow-[#9C3391]/30 hover:bg-gray-800/50'
      }`}>
        <span>{coin.gain >= 0 ? '📈' : '📉'}</span>
        {formatDecimal(Math.abs(coin.gain))}%
      </div>
    </td>
  </tr>
);

const CryptoTable = ({ title, data, variant = "default" }) => (
  <div className="overflow-hidden border shadow-2xl bg-gradient-to-br from-gray-950/90 via-black/95 to-gray-950/90 backdrop-blur-3xl rounded-3xl border-gray-800/50 shadow-black/70 hover:shadow-[#9C3391]/50 hover:shadow-2xl transition-all duration-500 relative group">
    {/* Glossy overlay effect */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/3 via-transparent to-black/30 rounded-3xl pointer-events-none"></div>
    
    <div className={`relative px-6 py-5 border-b border-gray-800/40 backdrop-blur-xl ${
      variant === "gainers" ? "bg-gradient-to-r from-[#FF3F7F]/15 via-black/30 to-transparent" : 
      variant === "losers" ? "bg-gradient-to-r from-[#FF3B30]/15 via-black/30 to-transparent" : "bg-gradient-to-r from-gray-900/30 via-black/20 to-gray-900/30"
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {variant === "gainers" && '🚀'}
          {variant === "losers" && '📉'}
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-200/95 tracking-wide uppercase">{title}</h2>
          <p className="text-sm text-gray-400/80 mt-0.5 tracking-wide">3-MINUTE PERFORMANCE RANKINGS</p>
        </div>
      </div>
    </div>
    
    <div className="relative overflow-x-auto backdrop-blur-2xl">
      <table className="w-full">
        <thead className="bg-gray-950/60 backdrop-blur-xl">
          <tr>
            <th className="py-4 pl-6 pr-4 text-xs font-bold tracking-wider text-left text-gray-400/90 uppercase">
              Asset
            </th>
            <th className="px-4 py-4 text-xs font-bold tracking-wider text-right text-gray-400/90 uppercase">
              Price
            </th>
            <th className="py-4 pl-4 pr-6 text-xs font-bold tracking-wider text-right text-gray-400/90 uppercase">
              3min Change
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/30">
          {data.map((coin, index) => 
            <CryptoRow key={coin.symbol} coin={coin} index={index} />
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const TopMoversBar = ({ data }) => (
  <div className="overflow-hidden border shadow-2xl bg-gradient-to-r from-gray-950/95 via-black/90 to-gray-950/95 backdrop-blur-3xl rounded-3xl border-gray-800/60 shadow-black/80 hover:shadow-[#9C3391]/40 hover:shadow-2xl transition-all duration-500 relative group">
    {/* Glossy overlay effect */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 rounded-3xl pointer-events-none"></div>
    
    <div className="relative px-6 py-4 border-b bg-gradient-to-r from-gray-900/40 via-black/30 to-gray-900/40 border-gray-800/60 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="text-xl">🌐</span>
        <h3 className="text-base font-bold tracking-wide text-gray-200/90 uppercase">
          Most Active 3min
        </h3>
      </div>
    </div>
    <div className="relative p-6 backdrop-blur-2xl">
      <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
        {data.map((coin, index) => (
          <a 
            key={coin.symbol}
            href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} 
            target="_blank"
            className="flex-shrink-0 transition-all duration-300 group hover:scale-105 hover:-translate-y-1"
          >
            <div className={`px-5 py-4 rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-lg relative group-hover:shadow-[#9C3391]/40 hover:drop-shadow-lg ${
              coin.gain >= 0 
                ? 'bg-gray-900/40 border-gray-700/50 hover:bg-gray-800/50 shadow-[#FF3F7F]/15 hover:shadow-[#9C3391]/30' 
                : 'bg-gray-900/40 border-gray-700/50 hover:bg-gray-800/50 shadow-[#FF3B30]/15 hover:shadow-[#9C3391]/30'
            }`}>
              {/* Inner glossy effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 rounded-2xl pointer-events-none"></div>
              
              <div className="relative mb-2 text-xs font-bold tracking-wide text-gray-300/90">
                {coin.symbol}
              </div>
              <div className={`relative text-lg font-bold flex items-center gap-1 ${
                coin.gain >= 0 ? 'text-[#FF3F7F]' : 'text-[#FF3B30]'
              }`}>
                <span>{coin.gain >= 0 ? '📈' : '📉'}</span>
                {coin.gain >= 0 ? '+' : ''}{formatDecimal(coin.gain)}%
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  </div>
);

export default function App() {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [top24h, setTop24h] = useState([]);
  const [bannerData, setBannerData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = io(import.meta.env.VITE_API_URL);

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    socket.on('crypto_update', (data) => {
      console.log('Received crypto update:', data);
      setGainers(data.gainers || []);
      setLosers(data.losers || []);
      setTop24h(data.top24h || []);
      setBannerData(data.banner || []);
      setLastUpdate(new Date());
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b shadow-2xl bg-black/98 backdrop-blur-2xl border-gray-900/80 shadow-black/60">
        <div className="px-6 py-6 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-wide text-white animate-fade-in-up">
                CBMO4ERS
                <span className="ml-3 text-[#FF5E00] font-bold animate-glow-pulse" style={{
                  filter: 'drop-shadow(0 4px 8px rgba(156, 51, 145, 0.6)) drop-shadow(0 0 12px rgba(156, 51, 145, 0.4))'
                }}>
                  BHABITS CB INSIGHT
                </span>
              </h1>
              <p className="mt-2 text-sm font-medium text-[#E0E0E0] tracking-wide animate-fade-in-up">REAL-TIME CRYPTOCURRENCY MARKET DATA</p>
            </div>
            <StatusBadge isConnected={isConnected} lastUpdate={lastUpdate} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-10 mx-auto space-y-10 max-w-7xl">
        {/* Top Movers Section */}
        <section className="animate-fade-in-up">
          <TopMoversBar data={top24h} />
        </section>

        {/* Tables Grid */}
        <section className="grid gap-8 lg:grid-cols-2 animate-fade-in-up">
          <CryptoTable 
            title="Top Gainers" 
            data={gainers} 
            variant="gainers"
          />
          <CryptoTable 
            title="Top Losers" 
            data={losers} 
            variant="losers"
          />
        </section>

        {/* Scrolling Banner Section */}
        <section className="animate-fade-in-up">
          <ContinuousScrollingBanner data={bannerData} />
        </section>

        <footer className="py-12 mt-20 text-center border-t border-gray-800/50 backdrop-blur-xl">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-medium text-gray-400/90 tracking-wider uppercase">
              Copyright 2025 GUISAN DESIGN - TOM PETRIE - BHABIT
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
