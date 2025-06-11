import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const formatDecimal = val => Math.abs(val) >= 1 ? val.toFixed(2) : val.toFixed(6);
const Row = ({ coin }) => (
  <tr className="hover:bg-black">
    <td className="text-purple-400 underline">
      <a href={`https://www.coinbase.com/price/${coin.symbol.split('-')[0].toLowerCase()}`} target="_blank">{coin.symbol}</a>
    </td>
    <td>${formatDecimal(coin.current)}</td>
    <td className={coin.gain >= 0 ? "text-green-400" : "text-red-400"}>{formatDecimal(coin.gain)}%</td>
  </tr>
);

const Table = ({ title, data }) => (
  <div className="my-4">
    <h2 className="mb-2 text-xl text-blue-400">{title}</h2>
    <table className="w-full text-sm text-center table-fixed">
      <thead><tr><th>Symbol</th><th>Price</th><th>%</th></tr></thead>
      <tbody>{data.map(coin => <Row key={coin.symbol} coin={coin} />)}</tbody>
    </table>
  </div>
);

export default function App() {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [top24h, setTop24h] = useState([]);
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
      setLastUpdate(new Date());
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen px-6 py-4 text-white bg-black">
      {/* Connection status and live banner */}
      <div className="flex items-center justify-between pb-2 mb-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Real-time Coinbase Data
        </div>
      </div>

      {/* 24h top movers banner */}
      <div className="p-3 mb-4 overflow-x-auto bg-gray-900 rounded-lg whitespace-nowrap">
        <div className="mb-1 text-xs text-gray-400">24H TOP MOVERS</div>
        <div className="flex gap-6">
          {top24h.map(c => (
            <a key={c.symbol} href={`https://www.coinbase.com/price/${c.symbol.split('-')[0].toLowerCase()}`} target="_blank"
               className={`inline-block text-sm font-mono ${c.gain >= 0 ? 'text-green-400' : 'text-red-400'} hover:underline`}>
              {c.symbol}: {formatDecimal(c.gain)}%
            </a>
          ))}
        </div>
      </div>

      <Table title="Top Gainers (24h)" data={gainers} />
      <Table title="Top Losers (24h)" data={losers} />
    </div>
  );
}
