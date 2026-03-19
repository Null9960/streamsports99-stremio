// ─── Transform cdn-live.tv data → Stremio format ────────────────
const config = require('./config');
const api = require('./api');

const PREFIX = config.ID_PREFIX;

// ─── Generate unique Stremio IDs ────────────────────────────────
function eventId(sportKey, gameID) {
  return `${PREFIX}_event_${sportKey}_${gameID}`;
}

function channelId(name, code) {
  return `${PREFIX}_ch_${code}_${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

// ─── Parse an ID back to components ─────────────────────────────
function parseEventId(id) {
  // ss99_event_Soccer_ToA5xIWZ
  const match = id.match(/^ss99_event_([^_]+)_(.+)$/);
  if (!match) return null;
  return { sportKey: match[1], gameID: match[2] };
}

function parseChannelId(id) {
  // ss99_ch_us_espn
  const match = id.match(/^ss99_ch_([^_]+)_(.+)$/);
  if (!match) return null;
  return { code: match[1], slug: match[2] };
}

// ─── Status badge ───────────────────────────────────────────────
function statusBadge(status) {
  switch (status) {
    case 'live': return '🔴 LIVE';
    case 'upcoming': return '🕐 Upcoming';
    case 'finished': return '✅ Finished';
    default: return status || '';
  }
}

// ─── Event → Stremio Meta Preview (catalog item) ────────────────
function eventToMetaPreview(sportKey, event) {
  const sportInfo = config.SPORTS[sportKey] || { name: sportKey, emoji: '🏟️' };

  // Some events have homeTeam/awayTeam, others have 'event' field
  let name, poster;
  if (event.homeTeam && event.awayTeam) {
    name = `${event.homeTeam} vs ${event.awayTeam}`;
    poster = event.homeTeamIMG || event.awayTeamIMG || null;
  } else {
    name = event.event || 'Unknown Event';
    poster = event.eventIMG || null;
  }

  const badge = statusBadge(event.status);
  const channelCount = (event.channels || []).length;

  return {
    id: eventId(sportKey, event.gameID),
    type: 'tv',
    name: `${badge} ${name}`,
    poster: poster,
    posterShape: 'square',
    description: [
      `${sportInfo.emoji} ${sportInfo.name} — ${event.tournament || ''}`,
      `${badge}`,
      event.time ? `Time: ${event.time} UTC` : '',
      event.country ? `Country: ${event.country}` : '',
      channelCount > 0 ? `${channelCount} channel(s) available` : 'No channels yet',
    ].filter(Boolean).join('\n'),
    releaseInfo: event.time ? `${event.time} UTC` : undefined,
    logo: event.countryIMG || undefined,
    background: poster || undefined,
    links: [],
    behaviorHints: {
      isLive: event.status === 'live',
    },
  };
}

// ─── Event → Full Stremio Meta (detail page) ────────────────────
function eventToMeta(sportKey, event) {
  const preview = eventToMetaPreview(sportKey, event);
  const sportInfo = config.SPORTS[sportKey] || { name: sportKey, emoji: '🏟️' };
  const channels = event.channels || [];

  let description = preview.description + '\n\n';
  if (channels.length > 0) {
    description += '📺 Available Channels:\n';
    channels.forEach((ch, i) => {
      description += `  ${i + 1}. ${ch.channel_name} (${(ch.channel_code || '').toUpperCase()})`;
      if (ch.viewers > 0) description += ` — ${ch.viewers} viewers`;
      description += '\n';
    });
  }

  return {
    ...preview,
    description,
    genre: [sportInfo.name, event.tournament || ''].filter(Boolean),
    releaseInfo: event.start ? `${event.start} UTC` : (event.time ? `${event.time} UTC` : undefined),
    runtime: event.start && event.end ? calcRuntime(event.start, event.end) : undefined,
    website: `https://streamsports99.ru/`,
  };
}

// ─── Event → Stremio Streams ────────────────────────────────────
function eventToStreams(event) {
  const channels = event.channels || [];
  if (channels.length === 0) return [];

  return channels.map((ch, index) => {
    const playerUrl = ch.url || api.buildPlayerUrl(ch.channel_name, ch.channel_code);

    return {
      name: `${ch.channel_name}`,
      title: `${ch.channel_name} (${(ch.channel_code || '').toUpperCase()})${ch.viewers > 0 ? ` — ${ch.viewers} viewers` : ''}`,
      externalUrl: playerUrl,
      behaviorHints: {
        notWebReady: false,
        bingeGroup: `ss99-${event.gameID}`,
      },
    };
  });
}

// ─── Channel → Stremio Meta Preview (for Live TV catalog) ───────
function channelToMetaPreview(channel) {
  return {
    id: channelId(channel.name, channel.code),
    type: 'tv',
    name: `📺 ${channel.name}`,
    poster: channel.image || null,
    posterShape: 'square',
    description: [
      `Channel: ${channel.name}`,
      `Country: ${(channel.code || '').toUpperCase()}`,
      `Status: ${channel.status === 'online' ? '🟢 Online' : '🔴 Offline'}`,
      channel.viewers > 0 ? `Viewers: ${channel.viewers}` : '',
    ].filter(Boolean).join('\n'),
    behaviorHints: {
      isLive: true,
    },
  };
}

// ─── Channel → Full Meta ────────────────────────────────────────
function channelToMeta(channel) {
  return {
    ...channelToMetaPreview(channel),
    genre: ['Live TV'],
    website: 'https://streamsports99.ru/',
  };
}

// ─── Channel → Stream ──────────────────────────────────────────
function channelToStreams(channel) {
  const playerUrl = channel.url || api.buildPlayerUrl(channel.name, channel.code);
  return [{
    name: channel.name,
    title: `${channel.name} (${(channel.code || '').toUpperCase()}) — ${channel.status === 'online' ? '🟢 Online' : '🔴 Offline'}`,
    externalUrl: playerUrl,
    behaviorHints: {
      notWebReady: false,
    },
  }];
}

// ─── Helper: calculate runtime string ───────────────────────────
function calcRuntime(start, end) {
  try {
    const s = new Date(start.replace(' ', 'T') + 'Z');
    const e = new Date(end.replace(' ', 'T') + 'Z');
    const mins = Math.round((e - s) / 60000);
    if (mins > 0) return `${mins} min`;
  } catch (e) {}
  return undefined;
}

module.exports = {
  eventId,
  channelId,
  parseEventId,
  parseChannelId,
  eventToMetaPreview,
  eventToMeta,
  eventToStreams,
  channelToMetaPreview,
  channelToMeta,
  channelToStreams,
};
