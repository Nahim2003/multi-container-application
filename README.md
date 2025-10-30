Multi-Container App (Node + Postgres + Redis)
From “why won’t this run?” to 200 OK.
This repo spins up a 3-service dev stack with Docker Compose:
web – Node/Express app with /health and /db-test
db – Postgres 16 (persistent volume)
cache – Redis 7 (with healthcheck)
Stack
Node 22 (Alpine), Express
Postgres 16-alpine
Redis 7-alpine
Docker + Docker Compose
How it’s wired (quick picture)
browser/cli ──> localhost:3000  (published from container:3000)
                     │
                 [ web ]  ───────►  [ db ]    (host: db, port: 5432)
                   │
                   └────────────►  [ cache ]  (host: cache, port: 6379)

Healthchecks:
- web   → GET http://localhost:3000/health (checks Postgres + Redis)
- db    → pg_isready
- cache → redis-cli ping
Prerequisites
Docker Desktop or Docker Engine + Compose
(Optional) curl/wget for quick tests
Setup
Clone & enter
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
Create env file (don’t commit your real .env)
cp .env.example .env
# edit POSTGRES_PASSWORD in .env
.env.example (you’ll have this in the repo):
APP_PORT=3000
POSTGRES_PASSWORD=changeme
REDIS_URL=redis://cache:6379
The app uses DATABASE_URL from Compose:
postgres://myuser:${POSTGRES_PASSWORD}@db:5432/mydatabase
Build & run
docker compose up -d --build
docker compose ps
You should see (healthy) for db, cache, and web.
Quick tests
# Health of the web app
curl http://localhost:3000/health
# → {"ok":true}

# DB sanity: returns Postgres NOW()
curl http://localhost:3000/db-test
# → {"success":true,"time":{"now":"..."}}
(Optional) Add a Redis test route in server.js:
app.get('/cache-test', async (req, res) => {
  await redisClient.set('ping','pong');
  const v = await redisClient.get('ping');
  res.json({ redis: v });
});
Then:
curl http://localhost:3000/cache-test
# → {"redis":"pong"}
Useful commands
# see status & health
docker compose ps

# follow logs
docker compose logs -f web
docker compose logs -f db
docker compose logs -f cache

# restart just web after code changes
docker compose restart web

# rebuild web when Dockerfile/deps change
docker compose up -d --build web

# stop (keep data)
docker compose down

# stop and DELETE db data (careful!)
docker compose down -v
Project structure (simple)
.
├─ server.js
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example          # sample values (safe to commit)
├─ .gitignore
└─ .dockerignore
Notes & tips
Don’t commit .env. Keep secrets local. Use .env.example for placeholders.
Service names, not localhost: inside containers use db and cache, not localhost.
Healthchecks save time:
web: hits /health which does SELECT 1 + PING
db: pg_isready
cache: redis-cli ping
Graceful shutdown: app closes HTTP server, then pool.end(), then redis.quit().
Ports: only web is exposed to your host (APP_PORT:3000).
Remove ports: on db/redis if you don’t need host access.
Redis persistence (optional):
In docker-compose.yml:
services:
  cache:
    command: ["redis-server","--appendonly","yes"]
    volumes:
      - redisdata:/data
volumes:
  redisdata:
Troubleshooting
Can’t reach localhost:3000
docker compose ps → is web Up/healthy?
docker compose port web 3000 → expect 127.0.0.1:3000
Check logs: docker compose logs --tail=120 web
“password authentication failed for user myuser”
Your DB volume saved an old password. Easiest fix for dev:
set matching POSTGRES_PASSWORD and DATABASE_URL, then docker compose down -v and up -d --build.
“no such service: web”
Ensure web: is under services: (same indent level as db/cache).
License
MIT (or your choice)

