import pg from 'pg';

const { types } = pg;
// OID PostgreSQL: 1700=numeric, 700=float4, 701=float8
const toNum = (v) => (v === null ? null : Number(v));
types.setTypeParser(1700, toNum);
types.setTypeParser(700, toNum);
types.setTypeParser(701, toNum);

// NOTE: jangan set int8 (OID 20) ke Number kalau pakai big id karena bisa overflow.
