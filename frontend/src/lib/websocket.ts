// WebSocket client for firewall monitoring
let socket: WebSocket | null = null;
let reconnectTimeout: number | null = null;
const RECONNECT_DELAY = 3000; // 3 seconds

export type WebSocketMessage = {
  type: 'apply_fix' | 'fix_applied' | 'fix_error' | 'new_request' | 'get_all_logs' | 'all_logs_response' | 'all_logs_error';
  data?: any;
  error?: string;
};

type MessageHandler = (message: WebSocketMessage) => void;
const messageHandlers: Set<MessageHandler> = new Set();

export const connectWebSocket = (url: string = 'ws://localhost:9001'): void => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected');
    return;
  }

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        console.log('📨 WebSocket message received:', event.data);
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 Parsed message:', message);
        console.log('📨 Number of handlers:', messageHandlers.size);
        messageHandlers.forEach(handler => {
          console.log('📨 Calling handler with message type:', message.type);
          handler(message);
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      socket = null;

      // Auto-reconnect
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          connectWebSocket(url);
        }, RECONNECT_DELAY);
      }
    };
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
  }
};

export const disconnectWebSocket = (): void => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }

  messageHandlers.clear();
};

export const sendWebSocketMessage = (message: WebSocketMessage): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket is not connected'));
      return;
    }

    try {
      socket.send(JSON.stringify(message));
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const onWebSocketMessage = (handler: MessageHandler): (() => void) => {
  messageHandlers.add(handler);

  // Return unsubscribe function
  return () => {
    messageHandlers.delete(handler);
  };
};

export const getWebSocketState = (): number | null => {
  return socket?.readyState ?? null;
};

export const isWebSocketConnected = (): boolean => {
  return socket !== null && socket.readyState === WebSocket.OPEN;
};
