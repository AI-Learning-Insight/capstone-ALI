# AI Learning Insight Frontend

Antarmuka React untuk platform AI Learning Insight (ALI). Aplikasi ini menyediakan dashboard siswa dan mentor, pengelolaan profil, todo, assessment, serta menampilkan insight ML yang diambil dari backend Hapi + PostgreSQL.

## Tech Stack
- React 19 + React Router DOM 7
- Vite 7 (dev server & bundler)
- Tailwind CSS 3 untuk styling utility-first
- Axios untuk HTTP client + interceptor auth (`src/lib/api.js`)
- Context API untuk sesi & otorisasi (`src/lib/auth-context.jsx`)
- Komponen UI kustom (Navbar, StatCard, LearningInsightsCard, dll.)

## Prasyarat
- Node.js 20+ dan npm 10+
- Backend ALI berjalan (default `http://localhost:8080`)
- (Opsional) Docker jika ingin menjalankan FE sebagai container

## Setup Cepat
1. **Clone repo & install**
   ```bash
   cd frontend
   npm ci
   ```
2. **Konfigurasi environment**  
   Salin `.env` dari contoh berikut:
   ```dotenv
   # URL backend Hapi (lihat backend/.env)
   VITE_API_URL=http://localhost:8080
   ```
3. **Jalankan pengembangan**
   ```bash
   npm run dev
   # buka http://localhost:5173
   ```
4. **Login** dengan akun yang dibuat via backend (contoh: `mentor@example.com / Mentor@123`).

## Skrip NPM
| Script            | Deskripsi                                       |
|-------------------|-------------------------------------------------|
| `npm run dev`     | Dev server + HMR                                |
| `npm run build`   | Build produksi ke `dist/`                        |
| `npm run preview` | Serve hasil build lokal                          |
| `npm run lint`    | Jalankan ESLint (React 19 + hooks rules)        |

## Struktur Proyek
```
frontend/
|-- src/
|   |-- pages/               # Dashboard, MentorDashboard, Profile, Todos, Assessment
|   |-- components/          # Navbar, ProtectedRoute, ProgressBar, komponen UI kecil
|   |-- features/dashboard/  # Kartu insight ML, statistik progres
|   |-- lib/                 # Auth context, helper axios, utilities notifikasi & kode siswa
|   |-- router.jsx           # Definisi route + proteksi role
|   `-- styles/tailwind.css  # Entrypoint Tailwind
|-- public/                  # Favicon dan asset statis
|-- index.html               # Vite entry
`-- Dockerfile               # Build FE sebagai static container (nginx)
```

## Fitur Utama
- **Auth & Role Routing**: `ProtectedRoute` dan `RoleHome` mengarahkan pengguna ke dashboard sesuai role (`student`, `mentor`, `admin`).
- **Student Dashboard**: insight gaya belajar, risiko dropout, todo ringkas, ringkasan assessment via `src/pages/Dashboard.jsx` dan `features/dashboard/LearningInsightsCard.jsx`.
- **Mentor Dashboard**: memonitor murid, insight cluster, dan data ML yang dipetakan ke mentor (`src/pages/MentorDashboard.jsx`).
- **Profil**: tab Info dan Security untuk memperbarui biodata serta password (`ProfileInfo.jsx`, `ProfileSecurity.jsx`).
- **Todo & Assessment**: daftar tugas personal dan form assessment berbasis API backend.
- **Notifikasi**: toast menggunakan `sonner`, helper di `src/lib/notify.js`.

## Integrasi API
- Base URL diambil dari `VITE_API_URL`. Pastikan origin FE diizinkan oleh backend CORS.
- Modul API utama:
  - `src/lib/api.js` untuk endpoint umum (todos, assessment, profil).
  - `src/lib/api-ml.js` untuk fitur ML (`/ml/features`, `/ml/learner-type`).
  - `src/lib/api-mentor.js` untuk endpoint mentor/dashboard.
- Auth context menyimpan token JWT di `localStorage` (`ali_token`) dan otomatis menambahkan header Authorization pada axios interceptor.

## Tailwind & Styling
- Tailwind dikonfigurasi di `tailwind.config.js` dengan tema kustom.
- Style global didefinisikan di `src/styles/tailwind.css` lalu diimport pada `main.jsx`.

## Docker (Opsional)
Build image statis dan jalankan di port 4173:
```bash
docker build -t ali-frontend .
docker run -d --name ali-fe -p 4173:4173 ali-frontend
```
Pastikan `VITE_API_URL` sudah dibuild sesuai URL backend publik.

## Testing Manual
1. Jalankan backend (`npm run dev` di folder backend) dan pastikan DB siap.
2. `npm run dev` untuk FE, buka `http://localhost:5173`.
3. Registrasi pengguna baru atau gunakan kredensial demo.
4. Verifikasi:
   - Dashboard siswa menampilkan kartu insight tanpa error.
   - `/mentor` hanya dapat diakses akun mentor/admin.
   - Halaman profil dapat mengubah data & password (cek toast sukses/gagal).
   - Todo CRUD dan Assessment form berhasil memanggil API dan menampilkan notifikasi.

## Troubleshooting
- **CORS error**: pastikan backend `.env` memasukkan origin FE (mis. `http://localhost:5173`).
- **Token hilang setelah refresh**: cek `localStorage` dan pastikan `auth-context` tidak dibersihkan oleh private mode/extension.
- **404 ketika refresh di halaman nested**: server hosting statis harus mengarah ke `index.html` (sudah dikonfigurasi di Dockerfile nginx bawaan).
- **Gagal build akibat memori**: gunakan `npm install --omit=dev` di lingkungan terbatas atau manfaatkan Docker build.

## Referensi Tambahan
- Backend README: `backend/readme.md` untuk menyiapkan API.
- API contract ringkas: `backend/docs/api-contract.md` (opsional) untuk memetakan payload FE.
