import 'dotenv/config';

// Render/Railway Postgres umumnya butuh SSL; aktifkan otomatis lewat env flag
const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_SERVICE_ID;
const isRailway =
  !!process.env.RAILWAY_PROJECT_ID ||
  !!process.env.RAILWAY_SERVICE_NAME ||
  !!process.env.RAILWAY_ENVIRONMENT;

const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  isRender ||
  isRailway;

const connectionString = process.env.DATABASE_URL;
const connection = useSsl
  ? {
      connectionString,
      ssl: { rejectUnauthorized: false },
    }
  : connectionString;

export default {
  client: 'pg',
  connection,
  pool: { min: 2, max: 10 },
  migrations: { directory: './migrations' },
};
