# TunaGuard — Design Specification

## 1. Overview

**TunaGuard** adalah dashboard monitoring IoT untuk memantau suhu dan kelembapan ruang penyimpanan ikan tuna pada kendaraan logistik.

Website harus memberikan informasi terpenting dalam beberapa detik:

- Berapa suhu saat ini?
- Berapa kelembapan saat ini?
- Apakah kondisi aman?
- Kapan data terakhir diterima?
- Bagaimana perubahan kondisi selama perjalanan?
- Apakah pernah terjadi kondisi WARNING atau CRITICAL?

Desain harus mengutamakan:

1. **Monitoring**
2. **Readability**
3. **Fast status recognition**
4. **Real-time feedback**
5. **Responsive dashboard**
6. **Simple prototype implementation**

---

# 2. Design Direction

## Visual Concept

Tema visual:

> **Cold Chain Monitoring Dashboard**

Karakter desain:

- Clean
- Industrial
- Modern
- Technical
- Minimal
- Data-focused
- High readability

Tampilan tidak boleh terlalu dekoratif karena fungsi utama sistem adalah monitoring.

Inspirasi visual:

- IoT dashboard
- Fleet monitoring
- Cold-chain monitoring
- Industrial control panel
- Modern logistics dashboard

Gunakan layout berbasis card dengan hierarki informasi yang jelas.

---

# 3. Design Principles

## 3.1 Status First

Status kondisi kendaraan merupakan informasi dengan prioritas tertinggi.

Urutan prioritas tampilan:

1. System Status
2. Temperature
3. Humidity
4. Last Update
5. Historical Chart
6. Alert History

---

## 3.2 Glanceable

Operator harus bisa memahami kondisi hanya dengan melihat dashboard selama beberapa detik.

Contoh:

```text
Temperature
5.2 °C

Humidity
70%

Status
NORMAL

Last Update
14:30:20
```

Jangan membuat pengguna membaca paragraf untuk mengetahui kondisi sistem.

---

## 3.3 Color Has Meaning

Warna status hanya digunakan untuk informasi kondisi.

### NORMAL

- Green
- Sistem berada dalam threshold prototype

### WARNING

- Amber / Yellow
- Salah satu parameter melewati threshold warning

### CRITICAL

- Red
- Parameter telah melewati threshold critical

Warna status harus konsisten di:

- status badge
- card
- chart marker
- alert history
- device indicator

---

# 4. Color System

## Base Colors

```css
--background: #07111F;
--surface: #0D1B2A;
--surface-secondary: #132638;
--border: #1E3A4F;

--text-primary: #F8FAFC;
--text-secondary: #94A3B8;
--text-muted: #64748B;
```

## Brand Colors

```css
--primary: #0EA5E9;
--primary-light: #38BDF8;
--primary-dark: #0369A1;
```

Primary blue merepresentasikan:

- cold storage
- water
- temperature monitoring
- technology

---

## Status Colors

```css
--normal: #22C55E;
--warning: #F59E0B;
--critical: #EF4444;
```

Gunakan warna status secara moderat.

Jangan membuat seluruh dashboard berubah merah ketika critical.

Gunakan warna pada:

- status indicator
- border
- badge
- icon
- alert section

---

# 5. Typography

Gunakan font modern dan mudah dibaca.

Recommended:

```text
Inter
```

Fallback:

```css
font-family:
Inter,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;
```

---

## Typography Scale

### Dashboard Title

```text
28–32px
700
```

### Section Title

```text
18–20px
600
```

### Card Label

```text
13–14px
500
```

### Sensor Value

```text
36–48px
700
```

### Unit

```text
16–20px
500
```

### Supporting Text

```text
13–14px
400
```

---

# 6. Application Layout

Desktop layout:

```text
┌───────────────────────────────────────────────────────┐
│ TunaGuard                         Device ● ONLINE     │
├───────────────┬───────────────────────────────────────┤
│               │                                       │
│ Sidebar       │ Dashboard Header                      │
│               │                                       │
│ Dashboard     │ Status Banner                         │
│ Monitoring    │                                       │
│ History       │ Temperature | Humidity | Last Update │
│ Alerts        │                                       │
│               │ Temperature Chart                     │
│               │                                       │
│               │ Humidity Chart                        │
│               │                                       │
│               │ Recent Alerts / Data                  │
│               │                                       │
└───────────────┴───────────────────────────────────────┘
```

---

# 7. Navigation

## Sidebar

Menu MVP:

```text
TunaGuard

Dashboard
Monitoring
History
Alerts
```

Bottom sidebar:

```text
Device
TG-001

Connection
ONLINE
```

### Active Menu

Gunakan:

- primary background
- primary icon
- stronger text

Contoh:

```text
▣ Dashboard
```

---

# 8. Top Bar

Top bar berisi:

```text
TunaGuard Dashboard

Last Sync: 14:30:20

● DEVICE ONLINE
```

Optional:

```text
Prototype Mode
```

Badge ini penting untuk menunjukkan bahwa sistem menggunakan threshold simulasi.

---

# 9. Dashboard Header

Contoh:

```text
Cold Storage Monitoring

Vehicle TG-001
Real-time monitoring of tuna storage conditions.
```

Sebelah kanan:

```text
● LIVE
Last update 3 seconds ago
```

---

# 10. System Status Banner

Komponen terpenting dashboard.

Normal:

```text
✓ STORAGE CONDITION NORMAL

Temperature and humidity are within the configured
prototype threshold.
```

Warning:

```text
⚠ STORAGE CONDITION WARNING

Temperature has exceeded the warning threshold.
```

Critical:

```text
! CRITICAL STORAGE CONDITION

Storage condition requires immediate attention.
```

Status banner memiliki:

- status icon
- status name
- short description
- timestamp

---

# 11. Sensor Cards

Gunakan grid:

```text
┌─────────────────┐
│ TEMPERATURE     │
│                 │
│ 5.2 °C          │
│                 │
│ ● Normal        │
└─────────────────┘

┌─────────────────┐
│ HUMIDITY        │
│                 │
│ 70 %            │
│                 │
│ ● Normal        │
└─────────────────┘

┌─────────────────┐
│ LAST UPDATE     │
│                 │
│ 14:30:20        │
│                 │
│ 3 sec ago       │
└─────────────────┘
```

Temperature card icon:

```text
Thermometer
```

Humidity card icon:

```text
Droplets
```

Timestamp icon:

```text
Clock
```

Recommended icon library:

```text
Lucide Icons
```

---

# 12. Temperature Chart

Section:

```text
Temperature History
```

Gunakan:

```text
Line Chart
```

X-axis:

```text
Time
```

Y-axis:

```text
Temperature (°C)
```

Contoh:

```text
8°C ─────────────────────
7°C ───────── Warning
6°C
5°C       ╭───╮
4°C ─────╯    ╰────────
3°C
   12:00 13:00 14:00
```

Tambahkan threshold reference line.

Contoh:

```text
Warning Threshold
Critical Threshold
```

---

# 13. Humidity Chart

Gunakan layout dan behavior yang sama dengan temperature chart.

Y-axis:

```text
Humidity (%)
```

X-axis:

```text
Time
```

---

# 14. Chart Controls

Tambahkan filter:

```text
1H
6H
12H
24H
```

Default:

```text
6H
```

MVP dapat menggunakan:

```text
1H
6H
24H
```

Jika data masih sedikit, tidak perlu filtering kompleks.

---

# 15. Current Device Panel

Section:

```text
Device Information
```

Data:

```text
Device ID
TG-001

Sensor
DHT22

Controller
Wemos D1 Mini / ESP8266

Connection
ONLINE

Firebase
CONNECTED

Last Sensor Update
14:30:20
```

---

# 16. History Table

Halaman:

```text
History
```

Table:

| Time | Temperature | Humidity | Status |
|---|---:|---:|---|
| 14:30:20 | 5.2°C | 70% | NORMAL |
| 14:29:20 | 5.4°C | 71% | NORMAL |
| 14:28:20 | 7.1°C | 73% | WARNING |
| 14:27:20 | 9.4°C | 76% | CRITICAL |

Status menggunakan badge.

```text
NORMAL
WARNING
CRITICAL
```

---

# 17. Alert History

Alert tidak perlu mencatat seluruh pembacaan.

Hanya perubahan kondisi penting.

Contoh:

```text
14:28

WARNING

Temperature exceeded warning threshold.

Temperature: 7.1 °C
Humidity: 73%
```

Critical:

```text
14:27

CRITICAL

Temperature reached critical threshold.

Temperature: 9.4 °C
Humidity: 76%
```

---

# 18. Real-Time Update

Website harus menerima perubahan data Firebase tanpa reload manual.

Ketika data baru datang:

```text
Firebase
   ↓
Realtime Listener
   ↓
Dashboard State
   ↓
UI Update
```

Elemen yang berubah:

- temperature
- humidity
- status
- last update
- chart
- history

---

# 19. Live Indicator

Saat data aktif:

```text
● LIVE
```

Saat koneksi Firebase terputus:

```text
● DISCONNECTED
```

Jika data terlalu lama:

```text
● STALE DATA
```

Contoh rule prototype:

```text
< 30 seconds
LIVE

30–120 seconds
STALE

> 120 seconds
OFFLINE
```

Nilai tersebut merupakan parameter UI prototype dan dapat dikonfigurasi.

---

# 20. Loading State

Saat dashboard pertama kali dibuka:

Gunakan skeleton.

Contoh:

```text
Temperature
████████

Humidity
████████

Chart
████████████████
████████████████
```

Jangan langsung menampilkan:

```text
0 °C
0%
```

karena dapat dianggap sebagai pembacaan sensor asli.

---

# 21. Empty State

Jika belum ada data:

```text
No Sensor Data

Waiting for data from TunaGuard device.

Device:
TG-001
```

CTA opsional:

```text
Retry Connection
```

---

# 22. Error State

Jika Firebase gagal diakses:

```text
Unable to Load Sensor Data

Connection with monitoring server could not be established.

Retry
```

Data terakhir yang berhasil dibaca boleh tetap ditampilkan dengan badge:

```text
STALE DATA
```

---

# 23. Responsive Design

## Desktop

```text
>= 1024px
```

Sidebar permanen.

Cards:

```text
3 columns
```

Chart full-width.

---

## Tablet

```text
768px – 1023px
```

Sidebar dapat collapse.

Cards:

```text
2 columns
```

---

## Mobile

```text
< 768px
```

Sidebar menjadi drawer.

Cards:

```text
1 column
```

Urutan:

```text
Status
Temperature
Humidity
Last Update
Chart
Alerts
History
```

Sensor value harus tetap besar.

---

# 24. Recommended Dashboard Structure

```text
Dashboard
│
├── Header
│   ├── Title
│   ├── Vehicle ID
│   └── Connection Status
│
├── SystemStatus
│
├── SensorGrid
│   ├── TemperatureCard
│   ├── HumidityCard
│   └── LastUpdateCard
│
├── TemperatureChart
│
├── HumidityChart
│
├── DeviceInformation
│
└── RecentAlerts
```

---

# 25. Component Design

Recommended reusable components:

```text
AppSidebar
TopNavigation
StatusBanner
SensorCard
TemperatureCard
HumidityCard
ConnectionBadge
StatusBadge
RealtimeIndicator
ChartCard
TemperatureChart
HumidityChart
DeviceCard
AlertCard
HistoryTable
EmptyState
ErrorState
LoadingSkeleton
```

---

# 26. Status Badge Design

NORMAL:

```text
● NORMAL
```

WARNING:

```text
▲ WARNING
```

CRITICAL:

```text
● CRITICAL
```

Badge harus memiliki:

- icon
- text
- color

Jangan menggunakan warna sebagai satu-satunya indikator karena alasan accessibility.

---

# 27. Status Logic Presentation

Threshold berasal dari konfigurasi aplikasi.

Contoh struktur:

```javascript
temperature: {
  warning: value,
  critical: value
}

humidity: {
  warning: value,
  critical: value
}
```

UI tidak boleh menyatakan nilai prototype sebagai standar cold-chain industri.

Tambahkan keterangan:

```text
Prototype Threshold
```

atau:

```text
Simulation Threshold
```

pada halaman informasi/configuration.

---

# 28. Animation

Animation harus subtle.

Duration:

```text
150–300ms
```

Gunakan animation untuk:

- card entrance
- status transition
- live indicator
- chart update
- sidebar transition

Hindari animation dekoratif berlebihan.

---

## Status Transition

Contoh:

```text
NORMAL
↓
WARNING
```

Status banner boleh menggunakan:

```text
fade + subtle pulse
```

Critical indicator boleh pulse ringan.

Jangan menggunakan flashing animation yang agresif.

---

# 29. Dashboard Interaction

Hover card:

```text
slight elevation
border highlight
```

Chart:

```text
hover → tooltip
```

Tooltip:

```text
14:30

Temperature
5.2 °C

Humidity
70%
```

---

# 30. Accessibility

Minimum requirements:

- text contrast tinggi
- icon tidak menjadi satu-satunya indikator
- status selalu memiliki label teks
- keyboard accessible
- semantic HTML
- chart memiliki textual summary
- button memiliki aria-label bila perlu

Target:

```text
WCAG AA
```

---

# 31. Recommended Frontend Stack

Recommended implementation:

```text
Next.js
TypeScript
Tailwind CSS
Firebase SDK
Recharts
Lucide React
```

Optional:

```text
Framer Motion
```

Tetapi animation tidak wajib untuk MVP.

---

# 32. Suggested Project Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── history/
│   │   └── page.tsx
│   └── alerts/
│       └── page.tsx
│
├── components/
│   ├── dashboard/
│   │   ├── SensorCard.tsx
│   │   ├── StatusBanner.tsx
│   │   ├── TemperatureChart.tsx
│   │   ├── HumidityChart.tsx
│   │   └── DeviceInformation.tsx
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   │
│   └── ui/
│       ├── Badge.tsx
│       ├── Card.tsx
│       └── Skeleton.tsx
│
├── hooks/
│   └── useRealtimeSensor.ts
│
├── lib/
│   ├── firebase.ts
│   └── status.ts
│
└── types/
    └── sensor.ts
```

---

# 33. Firebase Data Model

Recommended structure:

```json
{
  "vehicles": {
    "TG-001": {
      "current": {
        "temperature": 5.2,
        "humidity": 70,
        "status": "NORMAL",
        "timestamp": 1790577020000
      }
    }
  }
}
```

History:

```json
{
  "readings": {
    "TG-001": {
      "reading_001": {
        "temperature": 5.2,
        "humidity": 70,
        "status": "NORMAL",
        "timestamp": 1790577020000
      }
    }
  }
}
```

Untuk MVP satu kendaraan tetap gunakan struktur berdasarkan `vehicleId` agar sistem mudah dikembangkan menjadi multi-vehicle.

---

# 34. Data Type

```typescript
type SensorStatus =
  | "NORMAL"
  | "WARNING"
  | "CRITICAL";

interface SensorReading {
  temperature: number;
  humidity: number;
  status: SensorStatus;
  timestamp: number;
}

interface Vehicle {
  id: string;
  name: string;
  online: boolean;
  latestReading: SensorReading | null;
}
```

---

# 35. Dashboard Wireframe

```text
┌────────────────────────────────────────────────────────────┐
│ TunaGuard                                ● DEVICE ONLINE   │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│ Dashboard     │ Cold Storage Monitoring                   │
│ Monitoring    │ Vehicle TG-001                       ● LIVE│
│ History       │                                            │
│ Alerts        │ ┌────────────────────────────────────────┐ │
│               │ │ ✓ STORAGE CONDITION NORMAL             │ │
│               │ │ All monitored parameters are normal.   │ │
│               │ └────────────────────────────────────────┘ │
│               │                                            │
│               │ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│               │ │Temperature │ │ Humidity   │ │ Updated │ │
│               │ │            │ │            │ │         │ │
│               │ │  5.2 °C    │ │   70 %     │ │14:30:20 │ │
│               │ │ ● NORMAL   │ │ ● NORMAL   │ │3 sec ago│ │
│               │ └────────────┘ └────────────┘ └─────────┘ │
│               │                                            │
│               │ Temperature History               1H 6H 24H│
│               │ ┌────────────────────────────────────────┐ │
│               │ │             ╭─────╮                    │ │
│               │ │──────╮  ╭───╯     ╰────────────        │ │
│               │ │      ╰──╯                              │ │
│               │ └────────────────────────────────────────┘ │
│               │                                            │
│               │ Humidity History                           │
│               │ ┌────────────────────────────────────────┐ │
│               │ │      ╭────╮                            │ │
│               │ │──────╯    ╰────────────                │ │
│               │ └────────────────────────────────────────┘ │
│               │                                            │
│               │ Recent Alerts                              │
│               │ No active alerts                           │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

---

# 36. Mobile Wireframe

```text
┌────────────────────────┐
│ ☰ TunaGuard      ● LIVE│
├────────────────────────┤
│                        │
│ Cold Storage           │
│ Vehicle TG-001         │
│                        │
│ ✓ NORMAL               │
│ Storage condition      │
│ is normal              │
│                        │
│ Temperature            │
│                        │
│ 5.2 °C                 │
│ ● NORMAL               │
│                        │
│ Humidity               │
│                        │
│ 70 %                   │
│ ● NORMAL               │
│                        │
│ Last Update            │
│ 14:30:20               │
│                        │
│ Temperature History    │
│ ┌────────────────────┐ │
│ │      ╭──────╮      │ │
│ │──────╯      ╰──────│ │
│ └────────────────────┘ │
│                        │
│ Recent Alerts          │
│ No active alerts       │
└────────────────────────┘
```

---

# 37. MVP Design Scope

Untuk MVP, implementasikan:

### Required

- Sidebar/navigation
- Dashboard
- Real-time temperature
- Real-time humidity
- NORMAL/WARNING/CRITICAL status
- Connection status
- Last update
- Temperature chart
- Humidity chart
- History
- Firebase realtime listener
- Responsive design
- Loading state
- Error state

### Optional

- Multiple vehicles
- Notification
- Relay status
- Fan status
- Export CSV
- Advanced analytics
- User authentication
- Threshold configuration
- Dark/light theme

Jangan membangun fitur opsional sebelum alur monitoring utama stabil.

---

# 38. Final User Experience

Pengguna membuka TunaGuard.

Dalam waktu kurang dari beberapa detik pengguna harus langsung melihat:

```text
Vehicle TG-001

● LIVE

Temperature
5.2 °C

Humidity
70%

✓ NORMAL

Last Update
14:30:20
```

Setelah itu pengguna dapat melihat grafik untuk mengetahui perubahan kondisi selama perjalanan.

Jika kondisi berubah:

```text
NORMAL
→ WARNING
→ CRITICAL
```

dashboard memperbarui:

- status
- warna indikator
- data sensor
- chart
- alert history

tanpa reload halaman.

---

# 39. Design Goal

TunaGuard bukan sekadar halaman yang menampilkan angka sensor.

Dashboard harus memberikan jawaban cepat terhadap tiga pertanyaan utama:

```text
1. Apa kondisi ruang penyimpanan sekarang?

2. Apakah kondisi masih berada dalam batas prototype?

3. Bagaimana kondisi berubah selama perjalanan?
```

Semua keputusan desain harus mendukung tiga kebutuhan tersebut.

**Monitoring clarity lebih penting daripada visual decoration.**