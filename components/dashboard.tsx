"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { onValue, limitToLast, orderByChild, query, ref } from "firebase/database";
import {
  Activity, ArrowUpRight, BellRing, ChevronDown, CircleAlert, Clock3,
  Database, Droplets, Gauge, Menu, Radio, ShieldCheck, Thermometer,
  Waves, Wifi, X,
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
          query(ref(database, "readings"), orderByChild("timestamp"), limitToLast(100)),
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
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 720, height: 250 });
  useEffect(() => {
    if (!chartRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setChartSize({
        width: Math.max(240, Math.round(entry.contentRect.width)),
        height: Math.max(180, Math.round(entry.contentRect.height)),
      });
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);
  const data = readings.slice(-30);
  const isTemp = metric === "temperature";
  const { width, height } = chartSize;
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
  const activeIndex = hoverIndex !== null ? Math.min(hoverIndex, data.length - 1) : data.length - 1;
  const active = data[activeIndex];

  if (!data.length) return <div className="chart-empty">Grafik akan muncul setelah data sensor diterima.</div>;

  return (
    <div className="chart-wrap" ref={chartRef}>
      <div className="chart-highlight">
        <span>{hoverIndex === null ? "Pembacaan terbaru" : formatTime(active?.timestamp)}</span>
        <strong>{active?.[metric].toFixed(1)}{isTemp ? "°C" : "%"}</strong>
      </div>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Grafik ${isTemp ? "suhu" : "kelembapan"} dari ${data.length} pembacaan terakhir, nilai terbaru ${data.at(-1)?.[metric].toFixed(1)}${isTemp ? " derajat Celsius" : " persen"}`}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const svgX = ((event.clientX - box.left) / box.width) * width;
          setHoverIndex(Math.max(0, Math.min(data.length - 1, Math.round(((svgX - left) / (width - left - right)) * (data.length - 1)))));
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={`area-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isTemp ? "#38bdf8" : "#a5b4fc"} stopOpacity="0.18" />
            <stop offset="100%" stopColor={isTemp ? "#38bdf8" : "#a5b4fc"} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((step) => {
          const value = maximum - ((maximum - minimum) / 4) * step;
          const position = y(value);
          return <g key={step}><line className="chart-gridline" x1={left} x2={width - right} y1={position} y2={position} /><text className="chart-axis-label" x="0" y={position + 4}>{Math.round(value)}{isTemp ? "°" : "%"}</text></g>;
        })}
        {[isTemp ? PROTOTYPE_LIMITS.temperature.warning : PROTOTYPE_LIMITS.humidity.warning, isTemp ? PROTOTYPE_LIMITS.temperature.critical : PROTOTYPE_LIMITS.humidity.critical].map((limit, index) => (
          <g key={limit}>
            <line className={index ? "chart-threshold chart-threshold-critical" : "chart-threshold chart-threshold-warning"} x1={left} x2={width - right} y1={y(limit)} y2={y(limit)} />
            <text className={index ? "chart-threshold-label chart-threshold-critical-label" : "chart-threshold-label"} x={width - right - 3} y={y(limit) - 5} textAnchor="end">{index ? "CRITICAL" : "WARNING"}</text>
          </g>
        ))}
        <path d={area} fill={`url(#area-${metric})`} />
        <path d={line} className={`chart-line ${isTemp ? "chart-line-temp" : "chart-line-humidity"}`} />
        <line className="chart-cursor" x1={x(activeIndex)} x2={x(activeIndex)} y1={top} y2={height - bottom} />
        <circle cx={x(activeIndex)} cy={y(active![metric])} r="9" fill={isTemp ? "#38bdf8" : "#a5b4fc"} opacity="0.18" />
        <circle cx={x(activeIndex)} cy={y(active![metric])} r="4" fill={isTemp ? "#38bdf8" : "#a5b4fc"} stroke="#0d1b2a" strokeWidth="2" />
        <text className="chart-axis-label" x={left} y={height - 6}>{formatTime(data[0]?.timestamp)}</text>
        <text className="chart-axis-label" x={width - right} y={height - 6} textAnchor="end">{formatTime(data.at(-1)?.timestamp)}</text>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { readings, connection, scenario, changeScenario } = useReadings();
  const [clock, setClock] = useState(() => Date.now());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  const latest = readings.at(-1);
  const previous = readings.at(-2);
  const temperatureDelta = latest && previous ? latest.temperature - previous.temperature : 0;
  const humidityDelta = latest && previous ? latest.humidity - previous.humidity : 0;
  const status = latest?.status ?? "NORMAL";
  const age = latest && connection === "live" ? clock - latest.timestamp : 0;
  const freshness = age > 120_000 ? "Perangkat tidak mengirim data" : age > 30_000 ? "Data sensor terlambat" : "Data langsung";
  const recent = useMemo(() => [...readings].reverse().slice(0, historyExpanded ? 100 : 7), [readings, historyExpanded]);
  const alerts = useMemo(() => readings.filter((row, index) =>
    row.status !== "NORMAL" && (index === 0 || readings[index - 1].status !== row.status),
  ).reverse().slice(0, 3), [readings]);
  const connectionLabel = connection === "live" ? "Terhubung ke Firebase" : connection === "demo" ? "Mode simulasi aktif" : connection === "connecting" ? "Menghubungkan sensor" : connection === "empty" ? "Menunggu data sensor" : "Koneksi bermasalah";

  return (
    <div className="site-shell">
      <a className="skip-link" href="#monitoring">Lewati ke dashboard</a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#beranda" aria-label="TunaGuard, kembali ke beranda">
            <span className="brand-mark"><Waves size={23} strokeWidth={2.7} /></span>
            <span>Tuna<span>Guard</span><small>MONITORING SYSTEM</small></span>
          </a>
          <nav id="primary-navigation" className={`main-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Navigasi utama">
            <a href="#beranda" onClick={() => setMobileOpen(false)}><Gauge size={17} /> Ringkasan</a>
            <a href="#monitoring" onClick={() => setMobileOpen(false)}><Activity size={17} /> Monitoring</a>
            <a href="#riwayat" onClick={() => setMobileOpen(false)}><Clock3 size={17} /> Riwayat data</a>
            <a href="#peringatan" onClick={() => setMobileOpen(false)}><BellRing size={17} /> Peringatan</a>
            <a href="#cara-kerja" onClick={() => setMobileOpen(false)}><Database size={17} /> Cara kerja</a>
          </nav>
          <div className="header-actions">
            <span className={`connection-chip connection-${connection}`}><span className="connection-dot" />{connection === "live" ? "Sistem online" : connection === "demo" ? "Demo aktif" : connection === "error" ? "Koneksi gagal" : "Menunggu data"}</span>
            <button className="mobile-toggle" type="button" aria-label={mobileOpen ? "Tutup menu" : "Buka menu"} aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}<span>{mobileOpen ? "Tutup" : "Menu"}</span></button>
          </div>
        </div>
      </header>

      <main id="beranda">
        <section className={"hero container hero-" + (latest ? status.toLowerCase() : "waiting")} aria-labelledby="hero-title">
          <div className="hero-content">
            <span className="eyebrow hero-eyebrow">MONITORING RANTAI DINGIN <span className="hero-divider" /> UNIT TG-01</span>
            <div className={"hero-status hero-status-" + (latest ? status.toLowerCase() : "waiting")}>
              <span className="hero-status-icon">{status === "NORMAL" && latest ? <ShieldCheck size={27} /> : <CircleAlert size={27} />}</span>
              <div>
                <span className="hero-status-label">KONDISI PENYIMPANAN</span>
                <h1 id="hero-title">{latest ? statusCopy[status].label : connection === "connecting" ? "Menghubungkan sensor" : "Menunggu data sensor"}</h1>
              </div>
            </div>
            <p>{latest ? statusCopy[status].message : connection === "connecting" ? "Menyiapkan pembacaan suhu dan kelembapan dari perangkat." : "Data suhu dan kelembapan akan tampil setelah perangkat mengirim pembacaan pertama."}</p>
            <div className="hero-meta">
              <span><Clock3 size={16} /> Pembaruan terakhir <strong>{formatTime(latest?.timestamp)}</strong></span>
              <span><Radio size={16} /> {connection === "demo" ? "Mode simulasi" : connection === "live" ? freshness : connectionLabel}</span>
            </div>
          </div>
          <div className="hero-asset" aria-hidden="true">
            <Image src="/cold-storage-3d.webp" alt="" width={520} height={347} priority />
            <span>RUANG PENYIMPANAN / TG-01</span>
          </div>
        </section>

        <section className="dashboard-section container" id="monitoring" aria-labelledby="dashboard-heading">
          <div className="section-heading">
            <div><span className="eyebrow section-eyebrow"><span className="eyebrow-line" /> DASHBOARD MONITORING</span><h2 id="dashboard-heading">Kondisi dalam satu pandangan.</h2><p>Data ruang penyimpanan mobil logistik • Unit TG-01</p></div>
            <div className={`data-source data-source-${connection}`}><span className="source-icon"><Wifi size={17} /></span><span><strong>{connectionLabel}</strong><small>{connection === "demo" ? "Data diperbarui tiap 5 detik" : connection === "live" ? `Terakhir: ${formatTime(latest?.timestamp)}` : "Lihat status di bawah"}</small></span></div>
          </div>

          {connection === "error" && <div className="notice notice-error" role="alert"><CircleAlert size={18} /> Gagal membaca Firebase. Periksa konfigurasi dan izin baca Realtime Database.</div>}
          {connection === "empty" && <div className="notice" role="status"><Database size={18} /> Koneksi berhasil. Belum ada data pada path <code>/readings</code>.</div>}
          {connection === "live" && age > 30_000 && <div className="notice" role="status"><CircleAlert size={18} /> {freshness}. Pembacaan terakhir diterima pukul {formatTime(latest?.timestamp)}.</div>}

          <div className="metric-grid" aria-busy={connection === "connecting"}>
            <article className="metric-card metric-temperature"><div className="metric-card-top"><span className="metric-icon temp-icon"><Thermometer size={23} /></span><span className="metric-label">SUHU RUANG</span><ArrowUpRight className="metric-corner" size={17} /></div><div className="metric-value">{latest ? latest.temperature.toFixed(1) : connection === "connecting" ? <span className="metric-skeleton" aria-label="Memuat suhu" /> : "—"}{latest && <span>°C</span>}</div><div className="metric-card-bottom"><span className={`delta ${temperatureDelta > 0 ? "delta-up" : ""}`}>{previous ? `${temperatureDelta > 0 ? "+" : ""}${temperatureDelta.toFixed(1)}° dari sebelumnya` : "Menunggu pembacaan berikutnya"}</span><span className="mini-sparkline temp-sparkline" /></div></article>
            <article className="metric-card metric-humidity"><div className="metric-card-top"><span className="metric-icon humidity-icon"><Droplets size={23} /></span><span className="metric-label">KELEMBAPAN</span><ArrowUpRight className="metric-corner" size={17} /></div><div className="metric-value">{latest ? Math.round(latest.humidity) : connection === "connecting" ? <span className="metric-skeleton" aria-label="Memuat kelembapan" /> : "—"}{latest && <span>%</span>}</div><div className="metric-card-bottom"><span className={`delta ${humidityDelta > 0 ? "delta-up" : ""}`}>{previous ? `${humidityDelta > 0 ? "+" : ""}${humidityDelta.toFixed(0)}% dari sebelumnya` : "Menunggu pembacaan berikutnya"}</span><span className="mini-sparkline humidity-sparkline" /></div></article>
            <article className="metric-card metric-update"><div className="metric-card-top"><span className="metric-icon update-icon"><Clock3 size={23} /></span><span className="metric-label">PEMBARUAN TERAKHIR</span><Activity className="metric-corner" size={17} /></div><div className="metric-value metric-time">{connection === "connecting" ? <span className="metric-skeleton" aria-label="Memuat waktu pembaruan" /> : formatTime(latest?.timestamp)}</div><div className="metric-card-bottom"><span>{latest ? "Pembacaan sensor terbaru" : "Menunggu pembacaan sensor"}</span><span className="metric-device">TG-01</span></div></article>
          </div>

          <div className="analytics-grid">
            <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">TREN SUHU</span><h3>Suhu ruang</h3><p>30 pembacaan terbaru · °C</p></div><span className="chart-panel-icon temp-icon"><Thermometer size={19} /></span></div><TrendChart readings={readings} metric="temperature" /><div className="chart-footer"><span><span className="legend-dot legend-temp" /> Suhu ruang</span><span><Clock3 size={14} /> Diperbarui otomatis</span></div></article>
            <article className="panel chart-panel"><div className="panel-header"><div><span className="panel-kicker">TREN KELEMBAPAN</span><h3>Kelembapan ruang</h3><p>30 pembacaan terbaru · %</p></div><span className="chart-panel-icon humidity-icon"><Droplets size={19} /></span></div><TrendChart readings={readings} metric="humidity" /><div className="chart-footer"><span><span className="legend-dot legend-humidity" /> Kelembapan ruang</span><span><Clock3 size={14} /> Diperbarui otomatis</span></div></article>
            <aside className="panel control-panel"><div className="panel-header"><div><span className="panel-kicker">PUSAT KENDALI</span><h3>Ringkasan sistem</h3></div><span className="control-icon"><Gauge size={20} /></span></div><div className="control-status"><span className="control-status-label">KONDISI SAAT INI</span>{latest ? <StatusPill status={status} /> : <span className="awaiting-status">MENUNGGU DATA</span>}<p>{latest ? statusCopy[status].message : "Belum ada data pembacaan."}</p></div><div className="control-divider" /><div className="info-row"><span><Clock3 size={17} /> Pembacaan terakhir</span><strong>{formatTime(latest?.timestamp)}</strong></div><div className="info-row"><span><Radio size={17} /> Perangkat</span><strong>DHT22 + ESP32</strong></div><div className="info-row"><span><Database size={17} /> Penyimpanan</span><strong>{connection === "live" || connection === "empty" ? "Firebase" : "Simulasi lokal"}</strong></div>{connection === "demo" && <div className="scenario-box"><span className="scenario-title">UJI SKENARIO PROTOTYPE</span><p>Pilih kondisi untuk melihat perubahan status dan grafik.</p><div className="scenario-buttons"><button className={scenario === "normal" ? "selected" : ""} type="button" onClick={() => changeScenario("normal")}>Normal</button><button className={scenario === "warning" ? "selected" : ""} type="button" onClick={() => changeScenario("warning")}>Warning</button><button className={scenario === "critical" ? "selected" : ""} type="button" onClick={() => changeScenario("critical")}>Critical</button></div></div>}</aside>
          </div>

          <div className="lower-grid">
            <article className="panel history-panel" id="riwayat"><div className="panel-header"><div><span className="panel-kicker">JEJAK PERJALANAN</span><h3>Riwayat pembacaan</h3><p>Data terbaru dari ruang penyimpanan</p></div><span className="history-count">{readings.length} pembacaan</span></div><div className="table-scroll"><table><thead><tr><th>WAKTU</th><th>SUHU</th><th>KELEMBAPAN</th><th>STATUS</th></tr></thead><tbody>{recent.length ? recent.map((row) => <tr key={row.id}><td><span className="table-time-icon"><Clock3 size={14} /></span>{formatTime(row.timestamp, true)}</td><td><strong>{row.temperature.toFixed(1)} °C</strong></td><td><strong>{Math.round(row.humidity)}%</strong></td><td><StatusPill status={row.status} /></td></tr>) : <tr><td colSpan={4} className="empty-table">Belum ada riwayat pembacaan.</td></tr>}</tbody></table></div>{readings.length > 7 && <button className="history-toggle" type="button" onClick={() => setHistoryExpanded((expanded) => !expanded)}>{historyExpanded ? "Tampilkan lebih sedikit" : `Lihat semua ${readings.length} pembacaan`} <ChevronDown size={14} className={historyExpanded ? "is-expanded" : ""} /></button>}</article>
            <aside className="panel alerts-panel" id="peringatan">
              <div className="panel-header"><div><span className="panel-kicker">KEJADIAN PENTING</span><h3>Riwayat peringatan</h3><p>Perubahan kondisi warning dan critical</p></div><span className="control-icon"><BellRing size={19} /></span></div>
              <div className="alerts-list">{alerts.length ? alerts.map((row) => <div className="alert-row" key={row.id}><span className={"alert-row-icon alert-row-" + row.status.toLowerCase()}><CircleAlert size={17} /></span><div><StatusPill status={row.status} /><p>{row.temperature.toFixed(1)} °C · {Math.round(row.humidity)}% kelembapan</p></div><time>{formatTime(row.timestamp)}</time></div>) : <div className="alerts-empty"><ShieldCheck size={24} /><strong>Belum ada peringatan</strong><span>Perubahan kondisi akan muncul di sini.</span></div>}</div>
              <div className="alert-thresholds"><span>Ambang simulasi</span><small>Warning ≥ {PROTOTYPE_LIMITS.temperature.warning} °C / {PROTOTYPE_LIMITS.humidity.warning}% · Critical ≥ {PROTOTYPE_LIMITS.temperature.critical} °C / {PROTOTYPE_LIMITS.humidity.critical}%</small></div>
            </aside>
          </div>
        </section>

        <section className="workflow-section" id="cara-kerja" aria-labelledby="workflow-heading"><div className="container"><div className="workflow-heading"><div><span className="eyebrow section-eyebrow"><span className="eyebrow-line" /> CARA KERJA</span><h2 id="workflow-heading">Dari sensor, langsung ke keputusan.</h2></div><p>Alur data sederhana yang membantu tim logistik merespons perubahan kondisi lebih cepat.</p></div><div className="workflow-grid"><div className="workflow-step"><span className="step-number">01 / DETEKSI</span><span className="step-icon"><Thermometer size={25} /></span><h3>Sensor membaca</h3><p>DHT22 mengukur suhu dan kelembapan di ruang penyimpanan tuna.</p></div><div className="workflow-step"><span className="step-number">02 / KIRIM</span><span className="step-icon"><Wifi size={25} /></span><h3>Data dikirim</h3><p>ESP32 mengolah status lalu mengirimkan pembacaan melalui WiFi.</p></div><div className="workflow-step"><span className="step-number">03 / SIMPAN</span><span className="step-icon"><Database size={25} /></span><h3>Firebase mencatat</h3><p>Setiap nilai, status, dan waktu tersimpan sebagai riwayat perjalanan.</p></div><div className="workflow-step"><span className="step-number">04 / PANTAU</span><span className="step-icon"><Activity size={25} /></span><h3>Tim memantau</h3><p>Dashboard menampilkan kondisi terkini dan peringatan saat batas terlampaui.</p></div></div></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-bottom"><a className="brand footer-brand" href="#beranda"><span className="brand-mark"><Waves size={21} strokeWidth={2.7} /></span><span>Tuna<span>Guard</span><small>MONITORING SYSTEM</small></span></a><span>Prototype monitoring IoT untuk logistik tuna · © {new Date().getFullYear()} TunaGuard</span><a className="footer-back" href="#beranda">Kembali ke ringkasan <ArrowUpRight size={16} /></a></div></footer>
    </div>
  );
}
