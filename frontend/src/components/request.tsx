import React, { useState, useEffect } from "react";
import type Request from "../types/request";
import { sendWebSocketMessage, onWebSocketMessage, type WebSocketMessage } from "../lib/websocket";

interface RequestCardProps {
  request: Request;
}

const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const [showSolution, setShowSolution] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Listen for WebSocket messages related to this request
    const unsubscribe = onWebSocketMessage((message: WebSocketMessage) => {
      if (message.type === 'fix_applied' && message.data?.request_index === request.index) {
        setIsApplying(false);
        setIsApplied(true);
        setError(false);
      } else if (message.type === 'fix_error' && message.data?.request_index === request.index) {
        setIsApplying(false);
        setError(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [request.index]);

  const handleApplySolution = async () => {
    setIsApplying(true);
    setError(false);
    try {
      await sendWebSocketMessage({
        type: 'apply_fix',
        data: {
          request_index: request.index,
          firewall_id: request.firewall_id,
          bug_type: request.bug_type,
          fix_proposal: request.fix_proposal,
        },
      });
      // Response will be handled by the WebSocket message listener
    } catch (error) {
      console.error('Error sending fix request via WebSocket:', error);
      setError(true);
      setIsApplying(false);
    }
  };

  const borderColor = request.severity.toLowerCase() === 'élevé' ? '#ef4444' :
                      request.severity.toLowerCase() === 'moyen' ? '#eab308' :
                      '#10b981';

  const severityBgColor = request.severity.toLowerCase() === 'élevé' ? 'bg-red-100 text-red-800' :
                          request.severity.toLowerCase() === 'moyen' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800';

  const getRelativeTime = (timestamp: Date | string) => {
    const now = new Date();
    const ts = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffMs = now.getTime() - ts.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `Il y a ${diffSecs}s`;
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const formatFullTime = (timestamp: Date | string) => {
    const ts = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return ts.toLocaleString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div
      className="w-full mb-4 p-6 bg-white rounded-xl border-l-4 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Requête #{request.index}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${severityBgColor}`}>
              {request.severity}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-blue-700">{getRelativeTime(request.timestamp)}</span>
                <span className="text-blue-600">•</span>
                <span className="text-sm text-blue-600 font-medium" title={formatFullTime(request.timestamp)}>
                  {formatFullTime(request.timestamp)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {request.type}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm text-gray-700">
            <span className="font-medium">Pare-feu :</span> {request.firewall_id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm text-gray-700">
            <span className="font-medium">Type d'anomalie :</span> {request.bug_type || "Non spécifié"}
          </span>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2 flex-1">
            <svg className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">Explication</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {request.explanation || "Aucun détail disponible"}
              </p>
            </div>
          </div>

          {request.fix_proposal && (
            <button
              onClick={() => setShowSolution(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Voir solution
            </button>
          )}
        </div>
      </div>

      {/* Solution Modal */}
      {showSolution && request.fix_proposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Solution proposée</h2>
                    <p className="text-sm text-gray-500">Requête #{request.index} - {request.firewall_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSolution(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Success Message */}
              {isApplied && (
                <div className="p-4 bg-green-100 rounded-lg border border-green-300">
                  <div className="flex items-center gap-2 text-green-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Envoyé avec succès</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-100 rounded-lg border border-red-300">
                  <div className="flex items-start gap-2 text-red-800">
                    <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium">Erreur lors de l'envoi</p>
                      <p className="mt-1">
                        Veuillez réessayer. Si l'erreur persiste,{' '}
                        <a href="/contact" className="underline font-medium hover:text-red-900">
							contactez le service correspondant
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Type d'attaque :</span>
                    <span className="text-sm text-gray-700">{request.bug_type || "Non spécifié"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-700">{request.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Solution */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-2">Mesures correctives recommandées</p>
                    <p className="text-sm text-green-800 leading-relaxed">
                      {request.fix_proposal}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowSolution(false)}
                  disabled={isApplying}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleApplySolution}
                  disabled={isApplying || isApplied}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isApplied
                      ? 'bg-green-600 text-white cursor-default'
                      : isApplying
                      ? 'bg-gray-400 text-white cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Envoyée
                    </>
                  ) : isApplying ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestCard;
