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
          ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10' 
          : 'bg-red-500/10 text-red-400 border border-red-500/30'
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full ${
          isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        }`}></div>
        <span>📡</span>
        {isConnected ? 'LIVE' : 'OFFLINE'}
        {isConnected && (
          <span className="ml-1 text-xs text-green-300">Public API</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <span>🕐</span>
        Updated {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  </div>
);

const ContinuousScrollingBanner = ({ data }) => {
  return (
    <div className="overflow-hidden border shadow-xl bg-gradient-to-r from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl rounded-2xl border-gray-700/50 shadow-black/10">
      <div className="px-6 py-4 border-b bg-gray-800/40 border-gray-700/50">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔥</span>
          <h3 className="text-base font-bold tracking-wide text-white uppercase">
            Volume Surge Alert • Live Market Feed
          </h3>
          <div className="px-2 py-1 text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 rounded-full">
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
                  className="flex items-center gap-4 transition-transform duration-200 hover:scale-105"
                >
                  <div className="text-sm font-bold text-gray-200">
                    {coin.symbol}
                  </div>
                  <div className="font-mono text-sm text-white">
                    {formatCurrency(coin.current)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${
                    (coin.volume_change || 0) >= 0 ? 'text-blue-400' : 'text-orange-400'
                  }`}>
                    <span>{(coin.volume_change || 0) >= 0 ? '🔥' : '❄️'}</span>
                    Vol: {(coin.volume_change || 0) >= 0 ? '+' : ''}{formatDecimal(Math.abs(coin.volume_change || 0))}%
                  </div>
                  <div className={`text-xs ${
                    coin.gain >= 0 ? 'text-green-400' : 'text-red-400'
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
                  className="flex items-center gap-4 transition-transform duration-200 hover:scale-105"
                >
                  <div className="text-sm font-bold text-gray-200">
                    {coin.symbol}
                  </div>
                  <div className="font-mono text-sm text-white">
                    {formatCurrency(coin.current)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${
                    (coin.volume_change || 0) >= 0 ? 'text-blue-400' : 'text-orange-400'
                  }`}>
                    <span>{(coin.volume_change || 0) >= 0 ? '🔥' : '❄️'}</span>
                    Vol: {(coin.volume_change || 0) >= 0 ? '+' : ''}{formatDecimal(Math.abs(coin.volume_change || 0))}%
                  </div>
                  <div className={`text-xs ${
                    coin.gain >= 0 ? 'text-green-400' : 'text-red-400'
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
  <tr className="transition-all duration-200 group hover:bg-gray-800/30">
    <td className="py-5 pl-6 pr-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full shadow-sm bg-gradient-to-br from-gray-600 to-gray-700">
          {index + 1}
        </div>
        <a 
          href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} 
          target="_blank"
          className="font-semibold text-blue-400 transition-colors hover:text-blue-300 group-hover:underline"
        >
          {coin.symbol}
        </a>
      </div>
    </td>
    <td className="px-4 py-5 text-right">
      <div className="font-mono text-base font-semibold text-white">
        {formatCurrency(coin.current)}
      </div>
    </td>
    <td className="py-5 pl-4 pr-6 text-right">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
        coin.gain >= 0 
          ? 'bg-green-500/15 text-green-400 border border-green-500/30' 
          : 'bg-red-500/15 text-red-400 border border-red-500/30'
      }`}>
        <span>{coin.gain >= 0 ? '📈' : '📉'}</span>
        {formatDecimal(Math.abs(coin.gain))}%
      </div>
    </td>
  </tr>
);

const CryptoTable = ({ title, data, variant = "default" }) => (
  <div className="overflow-hidden border shadow-2xl bg-gray-900/60 backdrop-blur-xl rounded-2xl border-gray-700/50 shadow-black/20">
    <div className={`px-6 py-5 border-b border-gray-700/50 ${
      variant === "gainers" ? "bg-gradient-to-r from-green-500/10 to-transparent" : 
      variant === "losers" ? "bg-gradient-to-r from-red-500/10 to-transparent" : "bg-gray-800/30"
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {variant === "gainers" && '🚀'}
          {variant === "losers" && '📉'}
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">3-minute performance rankings</p>
        </div>
      </div>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-800/30">
          <tr>
            <th className="py-4 pl-6 pr-4 text-xs font-bold tracking-wider text-left text-gray-300 uppercase">
              Asset
            </th>
            <th className="px-4 py-4 text-xs font-bold tracking-wider text-right text-gray-300 uppercase">
              Price
            </th>
            <th className="py-4 pl-4 pr-6 text-xs font-bold tracking-wider text-right text-gray-300 uppercase">
              3min Change
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/30">
          {data.map((coin, index) => 
            <CryptoRow key={coin.symbol} coin={coin} index={index} />
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const TopMoversBar = ({ data }) => (
  <div className="overflow-hidden border shadow-xl bg-gradient-to-r from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl rounded-2xl border-gray-700/50 shadow-black/10">
    <div className="px-6 py-4 border-b bg-gray-800/40 border-gray-700/50">
      <div className="flex items-center gap-3">
        <span className="text-xl">🌐</span>
        <h3 className="text-base font-bold tracking-wide text-white uppercase">
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
            <div className={`px-5 py-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${
              coin.gain >= 0 
                ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 shadow-lg shadow-green-500/10' 
                : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 shadow-lg shadow-red-500/10'
            }`}>
              <div className="mb-2 text-xs font-bold tracking-wide text-gray-200">
                {coin.symbol}
              </div>
              <div className={`text-lg font-bold flex items-center gap-1 ${
                coin.gain >= 0 ? 'text-green-400' : 'text-red-400'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b shadow-xl bg-gray-900/90 backdrop-blur-xl border-gray-700/50 shadow-black/20">
        <div className="px-6 py-6 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                CBMo4ers
                <span className="ml-3 text-transparent bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text">
                  Crypto Dashboard
                </span>
              </h1>
              <p className="mt-2 text-sm font-medium text-gray-400">Real-time cryptocurrency market data from Coinbase</p>
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

        <footer className="py-10 mt-16 text-center border-t border-gray-700/50">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-400">
              Powered by <span className="font-semibold text-blue-400">Public Coinbase API</span> • Real-time WebSocket Updates • No Authentication Required
            </p>
            <p className="text-xs text-gray-500">
              Data updates every 60 seconds • Volume surge detection via price volatility correlation • This is not financial advice
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
