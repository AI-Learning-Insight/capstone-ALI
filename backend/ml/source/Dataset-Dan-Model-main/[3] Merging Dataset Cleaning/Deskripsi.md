## Ringkasan Aktivitas Notebook

Notebook ini melakukan serangkaian langkah pra-pemrosesan data untuk menganalisis aktivitas pengguna dari berbagai sumber data yang berbeda. Tujuan utamanya adalah untuk membuat dua dataset teragregasi yang berbeda:

1.  **`final_dataset.csv`**: BErisi Insight dari aktivitas per-User.
2.  **`df_record_full.csv`**: BErisi catatan lengkap semua aktivitas pengguna, Digunakan untuk proses CLustering.

### 1. Import Library

- Mengimpor pustaka `pandas` untuk manipulasi data dan `numpy` untuk operasi numerik.

### 2. Load Data

Beberapa file CSV dimuat ke dalam DataFrame Pandas:

- `df_users` dari `clean_users.csv`
- `df_tracking` dari `clean_tracking.csv`
- `df_submission` dari `clean_submissions.csv`
- `df_complete` dari `clean_completions.csv`
- `df_regist` dari `clean_exam_registrations.csv`
- `df_exam` dari `clean_exam_results.csv`
- `df_journey` dari `developer_journeys.csv`

Setiap DataFrame kemudian diperiksa informasinya menggunakan `df.info()` untuk memahami struktur dan tipe datanya.

### 3. Normalisasi Primary Key untuk Tahap Merging

Kolom-kolom kunci utama (`user_id`, `regist_id`, `journey_id`) diubah namanya di beberapa DataFrame (`df_users`, `df_tracking`, `df_submission`, `df_complete`, `df_regist`, `df_exam`, `df_journey`) untuk memastikan konsistensi dan memfasilitasi penggabungan data yang akurat.

### 4. Mencari Total dan Average Setiap User (Menghasilkan `final_dataset.csv`)

Bagian ini fokus pada agregasi metrik kunci untuk setiap pengguna:

- **Tracking Summary**: Menghitung `total_tracking_events` (total aktivitas pelacakan) dan `total_completed_modules` (total modul yang diselesaikan) dari `df_tracking`.
- **Submission Summary**: Menghitung `total_submissions` (total pengiriman) dan `avg_submission_rating` (rata-rata rating pengiriman) dari `df_submission`.
- **Completion Summary**: Menghitung `avg_study_duration` (rata-rata durasi belajar) dan `avg_completion_rating` (rata-rata rating penyelesaian) dari `df_complete`.
- **Exam Score Summary**: Menggabungkan `df_exam` dan `df_regist` untuk menghitung `avg_exam_score` (rata-rata nilai ujian) dan `exam_pass_rate` (tingkat kelulusan ujian).
- **Last Activity Summary**: Menghitung `days_since_last_active` (jumlah hari sejak aktivitas terakhir) dari `df_tracking`.
- **Merging Data Summary**: Semua ringkasan agregasi di atas digabungkan dengan `df_users` berdasarkan `user_id` untuk membentuk DataFrame akhir, `df_final`.
- **Ubah Tipe Data**: Kolom-kolom integer di `df_final` diisi dengan nilai 0 untuk NaN dan diubah ke tipe `int`. Kolom `phone` diformat agar dimulai dengan '62'. Kolom float dibulatkan menjadi 2 angka desimal dan nilai NaN diisi 0.
- **Penyimpanan Data**: DataFrame `df_final` yang berisi ringkasan metrik per pengguna disimpan ke file CSV bernama `final_dataset.csv`.

### 5. Mencari Aktivitas Semua User (Untuk Clustering - Menghasilkan `df_record_full.csv`)

Bagian ini bertujuan untuk membuat dataset yang lebih detail yang menggabungkan semua aktivitas pengguna untuk analisis clustering:

- **Mengambil Kolom yang Dibutuhkan**: Memilih subset kolom yang relevan dari `df_users`, `df_journey`, `df_submission`, dan `df_complete`. Sebuah DataFrame `df_exam_full` juga dibuat dengan menggabungkan `df_regist` dan `df_exam`.
- **Merge Data**: Semua subset DataFrame ini digabungkan secara bertahap ke `df_tracking` untuk membuat `df_record_full` yang komprehensif. Kolom `time_to_complete_hours` dihitung sebagai selisih waktu antara `completed_at` dan `first_opened_at`.
- **Penyimpanan Data**: DataFrame `df_record_full` yang berisi catatan detail semua aktivitas pengguna disimpan ke file CSV bernama `df_record_full.csv`.

## File Output yang Dihasilkan dan Fungsinya:

1.  **`final_dataset.csv`**:

    - **Fungsi**: Berisi ringkasan metrik kinerja dan aktivitas untuk setiap pengguna, seperti total aktivitas, modul yang diselesaikan, rating submission, durasi belajar, nilai ujian, tingkat kelulusan, dan hari sejak aktivitas terakhir.

2.  **`df_record_full.csv`**:
    - **Fungsi**: Berisi catatan gabungan yang sangat detail dari setiap aktivitas pengguna, termasuk informasi dari tracking, submission, completion, dan hasil ujian, digabungkan dengan detail pengguna dan perjalanan belajar. Dataset ini dirancang untuk Clustering dan untuk mengidentifikasi pola perilaku pengguna, analisis jalur pembelajaran, atau pembangunan model rekomendasi.
