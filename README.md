# AI Learning Insight (ALI)

Monorepo platform pembelajaran adaptif yang memadukan backend Hapi.js (ingest fitur ML + insight API) dan frontend React/Tailwind untuk dashboard siswa dan mentor. Repositori ini menampung semua layanan dan orkestrasi Docker Compose agar pengalaman setup konsisten.

## Arsitektur Singkat
- **Backend (`./backend`)**: Hapi.js 21 + Knex + PostgreSQL 14 untuk autentikasi JWT, todo, assessment, profil, serta endpoint insight machine-learning yang memanfaatkan dataset CSV terstruktur. Script `ml:*` menyiapkan data dan materialized view.
- **Frontend (`./frontend`)**: React 19 + Vite 7 + Tailwind 3. Menggunakan Context API untuk sesi, Router DOM 7 untuk proteksi role (`student`, `mentor`, `admin`), dan komponen dashboard khusus.
- **Database**: PostgreSQL 16 (lokal atau container `db`). Parser tipe numeric->Number diaktifkan pada backend.

## Struktur Direktori
```
capstone/
|-- backend/      # Server Hapi.js + dokumentasi detail backend/readme.md
|-- frontend/     # React SPA + dokumentasi detail frontend/README.md
|-- docker-compose.yml
`-- (README ini)
```

## Prasyarat
- Node.js 20+ dan npm 10+
- Docker Desktop (opsional, wajib jika memakai `docker-compose`)
- Dataset ML lokal berada di `backend/ml/source/Project_struktur/` (lihat README backend)

## Setup Lokal (Non-Docker)
1. **Sediakan Postgres**  
   Gunakan instalasi lokal atau jalankan container cepat:
   ```bash
   docker run -d --name ali-pg \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=ali \
     -p 5433:5432 postgres:16
   ```
2. **Backend**
   ```bash
   cd backend
   cp .env.example .env   # atau buat manual sesuai README backend
   npm ci
   npm run ml:bootstrap   # migrasi + ingest CSV (lihat README backend untuk detail dataset)
   npm run ml:link        # opsional, tautkan akun app -> ml_users
   npm run dev            # http://localhost:8080
   ```
3. **Frontend**
   ```bash
   cd ../frontend
   cp .env.example .env   # set VITE_API_URL=http://localhost:8080
   npm ci
   npm run dev            # http://localhost:5173
   ```
4. **Login / testing**  
   - Default password user baru: `Student@123`
   - Akun demo siap pakai (jalankan `npm run seed:dev` di `backend/` jika butuh secara lokal; Compose menjalankannya otomatis):  
     - `student@example.com / Student@123`  
     - `mentor@example.com / Mentor@123`  
     - `admin@example.com / Admin@123`
   - Gunakan halaman `/login` lalu jelajahi dashboard/mentor/todo.

## Jalankan via Docker Compose
```bash
# pertama kali (atau setelah update dependencies)
docker compose build

docker compose up        # backend di :8080, frontend di :5173, postgres di :5433

# setelah semua container hidup, isi data ML + user app langsung siap login
docker compose exec backend npm run ml:bootstrap      # migrasi + ingest CSV ML
docker compose exec backend npm run import:ml-users   # buat akun app dari ml_users (password default: Student@123)
```
Catatan:
- Backend container otomatis menjalankan migrasi + seed user demo lalu dev server (lihat CMD di Dockerfile).
- Volume `./backend` dan `./frontend` di-mount sehingga perubahan kode langsung terlihat.
- `DATABASE_URL` di backend sudah menunjuk ke service `db`, jadi tidak memakai `localhost`.
- Akun hasil import ML memakai password default `Student@123`; bisa diubah lewat env `DEFAULT_ML_PASSWORD` sebelum menjalankan `npm run import:ml-users`.

## Variabel Lingkungan Utama
| Layanan  | File                    | Keterangan                                                            |
|----------|-------------------------|------------------------------------------------------------------------|
| Backend  | `backend/.env`          | `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `ML_*` settings  |
| Frontend | `frontend/.env`         | `VITE_API_URL` yang mengarah ke origin backend                        |
| Compose  | `docker-compose.yml`    | Override environment per container (lihat bagian `environment`)       |

Lengkapnya, lihat contoh di masing-masing README layanan.

## Skrip Penting
- Backend: `npm run dev`, `npm run migrate:latest`, `npm run ml:bootstrap`, `npm run ml:link`, `npm run ml:candidates`.
- Frontend: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.
- Compose: `docker compose up`, `docker compose down -v` (hapus volume DB jika perlu reset data).

## Alur Data ML (Ringkas)
1. CSV (`ml/source/Project_struktur/data/raw_data/*.csv`) diproses oleh `scripts/ml_ingest.mjs` -> tabel `ml_users`, `ml_registration`, `ml_exam`, dll.
2. Materialized view `ml_user_features` otomatis di-refresh selama ingest.
3. Opsional: file `modeling/clustered_learners.csv` membentuk tabel `ml_learner_cluster` untuk klasifikasi gaya belajar.
4. Jalankan `npm run ml:link` agar akun aplikasi terhubung dengan data ML berdasarkan email.

## Troubleshooting Cepat
- **DB tidak terhubung (ECONNREFUSED)**: cek `DATABASE_URL` (port 5432 vs 5433) dan status container `ali-db`.
- **CORS error di frontend**: pastikan backend `CORS_ORIGINS` mencantumkan origin FE (mis. `http://localhost:5173`).
- **Endpoint ML 404/401**: jalankan `npm run ml:link` dan gunakan akun yang email-nya terdaftar di dataset ML.
- **Docker Compose rebuild lambat**: gunakan `docker compose build backend frontend` setelah perubahan Dockerfile, sisanya akan reuse layer.

## Referensi
- Backend detail: `backend/readme.md`
- Frontend detail: `frontend/README.md`
- API contract: `backend/docs/api-contract.md`
- ML scripts: `backend/scripts/*.mjs`

Kontribusi atau penyesuaian internal sebaiknya tetap sinkron dengan README layanan masing-masing agar dokumentasi tetap konsisten.
