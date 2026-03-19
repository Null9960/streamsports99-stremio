#!/usr/bin/env node
// ─── Functional Tests for StreamSports99 Addon ──────────────────
const api = require('./api');
const transform = require('./transform');
const handlers = require('./handlers');
const manifest = require('./manifest');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  StreamSports99 Addon — Test Suite');
  console.log('═══════════════════════════════════════════════\n');

  // ─── Test 1: Manifest validity ──────────────────────────────
  console.log('📋 Test 1: Manifest');
  assert(manifest.id === 'community.streamsports99', 'Addon ID correct');
  assert(manifest.version === '1.0.0', 'Version correct');
  assert(manifest.resources.includes('catalog'), 'Has catalog resource');
  assert(manifest.resources.includes('meta'), 'Has meta resource');
  assert(manifest.resources.includes('stream'), 'Has stream resource');
  assert(manifest.types.includes('tv'), 'Has tv type');
  assert(manifest.catalogs.length > 5, `Has ${manifest.catalogs.length} catalogs`);
  assert(manifest.idPrefixes[0] === 'ss99', 'ID prefix is ss99');

  // ─── Test 2: API — Events ──────────────────────────────────
  console.log('\n🌐 Test 2: API — Fetch Events');
  try {
    const events = await api.getAllEvents();
    const sportKeys = Object.keys(events).filter(k => Array.isArray(events[k]));
    assert(sportKeys.length > 0, `Got ${sportKeys.length} sport categories`);

    const totalEvents = sportKeys.reduce((sum, k) => sum + events[k].length, 0);
    assert(totalEvents > 0, `Got ${totalEvents} total events`);

    // Check first event structure
    const firstSport = sportKeys[0];
    const firstEvent = events[firstSport][0];
    assert(firstEvent.gameID !== undefined, 'Event has gameID');
    assert(firstEvent.status !== undefined, 'Event has status');
    assert(firstEvent.channels !== undefined, 'Event has channels array');
    console.log(`  ℹ️  First event: ${firstEvent.homeTeam ? `${firstEvent.homeTeam} vs ${firstEvent.awayTeam}` : firstEvent.event} (${firstEvent.status})`);
  } catch (err) {
    assert(false, `API events fetch failed: ${err.message}`);
  }

  // ─── Test 3: API — Channels ────────────────────────────────
  console.log('\n📺 Test 3: API — Fetch Channels');
  try {
    const channels = await api.getAllChannels();
    assert(channels.length > 0, `Got ${channels.length} channels`);
    assert(channels[0].name !== undefined, 'Channel has name');
    assert(channels[0].code !== undefined, 'Channel has code');
    assert(channels[0].url !== undefined, 'Channel has url');
    assert(channels[0].image !== undefined, 'Channel has image');
    console.log(`  ℹ️  First channel: ${channels[0].name} (${channels[0].code})`);
  } catch (err) {
    assert(false, `API channels fetch failed: ${err.message}`);
  }

  // ─── Test 4: Transform — Event to Meta ─────────────────────
  console.log('\n🔄 Test 4: Transform Functions');
  const mockEvent = {
    gameID: 'TEST123',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    homeTeamIMG: 'https://example.com/a.png',
    awayTeamIMG: 'https://example.com/b.png',
    time: '20:00',
    tournament: 'Test League',
    country: 'Test',
    countryIMG: 'https://example.com/flag.png',
    status: 'live',
    start: '2026-03-19 20:00',
    end: '2026-03-19 22:00',
    channels: [
      { channel_name: 'ESPN', channel_code: 'us', url: 'https://example.com/player', image: 'https://example.com/espn.png', viewers: 100 },
      { channel_name: 'Sky Sports', channel_code: 'gb', url: 'https://example.com/player2', image: 'https://example.com/sky.png', viewers: 50 },
    ],
  };

  const metaPreview = transform.eventToMetaPreview('Soccer', mockEvent);
  assert(metaPreview.id === 'ss99_event_Soccer_TEST123', 'Event ID generated correctly');
  assert(metaPreview.type === 'tv', 'Type is tv');
  assert(metaPreview.name.includes('Team A vs Team B'), 'Name contains teams');
  assert(metaPreview.name.includes('LIVE'), 'Live badge present');

  const fullMeta = transform.eventToMeta('Soccer', mockEvent);
  assert(fullMeta.description.includes('ESPN'), 'Full meta lists channels');
  assert(fullMeta.genre.includes('Soccer'), 'Genre includes sport');

  const streams = transform.eventToStreams(mockEvent);
  assert(streams.length === 2, `Got ${streams.length} streams`);
  assert(streams[0].externalUrl !== undefined, 'Stream has externalUrl');
  assert(streams[0].name === 'ESPN', 'Stream name correct');

  // ID parsing
  const parsed = transform.parseEventId('ss99_event_Soccer_TEST123');
  assert(parsed.sportKey === 'Soccer', 'Parsed sport key correct');
  assert(parsed.gameID === 'TEST123', 'Parsed gameID correct');

  const chId = transform.channelId('ESPN', 'us');
  assert(chId === 'ss99_ch_us_espn', 'Channel ID generated correctly');
  const chParsed = transform.parseChannelId(chId);
  assert(chParsed.code === 'us', 'Parsed channel code correct');
  assert(chParsed.slug === 'espn', 'Parsed channel slug correct');

  // ─── Test 5: Catalog Handler — All Live ────────────────────
  console.log('\n📂 Test 5: Catalog Handler');
  try {
    const liveCatalog = await handlers.catalogHandler({ type: 'tv', id: 'ss99_all_live', extra: {} });
    assert(Array.isArray(liveCatalog.metas), 'Live catalog returns array');
    console.log(`  ℹ️  Live events: ${liveCatalog.metas.length}`);

    const upcomingCatalog = await handlers.catalogHandler({ type: 'tv', id: 'ss99_all_upcoming', extra: {} });
    assert(Array.isArray(upcomingCatalog.metas), 'Upcoming catalog returns array');
    console.log(`  ℹ️  Upcoming events: ${upcomingCatalog.metas.length}`);

    const soccerCatalog = await handlers.catalogHandler({ type: 'tv', id: 'ss99_sport_soccer', extra: {} });
    assert(Array.isArray(soccerCatalog.metas), 'Soccer catalog returns array');
    console.log(`  ℹ️  Soccer events: ${soccerCatalog.metas.length}`);

    const tvCatalog = await handlers.catalogHandler({ type: 'tv', id: 'ss99_livetv', extra: {} });
    assert(Array.isArray(tvCatalog.metas), 'LiveTV catalog returns array');
    assert(tvCatalog.metas.length > 0, `LiveTV has ${tvCatalog.metas.length} channels`);

    // Search test
    const searchResult = await handlers.catalogHandler({ type: 'tv', id: 'ss99_livetv', extra: { search: 'espn' } });
    assert(Array.isArray(searchResult.metas), 'Search returns array');
    console.log(`  ℹ️  Search 'espn': ${searchResult.metas.length} results`);
  } catch (err) {
    assert(false, `Catalog handler failed: ${err.message}`);
  }

  // ─── Test 6: Meta Handler ──────────────────────────────────
  console.log('\n📄 Test 6: Meta Handler');
  try {
    const events = await api.getAllEvents();
    const firstSport = Object.keys(events).find(k => Array.isArray(events[k]) && events[k].length > 0);
    if (firstSport) {
      const ev = events[firstSport][0];
      const testId = transform.eventId(firstSport, ev.gameID);

      const metaResult = await handlers.metaHandler({ type: 'tv', id: testId });
      assert(metaResult.meta !== null, 'Meta handler returns meta');
      assert(metaResult.meta.id === testId, 'Meta ID matches');
      console.log(`  ℹ️  Meta for: ${metaResult.meta.name}`);
    }

    // Non-existent ID
    const nullResult = await handlers.metaHandler({ type: 'tv', id: 'ss99_event_Soccer_NONEXISTENT' });
    assert(nullResult.meta === null, 'Non-existent meta returns null');
  } catch (err) {
    assert(false, `Meta handler failed: ${err.message}`);
  }

  // ─── Test 7: Stream Handler ────────────────────────────────
  console.log('\n🎬 Test 7: Stream Handler');
  try {
    const events = await api.getAllEvents();
    let testEvent = null;
    let testSport = null;
    for (const [sport, evList] of Object.entries(events)) {
      if (!Array.isArray(evList)) continue;
      const found = evList.find(e => (e.channels || []).length > 0);
      if (found) { testEvent = found; testSport = sport; break; }
    }

    if (testEvent) {
      const testId = transform.eventId(testSport, testEvent.gameID);
      const streamResult = await handlers.streamHandler({ type: 'tv', id: testId });
      assert(Array.isArray(streamResult.streams), 'Stream handler returns array');
      assert(streamResult.streams.length > 0, `Got ${streamResult.streams.length} streams`);
      assert(streamResult.streams[0].externalUrl !== undefined, 'Stream has externalUrl');
      console.log(`  ℹ️  Streams for: ${testEvent.homeTeam ? `${testEvent.homeTeam} vs ${testEvent.awayTeam}` : testEvent.event}`);
      console.log(`  ℹ️  First stream: ${streamResult.streams[0].name} → ${streamResult.streams[0].externalUrl.substring(0, 80)}...`);
    }

    // Non-existent ID
    const emptyResult = await handlers.streamHandler({ type: 'tv', id: 'ss99_event_Soccer_NONEXISTENT' });
    assert(emptyResult.streams.length === 0, 'Non-existent stream returns empty');
  } catch (err) {
    assert(false, `Stream handler failed: ${err.message}`);
  }

  // ─── Test 8: Health Check ──────────────────────────────────
  console.log('\n🏥 Test 8: Health Check');
  try {
    const health = await api.healthCheck();
    assert(health.status === 'ok', 'Health check OK');
    assert(health.total_events > 0, `Total events: ${health.total_events}`);
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // ─── Test 9: Cache ─────────────────────────────────────────
  console.log('\n💾 Test 9: Cache');
  const stats = api.getCacheStats();
  assert(stats.hits > 0, `Cache hits: ${stats.hits}`);
  assert(stats.keys > 0, `Cache keys: ${stats.keys}`);

  // ─── Summary ───────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
