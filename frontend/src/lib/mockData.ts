import type Request from '../types/request';

const bugTypes = [
  'port_scan',
  'brut_force_ssh',
  'xss',
  'malware_download',
  'ddos',
  'sql_injection',
  null,
];

const bugTypeExplanations: Record<string, string> = {
  'port_scan': 'Scan de ports — activité de reconnaissance.',
  'brut_force_ssh': 'Brute-force SSH — tentative de compromission de comptes.',
  'xss': 'Tentative XSS — attaque applicative visant scripts côté client.',
  'malware_download': 'Téléchargement malveillant — risque d\'infection.',
  'ddos': 'Potentiel DDoS détecté — schéma de volume ou de fréquence malveillant.',
  'sql_injection': 'Tentative d\'injection SQL — attaque applicative critique.',
};

const bugTypeFixes: Record<string, string> = {
  'port_scan': 'Bloquer l\'IP source et activer la détection de scan avancée.',
  'brut_force_ssh': 'Bloquer l\'IP après plusieurs tentatives, implémenter l\'authentification à deux facteurs.',
  'xss': 'Nettoyer et échapper toutes les entrées utilisateur, implémenter CSP (Content Security Policy).',
  'malware_download': 'Bloquer le téléchargement, scanner avec antivirus, mettre en quarantaine le fichier.',
  'ddos': 'Activer la limitation de débit, filtrage géographique, et protection DDoS du CDN.',
  'sql_injection': 'Utiliser des requêtes préparées, valider toutes les entrées, activer WAF (Web Application Firewall).',
};

const requestTypes = ['Sécurité', 'Performance', 'Validation', 'Réseau', 'Accès'];

const severityLevels = ['élevé', 'moyen', 'faible'];

const firewallPrefixes = ['FW', 'SEC', 'GUARD', 'SHIELD'];

let requestIndex = 1;

export const generateMockRequest = (): Request => {
  const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
  const bugType = bugTypes[Math.floor(Math.random() * bugTypes.length)];
  const type = requestTypes[Math.floor(Math.random() * requestTypes.length)];
  const prefix = firewallPrefixes[Math.floor(Math.random() * firewallPrefixes.length)];

  const explanation = bugType ? bugTypeExplanations[bugType] : null;
  const fix_proposal = bugType ? bugTypeFixes[bugType] : null;

  const request: Request = {
    index: requestIndex++,
    firewall_id: `${prefix}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    timestamp: new Date(),
    bug_type: bugType,
    severity,
    explanation,
    type,
    fix_proposal,
  };

  return request;
};

export const generateMockRequests = (count: number): Request[] => {
  const requests: Request[] = [];
  for (let i = 0; i < count; i++) {
    requests.push(generateMockRequest());
  }
  return requests.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const resetRequestIndex = () => {
  requestIndex = 1;
};

// Initial mock data
export const initialMockRequests: Request[] = [
  {
    index: requestIndex++,
    firewall_id: 'FW-001',
    timestamp: new Date('2025-11-19T10:00:00Z'),
    bug_type: 'sql_injection',
    severity: 'élevé',
    explanation: bugTypeExplanations['sql_injection'],
    type: 'Sécurité',
    fix_proposal: bugTypeFixes['sql_injection'],
  },
  {
    index: requestIndex++,
    firewall_id: 'FW-002',
    timestamp: new Date('2025-11-19T10:05:00Z'),
    bug_type: 'xss',
    severity: 'moyen',
    explanation: bugTypeExplanations['xss'],
    type: 'Sécurité',
    fix_proposal: bugTypeFixes['xss'],
  },
  {
    index: requestIndex++,
    firewall_id: 'FW-003',
    timestamp: new Date('2025-11-19T10:10:00Z'),
    bug_type: 'port_scan',
    severity: 'faible',
    explanation: bugTypeExplanations['port_scan'],
    type: 'Réseau',
    fix_proposal: bugTypeFixes['port_scan'],
  },
  {
    index: requestIndex++,
    firewall_id: 'FW-004',
    timestamp: new Date('2025-11-19T10:15:00Z'),
    bug_type: 'brut_force_ssh',
    severity: 'élevé',
    explanation: bugTypeExplanations['brut_force_ssh'],
    type: 'Sécurité',
    fix_proposal: bugTypeFixes['brut_force_ssh'],
  },
  {
    index: requestIndex++,
    firewall_id: 'FW-005',
    timestamp: new Date('2025-11-19T10:20:00Z'),
    bug_type: 'ddos',
    severity: 'élevé',
    explanation: bugTypeExplanations['ddos'],
    type: 'Réseau',
    fix_proposal: bugTypeFixes['ddos'],
  },
];
