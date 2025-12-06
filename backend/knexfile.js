import 'dotenv/config';

// Render Postgres umumnya butuh SSL; aktifkan otomatis lewat env flag
const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  process.env.RENDER === 'true' ||
  !!process.env.RENDER_SERVICE_ID;

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
