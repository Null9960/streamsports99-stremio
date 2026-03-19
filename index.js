#!/usr/bin/env node
// ─── StreamSports99 Stremio Addon ───────────────────────────────
// Works both as: standalone server (npm start) AND Vercel serverless
const { addonBuilder, getRouter, serveHTTP } = require('stremio-addon-sdk');
const manifest = require('./manifest');
const handlers = require('./handlers');
const api = require('./api');
const config = require('./config');

// ─── Build addon ────────────────────────────────────────────────
const builder = new addonBuilder(manifest);
builder.defineCatalogHandler(handlers.catalogHandler);
builder.defineMetaHandler(handlers.metaHandler);
builder.defineStreamHandler(handlers.streamHandler);

const addonInterface = builder.getInterface();

// ─── Export for Vercel serverless ────────────────────────────────
// Vercel imports this module and uses the Express router
const express = require('express');
const app = express();

// CORS headers for Stremio
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  next();
});

// Health endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await api.healthCheck();
    res.json(health);
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Mount the Stremio addon router
app.use(getRouter(addonInterface));

// ─── Standalone mode (npm start) ────────────────────────────────
if (require.main === module) {
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║        StreamSports99 Stremio Addon v${config.ADDON_VERSION}                  ║
╠══════════════════════════════════════════════════════════════╣
║  Local:    http://localhost:${PORT}/manifest.json                    ║
║  Health:   http://localhost:${PORT}/health                           ║
║  API:      cdn-live.tv (${config.API_USER}/${config.API_PLAN})                        ║
╚══════════════════════════════════════════════════════════════╝`);
  });

  // Startup health check
  api.healthCheck().then(h => {
    console.log(`[HEALTH] ${h.status} — ${h.total_events} events available`);
  }).catch(err => {
    console.error(`[HEALTH] Failed: ${err.message}`);
  });
}

// ─── Export for Vercel / serverless ─────────────────────────────
module.exports = app;
