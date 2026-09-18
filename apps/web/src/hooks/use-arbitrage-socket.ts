import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export function useArbitrageSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestOpportunity, setLatestOpportunity] = useState<any | null>(null);
  const [latestTicker, setLatestTicker] = useState<any | null>(null);

  useEffect(() => {
    // Connect to /arbitrage namespace
    const socket = io(`${WS_BASE_URL}/arbitrage`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Auto-subscribe to default pair feeds
      socket.emit('subscribe_pairs', ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);
      socket.emit('subscribe_funding');
      socket.emit('subscribe_exchange_status');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('opportunity', (data) => {
      setLatestOpportunity(data);
    });

    socket.on('/ws/opportunities', (data) => {
      setLatestOpportunity(data);
    });

    socket.on('ticker', (data) => {
      setLatestTicker(data);
    });

    socket.on('/ws/market', (data) => {
      setLatestTicker(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    latestOpportunity,
    latestTicker,
  };
}
