import { ArrowUpRight, Cpu, Database, Thermometer, Waves, Wifi } from "lucide-react";

const connections = [
  "M 20 22 C 36 22 34 48 50 50",
  "M 20 78 C 36 78 34 52 50 50",
  "M 80 22 C 64 22 66 48 50 50",
  "M 80 78 C 64 78 66 52 50 50",
];

export default function IntegrationCard() {
  return (
    <article className="integration-card">
      <div className="integration-visual" role="img" aria-label="DHT22, ESP32, WiFi, dan Firebase terhubung ke dashboard TunaGuard">
        <svg className="integration-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {connections.map((path) => <g key={path}><path className="integration-line-base" d={path} /><path className="integration-line-flow" d={path} /></g>)}
        </svg>
        <span className="integration-node integration-node-sensor"><Thermometer size={21} /><span>DHT22</span></span>
        <span className="integration-node integration-node-esp"><Cpu size={21} /><span>ESP32</span></span>
        <span className="integration-node integration-node-wifi"><Wifi size={21} /><span>WiFi</span></span>
        <span className="integration-node integration-node-firebase"><Database size={21} /><span>Firebase</span></span>
        <span className="integration-hub"><Waves size={29} /><strong>TunaGuard</strong><small>Dashboard</small></span>
      </div>
      <div className="integration-copy">
        <span className="panel-kicker">ALUR SISTEM</span>
        <h3>Terhubung dari armada ke dashboard.</h3>
        <p>DHT22 membaca suhu dan kelembapan. ESP32 mengirim pembacaan melalui WiFi ke Firebase, lalu TunaGuard menampilkannya bersama riwayat dan peringatan.</p>
        <a href="#monitoring">Lihat pembacaan <ArrowUpRight size={17} aria-hidden="true" /></a>
      </div>
    </article>
  );
}
