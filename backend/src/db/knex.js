// backend/src/db/knex.js
import './pg-types.js'; 
import knexPkg from 'knex';
import knexConfig from '../../knexfile.js';

// Kompatibel CJS/ESM
const createKnex = knexPkg?.default ?? knexPkg;
const config = knexConfig?.default ?? knexConfig;

const db = createKnex(config);

// Ekspor multi-alaisas agar semua import lama tetap jalan
export default db;      // import knex from '../db/knex.js'
export { db };         // import { db } from '../db/knex.js'
export { db as knex }; // import { knex } from '../db/knex.js'
