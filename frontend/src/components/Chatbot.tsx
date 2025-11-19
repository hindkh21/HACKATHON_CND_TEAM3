import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  requests?: any[];
}

const Chatbot: React.FC<ChatbotProps> = ({ requests = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant de sécurité. Je peux vous aider à comprendre les alertes et vous conseiller sur les mesures de sécurité.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OVH_LLM_API_KEY;
      const endpoint = import.meta.env.VITE_OVH_LLM_ENDPOINT || 'https://llama-3-1-8b-instruct.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1/chat/completions';

      console.log('🔑 API Key présente:', !!apiKey);
      console.log('🔗 Endpoint:', endpoint);

      if (!apiKey) {
        throw new Error('API key not configured');
      }

      // Build context from recent alerts
      const alertsContext = requests.slice(0, 5).map(req =>
        `- Alerte #${req.index}: ${req.bug_type || 'Inconnu'} (${req.severity}) - ${req.explanation}`
      ).join('\n');

      const systemPrompt = `Tu es un assistant de sécurité informatique expert. Tu aides à analyser les alertes de pare-feu et à conseiller sur les mesures de sécurité.

Alertes récentes:
${alertsContext || 'Aucune alerte récente'}

Réponds de manière concise et professionnelle en français. Si on te pose une question sur une alerte spécifique, référence-toi aux données ci-dessus.`;

      console.log('📤 Sending request to LLM...');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'Llama-3.1-8B-Instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) >= messages.length - 10).map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: input }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ LLM Response received');

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('💥 Error calling LLM:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}. Vérifiez la console pour plus de détails.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
      >
        {isOpen ? (
          <Icon icon="mdi:close" className="w-6 h-6" />
        ) : (
          <Icon icon="mdi:robot" className="w-6 h-6" />
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon icon="mdi:robot" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Assistant Sécurité</h3>
                <p className="text-xs text-blue-100">Propulsé par OVH Cloud AI</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:send" className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Appuyez sur Entrée pour envoyer
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
