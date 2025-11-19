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
    setDisplayedRequests(requests);
  }, [requests]);

  // Auto-scroll removed for better UX - users can scroll manually

  return (
    <div className="space-y-4 pb-8">
      {displayedRequests.map((request) => {
        const timestampKey = typeof request.timestamp === 'string'
          ? request.timestamp
          : request.timestamp.getTime();
        return (
          <div key={`${request.index}-${timestampKey}`}>
            <RequestCard request={request} />
          </div>
        );
      })}

      {displayedRequests.length === 0 && (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Aucune requête à afficher</p>
            <p className="text-sm">En attente des requêtes entrantes...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogHistory;
