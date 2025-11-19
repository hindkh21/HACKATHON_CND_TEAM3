import React, { useState, useEffect } from 'react';
import type Request from '../types/request';
import RequestCard from './request';

interface LogHistoryProps {
  requests: Request[];
  autoScroll?: boolean;
}

const LogHistory: React.FC<LogHistoryProps> = ({ requests }) => {
  const [displayedRequests, setDisplayedRequests] = useState<Request[]>([]);

  useEffect(() => {
    // Remove duplicates by index using Map (keeps latest occurrence)
    const uniqueMap = new Map<number, Request>();
    requests.forEach(request => {
      if (!uniqueMap.has(request.index)) {
        uniqueMap.set(request.index, request);
      }
    });

    // Convert to array, reverse order (latest first), and limit to 50
    const uniqueRequests = Array.from(uniqueMap.values())
      .reverse()
      .slice(0, 50);

    setDisplayedRequests(uniqueRequests);
  }, [requests]);

  // Auto-scroll removed for better UX - users can scroll manually

  return (
    <div className="space-y-4">
      {/* Requests List */}
      <div className="space-y-4 pb-8">
      {displayedRequests.map((request) => {
        return (
          <div key={request.index}>
            <RequestCard request={request} />
          </div>
        );
      })}

        {displayedRequests.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">Tout va bien !</p>
                <p className="text-lg text-green-600 mt-2">Aucune cyberattaque détectée</p>
                <p className="text-sm text-gray-500 mt-3">Votre système est sécurisé et surveillé en temps réel</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogHistory;
