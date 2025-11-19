import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from './lightswind/button';
import { Badge } from './lightswind/badge';

export interface FilterOptions {
  severity: string[];
  type: string[];
  searchQuery: string;
}

interface LogFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  availableTypes: string[];
}

const LogFilter: React.FC<LogFilterProps> = ({
  onFilterChange,
  currentFilters,
  availableTypes,
}) => {
  const severityLevels = ['élevé', 'moyen', 'faible'];
  const severityLabels: Record<string, string> = {
    'élevé': 'élevée',
    'moyen': 'moyenne',
    'faible': 'faible'
  };

  const toggleSeverity = (severity: string) => {
    const newSeverities = currentFilters.severity.includes(severity)
      ? currentFilters.severity.filter(s => s !== severity)
      : [...currentFilters.severity, severity];

    onFilterChange({ ...currentFilters, severity: newSeverities });
  };

  const toggleType = (type: string) => {
    const newTypes = currentFilters.type.includes(type)
      ? currentFilters.type.filter(t => t !== type)
      : [...currentFilters.type, type];

    onFilterChange({ ...currentFilters, type: newTypes });
  };

  const clearFilters = () => {
    onFilterChange({ severity: [], type: [], searchQuery: '' });
  };

  const hasActiveFilters =
    currentFilters.severity.length > 0 ||
    currentFilters.type.length > 0 ||
    currentFilters.searchQuery.length > 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'élevé': return 'destructive';
      case 'moyen': return 'warning';
      case 'faible': return 'secondary';
      default: return 'outline';
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Icon icon="mdi:filter-variant" className="w-5 h-5" />
        Filtres
        {hasActiveFilters && (
          <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {(currentFilters.severity.length + currentFilters.type.length + (currentFilters.searchQuery ? 1 : 0))}
          </span>
        )}
        <Icon icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown panel */}
          <div className="absolute top-full mt-2 right-0 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg border border-gray-200 shadow-xl z-50 p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-3 border-b border-gray-200 -mt-6 -mx-6 px-6 pt-6 mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:filter-variant" className="w-5 h-5" />
                <h3 className="font-semibold">Filtres</h3>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2"
                >
                  <Icon icon="mdi:close" className="w-4 h-4 mr-1" />
                  Effacer
                </Button>
              )}
            </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Rechercher</label>
        <div className="relative">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Rechercher par ID de pare-feu, type d'anomalie..."
            value={currentFilters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...currentFilters, searchQuery: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Severity Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Sévérité</label>
        <div className="flex flex-wrap gap-2">
          {severityLevels.map((severity) => (
            <Badge
              key={severity}
              variant={
                currentFilters.severity.includes(severity)
                  ? getSeverityColor(severity)
                  : 'outline'
              }
              className="cursor-pointer capitalize transition-all hover:scale-105"
              onClick={() => toggleSeverity(severity)}
            >
              {currentFilters.severity.includes(severity) && (
                <Icon icon="mdi:check" className="w-3 h-3 mr-1" />
              )}
              {severityLabels[severity]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      {availableTypes.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((type) => (
              <Badge
                key={type}
                variant={currentFilters.type.includes(type) ? 'default' : 'outline'}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleType(type)}
              >
                {currentFilters.type.includes(type) && (
                  <Icon icon="mdi:check" className="w-3 h-3 mr-1" />
                )}
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}
          </div>
        </>
      )}
    </div>
  );
};

export default LogFilter;
