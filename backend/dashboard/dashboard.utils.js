export const RANGE_CONFIG = {
  '1d': { interval: '1 day', groupBy: 'hour', format: 'YYYY-MM-DD HH24:00' },
  '7d': { interval: '7 days', groupBy: 'day', format: 'YYYY-MM-DD' },
  '1m': { interval: '30 days', groupBy: 'day', format: 'YYYY-MM-DD' },
  '3m': { interval: '90 days', groupBy: 'week', format: 'YYYY-MM-DD' },
  '6m': { interval: '180 days', groupBy: 'month', format: 'YYYY-MM' },
  '1y': { interval: '1 year', groupBy: 'month', format: 'YYYY-MM' },
  '2y': { interval: '2 years', groupBy: 'month', format: 'YYYY-MM' },
  'all': null
};

export function getRangeConfig(rangeKey = '1m') {
  return RANGE_CONFIG[rangeKey] ?? RANGE_CONFIG['1m'];
}