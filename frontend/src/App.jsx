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
        {isConnected && (
          <span className="ml-1 text-xs text-[#00CFFF]">Public API</span>
        )}
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
    <div className="overflow-hidden border shadow-xl bg-black/95 backdrop-blur-xl rounded-2xl border-[#FF5E00]/30 shadow-[#FF5E00]/20 hover:shadow-[#FF5E00]/40 transition-all duration-300">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-[#FF5E00]/10 to-[#FF3F7F]/10 border-[#FF5E00]/30">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔥</span>
          <h3 className="text-base font-bold tracking-wide text-[#E0E0E0] uppercase">
            Volume Surge Alert • Live Market Feed
          </h3>
          <div className="px-2 py-1 text-xs font-bold text-[#00CFFF] bg-[#00CFFF]/20 border border-[#00CFFF]/30 rounded-full shadow-lg shadow-[#00CFFF]/20">
            No API Key Required
          </div>
        </div>
      </div>
      <div className="relative h-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <div className="flex animate-scroll whitespace-nowrap">
            {/* First set of data */}
            {data.map((coin, index) => (
              <div key={`first-${coin.symbol}`} className="flex-shrink-0 mx-8">
                <a 
                  href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} 
                  target="_blank"
                  className="flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#FF5E00]/30 rounded-lg px-2 py-1"
                >
                  <div className="text-sm font-bold text-[#E0E0E0] tracking-wide">
                    {coin.symbol}
                  </div>
                  <div className="font-mono text-sm text-white">
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
                  className="flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#FF5E00]/30 rounded-lg px-2 py-1"
                >
                  <div className="text-sm font-bold text-[#E0E0E0] tracking-wide">
                    {coin.symbol}
                  </div>
                  <div className="font-mono text-sm text-white">
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
  <tr className="transition-all duration-300 group hover:bg-[#FF5E00]/10 hover:shadow-lg hover:shadow-[#FF5E00]/20">
    <td className="py-5 pl-6 pr-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-black rounded-full shadow-lg bg-gradient-to-br from-[#FF5E00] to-[#FF3F7F]">
          {index + 1}
        </div>
        <a 
          href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} 
          target="_blank"
          className="font-bold text-[#00CFFF] transition-all duration-300 hover:text-[#FF3F7F] hover:shadow-lg hover:shadow-[#00CFFF]/30 group-hover:underline tracking-wide"
        >
          {coin.symbol}
        </a>
      </div>
    </td>
    <td className="px-4 py-5 text-right">
      <div className="font-mono text-base font-bold text-[#E0E0E0]">
        {formatCurrency(coin.current)}
      </div>
    </td>
    <td className="py-5 pl-4 pr-6 text-right">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 shadow-lg ${
        coin.gain >= 0 
          ? 'bg-[#FF3F7F]/20 text-[#FF3F7F] border border-[#FF3F7F]/40 shadow-[#FF3F7F]/20 hover:shadow-[#FF3F7F]/40' 
          : 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40 shadow-[#FF3B30]/20 hover:shadow-[#FF3B30]/40'
      }`}>
        <span>{coin.gain >= 0 ? '📈' : '📉'}</span>
        {formatDecimal(Math.abs(coin.gain))}%
      </div>
    </td>
  </tr>
);

const CryptoTable = ({ title, data, variant = "default" }) => (
  <div className="overflow-hidden border shadow-2xl bg-black/90 backdrop-blur-xl rounded-2xl border-[#FF5E00]/30 shadow-[#FF5E00]/20 hover:shadow-[#FF5E00]/40 transition-all duration-300">
    <div className={`px-6 py-5 border-b border-[#FF5E00]/20 ${
      variant === "gainers" ? "bg-gradient-to-r from-[#FF3F7F]/20 to-transparent" : 
      variant === "losers" ? "bg-gradient-to-r from-[#FF3B30]/20 to-transparent" : "bg-[#FF5E00]/10"
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {variant === "gainers" && '🚀'}
          {variant === "losers" && '📉'}
        </span>
        <div>
          <h2 className="text-xl font-bold text-[#E0E0E0] tracking-wide uppercase">{title}</h2>
          <p className="text-sm text-[#00CFFF] mt-0.5 tracking-wide">3-MINUTE PERFORMANCE RANKINGS</p>
        </div>
      </div>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-black/50">
          <tr>
            <th className="py-4 pl-6 pr-4 text-xs font-bold tracking-wider text-left text-[#00CFFF] uppercase">
              Asset
            </th>
            <th className="px-4 py-4 text-xs font-bold tracking-wider text-right text-[#00CFFF] uppercase">
              Price
            </th>
            <th className="py-4 pl-4 pr-6 text-xs font-bold tracking-wider text-right text-[#00CFFF] uppercase">
              3min Change
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#FF5E00]/20">
          {data.map((coin, index) => 
            <CryptoRow key={coin.symbol} coin={coin} index={index} />
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const TopMoversBar = ({ data }) => (
  <div className="overflow-hidden border shadow-xl bg-black/95 backdrop-blur-xl rounded-2xl border-[#FF5E00]/30 shadow-[#FF5E00]/20 hover:shadow-[#FF5E00]/40 transition-all duration-300">
    <div className="px-6 py-4 border-b bg-gradient-to-r from-[#FF5E00]/10 to-[#FF3F7F]/10 border-[#FF5E00]/30">
      <div className="flex items-center gap-3">
        <span className="text-xl">🌐</span>
        <h3 className="text-base font-bold tracking-wide text-[#E0E0E0] uppercase">
          Most Active 3min
        </h3>
      </div>
    </div>
    <div className="p-6">
      <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
        {data.map((coin, index) => (
          <a 
            key={coin.symbol}
            href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} 
            target="_blank"
            className="flex-shrink-0 transition-all duration-300 group hover:scale-105 hover:-translate-y-1"
          >
            <div className={`px-5 py-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm shadow-lg ${
              coin.gain >= 0 
                ? 'bg-[#FF3F7F]/20 border-[#FF3F7F]/40 hover:bg-[#FF3F7F]/30 shadow-[#FF3F7F]/20 hover:shadow-[#FF3F7F]/40' 
                : 'bg-[#FF3B30]/20 border-[#FF3B30]/40 hover:bg-[#FF3B30]/30 shadow-[#FF3B30]/20 hover:shadow-[#FF3B30]/40'
            }`}>
              <div className="mb-2 text-xs font-bold tracking-wide text-[#E0E0E0]">
                {coin.symbol}
              </div>
              <div className={`text-lg font-bold flex items-center gap-1 ${
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b shadow-xl bg-black/95 backdrop-blur-xl border-gray-800/50 shadow-black/40">
        <div className="px-6 py-6 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-wide text-white">
                CBMO4ERS
                <span className="ml-3 text-transparent bg-gradient-to-r from-[#FF5E00] to-[#00CFFF] bg-clip-text font-bold">
                  CRYPTO DASHBOARD
                </span>
              </h1>
              <p className="mt-2 text-sm font-medium text-[#E0E0E0] tracking-wide">REAL-TIME CRYPTOCURRENCY MARKET DATA</p>
            </div>
            <StatusBadge isConnected={isConnected} lastUpdate={lastUpdate} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-10 mx-auto space-y-10 max-w-7xl">
        {/* Top Movers Section */}
        <section>
          <TopMoversBar data={top24h} />
        </section>

        {/* Tables Grid */}
        <section className="grid gap-8 lg:grid-cols-2">
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
        <section>
          <ContinuousScrollingBanner data={bannerData} />
        </section>

        <footer className="py-10 mt-16 text-center border-t border-[#FF5E00]/30">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#E0E0E0] tracking-wide">
              Powered by <span className="font-bold text-[#00CFFF]">Public Coinbase API</span> • Real-time WebSocket Updates • No Authentication Required
            </p>
            <p className="text-xs text-[#FF5E00]">
              Data updates every 60 seconds • Volume surge detection via price volatility correlation • This is not financial advice
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
