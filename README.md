# 🏟️ StreamSports99 — Stremio Live Sports Addon

Live sports events and 650+ TV channels for Stremio, powered by cdn-live.tv API.

## Features

- 🔴 **100+ live events daily** across 24 sports
- ⚽🏀🏈🏒🎾🏏 Soccer, NBA, NFL, NHL, Tennis, Cricket, Motorsport...
- 📺 **651 international TV channels** with search
- 🕐 Live / Upcoming / Finished status badges
- 📡 Multiple broadcast channels per event

## Install in Stremio

Paste this URL in Stremio → Addons:

```
https://YOUR-DEPLOYMENT-URL/manifest.json
```

## Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Null9960/streamsports99-stremio)

Or manually:

```bash
npm i -g vercel
vercel --prod
```

## Run Locally

```bash
npm install
npm start
# → http://localhost:7000/manifest.json
```

## Project Structure

```
├── index.js          # Express server + Vercel serverless export
├── manifest.js       # Stremio manifest (27 catalogs)
├── config.js         # Configuration + sport mappings
├── api.js            # cdn-live.tv API client (cache + retry)
├── transform.js      # API → Stremio format transformer
├── handlers.js       # Catalog, Meta, Stream handlers
├── test.js           # 49 functional tests
├── vercel.json       # Vercel deployment config
└── package.json
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `7000` | Local server port |
| `CDN_USER` | `cdnlivetv` | cdn-live.tv API user |
| `CDN_PLAN` | `free` | cdn-live.tv API plan |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /manifest.json` | Addon manifest |
| `GET /catalog/tv/{id}.json` | Catalog listings |
| `GET /catalog/tv/{id}/search={q}.json` | Search channels |
| `GET /meta/tv/{id}.json` | Event/channel details |
| `GET /stream/tv/{id}.json` | Stream URLs |
| `GET /health` | Health check |

## 27 Catalogs

🔴 All Live Now · 🕐 Upcoming · ⚽ Soccer · 🏀 NBA · 🏈 NFL · 🏒 NHL · ⚾ MLB · 🎓 NCAA · 🎓 NCAAW · 🏏 Cricket · 🎾 Tennis · ⛳ Golf · 🏎️ Motorsport · 🏀 Basketball · 🏐 Volleyball · 🤾 Handball · 🎯 Darts · 🥊 MMA · 🥊 UFC · 💪 WWE · 🚴 Cycling · 🐎 Horse Racing · ❄️ Winter Sports · 🏒 Hockey · ⚽ Futsal · 🏸 Badminton · 📺 Live TV

## License

MIT
