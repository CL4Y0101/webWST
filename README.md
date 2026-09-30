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

## Uji ESP32 dan DHT22

Sketch awal ada di `firmware/esp32-dht22-test/esp32-dht22-test.ino`. Sketch ini hanya membaca sensor melalui Serial Monitor; belum mengirim data ke Firebase.

1. Matikan daya ESP32 saat memasang kabel. Hubungkan DHT22 **VCC → 3V3**, **GND → GND**, dan **DATA → GPIO4**. Untuk sensor DHT22 tanpa papan modul (4 pin), pin ketiga tidak dipakai dan pasang resistor 10 kΩ antara VCC dan DATA. Untuk modul 3 pin, ikuti label VCC/DATA/GND pada papan, bukan urutan pin fisiknya.
2. Di Arduino IDE, pasang board package **esp32 by Espressif Systems** dan pilih board ESP32 yang sesuai. Pasang library **DHT sensor library by Adafruit** dan **Adafruit Unified Sensor** melalui Library Manager.
3. Buka sketch, pilih port USB ESP32, lalu Upload. Buka Serial Monitor pada **115200 baud**. Suhu dan kelembapan semestinya tampil setiap tiga detik. Jika muncul pesan gagal dibaca, periksa daya, GND, DATA, dan resistor pull-up.

Setelah bacaan sensor stabil, langkah berikutnya adalah mengirim data ke `/readings` memakai identitas perangkat yang diberi izin tulis oleh Firebase Authentication. Untuk dashboard demo publik, aturan baca boleh terbuka, tetapi jangan mengubah `.write` menjadi `true` untuk semua orang. LED, buzzer, dan OLED ditambahkan setelah jenis modul serta pin masing-masing dipastikan.

## Ambang prototype

| Kondisi | Suhu | Kelembapan |
| --- | --- | --- |
| Warning | ≥ 6 °C | ≥ 76% |
| Critical | ≥ 8 °C | ≥ 85% |

Angka tersebut hanya contoh simulasi dari kebutuhan PRD, **bukan standar industri**. Sesuaikan ambang dengan standar cold-chain dan metode penyimpanan tuna yang digunakan sebelum penerapan nyata. ESP32, LED, buzzer, dan LCD/OLED merupakan bagian hardware dan tidak dikendalikan oleh website ini.

## Pemeriksaan

```bash
npm run typecheck
npm run lint
npm run build
```
