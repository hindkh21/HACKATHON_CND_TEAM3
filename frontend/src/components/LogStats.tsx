import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type Request from '../types/request';
import { Card, CardContent } from './lightswind/card';

interface LogStatsProps {
  requests: Request[];
}

const LogStats: React.FC<LogStatsProps> = ({ requests }) => {
  const stats = {
    total: requests.length,
    high: requests.filter(r => r.severity.toLowerCase() === 'élevé').length,
    medium: requests.filter(r => r.severity.toLowerCase() === 'moyen').length,
    low: requests.filter(r => r.severity.toLowerCase() === 'faible').length,
  };

  const statCards = [
    {
      label: 'Total des requêtes',
      value: stats.total,
      icon: 'mdi:database',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Sévérité élevée',
      value: stats.high,
      icon: 'mdi:alert-circle',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Sévérité moyenne',
      value: stats.medium,
      icon: 'mdi:alert',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Sévérité faible',
      value: stats.low,
      icon: 'mdi:information',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <motion.p
                    key={stat.value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold"
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon icon={stat.icon} className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default LogStats;
