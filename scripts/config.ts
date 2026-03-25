// Tournament Auto-Test Configuration
// Configure test parameters here

export const config = {
  // Base URL for API requests
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',

  // Test modes to run in parallel
  MODES: ['SINGLE', 'DOUBLE', 'ROUND_ROBIN', 'GROUP_STAGE'] as const,

  // Number of players to register for each test
  TOTAL_PLAYERS: 16,

  // Delay between API calls (ms)
  DELAY: 500,

  // Retry configuration
  RETRY_LIMIT: 3,

  // Division for test
  DIVISION: 'MALE' as const,

  // Tournament settings
  TOURNAMENT: {
    mode: 'GR Arena 3vs3',
    bpm: 'Random 120-140',
    maxParticipants: 16,
    location: 'Test Arena',
  },

  // Test player name prefix
  PLAYER_PREFIX: 'TestPlayer',
};

export type TestMode = (typeof config.MODES)[number];
