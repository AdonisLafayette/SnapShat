import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

type MessageHandler = (message: WebSocketMessage) => void;

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const messageHandlerRef = useRef<MessageHandler | null>(null);

  const setMessageHandler = useCallback((handler: MessageHandler) => {
    messageHandlerRef.current = handler;
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${url}`;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | undefined;
    
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            // Call the handler directly without state updates
            if (messageHandlerRef.current) {
              messageHandlerRef.current(message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect();
          }, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
      }
    };
    
    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [url]);

  return { isConnected, setMessageHandler };
}
