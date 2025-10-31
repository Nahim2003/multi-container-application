# 🐳 Multi-Container App: Node + Postgres + Redis

From “why won’t this run?” to **200 OK**.
This project spins up a **3-service development stack** using **Docker Compose**.

---

## 🚀 Overview

* **web** – Node/Express app with `/health` and `/db-test` endpoints
* **db** – Postgres 16 (with persistent volume)
* **cache** – Redis 7 (with healthcheck)

---

## 🧰 Stack

* Node 22 (Alpine) + Express
* Postgres 16-alpine
* Redis 7-alpine
* Docker + Docker Compose

---

## 🧩 Architecture at a Glance

```text
browser/cli ──> localhost:3000  (published from container:3000)
                     │
                 [ web ]  ───────►  [ db ]    (host: db, port: 5432)
                   │
                   └────────────►  [ cache ]  (host: cache, port: 6379)

Healthchecks:
- web   → GET http://localhost:3000/health (checks Postgres + Redis)
- db    → pg_isready
- cache → redis-cli ping
```

---

## 🧱 Prerequisites

* Docker Desktop or Docker Engine + Compose
* *(Optional)* curl or wget for quick endpoint testing

---

## ⚙️ Setup

### 1️⃣ Clone & Enter the Project

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2️⃣ Create a `.env` File

```bash
cp .env.example .env
# Edit POSTGRES_PASSWORD in .env
```

---

## 🧾 Configuration (.env)

Commit `.env.example`, **not your real `.env`** file.

```env
APP_PORT=3000
POSTGRES_PASSWORD=changeme
REDIS_URL=redis://cache:6379
```

> The app uses `DATABASE_URL` defined in your `docker-compose.yml`:
> `postgres://myuser:${POSTGRES_PASSWORD}@db:5432/mydatabase`

---

## 🏗️ Build & Run the Containers

```bash
docker compose up -d --build
docker compose ps
```

You should see `(healthy)` for `db`, `cache`, and `web`.

---

## 🔍 Quick Tests

Check the **health endpoint**:

```bash
curl http://localhost:3000/health
# → {"ok":true}
```

Check the **database connection**:

```bash
curl http://localhost:3000/db-test
# → {"success":true,"time":{"now":"..."}}
```

---

### 🧠 Optional: Add a Redis Test Route

Add this to your `server.js`:

```js
app.get('/cache-test', async (req, res) => {
  await redisClient.set('ping', 'pong');
  const v = await redisClient.get('ping');
  res.json({ redis: v });
});
```

Then test it:

```bash
curl http://localhost:3000/cache-test
# → {"redis":"pong"}
```

---

## 🧰 Useful Docker Commands

```bash
# Show container status & health
docker compose ps

# View logs
docker compose logs -f web
docker compose logs -f db
docker compose logs -f cache

# Restart just the web app
docker compose restart web

# Rebuild web after changes to Dockerfile or dependencies
docker compose up -d --build web

# Stop (keep data)
docker compose down

# Stop and DELETE all data (careful!)
docker compose down -v
```

---

## 🗂️ Project Structure

```text
.
├─ server.js
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example          # sample values (safe to commit)
├─ .gitignore
└─ .dockerignore
```

---

## 💡 Notes & Tips

* ❌ **Don’t commit `.env`** — keep secrets local.
  ✅ Use `.env.example` for safe placeholders.
* **Use service names, not localhost:**
  Inside containers, use `db` and `cache`, *not* `localhost`.
* **Healthchecks save time:**

  * web → `/health` (checks Postgres + Redis)
  * db → `pg_isready`
  * cache → `redis-cli ping`
* **Graceful shutdown:** app closes HTTP server → ends DB pool → quits Redis client.
* **Ports:** only web is exposed to your host (`APP_PORT:3000`).
  Remove `ports:` from db/redis if you don’t need local host access.

---

## 🧱 Optional: Redis Persistence

Enable Append-Only File (AOF) persistence for Redis:

```yaml
services:
  cache:
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redisdata:/data

volumes:
  redisdata:
```

---

## 🧭 Troubleshooting

### ❌ Can’t reach `localhost:3000`

```bash
docker compose ps
docker compose port web 3000
docker compose logs --tail=120 web
```

### 🔐 “password authentication failed for user myuser”

The DB volume saved an old password.

**Fix:**

1. Match `POSTGRES_PASSWORD` and `DATABASE_URL` in `.env`
2. Recreate containers:

   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

### ⚙️ “no such service: web”

Ensure `web:` is **under** `services:` (same indent level as `db` and `cache`).


---

## ✅ Summary

You now have:

* A fully working **multi-container environment** (Node + Postgres + Redis)
* Proper **healthchecks**, environment configs, and graceful shutdown
* A solid **Docker Compose foundation** for future projects 🚀

---
