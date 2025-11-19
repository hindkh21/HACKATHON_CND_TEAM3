import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type Request from '../types/request';

interface AnalyticsProps {
  requests: Request[];
}

const Analytics: React.FC<AnalyticsProps> = ({ requests }) => {
  // Calculate severity distribution
  const severityStats = {
    élevé: requests.filter(r => r.severity.toLowerCase() === 'élevé').length,
    moyen: requests.filter(r => r.severity.toLowerCase() === 'moyen').length,
    faible: requests.filter(r => r.severity.toLowerCase() === 'faible').length,
  };

  const total = requests.length || 0;
  const severityPercentages = {
    élevé: Math.round((severityStats.élevé / total) * 100),
    moyen: Math.round((severityStats.moyen / total) * 100),
    faible: Math.round((severityStats.faible / total) * 100),
  };

  // Calculate attack type distribution for the bar chart
  const attackTypes = requests.reduce((acc, req) => {
    const type = req.bug_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topAttacks = Object.entries(attackTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const maxCount = Math.max(...topAttacks.map(([, count]) => count), 1);

  // Calculate total for circular chart
  const circumference = 2 * Math.PI * 70; // radius = 70

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Icon icon="mdi:chart-box" className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-semibold">Analytique</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Circular Chart - Severity Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon icon="mdi:chart-donut" className="w-5 h-5 text-blue-600" />
            Répartition par niveau de danger
          </h3>

          <div className="flex items-center justify-center">
            <div className="relative w-56 h-56">
              {/* SVG Donut Chart */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="20"
                />

                {/* High severity segment */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="20"
                  strokeDasharray={`${(severityPercentages.élevé / 100) * circumference} ${circumference}`}
                  strokeDashoffset="0"
                  className="transition-all duration-500"
                />

                {/* Medium severity segment */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="20"
                  strokeDasharray={`${(severityPercentages.moyen / 100) * circumference} ${circumference}`}
                  strokeDashoffset={`-${(severityPercentages.élevé / 100) * circumference}`}
                  className="transition-all duration-500"
                />

                {/* Low severity segment */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${(severityPercentages.faible / 100) * circumference} ${circumference}`}
                  strokeDashoffset={`-${((severityPercentages.élevé + severityPercentages.moyen) / 100) * circumference}`}
                  className="transition-all duration-500"
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">Élevé</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{severityStats.élevé}</span>
                <span className="text-xs text-gray-500">({severityPercentages.élevé}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium text-gray-700">Moyen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{severityStats.moyen}</span>
                <span className="text-xs text-gray-500">({severityPercentages.moyen}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Faible</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{severityStats.faible}</span>
                <span className="text-xs text-gray-500">({severityPercentages.faible}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart - Top Attack Types */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon icon="mdi:chart-bar" className="w-5 h-5 text-blue-600" />
            Types d'attaques les plus fréquentes
          </h3>

          <div className="space-y-4">
            {topAttacks.map(([type, count]) => {
              const percentage = Math.round((count / total) * 100);
              const barWidth = (count / maxCount) * 100;

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 capitalize">
                      {type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {count} <span className="text-gray-500 text-xs">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {topAttacks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Icon icon="mdi:database-off" className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
