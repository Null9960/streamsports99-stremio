// ─── cdn-live.tv API Client with cache, retry, and rate limiting ─
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const config = require('./config');

const cache = new NodeCache({ checkperiod: 60 });

// ─── Helper: build query params ─────────────────────────────────
function apiParams() {
  return `user=${config.API_USER}&plan=${config.API_PLAN}`;
}

// ─── Helper: fetch with timeout + retry ─────────────────────────
async function fetchWithRetry(url, retries = config.MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.FETCH_TIMEOUT);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'StreamSports99-Stremio-Addon/1.0',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`[API] Attempt ${attempt + 1}/${retries + 1} failed for ${url}: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, config.RETRY_DELAY * (attempt + 1)));
      } else {
        throw err;
      }
    }
  }
}

// ─── Get all sports events ──────────────────────────────────────
async function getAllEvents() {
  const cacheKey = 'events_all';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `${config.API_BASE}/events/sports/?${apiParams()}`;
  console.log(`[API] Fetching events: ${url}`);
  const data = await fetchWithRetry(url);

  const cdnData = data['cdn-live-tv'] || data;
  cache.set(cacheKey, cdnData, config.CACHE_EVENTS_TTL);
  return cdnData;
}

// ─── Get all channels ───────────────────────────────────────────
async function getAllChannels() {
  const cacheKey = 'channels_all';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `${config.API_BASE}/channels/?${apiParams()}`;
  console.log(`[API] Fetching channels: ${url}`);
  const data = await fetchWithRetry(url);

  const channels = data.channels || [];
  cache.set(cacheKey, channels, config.CACHE_CHANNELS_TTL);
  return channels;
}

// ─── Get events for a specific sport ────────────────────────────
async function getEventsBySport(sportKey) {
  const allEvents = await getAllEvents();
  return allEvents[sportKey] || [];
}

// ─── Build player embed URL ─────────────────────────────────────
function buildPlayerUrl(channelName, channelCode) {
  const name = encodeURIComponent(channelName.toLowerCase());
  const code = encodeURIComponent(channelCode.toLowerCase());
  return `${config.PLAYER_BASE}/channels/player/?name=${name}&code=${code}&${apiParams()}`;
}

// ─── Health check ───────────────────────────────────────────────
async function healthCheck() {
  try {
    const url = `${config.API_BASE}/events/sports/?${apiParams()}`;
    const data = await fetchWithRetry(url);
    const total = data['cdn-live-tv']?.total_events ?? data.total_events ?? 0;
    return { status: 'ok', total_events: total, timestamp: new Date().toISOString() };
  } catch (err) {
    return { status: 'error', error: err.message, timestamp: new Date().toISOString() };
  }
}

// ─── Cache stats ────────────────────────────────────────────────
function getCacheStats() {
  return cache.getStats();
}

function flushCache() {
  cache.flushAll();
}

module.exports = {
  getAllEvents,
  getAllChannels,
  getEventsBySport,
  buildPlayerUrl,
  healthCheck,
  getCacheStats,
  flushCache,
};
