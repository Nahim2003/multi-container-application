import express from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const APP_PORT = process.env.APP_PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://myuser:mypassword@localhost:5432/mydatabase';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';


// Middleware to parse JSON requests
app.use(express.json());

// Sample route to test database connection
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');            // DB alive?
    const pong = await redisClient.ping();   // Redis alive?
    if (pong !== 'PONG') throw new Error('No PONG');
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});



let pool;
let redisClient;


process.on('SIGINT', () => shutdown().catch(console.error));
process.on('SIGTERM', () => shutdown().catch(console.error));

let server;

async function start() {
    try {
      pool = new Pool({ connectionString: DATABASE_URL });
      redisClient = createClient({ url: REDIS_URL });
      
      await redisClient.connect();
      await pool.query('SELECT 1'); // readiness probe (don't use pool.connect())

      const APP_PORT = Number(process.env.APP_PORT) || 3000;
      app.listen(APP_PORT, () => {
        console.log(`Server on ${APP_PORT}`);
      });

    } catch (error) {
      console.error('Startup failed:', error);
      process.exit(1);
    }
  }


async function shutdown() {
  try {
    // stop taking new requests (server comes from start())
    await new Promise((resolve) => server?.close(resolve));   

    // close DB pool
    await pool?.end();

    // close Redis
    await redisClient?.quit();
  } finally {
    process.exit(0);
  }
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
