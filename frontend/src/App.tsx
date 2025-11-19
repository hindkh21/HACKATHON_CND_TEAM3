import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type Request from './types/request';
import LogHistory from './components/LogHistory';
import LogStats from './components/LogStats';
import Analytics from './components/Analytics';
import { Button } from './components/lightswind/button';
import { initialMockRequests, generateMockRequest } from './lib/mockData';
import { connectWebSocket, disconnectWebSocket, onWebSocketMessage, isWebSocketConnected, type WebSocketMessage } from './lib/websocket';
import logoArmees from './assets/Ministère_des_Armées.svg.png';
import './App.css';

function App() {
  const [requests, setRequests] = useState<Request[]>(initialMockRequests);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:9001';
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    console.log('🔌 VITE_WS_URL env var:', import.meta.env.VITE_WS_URL);
    connectWebSocket(wsUrl);

    // Check connection status
    const checkConnection = setInterval(() => {
      const connected = isWebSocketConnected();
      setWsConnected(connected);
      if (connected) {
        console.log('✅ WebSocket is connected');
      }
    }, 1000);

    // Listen for new requests from WebSocket
    const unsubscribe = onWebSocketMessage((message: WebSocketMessage) => {
      if (message.type === 'new_request' && message.data) {
        const requestData = message.data as Request;
        // Convert timestamp string to Date object if needed
        if (typeof requestData.timestamp === 'string') {
          requestData.timestamp = new Date(requestData.timestamp);
        }
        setRequests((prev) => [requestData, ...prev].slice(0, 50));
      }
    });

    return () => {
      clearInterval(checkConnection);
      unsubscribe();
      // Don't disconnect WebSocket on unmount to avoid issues with React StrictMode
      // disconnectWebSocket();
    };
  }, []);

  // Simulate receiving new requests (for demo purposes)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const newRequest = generateMockRequest();
      setRequests((prev) => [newRequest, ...prev].slice(0, 50)); // Keep last 50 requests
    }, 3000); // Generate a new request every 3 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Small Screen Blocker */}
      <div className="sm:hidden fixed inset-0 z-9999 bg-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Écran trop petit</h1>
          <p className="text-gray-600 max-w-md">
            Ce site nécessite un écran plus grand. Veuillez utiliser un ordinateur de bureau ou une tablette.
          </p>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center gap-4">
              <img
                src={logoArmees}
                alt="Ministère des Armées"
                className="h-20 w-auto"
              />
            </div>
            <a
              href="/contact"
              className="px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Contacter le service
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-2 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className=""
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                <Icon icon="mdi:security" className="w-10 h-10" />
                Moniteur de Pare-feu
              </h1>
              <p className="text-muted-foreground text-lg">
                Surveillance en temps réel des alertes de sécurité et des activités du pare-feu
              </p>
            </div>
          </div>

			{/*
            <Button
              onClick={toggleSimulation}
              variant={isSimulating ? 'destructive' : 'default'}
              className="flex items-center gap-2"
            >
              <Icon
                icon={isSimulating ? 'mdi:pause' : 'mdi:play'}
                className="w-5 h-5"
              />
              {isSimulating ? 'Arrêter la simulation' : 'Démarrer la simulation'}
            </Button>
		  */}

          {/* Live indicator */}
          {isSimulating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
              <span className="text-muted-foreground">Surveillance en direct active</span>
            </motion.div>
          )}

          {/* WebSocket status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">
              {wsConnected ? (
                <span>Connexion avec le proxy en direct</span>
              ) : (
                <span>Déconnecté du proxy,&nbsp;<a href='/contact'>Contacter le support</a></span>
              )}
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <LogStats requests={requests} />

        {/* Analytics Section */}
        <Analytics requests={requests} />

        {/* Log History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Historique des requêtes</h2>
            <div className="text-sm text-muted-foreground">
              {requests.length} requêtes
            </div>
          </div>

          <LogHistory requests={requests} />
        </div>
        </div>
      </div>
    </div>
  );
}

export default App
