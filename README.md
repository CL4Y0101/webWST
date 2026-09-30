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

1. Matikan daya ESP32 saat memasang kabel. Untuk **modul DHT22 tiga pin**, ikuti tulisan pada papan modul (urutan kaki bisa berbeda):

   | Label DHT22 | Pin ESP32 |
   | --- | --- |
   | `+` / `VCC` | `3V3` |
   | `S` / `OUT` / `DATA` | `GPIO4` (kadang tertulis `4` atau `IO4`) |
   | `-` / `GND` | `GND` |

   Modul tiga pin biasanya sudah memiliki resistor pull-up. Jangan menebak urutan kaki jika label tidak terlihat. Untuk sensor DHT22 tanpa papan modul (4 pin), pin ketiga tidak dipakai dan pasang resistor 10 kΩ antara VCC dan DATA.
2. Di Arduino IDE, pasang board package **esp32 by Espressif Systems** dan pilih board ESP32 yang sesuai. Pasang library **DHT sensor library by Adafruit** dan **Adafruit Unified Sensor** melalui Library Manager.
3. Buka sketch, pilih port USB ESP32, lalu Upload. Buka Serial Monitor pada **115200 baud**. Suhu dan kelembapan semestinya tampil setiap tiga detik. Jika muncul pesan gagal dibaca, periksa daya, GND, DATA, dan resistor pull-up.

Setelah bacaan sensor stabil, langkah berikutnya adalah mengirim data ke `/readings` memakai identitas perangkat yang diberi izin tulis oleh Firebase Authentication. Untuk dashboard demo publik, aturan baca boleh terbuka, tetapi jangan mengubah `.write` menjadi `true` untuk semua orang. LED, buzzer, dan OLED ditambahkan setelah jenis modul serta pin masing-masing dipastikan.

### Mengirim bacaan ESP32 ke Firebase

1. Di Firebase Console, buka **Authentication → Sign-in method**, aktifkan **Email/Password**. Pada tab **Users**, buat akun khusus untuk ESP32 dan catat **UID** akun tersebut. Jangan memakai password akun pribadi.
2. Buka **Realtime Database → Rules**. Gunakan `examples/firebase-rules-device.json` yang sudah berisi UID akun ESP32, lalu terapkan aturan pada path `/readings`. Jika database punya aturan lain, gabungkan aturan ini tanpa menghapus akses yang masih dibutuhkan. Pastikan tidak ada aturan `.write: true` pada root atau parent yang membuat pembatasan UID tidak berlaku. Aturan contoh membiarkan dashboard dibaca publik dan mengizinkan akun ESP32 menambah bacaan baru saja.
3. Salin `firmware/esp32-firebase/secrets.example.h` menjadi `firmware/esp32-firebase/secrets.h`. Isi Wi-Fi 2,4 GHz, Web API Key Firebase, serta email dan password akun ESP32. `secrets.h` diabaikan Git. Jangan menaruh password di Next.js atau Vercel.
4. Di Arduino IDE, pasang library **ArduinoJson** selain library DHT yang sudah dipakai saat uji sensor. Buka `firmware/esp32-firebase/esp32-firebase.ino`, pilih board dan port ESP32, lalu Upload.
5. Buka Serial Monitor **115200 baud**. Urutan yang diharapkan: Wi-Fi terhubung, waktu tersinkron, Firebase Auth berhasil, kemudian `Terkirim` setiap 60 detik. Periksa node `/readings/esp32-...` di Firebase Console dan refresh dashboard Vercel. Sketch mengirim `temperature`, `humidity`, dan `timestamp`; dashboard menghitung statusnya.

Pada suhu ruangan sekitar 32 °C, status dashboard akan **CRITICAL** karena ambang suhu prototype saat ini adalah 8 °C. Ini hanya uji aliran data; ambang prototype belum mewakili standar penyimpanan tuna. Sertifikat CA Google untuk HTTPS ada di `firmware/esp32-firebase/google_root_cas.h` dan perlu diperbarui bila rantai sertifikat layanan berubah. Password akun perangkat tersimpan di firmware ESP32 untuk demo ini; gunakan akun khusus yang izinnya terbatas pada data sensor.

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
