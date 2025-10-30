🐳 Multi-Container App: Node + Postgres + Redis
From “why won’t this run?” to 200 OK.
This project spins up a 3-service development stack with Docker Compose.
🚀 Overview
web – Node/Express app with /health and /db-test endpoints
db – Postgres 16 (with a persistent volume)
cache – Redis 7 (with healthcheck)
🧰 Stack
Node 22 (Alpine) + Express
Postgres 16-alpine
Redis 7-alpine
Docker + Docker Compose
🧩 Architecture at a Glance
browser/cli ──> localhost:3000  (published from container:3000)
                     │
                 [ web ]  ───────►  [ db ]    (host: db, port: 5432)
                   │
                   └────────────►  [ cache ]  (host: cache, port: 6379)

Healthchecks:
- web   → GET http://localhost:3000/health (checks Postgres + Redis)
- db    → pg_isready
- cache → redis-cli ping
🧱 Prerequisites
Docker Desktop or Docker Engine + Compose
(Optional) curl or wget for quick tests
⚙️ Setup
1️⃣ Clone & Enter
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
2️⃣ Create an Environment File
cp .env.example .env
# edit POSTGRES_PASSWORD in .env
🧾 Configuration (.env)
Commit .env.example, not your real .env.
APP_PORT=3000
POSTGRES_PASSWORD=changeme
REDIS_URL=redis://cache:6379
The app uses DATABASE_URL from docker-compose.yml:
postgres://myuser:${POSTGRES_PASSWORD}@db:5432/mydatabase
🏗️ Build & Run
docker compose up -d --build
docker compose ps
You should see (healthy) for db, cache, and web.
🔍 Quick Tests
# Health of the web app
curl http://localhost:3000/health
# → {"ok":true}

# DB sanity check: returns Postgres NOW()
curl http://localhost:3000/db-test
# → {"success":true,"time":{"now":"..."}}
Optional: Redis Test Route
Add this to server.js:
app.get('/cache-test', async (req, res) => {
  await redisClient.set('ping', 'pong');
  const v = await redisClient.get('ping');
  res.json({ redis: v });
});
Then test:
curl http://localhost:3000/cache-test
# → {"redis":"pong"}
🧰 Useful Docker Commands
# show status & health
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
🗂️ Project Structure
.
├─ server.js
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example          # sample values (safe to commit)
├─ .gitignore
└─ .dockerignore
💡 Notes & Tips
❌ Don’t commit .env. Keep secrets local.
✅ Use .env.example for safe placeholders.
Service names, not localhost: inside containers use db and cache, not localhost.
Healthchecks save time:
web → /health (checks Postgres + Redis)
db → pg_isready
cache → redis-cli ping
Graceful shutdown: app closes HTTP server → pool.end() → redis.quit().
Ports: only web is exposed to your host (APP_PORT:3000).
Remove ports: from db/redis if you don’t need host access.
🧱 Optional: Redis Persistence
Enable Append Only File (AOF) persistence:
services:
  cache:
    command: ["redis-server","--appendonly","yes"]
    volumes:
      - redisdata:/data

volumes:
  redisdata:
🧭 Troubleshooting
Can’t reach localhost:3000
docker compose ps          # check if web is up/healthy
docker compose port web 3000
docker compose logs --tail=120 web
“password authentication failed for user myuser”
The DB volume saved an old password.
Fix: set matching POSTGRES_PASSWORD and DATABASE_URL, then:
docker compose down -v
docker compose up -d --build
“no such service: web”
Ensure web: is under services: (same indent level as db and cache).
📜 License
MIT (or your choice)
✅ Summary
You now have:
A multi-container environment running Node, Postgres, and Redis
Healthchecks, environment variables, and clean shutdowns
A solid Docker Compose base for future projects 🚀
