## **ClusteringModel**

File notebook ini melakukan serangkaian langkah untuk mengklasifikasikan pengguna berdasarkan pola pembelajaran mereka menggunakan metode _clustering_.

### **1. Persiapan Awal**

- **Import Library**: Mengimpor pustaka yang diperlukan untuk analisis data (pandas, numpy), visualisasi (matplotlib, seaborn), perhitungan (math, scipy), _clustering_ (KMeans, silhouette_score, KElbowVisualizer, PCA), dan _preprocessing_ (StandardScaler, MinMaxScaler, LabelEncoder).

### **2. Pemuatan dan Eksplorasi Data**

- **Load Dataset**: Memuat dataset dari file `df_record_full.csv`. Dataset ini berisi data aktivitas pengguna.
- **Exploratory Data Analysis (EDA)**:
  - Menganalisis distribusi fitur numerik melalui histogram.
  - Mengevaluasi korelasi antar fitur menggunakan heatmap.
  - Memeriksa keberadaan _outlier_ pada fitur numerik dengan boxplot.

### **3. Preprocessing Data**

- **Parsing Date Column**: Mengubah kolom-kolom tanggal (`first_opened_at`, `completed_at`, `last_viewed`, `last_activity_date`) ke format datetime.
- **Mencari data yang Valid**: Memfilter data untuk hanya menyertakan entri di mana `first_opened_opened_at` atau `completed_at` tidak kosong.
- **Handling outlier**: Memfilter _outlier_ pada kolom `time_to_complete_hours` agar nilainya berada di antara 0 dan 24.
- **Membuang Kolom yang tidak dibutuhkan**: Menghapus kolom-kolom yang tidak relevan untuk _clustering_ seperti ID, informasi pribadi (nama, email, telepon), metadata kelas, dan status kategori mentah.
- **Membuat Kolom Baru**: Menambahkan kolom `activity_date` berdasarkan `completed_at` atau `first_opened_at`.
- **Feature Engineering**: Membuat fitur `is_completed` (apakah modul selesai) dan `is_repeat` (apakah modul diulang oleh pengguna yang sama).
- **Aggregasi Setiap User**: Melakukan agregasi data per `user_id` untuk mendapatkan fitur-fitur penting seperti `avg_time_to_complete`, `total_completed_modules`, `active_days`, `repeat_ratio`, `avg_submission_rating`, `avg_exam_score`, dan `exam_pass_rate` ke dalam `df_features_cluster`.
- **Membersihkan Hasil Aggregasi**: Menangani nilai tak terbatas (`np.inf`, `-np.inf`) dan nilai kosong (`NaN`) dengan menggantinya menjadi 0.
- **Menghapus Kolom `total_activities`**: Menghapus kolom `total_activities` dari `df_features_cluster` karena `active_days` sudah cukup merepresentasikan aktivitas.
- **Melakukan Standard Scaler**: Menskalakan fitur-fitur numerik dalam `df_features_cluster` menggunakan `StandardScaler` untuk mempersiapkan data untuk _clustering_.

### **4. Model Clustering**

- **Visualisasi Elbow Method**: Menggunakan `KElbowVisualizer` untuk membantu menentukan jumlah cluster (k) yang optimal.
- **Silhouette Score**: Menghitung _Silhouette Score_ untuk evaluasi kualitas _clustering_ dengan `k=3`.
- **PCA (Principal Component Analysis)**: Menerapkan PCA dengan 3 komponen untuk reduksi dimensi data yang diskalakan sebelum _clustering_ (meskipun _clustering_ akhir dilakukan pada data yang diskalakan tanpa PCA).
- **Interpretasi Cluster**: Menerapkan algoritma K-Means dengan 3 cluster pada data yang sudah diskalakan dan menambahkan label cluster ke `df_features_cluster`.

### **5. Pemetaan dan Penyimpanan Hasil Cluster**

- **Mapping Hasil Cluster**: Memberikan nama deskriptif pada setiap cluster (misalnya, "Fast Learner", "Consistent Learner", "Reflective Learner") ke dalam kolom `learner_type`.

### **6. Output File**

Berikut adalah file-file yang dihasilkan dari proses ini:

- **`df_classification.csv`**:

  - **Fungsi**: Digunakan sebagai dataset untuk tahap klasifikasi. Berisi `user_id`, fitur-fitur yang diagregasi, `learner_type` (tipe pembelajar), dan `learner_label` (representasi numerik dari `learner_type`).

- **`df_dashboard.csv`**:

  - **Fungsi**: Dirancang untuk keperluan _dashboard_ web. Berisi informasi lengkap pengguna dari dataset awal (`df_final.csv`) yang digabungkan dengan `learner_type` hasil _clustering_.

- **`df_convert.csv`**:
  - **Fungsi**: Versi modifikasi dari `df_dashboard.csv` dengan format khusus. Kolom telepon diawali spasi dan kolom-kolom float diformat ulang agar menggunakan koma sebagai pemisah desimal. File ini digunakan untuk cek hasil pada Excel.
