# AI Learning Insight – Backend

Layanan backend untuk platform AI Learning Insight yang menangani autentikasi, manajemen data pembelajaran, dan paparan fitur machine learning. Dibangun dengan Hapi.js, Knex, dan PostgreSQL.

## Stack Utama
- Node.js 20+, Hapi.js 21
- PostgreSQL 14+ via Knex (custom PG type parser di `src/db/pg-types.js`)
- JWT auth, token-bucket rate limit, logging `hapi-pino`, hosting statis `/uploads`

## Prasyarat
- Node.js 20+ dan npm
- PostgreSQL 14+ (lokal atau Docker)
- (Opsional) cURL/Postman untuk uji endpoint

### Jalankan PostgreSQL via Docker
```bash
docker run -d --name ali-pg ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=ali ^
  -p 5433:5432 postgres:16
```

## Langkah Cepat
1. **Clone & install**
   ```bash
   git clone <repo-url>
   cd backend
   npm ci
   ```
2. **Konfigurasi environment**  
   Buat `.env` (atau salin dari `.env.example`):
   ```dotenv
   PORT=8080
   NODE_ENV=development
   DATABASE_URL=postgres://postgres:postgres@localhost:5433/ali
   JWT_SECRET=change_me
   CORS_ORIGINS=http://localhost:5173
   ML_BASE_URL=
   ML_TIMEOUT_MS=5000
   ML_API_KEY=
   ```
3. **Pastikan skrip npm tersedia**
   Tambahkan bila perlu:
   ```json
   {
     "dev": "node --watch src/server.js",
     "start": "node src/server.js",
     "migrate:latest": "knex migrate:latest --knexfile ./knexfile.js",
     "migrate:rollback": "knex migrate:rollback --knexfile ./knexfile.js",
     "ml:bootstrap": "npm run migrate:latest && node scripts/ml_ingest.mjs \"./ml/source/Capstone_v2/data/data_ml\"",
     "ml:link": "node scripts/ml_link_users.mjs",
     "ml:candidates": "node scripts/ml_debug_candidates.mjs",
     "ml:debug": "node scripts/ml_debug_counts.mjs",
     "ml:link:one": "node scripts/ml_link_one.mjs"
   }
   ```
4. **Siapkan database & data ML**
   - Dataset: `backend/ml/source/Capstone_v2/`
     - Raw CSV: `data/data_ml/*.csv`
     - Opsional cluster: `modeling/clustered_learners.csv`
   - Jalankan:
     ```bash
     npm run ml:bootstrap   # migrasi + ingest semua CSV ke tabel ml_*
     npm run ml:link        # opsional, tautkan akun users dengan ml_users via email
     ```
   - Pengguna Windows: kutip path yang mengandung spasi (contoh skrip sudah melakukannya).
   - Opsional: jalankan `npm run seed:dev` untuk membuat akun demo (student/mentor/admin) dengan password default sehingga login bisa langsung dicoba.
5. **Jalankan server**
   ```bash
   npm run dev
   # server tersedia di http://localhost:8080
   ```
6. **Tes dasar**
   ```bash
   curl http://localhost:8080/health
   curl -X POST http://localhost:8080/auth/register -H "Content-Type: application/json" ^
     -d "{""name"":""Demo"",""email"":""demo@example.com"",""password"":""Demo@123""}"
   curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" ^
     -d "{""email"":""demo@example.com"",""password"":""Demo@123""}"
   ```
   Simpan token dari response untuk mengakses endpoint terproteksi.

## Struktur Folder
```
src/
  server.js
  routes/            # health, auth, me, todo, ml, predict
  controllers/
  services/
  plugins/           # auth, cors, logging, rateLimit, static
  validators/
  db/knex.js
migrations/          # definisi schema users, assessments, ml_*
scripts/
  ml_ingest.mjs
  ml_link_users.mjs
  ml_debug_candidates.mjs
  ml_debug_counts.mjs
  ml_link_one.mjs
ml/
  source/Capstone_v2/
    data/data_ml/*.csv
    modeling/clustered_learners.csv
uploads/             # file avatar (sudah di .gitignore)
docs/api-contract.md # dokumentasi API detail (opsional)
```

## Ringkasan API
| Method | Path                  | Auth | Deskripsi                                             |
|--------|-----------------------|------|-------------------------------------------------------|
| GET    | /health               | -    | Ping                                                  |
| POST   | /auth/register        | -    | Registrasi                                            |
| POST   | /auth/login           | -    | Login, menghasilkan JWT                               |
| GET    | /me                   | JWT  | Profil                                                |
| PATCH  | /me                   | JWT  | Update profil                                         |
| PATCH  | /me/password          | JWT  | Ganti password                                        |
| POST   | /me/avatar            | JWT  | Upload avatar (multipart)                             |
| GET    | /dashboard            | JWT  | Ringkasan data                                        |
| GET    | /assessments          | JWT  | Daftar assessments                                    |
| POST   | /assessments          | JWT  | Tambah assessment                                     |
| GET    | /todos                | JWT  | Daftar to-do                                          |
| POST   | /todos                | JWT  | Tambah to-do                                          |
| PATCH  | /todos/{id}/status    | JWT  | Update status to-do                                   |
| GET    | /ml/features          | JWT  | Fitur agregat user (materialized view)                |
| GET    | /ml/learner-type      | JWT  | Tipe pembelajar (cluster atau heuristik fallback)     |
| POST   | /ml/dropout-risk      | JWT  | Skor baseline risiko drop-out                         |

Contoh:
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8080/ml/features
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8080/ml/learner-type
```

## Alur Data ML
1. `scripts/ml_ingest.mjs` memproses CSV ke tabel `ml_users`, `ml_complete`, `ml_registration`, `ml_exam`, `ml_submission`, `ml_tracking`, dan agregat `ml_final_dataset` (sumber `[3] Merging Dataset Cleaning/final_dataset.csv`).
2. Script otomatis membangun ulang materialized view `ml_user_features` dari `ml_final_dataset` (bukan lagi agregasi manual lintas tabel).
3. Jika `modeling/clustered_learners.csv` tersedia, jalankan ingest untuk menulis `ml_learner_cluster`.
4. Endpoint `/ml/learner-type` memakai data cluster terlebih dahulu; bila tidak ada, fallback ke heuristik `ml_user_features` (selalu 200 bila user tertaut).

Gunakan `npm run ml:candidates` untuk melihat email yang punya data ML kaya, daftar dengan email tersebut, lalu jalankan `npm run ml:link` agar endpoint ML mengembalikan data.

## Keamanan & Praktik Baik
- Jangan commit `.env`; dokumentasikan di `.env.example`.
- Batas CORS default `http://localhost:5173` (sesuaikan deployment).
- Rate limit default 60 request/menit/IP.
- Kredensial sensitif di-log dengan masking oleh `hapi-pino`.
- Uploads disimpan di `backend/uploads` dan tidak di commit.

## Troubleshooting
- **Script `migrate:latest` tidak ada**: pastikan bagian `scripts` di `package.json` sudah dibuat atau jalankan langsung `npx knex migrate:latest --knexfile ./knexfile.js`.
- **`clustered_learners.csv not found`**: letakkan file di `ml/source/Capstone_v2/modeling/clustered_learners.csv` atau `ml/source/Capstone_v2/data/modeling/clustered_learners.csv`.
- **`/ml/learner-type` 404**: jalankan `npm run ml:link` (user belum terhubung ke data ML) dan pastikan `ml.routes.js` sudah diregister di `routes/index.js`.
- **Auth error**: cek `JWT_SECRET` dan header `Authorization: Bearer <token>`.
- **DB connect error**: sesuaikan `DATABASE_URL` (perhatikan port 5432 vs 5433).

## Kredensial Demo
- Default password user baru: `Student@123`
- Akun demo (dibuat via `npm run seed:dev` atau otomatis di Docker):
  - Student: `student@example.com / Student@123`
  - Mentor: `mentor@example.com / Mentor@123`
  - Admin: `admin@example.com / Admin@123`
