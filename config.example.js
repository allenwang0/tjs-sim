// ============================================================
// SUPABASE CONFIGURATION (EXAMPLE)
// ============================================================
// Copy this file to config.js and fill in your actual credentials

const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-anon-key-here'
};

// Competitive challenge definitions
const COMPETITIVE_CHALLENGES = {
  'sf-52wk': {
    id: 'sf-52wk',
    name: 'San Francisco 52-Week Challenge',
    description: 'Start in Hayes Valley, SF. Survive 52 weeks. Highest cumulative profit wins.',
    locationId: 'sf',
    weekLimit: 52,
    startingCash: 75000,
    seed: 12345, // Fixed RNG seed for reproducibility
    enabled: true
  },
  'nyc-26wk': {
    id: 'nyc-26wk',
    name: 'NYC Sprint Challenge',
    description: 'Upper West Side for 26 weeks. Fast-paced high-stakes challenge.',
    locationId: 'nyc',
    weekLimit: 26,
    startingCash: 75000,
    seed: 67890,
    enabled: true
  },
  'houston-unlimited': {
    id: 'houston-unlimited',
    name: 'Houston Endurance Run',
    description: 'Low rent, high competition. How far can you go?',
    locationId: 'houston',
    weekLimit: null, // Unlimited
    startingCash: 75000,
    seed: 11111,
    enabled: true
  }
};

window.CONFIG = {
  SUPABASE: SUPABASE_CONFIG,
  CHALLENGES: COMPETITIVE_CHALLENGES
};
