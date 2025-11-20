import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type Request from './types/request';
import LogHistory from './components/LogHistory';
import LogStats from './components/LogStats';
import Analytics from './components/Analytics';
import Chatbot from './components/Chatbot';
import { connectWebSocket, onWebSocketMessage, isWebSocketConnected, sendWebSocketMessage, type WebSocketMessage } from './lib/websocket';
import logoArmees from './assets/Ministère_des_Armées.svg.png';
import './App.css';

function App() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const removeRequest = (index: number) => {
    setRequests((prev) => prev.filter(r => r.index !== index));
  };

  const loadAllHistory = () => {
    setIsLoadingHistory(true);

    // Listen for response
    const unsubscribe = onWebSocketMessage(async (message: WebSocketMessage) => {
      if (message.type === 'all_logs_response' && message.data) {
        const logs = message.data.logs as Request[];
        console.log(`📚 Received ${logs.length} historical logs`);

        // Generate explanations for logs with raw_log
        const { generateExplanation } = await import('./lib/llmExplanation');
        const logsWithExplanations = await Promise.all(
          logs.map(async (log) => {
            if (log.raw_log && log.bug_type && !log.explanation) {
              console.log('🤖 Generating explanation for historical log', log.index);
              const { explanation, fix_proposal } = await generateExplanation(
                log.raw_log,
                log.bug_type,
                log.severity
              );
              return { ...log, explanation, fix_proposal };
            }
            return log;
          })
        );

        // Merge with existing requests, avoiding duplicates
        setRequests((prev) => {
          const existingIndexes = new Set(prev.map(r => r.index));
          const newLogs = logsWithExplanations.filter(log => !existingIndexes.has(log.index));
          return [...prev, ...newLogs];
        });

        setIsLoadingHistory(false);
        unsubscribe();
      } else if (message.type === 'all_logs_error') {
        console.error('Error loading history:', message.data);
        setIsLoadingHistory(false);
        unsubscribe();
      }
    });

    // Send request
    sendWebSocketMessage({ type: 'get_all_logs' });
  };

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
    const unsubscribe = onWebSocketMessage(async (message: WebSocketMessage) => {
      if (message.type === 'new_request' && message.data) {
        const requestData = message.data as Request;

        // Convert timestamp string to Date object if needed
        if (typeof requestData.timestamp === 'string') {
          requestData.timestamp = new Date(requestData.timestamp);
        }

        // Generate explanation with LLM if raw_log is present
        if (requestData.raw_log && requestData.bug_type) {
          console.log('🤖 Generating explanation for', requestData.bug_type);
          const { generateExplanation } = await import('./lib/llmExplanation');
          const { explanation, fix_proposal } = await generateExplanation(
            requestData.raw_log,
            requestData.bug_type,
            requestData.severity
          );
          requestData.explanation = explanation;
          requestData.fix_proposal = fix_proposal;
        }

        // Add to requests - duplicates will be filtered by unique index
        setRequests((prev) => {
          // Check if this index already exists
          const exists = prev.some(r => r.index === requestData.index);
          if (exists) {
            console.log(`⏭️ Skipping duplicate request #${requestData.index}`);
            return prev;
          }
          console.log(`📥 Accepted request #${requestData.index}`);
          return [requestData, ...prev];
        });
      }
    });

    return () => {
      clearInterval(checkConnection);
      unsubscribe();
      // Don't disconnect WebSocket on unmount to avoid issues with React StrictMode
      // disconnectWebSocket();
    };
  }, []);

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
          <div className="flex items-center justify-between h-32">
            <div className="flex items-center gap-4">
              <img
                src={logoArmees}
                alt="Ministère des Armées"
                className="h-32 w-auto"
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

          {/* WebSocket status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">
              {wsConnected ? (
                <span>Connexion avec le proxy en direct</span>
              ) : (
                <span>Déconnecté du proxy,&nbsp;<a href='/contact' className='underline'>Contacter le support</a></span>
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
            <div className="flex items-center gap-4">
              <button
                onClick={loadAllHistory}
                disabled={isLoadingHistory || !wsConnected}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isLoadingHistory ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Chargement...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:history" className="w-4 h-4" />
                    Afficher tout l'historique
                  </>
                )}
              </button>
              <div className="text-sm text-muted-foreground">
                {requests.length} requêtes
              </div>
            </div>
          </div>

          <LogHistory requests={requests} onRemoveRequest={removeRequest} />
        </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot requests={requests} />
    </div>
  );
}

export default App
