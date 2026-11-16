# arcvnMD — Nexadev API build

## Upload via Android
Upload the CONTENTS of this ZIP to the GitHub repository root. Keep `api/`, `public/`, `package.json`, and `vercel.json` at repository root. Import/redeploy the repository in Vercel. No npm install is needed on the phone.

## Routes
- `/index.html` — separate landing page
- `/anime.html` — catalogue/search
- `/detail.html?url=<encoded anime URL>` — anime detail and episode list
- `/watch.html?url=<encoded episode URL>&title=<title>` — player
- `/api/anime?recent=1&page=1`
- `/api/anime?completed=1&page=1`
- `/api/anime?search=naruto`
- `/api/anime?details=<encoded anime URL>`
- `/api/anime?stream=<encoded episode URL>`
- `/api/health`

The proxy preserves Nexadev's lowercase query keys. The frontend accepts `data.animeList` as array or object. `data.episodes` is read as an array, and the player uses `data.streamUrl` (including Blogger embed URLs).

External API uptime, source availability, and embedded player permissions are outside this project's control.
