// ─── Stremio Addon Request Handlers ─────────────────────────────
const config = require('./config');
const api = require('./api');
const transform = require('./transform');

// ═══════════════════════════════════════════════════════════════
// CATALOG HANDLER
// ═══════════════════════════════════════════════════════════════
async function catalogHandler(args) {
  const { type, id, extra } = args;
  console.log(`[CATALOG] type=${type} id=${id} extra=${JSON.stringify(extra || {})}`);

  if (type !== 'tv') return { metas: [] };

  const skip = parseInt(extra?.skip, 10) || 0;
  const LIMIT = 100;

  try {
    // ─── All Live Now ─────────────────────────────────────────
    if (id === 'ss99_all_live') {
      const allEvents = await api.getAllEvents();
      const metas = [];

      for (const [sportKey, events] of Object.entries(allEvents)) {
        if (!Array.isArray(events)) continue;
        for (const ev of events) {
          if (ev.status === 'live') {
            metas.push(transform.eventToMetaPreview(sportKey, ev));
          }
        }
      }

      return { metas: metas.slice(skip, skip + LIMIT) };
    }

    // ─── All Upcoming ─────────────────────────────────────────
    if (id === 'ss99_all_upcoming') {
      const allEvents = await api.getAllEvents();
      const metas = [];

      for (const [sportKey, events] of Object.entries(allEvents)) {
        if (!Array.isArray(events)) continue;
        for (const ev of events) {
          if (ev.status === 'upcoming') {
            metas.push(transform.eventToMetaPreview(sportKey, ev));
          }
        }
      }

      // Sort by start time
      metas.sort((a, b) => {
        const tA = a.releaseInfo || '';
        const tB = b.releaseInfo || '';
        return tA.localeCompare(tB);
      });

      return { metas: metas.slice(skip, skip + LIMIT) };
    }

    // ─── Per-Sport catalog ────────────────────────────────────
    const sportMatch = id.match(/^ss99_sport_(.+)$/);
    if (sportMatch) {
      const slug = sportMatch[1];
      // Find the sport key from slug
      const sportEntry = Object.entries(config.SPORTS).find(([k, v]) => v.slug === slug);
      if (!sportEntry) return { metas: [] };

      const sportKey = sportEntry[0];
      const events = await api.getEventsBySport(sportKey);

      // Sort: live first, then upcoming, then finished
      const statusOrder = { live: 0, upcoming: 1, finished: 2 };
      const sorted = [...events].sort((a, b) => {
        const oA = statusOrder[a.status] ?? 3;
        const oB = statusOrder[b.status] ?? 3;
        if (oA !== oB) return oA - oB;
        return (a.time || '').localeCompare(b.time || '');
      });

      const metas = sorted.map(ev => transform.eventToMetaPreview(sportKey, ev));
      return { metas: metas.slice(skip, skip + LIMIT) };
    }

    // ─── Live TV Channels ─────────────────────────────────────
    if (id === 'ss99_livetv') {
      const channels = await api.getAllChannels();
      let filtered = channels;

      // Search support
      if (extra?.search) {
        const q = extra.search.toLowerCase();
        filtered = channels.filter(ch =>
          ch.name.toLowerCase().includes(q) ||
          (ch.code || '').toLowerCase().includes(q)
        );
      }

      // Online first
      filtered.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (b.status === 'online' && a.status !== 'online') return 1;
        return a.name.localeCompare(b.name);
      });

      const metas = filtered.map(ch => transform.channelToMetaPreview(ch));
      return { metas: metas.slice(skip, skip + LIMIT) };
    }

    return { metas: [] };

  } catch (err) {
    console.error(`[CATALOG] Error: ${err.message}`);
    return { metas: [] };
  }
}

// ═══════════════════════════════════════════════════════════════
// META HANDLER
// ═══════════════════════════════════════════════════════════════
async function metaHandler(args) {
  const { type, id } = args;
  console.log(`[META] type=${type} id=${id}`);

  if (type !== 'tv') return { meta: null };

  try {
    // ─── Event meta ───────────────────────────────────────────
    const eventParsed = transform.parseEventId(id);
    if (eventParsed) {
      const events = await api.getEventsBySport(eventParsed.sportKey);
      const event = events.find(e => e.gameID === eventParsed.gameID);
      if (event) {
        return { meta: transform.eventToMeta(eventParsed.sportKey, event) };
      }

      // If not found in sport-specific, search all
      const allEvents = await api.getAllEvents();
      for (const [sportKey, evList] of Object.entries(allEvents)) {
        if (!Array.isArray(evList)) continue;
        const found = evList.find(e => e.gameID === eventParsed.gameID);
        if (found) {
          return { meta: transform.eventToMeta(sportKey, found) };
        }
      }

      return { meta: null };
    }

    // ─── Channel meta ─────────────────────────────────────────
    const chParsed = transform.parseChannelId(id);
    if (chParsed) {
      const channels = await api.getAllChannels();
      const channel = channels.find(ch =>
        ch.code.toLowerCase() === chParsed.code &&
        ch.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === chParsed.slug
      );
      if (channel) {
        return { meta: transform.channelToMeta(channel) };
      }
      return { meta: null };
    }

    return { meta: null };

  } catch (err) {
    console.error(`[META] Error: ${err.message}`);
    return { meta: null };
  }
}

// ═══════════════════════════════════════════════════════════════
// STREAM HANDLER
// ═══════════════════════════════════════════════════════════════
async function streamHandler(args) {
  const { type, id } = args;
  console.log(`[STREAM] type=${type} id=${id}`);

  if (type !== 'tv') return { streams: [] };

  try {
    // ─── Event streams ────────────────────────────────────────
    const eventParsed = transform.parseEventId(id);
    if (eventParsed) {
      // Search across all events
      const allEvents = await api.getAllEvents();
      for (const [sportKey, evList] of Object.entries(allEvents)) {
        if (!Array.isArray(evList)) continue;
        const event = evList.find(e => e.gameID === eventParsed.gameID);
        if (event) {
          return { streams: transform.eventToStreams(event) };
        }
      }
      return { streams: [] };
    }

    // ─── Channel streams ──────────────────────────────────────
    const chParsed = transform.parseChannelId(id);
    if (chParsed) {
      const channels = await api.getAllChannels();
      const channel = channels.find(ch =>
        ch.code.toLowerCase() === chParsed.code &&
        ch.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === chParsed.slug
      );
      if (channel) {
        return { streams: transform.channelToStreams(channel) };
      }
      return { streams: [] };
    }

    return { streams: [] };

  } catch (err) {
    console.error(`[STREAM] Error: ${err.message}`);
    return { streams: [] };
  }
}

module.exports = { catalogHandler, metaHandler, streamHandler };
