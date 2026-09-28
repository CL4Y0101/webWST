# TunaGuard

Website dashboard Next.js untuk prototype monitoring suhu dan kelembapan ruang penyimpanan tuna, berdasarkan `PRD_TunaGuard_Monitoring_IoT.pdf`.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Tanpa konfigurasi Firebase, dashboard memakai **mode simulasi** yang ditandai di antarmuka. Tombol Normal, Warning, dan Critical dapat dipakai untuk menguji perubahan status, grafik, dan riwayat.

## Menghubungkan Firebase Realtime Database

1. Buat project Firebase dan aktifkan **Realtime Database**.
2. Salin `.env.example` menjadi `.env.local`, lalu isi seluruh variabel dengan konfigurasi aplikasi web Firebase Anda.
3. Kirim pembacaan sensor ke path `/readings/{readingId}` dengan bentuk berikut:

```json
{
  "temperature": 5.2,
  "humidity": 70,
  "status": "NORMAL",
  "timestamp": 1790591420000
}
```

`timestamp` menerima Unix milliseconds, Unix seconds, atau string tanggal yang dapat dibaca JavaScript. `status` menerima `NORMAL`, `WARNING`, atau `CRITICAL`. Jika status tidak ada, dashboard menghitungnya menggunakan ambang prototype di `lib/readings.ts`.

Dashboard membaca hingga 100 data terakhir secara real-time. Atur Firebase Realtime Database Rules agar hanya pengguna/perangkat yang berhak dapat membaca dan menulis data sebelum dipakai di lingkungan nyata. Konfigurasi web Firebase bukan pengganti aturan akses database.

## Ambang prototype

| Kondisi | Suhu | Kelembapan |
| --- | --- | --- |
| Warning | ≥ 6 °C | ≥ 76% |
| Critical | ≥ 8 °C | ≥ 85% |

Angka tersebut hanya contoh simulasi dari kebutuhan PRD, **bukan standar industri**. Sesuaikan ambang dengan standar cold-chain dan metode penyimpanan tuna yang digunakan sebelum penerapan nyata. Perangkat Wemos/ESP8266, LED, buzzer, dan LCD/OLED merupakan bagian hardware dalam PRD dan tidak dikendalikan oleh website ini.

## Pemeriksaan

```bash
npm run typecheck
npm run lint
npm run build
```
