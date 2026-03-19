// ─── Configuration ───────────────────────────────────────────────
module.exports = {
  // cdn-live.tv API credentials (free tier)
  API_BASE: 'https://api.cdn-live.tv/api/v1',
  PLAYER_BASE: 'https://cdn-live.tv/api/v1',
  API_USER: process.env.CDN_USER || 'cdnlivetv',
  API_PLAN: process.env.CDN_PLAN || 'free',

  // Server
  PORT: parseInt(process.env.PORT, 10) || 7000,

  // Cache TTL in seconds
  CACHE_EVENTS_TTL: 120,      // 2 minutes for live events
  CACHE_CHANNELS_TTL: 300,    // 5 minutes for channel list
  CACHE_META_TTL: 60,         // 1 minute for meta (live scores change fast)

  // Retry config
  FETCH_TIMEOUT: 10000,       // 10s timeout
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,          // 1s between retries

  // Addon identity
  ADDON_ID: 'community.streamsports99',
  ADDON_VERSION: '1.0.0',
  ADDON_NAME: 'StreamSports99 Live',
  ADDON_DESCRIPTION: 'Live sports events & TV channels — Soccer, NBA, NFL, NHL, Tennis, Cricket, Motorsport and more. Powered by cdn-live.tv.',

  // Logo
  ADDON_LOGO: 'https://api.cdn-live.tv/api/v1/channels/images6318/united-states/espn.svg',

  // Sport categories mapping (API key → display name & emoji)
  SPORTS: {
    Soccer:          { name: 'Soccer',          emoji: '⚽', slug: 'soccer' },
    NBA:             { name: 'NBA',             emoji: '🏀', slug: 'nba' },
    NFL:             { name: 'NFL',             emoji: '🏈', slug: 'nfl' },
    NHL:             { name: 'NHL',             emoji: '🏒', slug: 'nhl' },
    MLB:             { name: 'MLB',             emoji: '⚾', slug: 'mlb' },
    NCAA:            { name: 'NCAA',            emoji: '🎓', slug: 'ncaa' },
    NCAAW:           { name: 'NCAAW',           emoji: '🎓', slug: 'ncaaw' },
    Cricket:         { name: 'Cricket',         emoji: '🏏', slug: 'cricket' },
    Tennis:          { name: 'Tennis',           emoji: '🎾', slug: 'tennis' },
    Golf:            { name: 'Golf',            emoji: '⛳', slug: 'golf' },
    Motorsport:      { name: 'Motorsport',      emoji: '🏎️', slug: 'motorsport' },
    Basketball:      { name: 'Basketball',      emoji: '🏀', slug: 'basketball' },
    Volleyball:      { name: 'Volleyball',      emoji: '🏐', slug: 'volleyball' },
    Handball:        { name: 'Handball',         emoji: '🤾', slug: 'handball' },
    Darts:           { name: 'Darts',           emoji: '🎯', slug: 'darts' },
    MMA:             { name: 'MMA',             emoji: '🥊', slug: 'mma' },
    UFC:             { name: 'UFC',             emoji: '🥊', slug: 'ufc' },
    WWE:             { name: 'WWE',             emoji: '💪', slug: 'wwe' },
    Cycling:         { name: 'Cycling',         emoji: '🚴', slug: 'cycling' },
    'Horse Racing':  { name: 'Horse Racing',    emoji: '🐎', slug: 'horse-racing' },
    'Winter Sports': { name: 'Winter Sports',   emoji: '❄️', slug: 'winter-sports' },
    Hockey:          { name: 'Hockey',          emoji: '🏒', slug: 'hockey' },
    Futsal:          { name: 'Futsal',          emoji: '⚽', slug: 'futsal' },
    Badminton:       { name: 'Badminton',       emoji: '🏸', slug: 'badminton' },
  },

  // ID prefix for this addon
  ID_PREFIX: 'ss99',
};
