// ─── Stremio Addon Manifest ─────────────────────────────────────
const config = require('./config');

// Build catalog entries for each sport + Live TV
const sportCatalogs = Object.entries(config.SPORTS).map(([key, info]) => ({
  type: 'tv',
  id: `ss99_sport_${info.slug}`,
  name: `${info.emoji} ${info.name}`,
  extra: [
    { name: 'skip', isRequired: false },
  ],
}));

const manifest = {
  id: config.ADDON_ID,
  version: config.ADDON_VERSION,
  name: config.ADDON_NAME,
  description: config.ADDON_DESCRIPTION,
  logo: config.ADDON_LOGO,

  resources: ['catalog', 'meta', 'stream'],
  types: ['tv'],
  idPrefixes: [config.ID_PREFIX],

  catalogs: [
    // All live events
    {
      type: 'tv',
      id: 'ss99_all_live',
      name: '🔴 All Live Now',
      extra: [
        { name: 'skip', isRequired: false },
      ],
    },
    // All upcoming events
    {
      type: 'tv',
      id: 'ss99_all_upcoming',
      name: '🕐 Upcoming Events',
      extra: [
        { name: 'skip', isRequired: false },
      ],
    },
    // Per-sport catalogs
    ...sportCatalogs,
    // Live TV channels
    {
      type: 'tv',
      id: 'ss99_livetv',
      name: '📺 Live TV Channels',
      extra: [
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false },
      ],
    },
  ],

  behaviorHints: {
    adult: false,
    p2p: false,
  },
};

module.exports = manifest;
