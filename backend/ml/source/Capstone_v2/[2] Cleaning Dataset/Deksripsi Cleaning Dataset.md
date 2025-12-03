## Ringkasan Aktivitas pada Notebook Ini

Pada file ini, serangkaian aktivitas telah dilakukan untuk membersihkan dan menyiapkan data dari berbagai berkas CSV, yang melibatkan langkah-langkah berikut:

1.  **Memuat Data Awal**

    - Setiap berkas CSV (`users.csv`, `developer_journey_trackings.csv`, `developer_journey_submissions.csv`, `developer_journey_completions.csv`, `exam_registrations.csv`, dan `exam_results.csv`) dimuat ke dalam DataFrame Pandas terpisah.

2.  **Inspeksi dan Pembersihan Awal Data**

    - Untuk setiap DataFrame, dilakukan inspeksi awal menggunakan `.head()` untuk melihat beberapa baris pertama, `.shape` untuk mengetahui dimensi data, dan `.info()` untuk detail kolom dan tipe data.
    - Dilakukan pengecekan nilai yang hilang (`.isnull().sum()`) dan baris duplikat (`.duplicated().sum()`).
    - Kolom-kolom yang berpotensi mengandung informasi tanggal (`created_at`, `updated_at`, `last_viewed`, `first_opened_at`, `completed_at`, `started_review_at`, `ended_review_at`, `deadline_at`, `retake_limit_at`, `exam_finished_at`, `deleted_at`) dikonversi ke tipe data datetime menggunakan `pd.to_datetime` dengan penanganan error.
    - Kolom-kolom yang seluruh isinya adalah nilai kosong (NaN) dihapus dari DataFrame.
    - Salinan dari DataFrame yang sudah dibersihkan dibuat (misalnya, `df_users_clean`).

3.  **Pembersihan Data Lanjutan**

    - **Penghapusan Koma pada Kolom ID**: Koma dan spasi yang mungkin ada pada kolom-kolom identifikasi (seperti `id`, `user_id`, `developer_id`, `submitter_id`, `exam_registration_id`, `examinees_id`, `exam_module_id`, `quiz_id`, `tutorial_id`, `journey_id`) dihapus untuk memastikan konsistensi dan memungkinkan konversi tipe data yang tepat.
    - **Penghapusan Kolom Tidak Diperlukan**: Beberapa kolom yang diidentifikasi tidak relevan untuk analisis lebih lanjut dihapus dari masing-masing DataFrame (misalnya, `remember_token`, `image_path`, `app_link`, `admin_comment`, dll.).
    - **Konsistensi Tipe Data**: Kolom-kolom ID dikonversi secara eksplisit ke tipe data string. Kolom-kolom yang seharusnya numerik (seperti `status`, `rating`, `study_duration`, `total_questions`, `score`, `is_passed`) dikonversi ke tipe data numerik menggunakan `pd.to_numeric`.
    - **Verifikasi Kolom Datetime**: Semua kolom tanggal dan waktu yang tersisa dikonversi kembali ke tipe data datetime untuk memastikan format yang benar.

4.  **Penyimpanan Data Bersih**
    - Semua DataFrame yang telah melalui proses pembersihan kemudian disimpan ke berkas CSV baru dengan awalan `clean_` (misalnya, `clean_users.csv`, `clean_tracking.csv`, dll.) untuk digunakan dalam analisis lebih lanjut.
