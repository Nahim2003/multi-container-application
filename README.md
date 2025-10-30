cp .env.example .env
docker compose up -d --build
curl http://localhost:3000/health
