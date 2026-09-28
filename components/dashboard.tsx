"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onValue, limitToLast, query, ref } from "firebase/database";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BellRing,
  ChevronDown, CircleAlert, Clock3, Cloud, Database, Droplets, Gauge,
  Menu, Radio, ShieldCheck, Thermometer, Truck, Waves, Wifi, X,
} from "lucide-react";
import { firebaseDatabase, hasFirebaseConfig } from "@/lib/firebase";
import { conditionFor, demoSeed, normalizeReadings, PROTOTYPE_LIMITS, type Condition, type Reading } from "@/lib/readings";

type Scenario = "normal" | "warning" | "critical";
type Connection = "demo" | "connecting" | "live" | "empty" | "error";
type Metric = "temperature" | "humidity";

const scenarioValues: Record<Scenario, { temperature: number; humidity: number }> = {
  normal: { temperature: 5.2, humidity: 70 },
  warning: { temperature: 6.8, humidity: 79 },
  critical: { temperature: 9.4, humidity: 88 },
};

const statusCopy: Record<Condition, { label: string; message: string }> = {
  NORMAL: { label: "Kondisi normal", message: "Parameter berada dalam batas simulasi." },
  WARNING: { label: "Perlu perhatian", message: "Satu atau lebih parameter melewati batas peringatan." },
  CRITICAL: { label: "Tindakan diperlukan", message: "Parameter melewati batas kritis prototype." },
};

function useReadings() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [connection, setConnection] = useState<Connection>(hasFirebaseConfig ? "connecting" : "demo");
  const [scenario, setScenario] = useState<Scenario>("normal");
  const sequence = useRef(0);

  useEffect(() => {
    if (hasFirebaseConfig) {
      try {
        const database = firebaseDatabase();
        if (!database) return;
        const unsubscribe = onValue(
          query(ref(database, "readings"), limitToLast(100)),
          (snapshot) => {
            const next = normalizeReadings(snapshot.val());
            setReadings(next);
            setConnection(next.length ? "live" : "empty");
          },
          () => setConnection("error"),
        );
        return unsubscribe;
      } catch {
        const errorTimer = window.setTimeout(() => setConnection("error"), 0);
        return () => window.clearTimeout(errorTimer);
      }
    }
    const demoTimer = window.setTimeout(() => setReadings(demoSeed(Date.now())), 0);
    return () => window.clearTimeout(demoTimer);
  }, []);

  useEffect(() => {
    if (hasFirebaseConfig) return;
    const timer = window.setInterval(() => {
      sequence.current += 1;
      const target = scenarioValues[scenario];
      const temperature = Number((target.temperature + Math.sin(sequence.current * 0.9) * 0.18).toFixed(1));
      const humidity = Math.round(target.humidity + Math.sin(sequence.current * 0.7) * 1.4);
      setReadings((current) => [...current, {
        id: `demo-live-${sequence.current}`,
        temperature,
        humidity,
        status: conditionFor(temperature, humidity),
        timestamp: Date.now(),
      }].slice(-100));
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [scenario]);

  function changeScenario(next: Scenario) {
    setScenario(next);
    sequence.current += 1;
    const { temperature, humidity } = scenarioValues[next];
    setReadings((current) => [...current, {
      id: `demo-live-${sequence.current}`,
      temperature,
      humidity,
      status: conditionFor(temperature, humidity),
      timestamp: Date.now(),
    }].slice(-100));
  }

  return { readings, connection, scenario, changeScenario };
}

function formatTime(timestamp?: number, includeDate = false) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    ...(includeDate ? { day: "2-digit", month: "short" } : {}),
    hour: "2-digit", minute: "2-digit", second: includeDate ? undefined : "2-digit",
  }).format(timestamp);
}

function StatusPill({ status }: { status: Condition }) {
  return <span className={`status-pill status-${status.toLowerCase()}`}><span className="status-dot" />{status}</span>;
}

function TrendChart({ readings, metric }: { readings: Reading[]; metric: Metric }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const data = readings.slice(-30);
  const isTemp = metric === "temperature";
  const width = 720;
  const height = 250;
  const left = 38;
  const right = 18;
  const top = 18;
  const bottom = 34;
  const values = data.map((row) => row[metric]);
  const minimum = isTemp ? Math.min(0, ...values.map((value) => Math.floor(value - 1))) : Math.min(40, ...values.map((value) => Math.floor((value - 5) / 10) * 10));
  const maximum = isTemp ? Math.max(10, ...values.map((value) => Math.ceil(value + 1))) : Math.max(100, ...values.map((value) => Math.ceil((value + 5) / 10) * 10));
  const x = (index: number) => left + (index / Math.max(1, data.length - 1)) * (width - left - right);
  const y = (value: number) => top + ((maximum - value) / (maximum - minimum)) * (height - top - bottom);
  const line = data.map((row, index) => `${index ? "L" : "M"} ${x(index)} ${y(row[metric])}`).join(" ");
  const area = `${line} L ${x(Math.max(0, data.length - 1))} ${height - bottom} L ${left} ${height - bottom} Z`;
  const active = hoverIndex !== null ? data[hoverIndex] : data.at(-1);
  const activeIndex = hoverIndex !== null ? hoverIndex : data.length - 1;

  if (!data.length) return <div className="chart-empty">Grafik akan muncul setelah data sensor diterima.</div>;

  return (
    <div className="chart-wrap">
      <div className="chart-highlight">
        <span>{hoverIndex === null ? "Pembacaan terbaru" : formatTime(active?.timestamp)}</span>
        <strong>{active?.[metric].toFixed(1)}{isTemp ? "°C" : "%"}</strong>
      </div>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Grafik ${isTemp ? "suhu" : "kelembapan"} dari ${data.length} pembacaan terakhir`}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const svgX = ((event.clientX - box.left) / box.width) * width;
          setHoverIndex(Math.max(0, Math.min(data.length - 1, Math.round(((svgX - left) / (width - left - right)) * (data.length - 1)))));
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={`area-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isTemp ? "#23b8b0" : "#5783e9"} stopOpacity="0.24" />
            <stop offset="100%" stopColor={isTemp ? "#23b8b0" : "#5783e9"} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((step) => {
          const value = maximum - ((maximum - minimum) / 4) * step;
          const position = y(value);
          return <g key={step}><line className="chart-gridline" x1={left} x2={width - right} y1={position} y2={position} /><text className="chart-axis-label" x="0" y={position + 4}>{Math.round(value)}{isTemp ? "°" : "%"}</text></g>;
        })}
        <path d={area} fill={`url(#area-${metric})`} />
        <path d={line} className={`chart-line ${isTemp ? "chart-line-temp" : "chart-line-humidity"}`} />
        <line className="chart-cursor" x1={x(activeIndex)} x2={x(activeIndex)} y1={top} y2={height - bottom} />
        <circle cx={x(activeIndex)} cy={y(active![metric])} r="9" fill={isTemp ? "#23b8b0" : "#5783e9"} opacity="0.18" />
        <circle cx={x(activeIndex)} cy={y(active![metric])} r="4" fill={isTemp ? "#18a9a2" : "#4873d9"} stroke="white" strokeWidth="2" />
        <text className="chart-axis-label" x={left} y={height - 6}>{formatTime(data[0]?.timestamp)}</text>
        <text className="chart-axis-label" x={width - right} y={height - 6} textAnchor="end">{formatTime(data.at(-1)?.timestamp)}</text>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { readings, connection, scenario, changeScenario } = useReadings();
  const [metric, setMetric] = useState<Metric>("temperature");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const latest = readings.at(-1);
  const previous = readings.at(-2);
  const temperatureDelta = latest && previous ? latest.temperature - previous.temperature : 0;
  const humidityDelta = latest && previous ? latest.humidity - previous.humidity : 0;
  const status = latest?.status ?? "NORMAL";
  const recent = useMemo(() => [...readings].reverse().slice(0, historyExpanded ? 100 : 7), [readings, historyExpanded]);
  const connectionLabel = connection === "live" ? "Terhubung ke Firebase" : connection === "demo" ? "Mode simulasi aktif" : connection === "connecting" ? "Menghubungkan sensor" : connection === "empty" ? "Menunggu data sensor" : "Koneksi bermasalah";

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#beranda" aria-label="TunaGuard, kembali ke beranda">
            <span className="brand-mark"><Waves size={23} strokeWidth={2.7} /></span>
            <span>Tuna<span>Guard</span><small>MONITORING SYSTEM</small></span>
          </a>
          <nav className={`main-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Navigasi utama">
            <a href="#monitoring" onClick={() => setMobileOpen(false)}>Dashboard</a>
            <a href="#cara-kerja" onClick={() => setMobileOpen(false)}>Cara kerja</a>
            <a href="#riwayat" onClick={() => setMobileOpen(false)}>Riwayat data</a>
          </nav>
          <div className="header-actions">
            <span className={`connection-chip connection-${connection}`}><span className="connection-dot" />{connection === "live" ? "Sistem online" : connection === "demo" ? "Demo aktif" : connection === "error" ? "Koneksi gagal" : "Menunggu data"}</span>
            <button className="mobile-toggle" type="button" aria-label={mobileOpen ? "Tutup menu" : "Buka menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
      </header>

      <main id="beranda">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
          <div className="hero-content">
            <span className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> SMART COLD CHAIN MONITORING</span>
            <h1 id="hero-title">Setiap derajat <em>berarti.</em><br />Setiap perjalanan <em>terjaga.</em></h1>
            <p>Pantau suhu dan kelembapan ruang penyimpanan tuna secara real-time, dari kendaraan hingga layar Anda.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#monitoring">Lihat dashboard <ArrowRight size={18} /></a>
              <a className="button button-ghost" href="#cara-kerja">Jelajahi sistem <ArrowDownRight size={18} /></a>
            </div>
            <div className="hero-proof"><span className="proof-icon"><ShieldCheck size={16} /></span> DHT22 <span className="proof-separator" /> ESP8266 <span className="proof-separator" /> Firebase</div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit orbit-outer" /><div className="orbit orbit-middle" /><div className="orbit orbit-inner" />
            <div className="orbit-pulse orbit-pulse-one" /><div className="orbit-pulse orbit-pulse-two" />
            <div className="hero-visual-card">
              <div className="visual-card-top"><span><span className="live-blip" /> LIVE TELEMETRY</span><Radio size={16} /></div>
              <div className="visual-route"><span className="route-start"><Truck size={24} /></span><span className="route-track"><span className="route-packet" /></span><span className="route-end"><Cloud size={24} /></span></div>
              <div className="visual-data"><div><span>SUHU</span><strong>{latest ? latest.temperature.toFixed(1) : "—"}<small> °C</small></strong></div><div><span>KELEMBAPAN</span><strong>{latest ? Math.round(latest.humidity) : "—"}<small> %</small></strong></div></div>
              <div className="visual-card-bottom"><span>UNIT TG-01</span><span><span className="tiny-dot" /> DATA TERKIRIM</span></div>
            </div>
            <div className="floating-tag floating-tag-top"><span className="tag-icon"><Thermometer size={16} /></span><span>Suhu terpantau<small>24 / 7 monitoring</small></span></div>
            <div className="floating-tag floating-tag-bottom"><span className="tag-icon tag-icon-blue"><Database size={16} /></span><span>Sinkronisasi data<small>Firebase Realtime DB</small></span></div>
          </div>
          <div className="hero-bottom-line"><span>PROTOTYPE IOT UNTUK LOGISTIK TUNA</span><span>SCROLL UNTUK MEMANTAU <ChevronDown size={14} /></span></div>
        </section>

        <section className="dashboard-section container" id="monitoring" aria-labelledby="dashboard-heading">
          <div className="section-heading">
            <div><span className="eyebrow section-eyebrow"><span className="eyebrow-line" /> DASHBOARD MONITORING</span><h2 id="dashboard-heading">Kondisi dalam satu pandangan.</h2><p>Data ruang penyimpanan mobil logistik • Unit TG-01</p></div>
            <div className={`data-source data-source-${connection}`}><span className="source-icon"><Wifi size={17} /></span><span><strong>{connectionLabel}</strong><small>{connection === "demo" ? "Data diperbarui tiap 5 detik" : connection === "live" ? `Terakhir: ${formatTime(latest?.timestamp)}` : "Lihat status di bawah"}</small></span></div>
          </div>

          {connection === "error" && <div className="notice notice-error" role="alert"><CircleAlert size={18} /> Gagal membaca Firebase. Periksa konfigurasi dan izin baca Realtime Database.</div>}
          {connection === "empty" && <div className="notice" role="status"><Database size={18} /> Koneksi berhasil. Belum ada data pada path <code>/readings</code>.</div>}

          <div className="metric-grid">
            <article className="metric-card metric-temperature"><div className="metric-card-top"><span className="metric-icon temp-icon"><Thermometer size={23} /></span><span className="metric-label">SUHU RUANG</span><ArrowUpRight className="metric-corner" size={17} /></div><div className="metric-value">{latest ? latest.temperature.toFixed(1) : "—"}<span>°C</span></div><div className="metric-card-bottom"><span className={`delta ${temperatureDelta > 0 ? "delta-up" : ""}`}>{temperatureDelta > 0 ? "+" : ""}{temperatureDelta.toFixed(1)}° dari sebelumnya</span><span className="mini-sparkline temp-sparkline" /></div></article>
            <article className="metric-card metric-humidity"><div className="metric-card-top"><span className="metric-icon humidity-icon"><Droplets size={23} /></span><span className="metric-label">KELEMBAPAN</span><ArrowUpRight className="metric-corner" size={17} /></div><div className="metric-value">{latest ? Math.round(latest.humidity) : "—"}<span>%</span></div><div className="metric-card-bottom"><span className={`delta ${humidityDelta > 0 ? "delta-up" : ""}`}>{humidityDelta > 0 ? "+" : ""}{humidityDelta.toFixed(0)}% dari sebelumnya</span><span className="mini-sparkline humidity-sparkline" /></div></article>
            <article className={`metric-card metric-condition condition-${status.toLowerCase()}`}><div className="metric-card-top"><span className="metric-icon condition-icon">{status === "NORMAL" ? <ShieldCheck size={23} /> : <BellRing size={23} />}</span><span className="metric-label">STATUS KONDISI</span><Activity className="metric-corner" size={17} /></div><div className="condition-value"><span className="condition-light" />{latest ? status : "—"}</div><div className="metric-card-bottom"><span>{latest ? statusCopy[status].message : "Menunggu pembacaan sensor."}</span></div></article>
          </div>

          <div className="analytics-grid">
            <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">ANALISIS REAL-TIME</span><h3>Tren pembacaan sensor</h3><p>Visualisasi 30 pembacaan terbaru</p></div><div className="chart-tabs" role="tablist" aria-label="Pilih grafik"><button type="button" role="tab" aria-selected={metric === "temperature"} className={metric === "temperature" ? "active" : ""} onClick={() => setMetric("temperature")}><Thermometer size={15} /> Suhu</button><button type="button" role="tab" aria-selected={metric === "humidity"} className={metric === "humidity" ? "active" : ""} onClick={() => setMetric("humidity")}><Droplets size={15} /> Kelembapan</button></div></div><TrendChart readings={readings} metric={metric} /><div className="chart-footer"><span><span className={`legend-dot ${metric === "temperature" ? "legend-temp" : "legend-humidity"}`} /> {metric === "temperature" ? "Suhu ruang" : "Kelembapan ruang"}</span><span><Clock3 size={14} /> Diperbarui otomatis</span></div></article>
            <aside className="panel control-panel"><div className="panel-header"><div><span className="panel-kicker">PUSAT KENDALI</span><h3>Ringkasan sistem</h3></div><span className="control-icon"><Gauge size={20} /></span></div><div className="control-status"><span className="control-status-label">KONDISI SAAT INI</span>{latest ? <StatusPill status={status} /> : <span className="awaiting-status">MENUNGGU DATA</span>}<p>{latest ? statusCopy[status].message : "Belum ada data pembacaan."}</p></div><div className="control-divider" /><div className="info-row"><span><Clock3 size={17} /> Pembacaan terakhir</span><strong>{formatTime(latest?.timestamp)}</strong></div><div className="info-row"><span><Radio size={17} /> Perangkat</span><strong>DHT22 + ESP8266</strong></div><div className="info-row"><span><Database size={17} /> Penyimpanan</span><strong>{connection === "live" || connection === "empty" ? "Firebase" : "Simulasi lokal"}</strong></div>{connection === "demo" && <div className="scenario-box"><span className="scenario-title">UJI SKENARIO PROTOTYPE</span><p>Pilih kondisi untuk melihat perubahan status dan grafik.</p><div className="scenario-buttons"><button className={scenario === "normal" ? "selected" : ""} type="button" onClick={() => changeScenario("normal")}>Normal</button><button className={scenario === "warning" ? "selected" : ""} type="button" onClick={() => changeScenario("warning")}>Warning</button><button className={scenario === "critical" ? "selected" : ""} type="button" onClick={() => changeScenario("critical")}>Critical</button></div></div>}</aside>
          </div>

          <div className="lower-grid">
            <article className="panel history-panel" id="riwayat"><div className="panel-header"><div><span className="panel-kicker">JEJAK PERJALANAN</span><h3>Riwayat pembacaan</h3><p>Data terbaru dari ruang penyimpanan</p></div><span className="history-count">{readings.length} pembacaan</span></div><div className="table-scroll"><table><thead><tr><th>WAKTU</th><th>SUHU</th><th>KELEMBAPAN</th><th>STATUS</th></tr></thead><tbody>{recent.length ? recent.map((row) => <tr key={row.id}><td><span className="table-time-icon"><Clock3 size={14} /></span>{formatTime(row.timestamp, true)}</td><td><strong>{row.temperature.toFixed(1)} °C</strong></td><td><strong>{Math.round(row.humidity)}%</strong></td><td><StatusPill status={row.status} /></td></tr>) : <tr><td colSpan={4} className="empty-table">Belum ada riwayat pembacaan.</td></tr>}</tbody></table></div>{readings.length > 7 && <button className="history-toggle" type="button" onClick={() => setHistoryExpanded((expanded) => !expanded)}>{historyExpanded ? "Tampilkan lebih sedikit" : `Lihat semua ${readings.length} pembacaan`} <ChevronDown size={14} className={historyExpanded ? "is-expanded" : ""} /></button>}</article>
            <aside className="insight-card"><div className="insight-icon"><CircleAlert size={22} /></div><span className="insight-kicker">AMBANG SIMULASI</span><h3>Kenali batasnya.<br />Jaga kualitasnya.</h3><p>Warna status berubah saat suhu atau kelembapan melewati ambang prototype.</p><div className="threshold-list"><div><span><i className="threshold-dot warning-dot" /> Warning</span><strong>≥ {PROTOTYPE_LIMITS.temperature.warning}°C / {PROTOTYPE_LIMITS.humidity.warning}%</strong></div><div><span><i className="threshold-dot critical-dot" /> Critical</span><strong>≥ {PROTOTYPE_LIMITS.temperature.critical}°C / {PROTOTYPE_LIMITS.humidity.critical}%</strong></div></div><small>Ambang ini hanya untuk demo; sesuaikan dengan standar cold-chain dan metode penyimpanan tuna saat implementasi nyata.</small></aside>
          </div>
        </section>

        <section className="workflow-section" id="cara-kerja" aria-labelledby="workflow-heading"><div className="container"><div className="workflow-heading"><div><span className="eyebrow section-eyebrow"><span className="eyebrow-line" /> CARA KERJA</span><h2 id="workflow-heading">Dari sensor, langsung ke keputusan.</h2></div><p>Alur data sederhana yang membantu tim logistik merespons perubahan kondisi lebih cepat.</p></div><div className="workflow-grid"><div className="workflow-step"><span className="step-number">01 / DETEKSI</span><span className="step-icon"><Thermometer size={25} /></span><h3>Sensor membaca</h3><p>DHT22 mengukur suhu dan kelembapan di ruang penyimpanan tuna.</p></div><div className="workflow-step"><span className="step-number">02 / KIRIM</span><span className="step-icon"><Wifi size={25} /></span><h3>Data dikirim</h3><p>ESP8266 mengolah status lalu mengirimkan pembacaan melalui WiFi.</p></div><div className="workflow-step"><span className="step-number">03 / SIMPAN</span><span className="step-icon"><Database size={25} /></span><h3>Firebase mencatat</h3><p>Setiap nilai, status, dan waktu tersimpan sebagai riwayat perjalanan.</p></div><div className="workflow-step"><span className="step-number">04 / PANTAU</span><span className="step-icon"><Activity size={25} /></span><h3>Tim memantau</h3><p>Dashboard menampilkan kondisi terkini dan peringatan saat batas terlampaui.</p></div></div></div></section>
      </main>

      <footer className="site-footer"><div className="footer-wave footer-wave-back" /><div className="footer-wave footer-wave-front" /><div className="footer-bubble bubble-one" /><div className="footer-bubble bubble-two" /><div className="footer-bubble bubble-three" /><div className="container footer-content"><div className="footer-main"><div><span className="eyebrow footer-eyebrow"><span className="eyebrow-line" /> THE FUTURE OF COLD CHAIN</span><h2>Perjalanan aman.<br /><em>Kualitas terjaga.</em></h2><p>TunaGuard membantu setiap pembacaan menjadi langkah nyata untuk menjaga kualitas distribusi tuna.</p><a href="#monitoring" className="button button-footer">Kembali ke dashboard <ArrowUpRight size={18} /></a></div><div className="footer-orbit" aria-hidden="true"><div className="footer-orbit-ring ring-one" /><div className="footer-orbit-ring ring-two" /><div className="footer-orbit-ring ring-three" /><div className="footer-center"><Waves size={47} /></div><span className="footer-orbit-dot dot-a" /><span className="footer-orbit-dot dot-b" /></div></div><div className="footer-bottom"><a className="brand footer-brand" href="#beranda"><span className="brand-mark"><Waves size={21} strokeWidth={2.7} /></span><span>Tuna<span>Guard</span><small>MONITORING SYSTEM</small></span></a><span>Prototype monitoring IoT untuk logistik tuna</span><span>© {new Date().getFullYear()} TunaGuard</span></div></div></footer>
    </div>
  );
}
